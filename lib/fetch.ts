import { formatUnits } from 'viem';
import { publicClient, veEqualAddress, veEqualAbi } from './viemClient.ts';
import { getMaxNFTId } from './getMaxNFTId.ts';
import { db } from './db.ts';
import { CHUNK_SIZE, PARALLEL } from '../src/constants.ts';

interface NFTData {
  tokenId: bigint;
  owner: string;
  balance: bigint; // This is voting power
  tokenAmount: bigint; // This is the actual locked token amount
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRateLimited = isRateLimitError(errorMessage);

      if (i === maxRetries - 1) throw error;

      let delay: number;
      if (isRateLimited) {
        // For rate limits, use longer delays and don't increase exponentially as aggressively
        delay = Math.min(5000 + (i * 2000), 15000); // 5s, 7s, 9s (max 15s)
        console.warn(`Rate limit detected on retry ${i + 1}/${maxRetries}, waiting ${delay}ms:`, errorMessage);
      } else {
        // For other errors, use standard exponential backoff
        delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms:`, error);
      }

      await sleep(delay);
    }
  }
  throw new Error('Should not reach here');
}

function isRateLimitError(errorMessage: string): boolean {
  const rateLimitIndicators = [
    'rate limit',
    'too many requests',
    'call rate limit exhausted',
    'retry in',
    'rate exceeded',
    'throttled',
    'request limit',
    'quota exceeded',
    'api rate limit',
    'requests per second',
    'rpm limit',
    'rps limit'
  ];

  const lowerMessage = errorMessage.toLowerCase();
  return rateLimitIndicators.some(indicator => lowerMessage.includes(indicator));
}

async function fetchNFTBatch(tokenIds: bigint[]): Promise<NFTData[]> {
  return retryWithBackoff(async () => {
    const multicalls = tokenIds.flatMap(tokenId => [
      {
        address: veEqualAddress,
        abi: veEqualAbi,
        functionName: 'balanceOfNFT', // Voting Power
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
        functionName: 'locked__end', // Lock end timestamp
        args: [tokenId],
      },
      { // New call for actual locked token amount
        address: veEqualAddress,
        abi: veEqualAbi,
        functionName: 'locked', // Returns [amount: string, end: string]
        args: [tokenId],
      },
    ]);

    const results = await publicClient.multicall({
      contracts: multicalls,
    });

    const nftData: NFTData[] = [];

    for (let i = 0; i < tokenIds.length; i++) {
      const balanceResult = results[i * 4]; // Voting power
      const ownerResult = results[i * 4 + 1];
      const lockedEndResult = results[i * 4 + 2];
      const lockedResult = results[i * 4 + 3]; // Result of 'locked(tokenId)'

      if (balanceResult.status === 'failure') {
        console.warn(`Failed to fetch balanceOfNFT for tokenId: ${tokenIds[i]}. Status: ${balanceResult.status}, Error: ${balanceResult.error?.message || 'Unknown error'}`);
      }
      if (ownerResult.status === 'failure') {
        console.warn(`Failed to fetch ownerOf for tokenId: ${tokenIds[i]}. Status: ${ownerResult.status}, Error: ${ownerResult.error?.message || 'Unknown error'}`);
      }
      if (lockedEndResult.status === 'failure') {
        console.warn(`Failed to fetch locked__end for tokenId: ${tokenIds[i]}. Status: ${lockedEndResult.status}, Error: ${lockedEndResult.error?.message || 'Unknown error'}`);
      }
      if (lockedResult.status === 'failure') {
        console.warn(`Failed to fetch locked for tokenId: ${tokenIds[i]}. Status: ${lockedResult.status}, Error: ${lockedResult.error?.message || 'Unknown error'}`);
      }

      // Skip if any call failed
      if (balanceResult.status === 'failure' ||
          ownerResult.status === 'failure' ||
          lockedEndResult.status === 'failure' ||
          lockedResult.status === 'failure') {
        continue;
      }

      const votingPower = balanceResult.result as bigint;

      // Skip NFTs with zero voting power (these are effectively non-existent or fully withdrawn)
      if (votingPower === 0n) {
        continue;
      }

      // The 'locked' function returns an object { amount: int128, end: uint256 }
      // We need the 'amount' from this object.
      /*
      const lockedData = lockedResult.result as { amount: bigint, end: bigint } | undefined;
      if (!lockedData || typeof lockedData.amount === 'undefined') {
        console.warn(`Failed to get locked.amount for tokenId: ${tokenIds[i]}. LockedResult status: ${lockedResult.status}, result type: ${typeof lockedResult.result}. Skipping.`);
        // Add more detailed logging for the problematic result
        console.log('Problematic lockedResult.result:', JSON.stringify(lockedResult.result, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value // return everything else unchanged
        ));
        continue;
      }
      const tokenAmount = lockedData.amount;
      */

      // Based on the logs, lockedResult.result is an array: [string, string]
      const lockedDataArray = lockedResult.result as [string, string] | undefined;
      if (!lockedDataArray || !Array.isArray(lockedDataArray) || lockedDataArray.length < 2) {
        console.warn(`Failed to get locked.amount for tokenId: ${tokenIds[i]}. lockedResult.result is not a valid array or is undefined. Skipping.`);
        // console.log('Problematic lockedResult.result:', JSON.stringify(lockedResult.result)); // Keep this commented unless further debugging is needed
        continue;
      }

      let tokenAmount: bigint;
      try {
        tokenAmount = BigInt(lockedDataArray[0]);
      } catch (e) {
        console.warn(`Failed to convert locked amount to BigInt for tokenId: ${tokenIds[i]}. Amount: ${lockedDataArray[0]}. Error: ${e}. Skipping.`);
        // console.log('Problematic lockedResult.result (on conversion error):', JSON.stringify(lockedResult.result));
        continue;
      }
      // const lockedEndFromStringArray = BigInt(lockedDataArray[1]); // This is also available


      nftData.push({
        tokenId: tokenIds[i],
        owner: ownerResult.result as string,
        balance: votingPower,
        tokenAmount: tokenAmount,
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
    const batchNumber = Math.floor(i / PARALLEL) + 1;
    const totalBatches = Math.ceil(chunks.length / PARALLEL);
    
    console.log(`Processing batch ${batchNumber}/${totalBatches}...`);
    
    const batch = chunks.slice(i, i + PARALLEL);
    const promises = batch.map(chunk => fetchNFTBatch(chunk));

    try {
      const results = await Promise.all(promises);
      const allNFTs = results.flat();

      console.log(`Batch ${batchNumber}: Found ${allNFTs.length} active NFTs`);

      // Insert/update data in database
      if (allNFTs.length > 0) {
        for (const nft of allNFTs) {
          const unlockDate = formatUnlockDate(nft.lockedEnd);
          const isLocked = nft.lockedEnd * 1000n > BigInt(Date.now()); // Check if lockedEnd is in the future

          // Delete existing record first, then insert (DuckDB approach)
          await db.query(`DELETE FROM venfts WHERE token_id = ${nft.tokenId}`);
          await db.query(`
            INSERT INTO venfts
            (token_id, owner, balance_raw, token_balance_raw, unlock_timestamp, unlock_date, is_locked, lock_end_timestamp, snapshot_time)
            VALUES (${nft.tokenId}, '${nft.owner}', '${nft.balance}', '${nft.tokenAmount}', ${nft.lockedEnd}, '${unlockDate}', ${isLocked}, ${nft.lockedEnd}, CURRENT_TIMESTAMP)
          `);
        }
      }

      // Add delay between batches to avoid rate limiting (except for the last batch)
      if (i + PARALLEL < chunks.length) {
        const delay = 500; // 500ms delay between batches
        console.log(`Waiting ${delay}ms before next batch to avoid rate limits...`);
        await sleep(delay);
      }

    } catch (error) {
      console.error(`Error processing batch ${batchNumber}:`, error);
      
      // Check if it's a rate limit error and add extra delay before retrying
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (isRateLimitError(errorMessage)) {
        console.log('Rate limit detected in batch processing, adding extra delay...');
        await sleep(5000); // 5 second delay for rate limits
      }
      
      throw error;
    }
  }

  // Get final count
  const countResult = await db.query('SELECT COUNT(*) as count FROM venfts');
  const count = (countResult as any).toArray()[0].count;
  console.log(`Snapshot complete: ${count} active NFTs stored`);
}
