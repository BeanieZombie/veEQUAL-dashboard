#!/usr/bin/env bun
// veEQUAL Data API Server
import { db } from './lib/db.ts';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  lastUpdated?: string;
  count?: number;
}

async function getLastUpdated(): Promise<string> {
  try {
    const result = await db.query('SELECT last_nft_snapshot_within_day FROM owner_daily LIMIT 1');
    const data = (result as any).toArray();
    return data[0]?.last_nft_snapshot_within_day || new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

async function handleApiRequest(pathname: string): Promise<Response> {
  const lastUpdated = await getLastUpdated();

  try {
    switch (pathname) {
      case '/api/summary': {
        const summaryResult = await db.query(`
          SELECT
            SUM(total_voting_power) as total_voting_power,
            COUNT(*) as unique_holders,
            SUM(nft_count) as total_nfts
          FROM owner_daily
        `);
        const summary = (summaryResult as any).toArray()[0];

        const response: ApiResponse = {
          success: true,
          data: {
            totalVotingPower: Math.round(Number(summary.total_voting_power)),
            uniqueHolders: Number(summary.unique_holders),
            totalNFTs: Number(summary.total_nfts),
            formattedVotingPower: Number(summary.total_voting_power) >= 1000000
              ? `${(Number(summary.total_voting_power) / 1000000).toFixed(2)}M`
              : `${(Number(summary.total_voting_power) / 1000).toFixed(2)}K`
          },
          lastUpdated,
          count: 1
        };
        return Response.json(response);
      }

      case '/api/holders': {
        const limit = 100; // Default limit
        const holdersResult = await db.query(`
          SELECT
            owner,
            nft_count,
            total_voting_power,
            next_overall_unlock_date,
            last_nft_snapshot_within_day
          FROM owner_daily
          ORDER BY total_voting_power DESC
          LIMIT ${limit}
        `);
        const holders = (holdersResult as any).toArray();

        const response: ApiResponse = {
          success: true,
          data: holders.map((holder: any) => ({
            owner: holder.owner,
            nftCount: Number(holder.nft_count),
            votingPower: Math.round(Number(holder.total_voting_power)),
            formattedVotingPower: Number(holder.total_voting_power) >= 1000000
              ? `${(Number(holder.total_voting_power) / 1000000).toFixed(2)}M`
              : `${(Number(holder.total_voting_power) / 1000).toFixed(2)}K`,
            nextUnlockDate: holder.next_overall_unlock_date,
            lastUpdated: holder.last_nft_snapshot_within_day
          })),
          lastUpdated,
          count: holders.length
        };
        return Response.json(response);
      }

      case '/api/nfts': {
        const limit = 100; // Default limit
        const nftsResult = await db.query(`
          SELECT
            token_id,
            owner,
            balance_formatted,
            unlock_date,
            snapshot_time
          FROM venfts
          WHERE balance_formatted > 0
          ORDER BY balance_formatted DESC
          LIMIT ${limit}
        `);
        const nfts = (nftsResult as any).toArray();

        const response: ApiResponse = {
          success: true,
          data: nfts.map((nft: any) => ({
            tokenId: String(nft.token_id),
            owner: nft.owner,
            votingPower: Math.round(Number(nft.balance_formatted)),
            formattedVotingPower: Number(nft.balance_formatted) >= 1000000
              ? `${(Number(nft.balance_formatted) / 1000000).toFixed(2)}M`
              : `${(Number(nft.balance_formatted) / 1000).toFixed(2)}K`,
            unlockDate: nft.unlock_date,
            lastUpdated: nft.snapshot_time
          })),
          lastUpdated,
          count: nfts.length
        };
        return Response.json(response);
      }

      case '/api/analytics': {
        // TODO: Fix table names and column references
        const response: ApiResponse = {
          success: false,
          error: 'Analytics endpoint temporarily disabled - table schema needs verification'
        };
        return Response.json(response, { status: 503 });
      }

      default:
        const response: ApiResponse = {
          success: false,
          error: 'Endpoint not found'
        };
        return Response.json(response, { status: 404 });
    }
  } catch (error) {
    console.error('API Error:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return Response.json(response, { status: 500 });
  }
}

const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // API endpoints
    if (pathname.startsWith('/api/')) {
      const response = await handleApiRequest(pathname);
      // Add CORS headers to API responses
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Serve markdown report
    if (pathname === '/veEQUAL.md' || pathname === '/report') {
      try {
        const file = Bun.file('veEQUAL.md');
        if (await file.exists()) {
          return new Response(file, {
            headers: {
              'Content-Type': 'text/markdown; charset=utf-8',
              ...corsHeaders
            }
          });
        }
      } catch (error) {
        console.error('Error serving markdown:', error);
      }
      return new Response('Report not found', { status: 404, headers: corsHeaders });
    }

    // API documentation (root path)
    if (pathname === '/') {
      const lastUpdated = await getLastUpdated();
      const docs = `# veEQUAL Data API

Last updated: ${new Date(lastUpdated).toLocaleString()}

Access the full markdown report: [veEQUAL.md](./veEQUAL.md)

## Available Endpoints

### 📊 Summary Data
- \`GET /api/summary\` - Basic statistics (total voting power, holders, NFTs)

### 👥 Holders Data
- \`GET /api/holders\` - Top 100 holders by voting power

### 🎯 NFT Data
- \`GET /api/nfts\` - Top 100 NFTs by voting power

### 📈 Analytics Data
- \`GET /api/analytics\` - Concentration, supply, and unlock analytics

### 📄 Reports
- \`GET /veEQUAL.md\` - Full markdown report
- \`GET /report\` - Alias for markdown report

## Response Format

All API endpoints return JSON in this format:
\`\`\`json
{
  "success": true,
  "data": [...],
  "lastUpdated": "2025-05-24T12:50:09.290Z",
  "count": 100
}
\`\`\`

## Example Usage

\`\`\`bash
# Get summary data
curl https://your-api-url.com/api/summary

# Get top holders
curl https://your-api-url.com/api/holders

# Get markdown report
curl https://your-api-url.com/veEQUAL.md
\`\`\`

---

Data is updated daily at 00:33 UTC via automated pipeline.
Source: [veEQUAL Dashboard](https://github.com/BeanieZombie/veEQUAL-dashboard)
`;

      return new Response(docs, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          ...corsHeaders
        }
      });
    }

    // 404 for other paths
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
});

console.log(`🚀 veEQUAL Data API running at http://localhost:${server.port}`);
console.log(`📊 API endpoints: http://localhost:${server.port}/api/`);
console.log(`📄 Markdown report: http://localhost:${server.port}/veEQUAL.md`);
console.log('\nPress Ctrl+C to stop the server');
