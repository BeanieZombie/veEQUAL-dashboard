# veEQUAL Dashboard

[![Update veEQUAL Dashboard](https://github.com/BeanieZombie/veEQUAL-dashboard/actions/workflows/update.yml/badge.svg)](https://github.com/BeanieZombie/veEQUAL-dashboard/actions/workflows/update.yml)

A comprehensive analytics dashboard for tracking veEQUAL (vote-escrowed EQUAL) token holders and governance metrics on the Sonic blockchain. Built with modern data infrastructure for real-time insights and automated reporting.

## 🚀 Features

- **Real-time Analytics**: Automated hourly data collection and processing
- **Comprehensive Dashboard**: Interactive visualizations with multiple metric views
- **Top Holders Tracking**: Ranked lists of voting power and governance influence
- **Historical Analysis**: Time-series data with trend analysis and forecasting
- **NFT Management**: Individual veEQUAL NFT tracking and unlock schedules
- **Governance Insights**: Concentration analysis and voting power distribution
- **API Endpoints**: RESTful API for external integrations
- **Automated Reporting**: Markdown reports with dynamic table of contents

## 🛠 Technology Stack

- **Runtime**: [Bun](https://bun.sh) 1.1+ (JavaScript/TypeScript runtime)
- **Database**: [DuckDB](https://duckdb.org) with Parquet file storage
- **Blockchain**: [Viem](https://viem.sh) for Ethereum/Sonic interactions
- **Data Format**: [Apache Parquet](https://parquet.apache.org) for efficient analytics
- **CI/CD**: GitHub Actions for automated data updates
- **API**: Bun native HTTP server with JSON endpoints

## 📊 API Endpoints

The dashboard provides several API endpoints for external integrations:

### Core Data
- `GET /api/summary` - Overall statistics and key metrics
- `GET /api/top-holders` - Top 50 veEQUAL holders by voting power
- `GET /api/top-nfts` - Top 50 individual NFTs by value
- `GET /api/analytics` - Comprehensive analytics data

### Visualizations
- `GET /api/charts` - Chart data for visualizations
- `GET /api/dashboard` - Dashboard configuration and metrics

### Utility
- `GET /api/wallet-nfts?address={wallet}` - NFTs owned by specific wallet

All endpoints return JSON data with appropriate caching headers.

## 🚀 Quick Start

### Prerequisites
```bash
# Install Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# Or using Homebrew
brew install oven-sh/bun/bun
```

### Installation & Setup
```bash
# Clone the repository
git clone https://github.com/BeanieZombie/veEQUAL-dashboard.git
cd veEQUAL-dashboard

# Install dependencies
bun install

# Run initial data collection
bun run update
```

### Development
```bash
# Start the API server (development mode)
bun run dev

# Or start the API server (production mode)
bun run start

# Run data update pipeline
bun run update

# Generate markdown report
bun run md
```

### API Server
```bash
# Start API server on http://localhost:3000
bun run start

# Access endpoints
curl http://localhost:3000/api/summary
curl http://localhost:3000/api/top-holders
```

## 📁 Project Structure

```
├── api.ts                 # Main API server and endpoints
├── src/                   # Core TypeScript modules
│   ├── update.ts         # Data collection pipeline
│   ├── generateJSON.ts   # JSON API generation
│   ├── writeMd.ts        # Markdown report generation
│   ├── constants.ts      # Configuration constants
│   └── abi/              # Smart contract ABIs
├── lib/                   # Utility libraries
│   ├── db.ts            # DuckDB database operations
│   ├── rpcProvider.ts   # Blockchain RPC connections
│   └── formatUtils.ts   # Data formatting utilities
├── sql/                   # SQL queries for data processing
├── data/                  # Generated data files
│   ├── *.parquet        # Parquet data files
│   ├── veEqual.duckdb   # DuckDB database
│   └── api/             # Generated JSON API files
└── .github/workflows/    # GitHub Actions automation
```

## 🔄 Data Pipeline

The system operates on a multi-stage data pipeline:

1. **Collection**: Fetches all veEQUAL NFT data from Sonic blockchain
2. **Processing**: Aggregates data using SQL queries in DuckDB
3. **Export**: Generates Parquet files for efficient analytics
4. **API Generation**: Creates JSON endpoints for web consumption
5. **Reporting**: Produces markdown reports with insights

### Key Data Models
- **Owner Daily**: Daily holder snapshots and changes
- **Total Supply**: Historical supply metrics and trends
- **Concentration**: Holder concentration and distribution analysis
- **Unlock History**: Token unlock schedules and impact analysis
- **Wallet Changes**: Wallet-level activity tracking
- **NFT Details**: Individual NFT metadata and valuations

## 📈 Analytics Features

### Governance Metrics
- **Voting Power Distribution**: Concentration analysis across holders
- **Top Holders Tracking**: Leaderboards with historical changes
- **Governance Concentration**: Decentralization metrics and trends

### Financial Analysis
- **Token Unlock Schedules**: Future unlock events and impact
- **Historical Valuations**: Price trends and market analysis
- **Liquidity Analysis**: Lock duration and unlock patterns

### Operational Insights
- **Data Freshness**: Real-time monitoring of data collection
- **System Health**: Pipeline performance and error tracking
- **Usage Analytics**: API endpoint performance metrics

## 🚀 Deployment

### GitHub Actions (Automated)
The repository includes automated data updates via GitHub Actions:
- Runs every hour to collect fresh data
- Updates all Parquet files and JSON APIs
- Commits changes back to the repository
- Maintains historical data integrity

### Local Deployment
```bash
# Production server
bun run start

# Development with auto-reload
bun run dev

# Data update only
bun run update
```

### Environment Variables
```bash
# Optional: Custom RPC endpoint
SONIC_RPC_URL=https://rpc.soniclabs.com

# Optional: API server port
PORT=3000
```

## 🔍 Generated Files

### Data Files
- `data/*.parquet` - Efficient columnar data for analytics
- `data/veEqual.duckdb` - Complete SQLite-compatible database
- `data/api/*.json` - Pre-generated API responses

### Reports
- `veEQUAL.md` - Comprehensive markdown report with insights
- Auto-generated table of contents with upcoming unlock warnings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the Business Source License 1.1 (BSL 1.1).

**Commercial Use**: Requires holding a minimum of 5,000 veEQUAL tokens.
**Open Source**: Freely available for non-commercial use, research, and development.

The license automatically converts to Apache License 2.0 after the Change Date specified in LICENSE.md.

## 🔗 Links

- **Live Dashboard**: [View on GitHub Pages](https://beaniebozombie.github.io/veEQUAL-dashboard/)
- **API Documentation**: Available at `/api/` endpoints when server is running
- **Sonic Blockchain**: [Sonic Labs](https://soniclabs.com)
- **EQUAL Protocol**: [Equalizer DEX](https://equal.fi)

---

Built with ❤️ using [Bun](https://bun.sh) | Powered by [DuckDB](https://duckdb.org) | Data via [Sonic](https://soniclabs.com)
