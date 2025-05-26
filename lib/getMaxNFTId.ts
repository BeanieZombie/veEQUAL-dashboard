import { resilientClient, veEqualAddress, veAbi } from './viemClient.ts';

const CHUNK_BLOCKS = 10000n;

export async function getMaxNFTId(): Promise<bigint> {
  console.log('Scanning for maximum NFT ID...');

  const latestBlock = await resilientClient.getBlockNumber();
  let maxTokenId = 0n;

  // Get contract creation block or start from a reasonable block
  let fromBlock = latestBlock - 1000000n; // Go back ~1M blocks
  if (fromBlock < 0n) fromBlock = 0n;

  while (fromBlock <= latestBlock) {
    const toBlock = fromBlock + CHUNK_BLOCKS > latestBlock
      ? latestBlock
      : fromBlock + CHUNK_BLOCKS;

    console.log(`Scanning blocks ${fromBlock} to ${toBlock}...`);

    try {
      const logs = await resilientClient.getLogs({
        address: veEqualAddress,
        event: {
          type: 'event',
          name: 'Transfer',
          inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'tokenId', type: 'uint256', indexed: true }
          ]
        },
        fromBlock,
        toBlock,
      });

      for (const log of logs) {
        const tokenId = log.args.tokenId as bigint;
        if (tokenId > maxTokenId) {
          maxTokenId = tokenId;
        }
      }

    } catch (error) {
      console.warn(`Error scanning blocks ${fromBlock}-${toBlock}:`, error);
      // Continue with smaller chunk on error
      fromBlock += 1000n;
      continue;
    }

    fromBlock = toBlock + 1n;
  }

  console.log(`Maximum NFT ID found: ${maxTokenId}`);
  return maxTokenId;
}
