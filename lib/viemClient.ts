import { createPublicClient, http, type Abi } from 'viem';
import { sonic } from 'viem/chains';
import veAbi from '../src/abi/veequal.json' with { type: "json" };
import { SONIC_RPC, VE_EQUAL } from '../src/constants.ts';

export const publicClient = createPublicClient({
  chain: sonic,
  transport: http(SONIC_RPC),
});

export const veEqualAbi = veAbi as Abi;
export const veEqualAddress = VE_EQUAL as `0x${string}`;

export { veAbi };
