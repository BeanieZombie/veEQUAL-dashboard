import { createPublicClient, http, type Abi, type PublicClient } from 'viem';
import { sonic } from 'viem/chains';
import veAbi from '../src/abi/veequal.json' with { type: "json" };
import { VE_EQUAL } from '../src/constants.ts';
import { sonicRPCProvider } from './rpcProvider.ts';

// Enterprise-grade client with intelligent RPC management
class ResilientViemClient {
  private client: PublicClient;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second base delay

  constructor() {
    this.client = this.createClient();
  }

  private createClient(): PublicClient {
    const rpcUrl = sonicRPCProvider.getCurrentRPC();
    return createPublicClient({
      chain: sonic,
      transport: http(rpcUrl, {
        retryCount: 2,
        retryDelay: 1000,
        timeout: 10000,
      }),
    });
  }

  async request(requestFn: (client: PublicClient) => Promise<any>): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await requestFn(this.client);
      } catch (error) {
        lastError = error as Error;
        console.warn(`RPC request failed (attempt ${attempt + 1}/${this.maxRetries}):`, error);

        // If not the last attempt, try next RPC
        if (attempt < this.maxRetries - 1) {
          try {
            const nextRPC = await sonicRPCProvider.getNextRPC();
            console.log(`Switching to RPC: ${nextRPC}`);
            this.client = this.createClient();
            
            // Wait before retry with exponential backoff
            await new Promise(resolve =>
              setTimeout(resolve, this.retryDelay * Math.pow(2, attempt))
            );
          } catch (rpcError) {
            console.error('Failed to switch RPC:', rpcError);
          }
        }
      }
    }

    throw new Error(`All RPC attempts failed. Last error: ${lastError?.message}`);
  }

  // Wrapper methods for common operations
  async readContract(args: any) {
    return this.request(client => client.readContract(args));
  }

  async multicall(args: any) {
    return this.request(client => client.multicall(args));
  }

  async getBlockNumber() {
    return this.request(client => client.getBlockNumber());
  }

  async getBlock(args?: any) {
    return this.request(client => client.getBlock(args));
  }

  async getLogs(args: any) {
    return this.request(client => client.getLogs(args));
  }

  // Health check for monitoring
  async healthCheck(): Promise<{ healthy: boolean; latestBlock?: bigint; rpc: string }> {
    try {
      const latestBlock = await this.getBlockNumber();
      return {
        healthy: true,
        latestBlock,
        rpc: sonicRPCProvider.getCurrentRPC()
      };
    } catch (error) {
      return {
        healthy: false,
        rpc: sonicRPCProvider.getCurrentRPC()
      };
    }
  }
  // Get current client for legacy compatibility
  getCurrentClient(): PublicClient {
    return this.client;
  }
}

// Singleton instance for enterprise reliability
export const resilientClient = new ResilientViemClient();

// Legacy compatibility - keep for existing code
export const publicClient = resilientClient.getCurrentClient();

export const veEqualAbi = veAbi as Abi;
export const veEqualAddress = VE_EQUAL as `0x${string}`;

export { veAbi };
