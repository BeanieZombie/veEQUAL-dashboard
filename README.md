# veEQUAL Dashboard

[![Update veEQUAL Dashboard](https://github.com/BeanieZombie/veEQUAL-dashboard/actions/workflows/update.yml/badge.svg)](https://github.com/BeanieZombie/veEQUAL-dashboard/actions/workflows/update.yml)
[![License: BSL-1.1](https://img.shields.io/badge/License-BSL--1.1-blue.svg)](LICENSE.md)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Sonic](https://img.shields.io/badge/Sonic-146-orange.svg)](https://soniclabs.com)

**Real-time governance analytics for veEQUAL on Sonic blockchain**

Track voting power distribution, analyze governance concentration, and monitor unlock schedules with enterprise-grade analytics. Currently tracking **2.1M+ voting power** across **3,684 unique holders**.

[View Live Dashboard — soonic™ ](https://beaniebozombie.github.io/veEQUAL-dashboard/) • [Latest Report](veEQUAL.md) • [API Docs](#api-endpoints)

## What This Provides

- **Governance Risk Assessment**: Gini coefficient analysis and concentration metrics for institutional due diligence
- **Whale Movement Tracking**: Monitor large holder behavior and voting power shifts across governance tiers
- **Unlock Impact Analysis**: 90-day projection of governance power changes with risk indicators
- **Real-time APIs**: Production-ready endpoints with sub-second response times and CORS support
- **Enterprise Analytics**: Mathematical models for regulatory compliance and governance health assessment

## Quick Start

Get governance data in under 30 seconds:

```bash
# Clone and run
git clone https://github.com/BeanieZombie/veEQUAL-dashboard.git
cd veEQUAL-dashboard
bun install && bun run dev

# Test the API
curl http://localhost:3000/api/summary
```

**Live API Available**: All endpoints are also accessible at our [live instance](https://beaniebozombie.github.io/veEQUAL-dashboard/).

## Documentation

This README provides a quick start guide. For comprehensive technical information, implementation details, and advanced features, please refer to the [Technical Documentation](TECHNICAL.md).

## Installation

### Prerequisites

- `Bun >= 1.0` - [Installation Guide](https://bun.sh/docs/installation)
- `Node.js >= 18` (if using npm/yarn instead of Bun)
- `Git` for cloning the repository

### Install from Source

1. Clone the repository and navigate to the directory:

```bash
git clone https://github.com/BeanieZombie/veEQUAL-dashboard.git
cd veEQUAL-dashboard
```

2. Install dependencies:

```bash
bun install
```

3. Run the data collection and API server:

```bash
# Update data and start API server
bun run dev
```

The API server will be available at `http://localhost:3000`.

## Usage

### API Endpoints

The dashboard provides several REST API endpoints for accessing veEQUAL data:

| Endpoint | Description | Sample Response | Rate Limit |
|----------|-------------|-----------------|------------|
| `/api/summary` | Key governance metrics | `{"totalVotingPower": "2.1M", "uniqueHolders": 3684}` | 1000/hr |
| `/api/holders` | Top 50 holders by power | `[{"address": "0x...", "votingPower": "156789"}]` | 1000/hr |
| `/api/nfts` | Individual NFT rankings | `[{"tokenId": 1, "owner": "0x...", "power": "5432"}]` | 1000/hr |
| `/data/api/dashboard.json` | Complete dataset | Full governance dashboard data | 1000/hr |

**Features**: CORS enabled • No authentication required • Sub-second response times

### Example Usage

```bash
# Get summary statistics
curl http://localhost:3000/api/summary

# Get top holders
curl http://localhost:3000/api/holders

# Get top NFTs
curl http://localhost:3000/api/nfts
```

**Example Response** (`/api/summary`):
```json
{
  "totalVotingPower": "2.1M",
  "totalNFTs": 4934,
  "uniqueHolders": 3684,
  "lastUpdated": "2025-05-25T22:10:34.641Z"
}
```

### Data Collection

To manually update the dataset:

```bash
# Collect fresh data from Sonic blockchain
bun run update
```

This process:
1. Fetches all veEQUAL NFT data from Sonic blockchain
2. Processes data through 8 SQL transformation stages
3. Generates optimized JSON API endpoints
4. Updates Parquet files and DuckDB database

## Use Cases

**For DeFi Protocols**
- Monitor governance health and decentralization metrics
- Track voting power concentration risks
- Analyze unlock impact on governance stability

**For Institutional Investors**
- Due diligence on governance structures
- Risk assessment for token investments
- Regulatory compliance reporting

**For Governance Participants**
- Understand voting power landscape
- Track whale movements and behavior
- Plan participation strategies

## Technology Stack

Built with modern Web3 infrastructure:
- **Runtime**: Bun for performance and simplicity
- **Database**: DuckDB for analytical queries
- **Blockchain**: Viem for Sonic network interaction
- **Processing**: 8-stage SQL transformation pipeline
- **Storage**: Parquet files for efficient analytics

## Architecture

The system operates on a multi-stage data pipeline:

1. **Data Collection**: Retrieves veEQUAL NFT data from Sonic (Chain ID 146) using Viem
2. **Processing**: Aggregates and analyzes data using DuckDB with SQL transformations
3. **Storage**: Exports to Parquet format for efficient analytics
4. **API Generation**: Creates JSON endpoints with pre-computed responses
5. **Reporting**: Generates markdown reports with governance insights

### Governance Analysis

The platform categorizes holders into governance tiers based on voting power:

- **M.E.G.A Whale (≥50K)**: Maximum governance influence
- **Major Holder (20K-50K)**: Significant voting power
- **Equalest (5K-20K)**: Core participants
- **More Equal (1K-5K)**: Active members
- **Equal (<1K)**: Base participants

## Environment Variables

```bash
# Optional: Custom RPC endpoint (defaults to automatic discovery)
SONIC_RPC_URL=https://rpc.soniclabs.com

# Optional: API server port (defaults to 3000)
PORT=3000

# Optional: veEQUAL contract address (defaults to mainnet)
VE_EQUAL=0x3045119766352fF250b3d45312Bd0973CBF7235a
```

## Deployment

### Automated (GitHub Actions)
The repository includes automated data updates:
- Runs daily at 00:33 UTC
- Updates all datasets and API endpoints
- Commits changes automatically

### Manual Deployment
```bash
# Production server
bun run start

# Development with auto-reload
bun run dev

# Data update only
bun run update
```

## Limitations

This dashboard is designed specifically for veEQUAL governance analysis on Sonic blockchain. Applications beyond this scope should be approached with caution:

- **Network Dependency**: Requires stable connection to Sonic RPC endpoints
- **Data Scope**: Limited to veEQUAL NFT contract data only
- **Historical Data**: Limited by blockchain history availability
- **Real-time Updates**: Data freshness depends on collection schedule (daily updates)

## Troubleshooting

**Common Issues**:

- **RPC Connection Failed**: The system automatically discovers working Sonic RPCs. If all fail, set `SONIC_RPC_URL` manually.
- **Port Already in Use**: Change the port with `PORT=3001 bun run dev`
- **Missing Data**: Run `bun run update` to refresh from blockchain

**Getting Help**: See [Technical Documentation](TECHNICAL.md) for detailed troubleshooting.

## Reference

When referencing this dashboard in academic papers or technical reports, please specify the exact version and data collection date for reproducibility.

Example citation format:
```
veEQUAL Dashboard v1.0.0 - Governance analytics for Equalizer DEX on Sonic blockchain.
Data collected: [DATE]. Available: https://github.com/BeanieZombie/veEQUAL-dashboard
```

## License

**Business Source License 1.1** - See [LICENSE.md](LICENSE.md)
- Free for research, development, and non-commercial use
- Commercial use requires 5,000+ veEQUAL tokens
- Converts to MIT License in 2029

## Links

- **[Live Data](https://beaniebozombie.github.io/veEQUAL-dashboard/)** - View the dashboard
- **[Latest Report](veEQUAL.md)** - Comprehensive governance analysis report
- **[Sonic](https://soniclabs.com)** - Layer 1 blockchain
- **[Equalizer Exchange](https://equalizer.exchange)** - DeFi protocol

---

*Built with care for the Equalizer community*
# YAML syntax fixed - trigger workflow test
