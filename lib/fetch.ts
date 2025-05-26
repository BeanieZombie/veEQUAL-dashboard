import { formatUnits } from 'viem';
import { publicClient, veEqualAddress, veEqualAbi } from './viemClient.ts';
import { getMaxNFTId } from './getMaxNFTId.ts';
import { db } from './db.ts';
import { CHUNK_SIZE, PARALLEL } from '../src/constants.ts';

interface NFTData {
  tokenId: bigint;
  owner: string;
  balance: bigint;
  lockedEnd: bigint;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms:`, error);
      await sleep(delay);
    }
  }
  throw new Error('Should not reach here');
}

async function fetchNFTBatch(tokenIds: bigint[]): Promise<NFTData[]> {
  return retryWithBackoff(async () => {
    const multicalls = tokenIds.flatMap(tokenId => [
      {
        address: veEqualAddress,
        abi: veEqualAbi,
        functionName: 'balanceOfNFT',
        args: [tokenId],
      },
      {
        address: veEqualAddress,
        abi: veEqualAbi,
        functionName: 'ownerOf',
        args: [tokenId],
      },
      {
        address: veEqualAddress,
        abi: veEqualAbi,
        functionName: 'locked__end',
        args: [tokenId],
      },
    ]);

    const results = await publicClient.multicall({
      contracts: multicalls,
    });

    const nftData: NFTData[] = [];

    for (let i = 0; i < tokenIds.length; i++) {
      const balanceResult = results[i * 3];
      const ownerResult = results[i * 3 + 1];
      const lockedEndResult = results[i * 3 + 2];

      // Skip if any call failed
      if (balanceResult.status === 'failure' ||
          ownerResult.status === 'failure' ||
          lockedEndResult.status === 'failure') {
        continue;
      }

      const balance = balanceResult.result as bigint;

      // Skip NFTs with zero balance
      if (balance === 0n) {
        continue;
      }

      nftData.push({
        tokenId: tokenIds[i],
        owner: ownerResult.result as string,
        balance,
        lockedEnd: lockedEndResult.result as bigint,
      });
    }

    return nftData;
  });
}

function formatUnlockDate(timestamp: bigint): string {
  if (timestamp === 0n) return '–';
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export async function fetchSnapshot(): Promise<void> {
  console.log('Starting veEQUAL snapshot...');

  const maxId = await getMaxNFTId();
  console.log(`Fetching data for NFTs 1 to ${maxId}...`);

  // Create chunks of token IDs
  const chunks: bigint[][] = [];
  for (let i = 1n; i <= maxId; i += CHUNK_SIZE) {
    const chunk: bigint[] = [];
    const end = i + CHUNK_SIZE > maxId ? maxId : i + CHUNK_SIZE - 1n;
    for (let j = i; j <= end; j++) {
      chunk.push(j);
    }
    chunks.push(chunk);
  }

  console.log(`Processing ${chunks.length} chunks with ${PARALLEL} parallel workers...`);

  // Process chunks in parallel batches
  for (let i = 0; i < chunks.length; i += PARALLEL) {
    const batch = chunks.slice(i, i + PARALLEL);
    const promises = batch.map(chunk => fetchNFTBatch(chunk));

    try {
      const results = await Promise.all(promises);
      const allNFTs = results.flat();

      console.log(`Batch ${Math.floor(i / PARALLEL) + 1}: Found ${allNFTs.length} active NFTs`);

      // Insert/update data in database
      if (allNFTs.length > 0) {
        for (const nft of allNFTs) {
          const balanceFormatted = parseFloat(formatUnits(nft.balance, 18));
          const unlockDate = formatUnlockDate(nft.lockedEnd);

          // Delete existing record first, then insert (DuckDB approach)
          await db.query(`DELETE FROM venfts WHERE token_id = ${nft.tokenId}`);
          await db.query(`
            INSERT INTO venfts
            (token_id, owner, balance_raw, balance_formatted, unlock_timestamp, unlock_date, snapshot_time)
            VALUES (${nft.tokenId}, '${nft.owner}', '${nft.balance}', ${balanceFormatted}, ${nft.lockedEnd}, '${unlockDate}', CURRENT_TIMESTAMP)
          `);
        }
      }

    } catch (error) {
      console.error(`Error processing batch ${Math.floor(i / PARALLEL) + 1}:`, error);
      throw error;
    }
  }

  // Get final count
  const countResult = await db.query('SELECT COUNT(*) as count FROM venfts');
  const count = (countResult as any).toArray()[0].count;
  console.log(`Snapshot complete: ${count} active NFTs stored`);
}
