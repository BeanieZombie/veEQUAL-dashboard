# veEQUAL API & Data Pipeline

[![Update veEQUAL Dashboard](https://github.com/BeanieZombie/veEQUAL-dashboard/actions/workflows/update.yml/badge.svg)](https://github.com/BeanieZombie/veEQUAL-dashboard/actions/workflows/update.yml)

> 📊 **[View Latest veEQUAL Report](veEQUAL.md)** - Daily updated data on all veEQUAL holders and NFTs

This project provides a data pipeline and API for veEQUAL (Vote Escrowed EQUAL) on the Sonic blockchain. It generates a daily markdown report and exposes the data through a simple Bun-based API.

## Data Pipeline

The data pipeline performs the following steps:

1.  **Fetches Data**: Retrieves the latest veEQUAL data from the Sonic blockchain.
2.  **Processes Data**: Uses DuckDB to process and aggregate the data. SQL queries for this are located in the `sql/` directory.
3.  **Generates Report**: Creates a markdown report (`veEQUAL.md`) summarizing the current state, including top NFTs, top holders, and a detailed leaderboard. This report is updated daily.
4.  **Generates JSON Data**: Creates JSON files in `data/api/` for consumption by the API.

The core data pipeline logic is in `lib/` and `src/update.ts`. The markdown report generation is handled by `src/writeMd.ts`.

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
*   **`/api/summary`**: Returns overall summary statistics. (Corresponds to `data/api/summary.json`)
*   **`/api/holders`**: Returns data on top token holders. (Corresponds to `data/api/top-holders.json`)
*   **`/api/nfts`**: Returns data on top NFTs. (Corresponds to `data/api/top-nfts.json`)
*   **`/api/analytics`**: Returns detailed analytics data. (Corresponds to `data/api/analytics.json`)

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

### Running the API Locally

1.  Install dependencies:
    ```bash
    bun install
    ```
2.  Start the API server:
    ```bash
    bun run api
    ```
    The API will be available at `http://localhost:3000`.

## Deployment

The data pipeline and API are designed to be deployed using GitHub Actions. The workflow (`.github/workflows/update.yml`) performs the following:

1.  **Daily Update (0:33 UTC)**:
    *   Checks out the code.
    *   Sets up Bun.
    *   Installs dependencies (`bun install`).
    *   Runs the data update script (`bun run update`), which fetches data, processes it, and generates `veEQUAL.md` and JSON files.
    *   Commits and pushes the updated `veEQUAL.md`, JSON files in `data/`, and the DuckDB database file to the repository.
2.  **GitHub Pages Deployment**:
    *   The updated `veEQUAL.md` and other static assets (if any were configured for Pages) are deployed to GitHub Pages.
    *   The API itself is intended to be run on a server environment that supports Bun. The GitHub Actions workflow primarily handles the data update and report generation part. For a full API deployment, you would typically pull the latest code (with updated data) onto your server and restart the Bun API process.

## Project Structure

*   `api.ts`: Bun server implementation.
*   `src/update.ts`: Main script for the data update pipeline.
*   `src/writeMd.ts`: Logic for generating the `veEQUAL.md` report.
*   `src/constants.ts`: Project constants.
*   `lib/`: Core data fetching, database interaction, and utility functions.
*   `sql/`: SQL queries for data processing.
*   `data/`: Contains the DuckDB database (`veEqual.duckdb`) and generated JSON files for the API.
*   `veEQUAL.md`: The generated markdown report.
*   `.github/workflows/update.yml`: GitHub Actions workflow for daily updates and deployment.
*   `package.json`: Project dependencies and scripts.
*   `bun.lockb`: Bun lockfile.

### Key Scripts (from `package.json`)
- `bun run update`: Runs the full data update pipeline (fetches data, processes it, generates `veEQUAL.md` and JSON files).
- `bun run api`: Starts the Bun API server (serves API endpoints and `veEQUAL.md`).
- `bun run dev`: A development script, typically to run the update and then start the API server.
- `bun run start`: Usually an alias for `bun run api` or a production start command.
- `bun run test`: Runs any configured test suites (e.g., TypeScript checks, unit tests).
