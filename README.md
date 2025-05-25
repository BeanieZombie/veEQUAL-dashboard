# veEQUAL API & Data Pipeline

[![Update veEQUAL Dashboard](https://github.com/BeanieZombie/veEQUAL-dashboard/actions/workflows/update.yml/badge.svg)](https://github.com/BeanieZombie/veEQUAL-dashboard/actions/workflows/update.yml)

> 📊 **[View Latest veEQUAL Report](veEQUAL.md)** - Daily updated data on all veEQUAL holders and NFTs
>
> 🔄 **Auto-Updated**: Daily at 00:33 UTC via GitHub Actions
>
> 🌐 **Live API**: Real-time data access through REST endpoints

This project provides a comprehensive data pipeline and API for veEQUAL (Vote Escrowed EQUAL) on the Sonic blockchain. It automatically fetches, processes, and serves veEQUAL data through multiple formats including markdown reports, JSON APIs, and downloadable datasets.

## Technology Stack

- **Runtime**: Bun (JavaScript/TypeScript runtime)
- **Database**: DuckDB (in-process analytics database)
- **Blockchain**: Viem client for Sonic blockchain interaction
- **Data Format**: Parquet files for data exports
- **Deployment**: GitHub Actions with GitHub Pages
- **Language**: TypeScript with ES modules

## Data Pipeline

The data pipeline performs the following steps:

1.  **Fetches Data**: Retrieves the latest veEQUAL data from the Sonic blockchain using a resilient RPC provider that automatically discovers and tests multiple endpoints.
2.  **Processes Data**: Uses DuckDB to process and aggregate the data. SQL queries for this are located in the `sql/` directory.
3.  **Generates Report**: Creates a markdown report (`veEQUAL.md`) summarizing the current state, including top NFTs, top holders, and a detailed leaderboard. This report is updated daily.
4.  **Generates JSON Data**: Creates JSON files in `data/api/` for consumption by the API.

The core data pipeline logic is in `lib/` and `src/update.ts`. The markdown report generation is handled by `src/writeMd.ts`, and JSON generation by `src/generateJSON.ts`.

### Data Model

The pipeline processes veEQUAL data into several structured datasets:

- **`venfts`**: Individual NFT records with voting power, unlock dates, and ownership
- **`owner_daily`**: Daily aggregated data per owner (total voting power, NFT count, next unlock)
- **`total_supply`**: Historical supply tracking
- **`concentration`**: Voting power concentration metrics
- **`unlock_hist`**: Historical unlock event tracking
- **`wallet_changes`**: Wallet-level change tracking over time

All data is stored in DuckDB with additional Parquet exports for analysis.

## Markdown Report

The `veEQUAL.md` report is generated daily at 0:33 UTC and includes:

*   Total veEQUAL Owners
*   Total veEQUAL NFTs
*   Last data build timestamp
*   Top 10 NFTs by Balance (with unlock warnings ⚠️ for NFTs unlocking within 30 days)
*   Top 10 Holders by Total Voting Power (with Debank links and unlock warnings ⚠️)
*   A detailed "veEQUAL Leaderboard" showing:
    *   Rank
    *   Owner (with Debank profile link)
    *   Total Voting Power
    *   Influence Percentage
    *   List of NFT IDs held by the owner (with unlock warnings ⚠️)

## API Endpoints

The Bun server (`api.ts`) exposes the following endpoints:

*   **`/`**: Serves API documentation, including a link to the latest `veEQUAL.md` report.
*   **`/veEQUAL.md`**: Serves the raw markdown report.
*   **`/report`**: Also serves the raw markdown report.
*   **`/api/summary`**: Returns overall summary statistics (total voting power, unique holders, total NFTs)
*   **`/api/holders`**: Returns top 100 holders by voting power with formatted display values
*   **`/api/nfts`**: Returns top 100 NFTs by voting power with ownership and unlock information
*   **`/api/analytics`**: Analytics endpoint (currently disabled - under development)

### API Response Format

All API endpoints return JSON with the following structure:
```json
{
  "success": true,
  "data": [...],
  "lastUpdated": "2025-05-25T12:50:09.290Z",
  "count": 100
}
```

### Generated Data Files

The pipeline also generates the following JSON files in `data/api/`:
- `summary.json` - Overall statistics
- `top-holders.json` - Top holders data
- `top-nfts.json` - Top NFTs data
- `analytics.json` - Analytics and charts data
- `dashboard.json` - Combined dashboard data
- `charts.json` - Chart-specific data
- `wallet-nfts.json` - Wallet-to-NFT mappings

## RPC Resilience

This project features a robust RPC provider system that eliminates single points of failure:

### Dynamic RPC Discovery
- **Automatic RPC Fetching**: Dynamically fetches all available Sonic (Chain ID 146) RPC endpoints from [chainlist.org](https://chainlist.org/rpcs.json)
- **Performance Testing**: Tests all RPCs on startup and sorts them by response time
- **Fallback Protection**: Includes hardcoded fallback RPCs in case chainlist.org is unavailable

### Automatic Failover
- **Retry Logic**: Automatically retries failed requests with different RPC endpoints
- **Health Monitoring**: Marks failed RPCs as unavailable and rotates to healthy ones
- **Periodic Refresh**: Refreshes the RPC list every 5 minutes to discover new endpoints

### Current RPC Pool
The system automatically discovers and tests RPCs including:
- `https://sonic-rpc.publicnode.com`
- `https://rpc.soniclabs.com`
- `https://sonic.gateway.tenderly.co`
- `https://sonic.drpc.org`
- `https://rpc.ankr.com/sonic_mainnet`
- And others from chainlist.org

This ensures maximum uptime and performance for blockchain data fetching.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) runtime (latest version)
- Git for cloning the repository

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BeanieZombie/veEQUAL-dashboard.git
   cd veEQUAL-dashboard
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Run the data pipeline** (optional - data is already included):
   ```bash
   bun run update
   ```

4. **Start the API server**:
   ```bash
   bun run api
   ```

The API will be available at `http://localhost:3000` with:
- API documentation at `/`
- Markdown report at `/veEQUAL.md`
- Data endpoints at `/api/*`

### Development Scripts

- `bun run dev` - Run data update and start API server
- `bun run update` - Run only the data pipeline
- `bun run api` - Start only the API server
- `bun run start` - Production API start (same as `api`)

## Deployment

The data pipeline is automated using GitHub Actions, with the API designed for deployment on any Bun-compatible server. The workflow (`.github/workflows/update.yml`) performs the following:

1.  **Daily Update (0:33 UTC)**:
    *   Checks out the code and sets up Bun environment
    *   Installs dependencies (`bun install`)
    *   Runs the data update script (`bun run update`), which:
        - Fetches fresh veEQUAL data from Sonic blockchain using resilient RPC provider
        - Processes data through DuckDB with SQL transformations
        - Generates `veEQUAL.md` markdown report and JSON API files
        - Updates the DuckDB database with latest information
    *   Commits and pushes updated files to the repository
2.  **GitHub Pages Deployment**:
    *   Deploys the updated `veEQUAL.md` report and data files to GitHub Pages
    *   Makes the markdown report publicly accessible
    *   For API deployment, pull the latest code to your server and run `bun run api`

### API Deployment

To deploy the API server:
```bash
git clone https://github.com/BeanieZombie/veEQUAL-dashboard.git
cd veEQUAL-dashboard
bun install
bun run api
```

The API will be available at `http://localhost:3000` (or your configured port).

## Project Structure

*   `api.ts`: Bun server implementation with CORS support and comprehensive API endpoints.
*   `src/update.ts`: Main script for the data update pipeline.
*   `src/writeMd.ts`: Logic for generating the `veEQUAL.md` report.
*   `src/generateJSON.ts`: Generates JSON API files from processed data.
*   `src/constants.ts`: Project constants and configuration.
*   `lib/`: Core modules:
    - `db.ts`: DuckDB database connection and management
    - `rpcProvider.ts`: Resilient RPC provider with automatic failover
    - `viemClient.ts`: Viem blockchain client configuration
    - `fetch.ts`: Data fetching utilities
    - `runSql.ts`: SQL execution and data transformation
    - `formatUtils.ts`: Data formatting utilities
    - `getMaxNFTId.ts`: NFT ID discovery utilities
*   `sql/`: SQL queries for data processing and analysis:
    - `00_create_ens_table.sql`: ENS table creation
    - `01_owner_daily.sql`: Daily owner aggregations
    - `02_total_supply.sql`: Supply calculations
    - `03_concentration.sql`: Concentration analysis
    - `04_unlock_hist.sql`: Unlock history tracking
    - `05_wallet_changes.sql`: Wallet change tracking
    - `06_whale_analysis.sql`: Large holder analysis
    - `07_unlock_impact.sql`: Unlock impact analysis
*   `src/abi/`: Smart contract ABIs for veEQUAL and EQUAL tokens
*   `data/`: Contains:
    - `veEqual.duckdb`: DuckDB database with processed data
    - `*.parquet`: Parquet files for different data views
    - `api/`: Generated JSON files for API endpoints
*   `veEQUAL.md`: The generated markdown report.
*   `.github/workflows/update.yml`: GitHub Actions workflow for daily updates and deployment.

### Key Scripts (from `package.json`)
- `bun run update`: Runs the full data update pipeline (fetches data, processes it, generates `veEQUAL.md` and JSON files).
- `bun run api`: Starts the Bun API server (serves API endpoints and `veEQUAL.md`).
- `bun run dev`: Development script that runs the update pipeline and then starts the API server.
- `bun run start`: Starts the API server (alias for `bun run api`).
