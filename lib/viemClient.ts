import { createPublicClient, http, type Abi, type PublicClient } from 'viem';
import { sonic } from 'viem/chains';
import veAbi from '../src/abi/veequal.json' with { type: "json" };
import { VE_EQUAL } from '../src/constants.ts';
import { sonicRPCProvider } from './rpcProvider.ts';

// Dynamic client that retries with different RPCs
class ResilientViemClient {
  private client: PublicClient | null = null;
  private currentRpc: string | null = null;

  async getClient(): Promise<PublicClient> {
    if (!this.client || !this.currentRpc) {
      await this.createClient();
    }
    return this.client!;
  }

  private async createClient(forceNew = false): Promise<void> {
    const rpc = forceNew ? await sonicRPCProvider.getNextRPC() : sonicRPCProvider.getCurrentRPC();

    this.client = createPublicClient({
      chain: sonic,
      transport: http(rpc, {
        timeout: 30_000, // 30 second timeout
        retryCount: 0, // We handle retries ourselves
      }),
    });

    this.currentRpc = rpc;
    console.log(`Using RPC: ${rpc}`);
  }

  async executeWithRetry<T>(
    operation: (client: PublicClient) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const client = await this.getClient();
        return await operation(client);
      } catch (error) {
        lastError = error as Error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if this is a rate limiting error
        const isRateLimited = this.isRateLimitError(errorMessage);
        
        if (isRateLimited) {
          console.warn(`RPC rate limited on attempt ${attempt + 1} with ${this.currentRpc}:`, errorMessage);
        } else {
          console.warn(`RPC attempt ${attempt + 1} failed with ${this.currentRpc}:`, error);
        }

        if (attempt < maxRetries - 1) {
          if (isRateLimited) {
            // For rate limits, just switch to next RPC without marking as permanently failed
            console.log('Rate limit detected, switching to next RPC endpoint...');
            await this.createClient(true);
            // Add a small delay for rate limited requests
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            // For other errors, mark current RPC as failed and try next one
            if (this.currentRpc) {
              await sonicRPCProvider.markRPCFailed(this.currentRpc);
            }
            await this.createClient(true);
          }
        }
      }
    }

    throw new Error(`All RPC attempts failed. Last error: ${lastError?.message}`);
  }

  private isRateLimitError(errorMessage: string): boolean {
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

  // Convenience methods that automatically retry
  async readContract(args: Parameters<PublicClient['readContract']>[0]) {
    return this.executeWithRetry((c) => c.readContract(args));
  }

  async multicall(args: Parameters<PublicClient['multicall']>[0]) {
    return this.executeWithRetry((c) => c.multicall(args));
  }

  async getBlockNumber() {
    return this.executeWithRetry((c) => c.getBlockNumber());
  }

  async getLogs(args: Parameters<PublicClient['getLogs']>[0]) {
    return this.executeWithRetry((c) => c.getLogs(args));
  }
}

// Export singleton instance
export const resilientClient = new ResilientViemClient();

// For backward compatibility, create a proxy that forwards to resilientClient
export const publicClient = new Proxy({} as PublicClient, {
  get(target, prop) {
    if (prop === 'readContract') {
      return (args: Parameters<PublicClient['readContract']>[0]) => resilientClient.readContract(args);
    }
    if (prop === 'multicall') {
      return (args: Parameters<PublicClient['multicall']>[0]) => resilientClient.multicall(args);
    }
    if (prop === 'getBlockNumber') {
      return () => resilientClient.getBlockNumber();
    }
    if (prop === 'getLogs') {
      return (args: Parameters<PublicClient['getLogs']>[0]) => resilientClient.getLogs(args);
    }
    // For other methods, get the actual client
    return async (...args: any[]) => {
      const client = await resilientClient.getClient();
      const method = (client as any)[prop];
      if (typeof method === 'function') {
        return method.apply(client, args);
      }
      return method;
    };
  }
});

export const veEqualAbi = veAbi as Abi;
export const veEqualAddress = VE_EQUAL as `0x${string}`;

export { veAbi };
