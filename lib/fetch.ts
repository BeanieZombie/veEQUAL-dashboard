import { resilientClient, veEqualAddress, veEqualAbi } from './viemClient.ts';
import { getMaxNFTId } from './getMaxNFTId.ts';
import { db } from './db.ts';
import { CHUNK_SIZE, PARALLEL } from '../src/constants.ts';

interface NFTData {
  tokenId: bigint;
  owner: string;
  balance: bigint; // Current voting power from balanceOfNFT
  amount: bigint; // Original locked amount from locked.amount
  lockedEnd: bigint;
}

// Enterprise-grade rate limiting and tracking
class FetchRateLimiter {
  private requestCount = 0;
  private windowStart = Date.now();
  private windowMs = 60000; // 1 minute window
  private maxRequestsPerWindow = 1000; // Conservative limit

  async checkLimit(): Promise<void> {
    const now = Date.now();

    // Reset window if needed
    if (now - this.windowStart >= this.windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    // Check if we're hitting limits
    if (this.requestCount >= this.maxRequestsPerWindow) {
      const waitTime = this.windowMs - (now - this.windowStart);
      console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
      await sleep(waitTime);
      this.requestCount = 0;
      this.windowStart = Date.now();
    }

    this.requestCount++;
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      windowStart: this.windowStart,
      remainingRequests: this.maxRequestsPerWindow - this.requestCount
    };
  }
}

const rateLimiter = new FetchRateLimiter();

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
    // Apply rate limiting for enterprise reliability
    await rateLimiter.checkLimit();

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
      {
        address: veEqualAddress,
        abi: veEqualAbi,
        functionName: 'locked',
        args: [tokenId],
      },
    ]);

    const results = await resilientClient.multicall({
      contracts: multicalls,
    });

    const nftData: NFTData[] = [];

    for (let i = 0; i < tokenIds.length; i++) {
      const balanceResult = results[i * 4];
      const ownerResult = results[i * 4 + 1];
      const lockedEndResult = results[i * 4 + 2];
      const lockedResult = results[i * 4 + 3];

      // Skip if any call failed or balance is null/undefined
      if (balanceResult.status === 'failure' ||
          ownerResult.status === 'failure' ||
          lockedEndResult.status === 'failure' ||
          lockedResult.status === 'failure' ||
          balanceResult.result == null) {
        console.warn(`Skipping NFT ${tokenIds[i]} due to invalid multicall results`);
        continue;
      }

      const balance = balanceResult.result as bigint;
      const lockedData = lockedResult.result as [bigint, bigint]; // [amount, end]
      const amount = lockedData[0] < 0n ? -lockedData[0] : lockedData[0]; // Handle int128 conversion

      // Skip NFTs with zero balance
      if (balance === 0n) {
        continue;
      }

      nftData.push({
        tokenId: tokenIds[i],
        owner: ownerResult.result as string,
        balance,
        amount,
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
  const startTime = Date.now();

  // Health check before starting
  const healthCheck = await resilientClient.healthCheck();
  if (!healthCheck.healthy) {
    throw new Error(`RPC health check failed for ${healthCheck.rpc}`);
  }
  console.log(`✅ RPC health check passed: ${healthCheck.rpc} (Block: ${healthCheck.latestBlock})`);

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

  let totalNFTs = 0;
  let totalErrors = 0;

  // Process chunks in parallel batches
  for (let i = 0; i < chunks.length; i += PARALLEL) {
    const batch = chunks.slice(i, i + PARALLEL);
    const promises = batch.map(chunk => fetchNFTBatch(chunk));

    try {
      const results = await Promise.all(promises);
      const allNFTs = results.flat();
      totalNFTs += allNFTs.length;

      console.log(`Batch ${Math.floor(i / PARALLEL) + 1}: Found ${allNFTs.length} active NFTs`);

      // Insert/update data in database
      if (allNFTs.length > 0) {
        for (const nft of allNFTs) {
          // Validate NFT data before insertion
          if (nft.balance == null) {
            console.warn(`Skipping NFT ${nft.tokenId} due to null balance`);
            continue;
          }

          const unlockDate = formatUnlockDate(nft.lockedEnd);
          const balanceFormatted = Number(nft.balance) / 1e18; // Convert wei to human-readable
          const amountFormatted = Number(nft.amount) / 1e18; // Convert wei to human-readable

          try {
            // Delete existing record first, then insert (DuckDB approach)
            await db.query(`DELETE FROM venfts WHERE token_id = ${nft.tokenId}`);
            await db.query(`
              INSERT INTO venfts
              (token_id, owner, balance_raw, balance_formatted, amount_raw, amount_formatted, unlock_timestamp, unlock_date, snapshot_time)
              VALUES (${nft.tokenId}, '${nft.owner}', '${nft.balance}', ${balanceFormatted}, '${nft.amount}', ${amountFormatted}, ${nft.lockedEnd}, '${unlockDate}', CURRENT_TIMESTAMP)
            `);
          } catch (dbError) {
            console.error(`Database insertion failed for NFT ${nft.tokenId}:`, dbError);
            totalErrors++;
          }
        }
      }

      // Log rate limiting stats for monitoring
      const stats = rateLimiter.getStats();
      if (i % 10 === 0) { // Log every 10 batches
        console.log(`📊 Rate limit stats: ${stats.requestCount}/${1000} requests, ${stats.remainingRequests} remaining`);
      }

    } catch (error) {
      totalErrors++;
      console.error(`Error processing batch ${Math.floor(i / PARALLEL) + 1}:`, error);

      // For enterprise reliability, continue processing other batches
      if (totalErrors > chunks.length * 0.1) { // Fail if >10% error rate
        throw new Error(`Too many batch failures (${totalErrors}), aborting`);
      }
    }
  }

  // Get final count and performance metrics
  const countResult = await db.query('SELECT COUNT(*) as count FROM venfts');
  const count = (countResult as any).toArray()[0].count;
  const duration = Date.now() - startTime;
  const nftsPerSecond = (totalNFTs / (duration / 1000)).toFixed(2);

  console.log(`Snapshot complete: ${count} active NFTs stored`);
  console.log(`📈 Performance: ${nftsPerSecond} NFTs/sec, ${totalErrors} errors, ${duration}ms total`);
}
