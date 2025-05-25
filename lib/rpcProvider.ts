interface ChainlistRPC {
  url: string;
  tracking?: string;
  trackingDetails?: string;
  isOpenSource?: boolean;
}

interface ChainlistResponse {
  name: string;
  chainId: number;
  rpc: ChainlistRPC[];
}

interface RPCStatus {
  url: string;
  responseTime: number;
  success: boolean;
  blockNumber?: number;
}

class SonicRPCProvider {
  private rpcs: string[] = [];
  private fallbackRpcs: string[] = [
    "https://sonic-rpc.publicnode.com",
    "https://rpc.soniclabs.com",
    "https://sonic.gateway.tenderly.co",
  ];
  private currentRpcIndex = 0;
  private lastUpdate = 0;
  private updateInterval = 5 * 60 * 1000; // 5 minutes

  async initialize(): Promise<void> {
    try {
      await this.fetchRPCsFromChainlist();
      await this.testAndSortRPCs();
    } catch (error) {
      console.warn('Failed to fetch RPCs from chainlist, using fallback:', error);
      this.rpcs = [...this.fallbackRpcs];
    }
  }

  private async fetchRPCsFromChainlist(): Promise<void> {
    const response = await fetch('https://chainlist.org/rpcs.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch chainlist: ${response.status}`);
    }

    const data: ChainlistResponse[] = await response.json();
    const sonicChain = data.find(chain => chain.chainId === 146);

    if (!sonicChain) {
      throw new Error('Sonic chain (146) not found in chainlist');
    }

    // Extract HTTPS RPCs, prefer open source ones
    const httpsRpcs = sonicChain.rpc
      .filter(rpc => {
        const url = typeof rpc === 'string' ? rpc : rpc.url;
        return url.startsWith('https://');
      })
      .map(rpc => typeof rpc === 'string' ? rpc : rpc.url)
      .filter(url => !url.includes('${') && !url.includes('$')); // Remove template URLs

    this.rpcs = [...new Set([...httpsRpcs, ...this.fallbackRpcs])];
    console.log(`Fetched ${this.rpcs.length} Sonic RPCs from chainlist`);
  }

  private async testRPC(url: string): Promise<RPCStatus> {
    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        return { url, responseTime: Infinity, success: false };
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      if (data.result) {
        const blockNumber = parseInt(data.result, 16);
        return { url, responseTime, success: true, blockNumber };
      }

      return { url, responseTime: Infinity, success: false };
    } catch (error) {
      return { url, responseTime: Infinity, success: false };
    }
  }

  private async testAndSortRPCs(): Promise<void> {
    console.log(`Testing ${this.rpcs.length} RPCs...`);

    const results = await Promise.all(
      this.rpcs.map(rpc => this.testRPC(rpc))
    );

    // Sort by success first, then by response time
    const workingRpcs = results
      .filter(result => result.success)
      .sort((a, b) => a.responseTime - b.responseTime)
      .map(result => result.url);

    if (workingRpcs.length === 0) {
      console.warn('No working RPCs found, keeping original list');
      return;
    }

    this.rpcs = workingRpcs;
    this.currentRpcIndex = 0;

    console.log(`Found ${workingRpcs.length} working RPCs. Fastest: ${workingRpcs[0]} (${results.find(r => r.url === workingRpcs[0])?.responseTime}ms)`);
  }

  getCurrentRPC(): string {
    if (this.rpcs.length === 0) {
      return this.fallbackRpcs[0];
    }
    return this.rpcs[this.currentRpcIndex];
  }

  async getNextRPC(): Promise<string> {
    // Rotate to next RPC
    this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcs.length;

    // Refresh RPC list if it's been a while
    if (Date.now() - this.lastUpdate > this.updateInterval) {
      this.lastUpdate = Date.now();
      try {
        await this.initialize();
      } catch (error) {
        console.warn('Failed to refresh RPC list:', error);
      }
    }

    return this.getCurrentRPC();
  }

  getAllRPCs(): string[] {
    return [...this.rpcs];
  }

  async markRPCFailed(failedRpc: string): Promise<string> {
    // Remove the failed RPC and get the next one
    this.rpcs = this.rpcs.filter(rpc => rpc !== failedRpc);

    if (this.rpcs.length === 0) {
      console.warn('All RPCs failed, reinitializing...');
      await this.initialize();
    }

    this.currentRpcIndex = 0;
    return this.getCurrentRPC();
  }

  async handleRateLimitedRPC(): Promise<string> {
    // For rate limits, just rotate to next RPC without marking as permanently failed
    console.log('Rate limit detected, rotating to next RPC...');
    return await this.getNextRPC();
  }

  isRateLimitError(errorMessage: string): boolean {
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
}

// Singleton instance
export const sonicRPCProvider = new SonicRPCProvider();

// Initialize on import
sonicRPCProvider.initialize().catch(console.error);
