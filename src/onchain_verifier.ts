import { createPublicClient, http, formatUnits } from 'viem';
import { fantom } from 'viem/chains'; // Reverted to fantom as fantomSonic is not found
import { VE_EQUAL, SONIC_RPC } from './constants';
import veEqualABI from './abi/veequal.json';

// Setup the public client
const client = createPublicClient({
  chain: fantom, // Reverted to fantom
  transport: http(SONIC_RPC),
});

const veEqualContract = {
  address: VE_EQUAL,
  abi: veEqualABI,
} as const;

async function getTotalSupplyOnChain() {
  try {
    const totalSupply = await client.readContract({
      ...veEqualContract,
      functionName: 'totalSupply',
    });
    const decimals = await client.readContract({
      ...veEqualContract,
      functionName: 'decimals',
    });
    const formattedTotalSupply = formatUnits(totalSupply as bigint, decimals as number);
    console.log(`On-chain Total Supply: ${formattedTotalSupply}`);
    return totalSupply;
  } catch (error) {
    console.error('Error fetching total supply:', error);
  }
}

async function getVotesOnChain(address: `0x${string}`) {
  try {
    const votes = await client.readContract({
      ...veEqualContract,
      functionName: 'getVotes',
      args: [address],
    });
    const decimals = await client.readContract({
      ...veEqualContract,
      functionName: 'decimals',
    });
    const formattedVotes = formatUnits(votes as bigint, decimals as number);
    console.log(`On-chain Votes for ${address}: ${formattedVotes}`);
    return votes;
  } catch (error) {
    console.error(`Error fetching votes for ${address}:`, error);
  }
}

async function main() {
  console.log('Starting on-chain verification...');
  await getTotalSupplyOnChain();

  const addressToVerify = '0x5Daf884B73F6aB637D72bf09475a8455121614E6' as `0x${string}`; // Rank 1 from top-holders.json
  console.log(`Fetching votes for address: ${addressToVerify}`);
  await getVotesOnChain(addressToVerify);
}

main().catch(console.error);

// To run this file: bun src/onchain_verifier.ts
