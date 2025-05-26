# veEQUAL Dashboard

[![Update veEQUAL Dashboard](https://github.com/BeanieZombie/veEQUAL-dashboard/actions/workflows/update.yml/badge.svg)](https://github.com/BeanieZombie/veEQUAL-dashboard/actions/workflows/update.yml)

A comprehensive analytics platform for veEQUAL governance tracking on Sonic blockchain.

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

| Endpoint | Description | Response Format |
|----------|-------------|----------------|
| `/api/summary` | Key metrics and totals | JSON |
| `/api/holders` | Top 50 holders by voting power | JSON |
| `/api/nfts` | Top 50 individual NFTs | JSON |
| `/data/api/dashboard.json` | Complete dashboard data | JSON |

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
