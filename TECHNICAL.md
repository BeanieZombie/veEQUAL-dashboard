# Technical Documentation

## Table of Contents
- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Building the Code](#building-the-code)
- [Running & Debugging](#running--debugging)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Data Pipeline](#data-pipeline)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [RPC Management](#rpc-management)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Monitoring & Observability](#monitoring--observability)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [Coding Guidance](#coding-guidance)

## Project Overview

The veEQUAL Dashboard is a comprehensive analytics platform designed for tracking governance data on the Sonic blockchain. This project provides real-time insights into voting power distribution, holder analytics, and governance concentration for the Equalizer DEX ecosystem.

### Key Components

This repository contains the source code for:

- **Analytics Engine**: Data collection and processing pipeline using DuckDB
- **API Server**: REST endpoints serving pre-computed governance data
- **Smart RPC Provider**: Intelligent blockchain connectivity with automatic failover
- **Report Generator**: Automated markdown reporting with dynamic content
- **Data Export**: Parquet file generation for efficient analytics storage

### Related Resources

- **[Live Dashboard](https://beaniebozombie.github.io/veEQUAL-dashboard/)** - Production deployment
- **[Sonic Blockchain](https://soniclabs.com)** - Layer 1 blockchain platform
- **[Equalizer Exchange](https://equalizer.exchange)** - DeFi protocol
- **[veEQUAL Contract](https://paintswap.io/sonic/assets/0x3045119766352fF250b3d45312Bd0973CBF7235a)** - NFT collection

## Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows 10/11
- **Node.js**: Version 18 or later
- **Bun**: Version 1.0 or later (recommended runtime)
- **Git**: For repository management
- **Internet Connection**: Required for blockchain data fetching

### Development Environment Setup

#### Using Bun (Recommended)

1. **Install Bun** (if not already installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Verify Installation**:
   ```bash
   bun --version
   ```

#### Alternative: Using Node.js

If you prefer Node.js over Bun:

1. **Install Node.js** (18+):
   ```bash
   # Using Homebrew on macOS
   brew install node

   # Using nvm (cross-platform)
   nvm install 18
   nvm use 18
   ```

2. **Verify Installation**:
   ```bash
   node --version
   npm --version
   ```

### Optional Dependencies

- **DuckDB CLI**: For direct database inspection
- **VS Code**: Recommended IDE with TypeScript support
- **Postman**: For API testing and development

## Building the Code

### Initial Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/BeanieZombie/veEQUAL-dashboard.git
   cd veEQUAL-dashboard
   ```

2. **Install Dependencies**:
   ```bash
   bun install
   ```

### Build Commands

#### Development Build
```bash
# Install dependencies and start development server
bun run dev
```

#### Production Build
```bash
# Build for production deployment
bun run build
```

#### Data Collection Only
```bash
# Update data without starting server
bun run update
```

### Build Verification

After building, verify the setup by checking for generated files:

```bash
# Check if data directory exists
ls -la data/

# Verify API files are generated
ls -la data/api/

# Test API server
curl http://localhost:3000/api/summary
```

## Running & Debugging

### Development Server

To run the dashboard in development mode with hot reloading:

```bash
bun run dev
```

This command will:
1. Check for existing data and collect fresh data if needed
2. Start the API server on `http://localhost:3000`
3. Enable file watching for automatic restarts

### Production Server

For production deployment:

```bash
bun run start
```

### API Testing

Test individual endpoints using curl:

```bash
# Test summary endpoint
curl http://localhost:3000/api/summary

# Test holders endpoint
curl http://localhost:3000/api/holders

# Test NFTs endpoint
curl http://localhost:3000/api/nfts
```

### Debugging Tips

#### Common Issues

1. **Port Already in Use**:
   ```bash
   # Find process using port 3000
   lsof -i :3000

   # Kill the process
   kill -9 <PID>
   ```

2. **RPC Connection Issues**:
   ```bash
   # Test RPC connectivity
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     https://sonic-rpc.publicnode.com
   ```

3. **Database Corruption**:
   ```bash
   # Remove and regenerate database
   rm data/veEqual.duckdb*
   bun run update
   ```

#### Logging

Enable verbose logging by setting environment variable:

```bash
DEBUG=true bun run dev
```

## Project Structure

```
veEQUAL-dashboard/
├── api.ts                     # Main API server and endpoint definitions
├── package.json               # Dependencies and npm scripts
├── tsconfig.json              # TypeScript configuration
├── bun.lockb                  # Bun lockfile for reproducible builds
├── README.md                  # Project overview and quick start
├── TECHNICAL.md               # This comprehensive technical documentation
├── LICENSE.md                 # Business Source License 1.1
├──
├── src/                       # Core application modules
│   ├── update.ts              # Main data collection pipeline orchestrator
│   ├── generateJSON.ts        # JSON API endpoint generation
│   ├── writeMd.ts             # Markdown report generation with TOC
│   ├── constants.ts           # Application constants and configuration
│   ├── equalGovernance.ts     # Governance-specific data processing
│   └── abi/                   # Smart contract ABIs
│       ├── veequal.json       # veEQUAL NFT contract ABI
│       └── equal.json         # EQUAL token contract ABI
│
├── lib/                       # Utility libraries and helpers
│   ├── db.ts                  # DuckDB database operations and connections
│   ├── fetch.ts               # Blockchain data fetching utilities
│   ├── formatUtils.ts         # Data formatting and number utilities
│   ├── getMaxNFTId.ts         # NFT enumeration and discovery
│   ├── rpcProvider.ts         # Smart RPC provider with failover
│   ├── runSql.ts              # SQL execution and query utilities
│   └── viemClient.ts          # Viem blockchain client configuration
│
├── sql/                       # SQL transformation queries (executed in order)
│   ├── 00_create_ens_table.sql    # ENS domain resolution table
│   ├── 01_owner_daily.sql         # Daily owner aggregation
│   ├── 02_total_supply.sql        # Supply metrics calculation
│   ├── 03_concentration.sql       # Concentration analysis (Gini, etc.)
│   ├── 04_unlock_hist.sql         # Unlock schedule analysis
│   ├── 05_wallet_changes.sql      # Wallet movement tracking
│   ├── 06_whale_analysis.sql      # Governance tier classification
│   └── 07_unlock_impact.sql       # Unlock impact projections
│
├── data/                      # Generated data files (not committed)
│   ├── venfts.parquet         # Raw NFT data from blockchain
│   ├── owner_daily.parquet    # Processed daily owner data
│   ├── total_supply.parquet   # Supply metrics over time
│   ├── concentration.parquet  # Concentration analysis results
│   ├── unlock_hist.parquet    # Historical unlock data
│   ├── wallet_changes.parquet # Wallet movement data
│   ├── veEqual.duckdb         # Main DuckDB database file
│   ├── veEqual.duckdb.wal     # DuckDB write-ahead log
│   └── api/                   # Pre-generated JSON API responses
│       ├── summary.json       # Key metrics and totals
│       ├── top-holders.json   # Top 50 holders by voting power
│       ├── top-nfts.json      # Top 50 individual NFTs
│       ├── charts.json        # Chart data for visualizations
│       ├── dashboard.json     # Complete dashboard dataset
│       ├── wallet-nfts.json   # Wallet-to-NFT mapping
│       └── analytics.json     # Advanced analytics and insights
│
├── .github/                   # GitHub Actions and workflows
│   └── workflows/
│       └── update.yml         # Automated daily data collection
│
└── veEQUAL.md                 # Generated governance report with insights
```

### Key File Descriptions

#### Core Application Files

- **`api.ts`**: Express.js server providing REST API endpoints. Serves pre-generated JSON files and handles CORS for browser access.

- **`src/update.ts`**: Main orchestrator for the data pipeline. Coordinates blockchain data fetching, database operations, and file generation.

- **`src/generateJSON.ts`**: Transforms DuckDB query results into optimized JSON API responses with proper formatting and structure.

- **`src/writeMd.ts`**: Generates the comprehensive veEQUAL.md report with dynamic table of contents based on upcoming unlock dates.

#### Database and Analytics

- **`lib/db.ts`**: Manages DuckDB connections, handles Parquet file operations, and provides database utilities.

- **`sql/*.sql`**: Sequential SQL transformations that process raw NFT data into analytics insights. Each file represents a stage in the pipeline.

#### Blockchain Integration

- **`lib/rpcProvider.ts`**: Sophisticated RPC management system with automatic discovery, performance testing, and failover capabilities.

- **`lib/viemClient.ts`**: Viem configuration for blockchain interactions with retry logic and error handling.

## Architecture Overview

The veEQUAL Dashboard follows a modern, microservice-inspired architecture designed for reliability, performance, and maintainability. The system is built around a multi-stage data pipeline that transforms raw blockchain data into actionable governance insights.

### High-Level Architecture

```mermaid
graph TB
    A[Sonic Blockchain] --> B[Smart RPC Provider]
    B --> C[Data Collection Pipeline]
    C --> D[DuckDB Analytics Engine]
    D --> E[Parquet Storage]
    D --> F[JSON API Generation]
    D --> G[Markdown Report Generation]
    F --> H[REST API Server]
    G --> I[GitHub Pages Deployment]
    J[GitHub Actions] --> C

    subgraph "Data Processing"
        C --> C1[NFT Enumeration]
        C1 --> C2[Metadata Fetching]
        C2 --> C3[SQL Transformations]
        C3 --> C4[Analytics Computation]
    end

    subgraph "Output Formats"
        E[Parquet Files]
        F[JSON APIs]
        G[Markdown Reports]
    end
```

### Design Principles

1. **Reliability First**: Smart RPC provider with automatic failover ensures consistent data collection
2. **Performance Optimized**: DuckDB for fast analytics, Parquet for efficient storage
3. **Maintainable**: Clear separation of concerns with modular TypeScript architecture
4. **Observable**: Comprehensive logging and monitoring throughout the pipeline
5. **Scalable**: Stateless design allows for easy horizontal scaling

### Data Flow

The system processes data through five distinct stages:

#### Stage 1: Data Collection
- **Smart RPC Discovery**: Automatically discovers and tests Sonic RPC endpoints
- **NFT Enumeration**: Efficiently discovers all veEQUAL NFT IDs
- **Metadata Fetching**: Retrieves voting power, lock times, and ownership data
- **Error Handling**: Robust retry logic and fallback mechanisms

#### Stage 2: Data Processing
- **Raw Data Import**: Loads blockchain data into DuckDB for processing
- **SQL Transformations**: Eight sequential SQL stages transform raw data
- **Analytics Computation**: Calculates governance metrics and concentration analysis
- **Data Validation**: Ensures data integrity throughout processing

#### Stage 3: Storage & Export
- **Parquet Generation**: Exports processed data in columnar format
- **Database Persistence**: Maintains DuckDB database for queries
- **JSON API Creation**: Pre-computes API responses for fast access
- **Report Generation**: Creates comprehensive markdown documentation

#### Stage 4: API Service
- **REST Endpoints**: Serves JSON data via Express.js server
- **CORS Support**: Enables cross-origin requests for frontend integration
- **Performance**: Sub-millisecond response times via pre-computed data
- **Monitoring**: Request logging and performance metrics

#### Stage 5: Deployment
- **GitHub Actions**: Automated daily data collection and deployment
- **Version Control**: All data changes tracked in git history
- **Static Hosting**: GitHub Pages deployment for public access
- **Rollback Capability**: Git-based rollback for data issues

## Data Pipeline

The data pipeline is the core of the veEQUAL Dashboard, transforming raw blockchain data into governance insights through a series of carefully orchestrated stages.

### Pipeline Overview

```mermaid
flowchart LR
    A[🔗 Blockchain Data] --> B[📥 Collection]
    B --> C[🔄 Processing]
    C --> D[💾 Storage]
    D --> E[🚀 API Generation]
    E --> F[📊 Reports]

    subgraph "Collection Stage"
        B1[RPC Discovery]
        B2[NFT Enumeration]
        B3[Metadata Fetching]
        B4[Data Validation]
    end

    subgraph "Processing Stage"
        C1[SQL Stage 0: ENS]
        C2[SQL Stage 1: Owners]
        C3[SQL Stage 2: Supply]
        C4[SQL Stage 3: Concentration]
        C5[SQL Stage 4: Unlocks]
        C6[SQL Stage 5: Changes]
        C7[SQL Stage 6: Whales]
        C8[SQL Stage 7: Impact]
    end

    B --> B1 --> B2 --> B3 --> B4 --> C
    C --> C1 --> C2 --> C3 --> C4 --> C5 --> C6 --> C7 --> C8 --> D
```

### Stage 1: Data Collection (`src/update.ts`)

The collection stage fetches fresh data from the Sonic blockchain using our smart RPC provider system.

#### NFT Discovery Process

1. **Contract Analysis**: Query the veEQUAL contract for total supply
2. **ID Enumeration**: Efficiently discover all valid NFT IDs
3. **Batch Optimization**: Group requests to minimize RPC calls
4. **Progress Tracking**: Real-time progress reporting during collection

#### Metadata Fetching

For each discovered NFT:

```typescript
interface NFTData {
  id: number;              // NFT token ID
  owner: string;           // Current owner address
  balance: bigint;         // Raw token balance
  balanceFormatted: number; // Human-readable balance
  locked: bigint;          // Lock end timestamp
  votingPower: number;     // Current voting power
}
```

#### Error Handling & Retries

- **Automatic Retries**: Failed requests retry with exponential backoff
- **RPC Failover**: Automatic switching to backup RPC endpoints
- **Partial Recovery**: System continues with partial data if some requests fail
- **Data Validation**: Comprehensive validation ensures data integrity

### Stage 2: SQL Processing Pipeline

The SQL processing stage transforms raw NFT data through eight sequential stages, each building upon the previous results.

#### SQL Stage 0: ENS Table Creation (`00_create_ens_table.sql`)
```sql
-- Creates lookup table for ENS domain resolution
-- Enables human-readable addresses in reports
CREATE TABLE ens_lookup AS
SELECT address, ens_name, last_updated
FROM external_ens_api;
```

#### SQL Stage 1: Owner Daily Aggregation (`01_owner_daily.sql`)
```sql
-- Aggregates NFT data by owner for daily snapshots
-- Calculates total voting power per wallet
CREATE TABLE owner_daily AS
SELECT
  owner,
  COUNT(*) as nft_count,
  SUM(balance_formatted) as total_voting_power,
  MAX(locked) as latest_unlock,
  CURRENT_DATE as snapshot_date
FROM venfts
WHERE balance_formatted > 0
GROUP BY owner;
```

#### SQL Stage 2: Total Supply Metrics (`02_total_supply.sql`)
```sql
-- Calculates system-wide supply metrics
-- Tracks total locked tokens and voting power
CREATE TABLE total_supply AS
SELECT
  SUM(balance_formatted) as total_voting_power,
  COUNT(*) as total_nfts,
  COUNT(DISTINCT owner) as unique_holders,
  AVG(balance_formatted) as avg_voting_power,
  CURRENT_TIMESTAMP as calculated_at
FROM venfts;
```

#### SQL Stage 3: Concentration Analysis (`03_concentration.sql`)
```sql
-- Performs governance concentration analysis
-- Calculates Gini coefficient and power distribution
CREATE TABLE concentration AS
WITH ranked_holders AS (
  SELECT owner, total_voting_power,
    ROW_NUMBER() OVER (ORDER BY total_voting_power) as rank,
    COUNT(*) OVER () as total_holders
  FROM owner_daily
)
SELECT
  -- Gini coefficient calculation
  2.0 * SUM(rank * total_voting_power) /
  (total_holders * SUM(total_voting_power)) -
  (total_holders + 1) / total_holders as gini_coefficient,

  -- Power percentiles
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY total_voting_power) as median_power,
  PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY total_voting_power) as p90_power,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY total_voting_power) as p99_power
FROM ranked_holders;
```

#### SQL Stage 4: Unlock History (`04_unlock_hist.sql`)
```sql
-- Analyzes unlock schedules and future impact
-- Identifies upcoming governance changes
CREATE TABLE unlock_hist AS
SELECT
  DATE(locked, 'unixepoch') as unlock_date,
  COUNT(*) as nfts_unlocking,
  SUM(balance_formatted) as tokens_unlocking,
  SUM(balance_formatted) /
    (SELECT SUM(balance_formatted) FROM venfts) * 100 as impact_percentage
FROM venfts
WHERE locked > UNIXEPOCH('now')
GROUP BY DATE(locked, 'unixepoch')
ORDER BY unlock_date;
```

#### SQL Stage 5: Wallet Changes (`05_wallet_changes.sql`)
```sql
-- Tracks wallet-level changes and movements
-- Identifies new holders and power shifts
CREATE TABLE wallet_changes AS
SELECT
  owner,
  previous_power,
  current_power,
  power_change,
  change_percentage,
  change_type
FROM (
  SELECT owner,
    LAG(total_voting_power) OVER (ORDER BY snapshot_date) as previous_power,
    total_voting_power as current_power,
    total_voting_power - LAG(total_voting_power) OVER (ORDER BY snapshot_date) as power_change
  FROM owner_daily
);
```

#### SQL Stage 6: Whale Analysis (`06_whale_analysis.sql`)
```sql
-- Classifies holders into governance tiers
-- Analyzes power distribution by tier
CREATE TABLE whale_analysis AS
WITH holder_tiers AS (
  SELECT owner, total_voting_power,
    CASE
      WHEN total_voting_power >= 50000 THEN 'M.E.G.A Whale (≥50K)'
      WHEN total_voting_power >= 20000 THEN 'Major Holder (20K-50K)'
      WHEN total_voting_power >= 5000 THEN 'Equalest (5K-20K)'
      WHEN total_voting_power >= 1000 THEN 'More Equal (1K-5K)'
      ELSE 'Equal (<1K)'
    END as tier
  FROM owner_daily
)
SELECT tier,
  COUNT(*) as holder_count,
  SUM(total_voting_power) as tier_voting_power,
  AVG(total_voting_power) as avg_power_per_holder
FROM holder_tiers
GROUP BY tier;
```

#### SQL Stage 7: Unlock Impact Analysis (`07_unlock_impact.sql`)
```sql
-- Projects unlock impact on governance
-- Calculates cumulative effects over time
CREATE TABLE unlock_impact AS
SELECT
  unlock_month,
  monthly_unlock_amount,
  cumulative_unlock_amount,
  remaining_locked_amount,
  governance_impact_score
FROM (
  SELECT
    DATE_TRUNC('month', unlock_date) as unlock_month,
    SUM(tokens_unlocking) as monthly_unlock_amount,
    SUM(SUM(tokens_unlocking)) OVER (ORDER BY DATE_TRUNC('month', unlock_date)) as cumulative_unlock_amount
  FROM unlock_hist
  GROUP BY DATE_TRUNC('month', unlock_date)
);
```

### Stage 3: Data Export & Storage

After SQL processing, the system exports data in multiple formats optimized for different use cases.

#### Parquet File Generation

```typescript
// Export each table to Parquet format
const tables = [
  'venfts', 'owner_daily', 'total_supply',
  'concentration', 'unlock_hist', 'wallet_changes'
];

for (const table of tables) {
  await db.run(`
    COPY ${table} TO 'data/${table}.parquet'
    (FORMAT PARQUET, COMPRESSION 'snappy')
  `);
}
```

#### Database Persistence

The DuckDB database file is maintained for:
- **Interactive Queries**: Ad-hoc analysis and debugging
- **Data Lineage**: Tracking data transformations
- **Backup & Recovery**: Point-in-time data restoration
- **Development**: Local testing and experimentation

### Stage 4: API Generation (`src/generateJSON.ts`)

The API generation stage creates optimized JSON endpoints for fast client access.

#### Endpoint Generation Process

1. **Query Optimization**: Pre-compute expensive queries during generation
2. **Data Formatting**: Apply consistent number formatting and units
3. **Response Structuring**: Organize data for efficient client consumption
4. **File Writing**: Write JSON files to `data/api/` directory

#### Generated Endpoints

```typescript
interface APIEndpoints {
  '/api/summary': SummaryResponse;      // Key metrics overview
  '/api/holders': HoldersResponse;      // Top 50 holders
  '/api/nfts': NFTsResponse;           // Top 50 NFTs
  '/api/charts': ChartsResponse;        // Visualization data
  '/api/dashboard': DashboardResponse;  // Complete dataset
  '/api/wallet-nfts': WalletNFTsResponse; // Ownership mapping
  '/api/analytics': AnalyticsResponse;  // Advanced analytics
}
```

### Stage 5: Report Generation (`src/writeMd.ts`)

The final stage generates comprehensive markdown reports with dynamic content.

#### Dynamic Table of Contents

```typescript
// Generate TOC based on upcoming unlocks
const upcomingUnlocks = await db.all(`
  SELECT unlock_date, COUNT(*) as nft_count, SUM(tokens_unlocking) as total_tokens
  FROM unlock_hist
  WHERE unlock_date <= date('now', '+90 days')
  ORDER BY unlock_date
`);

const tocEntries = upcomingUnlocks.map(unlock => {
  const warningFlag = isWithin30Days(unlock.unlock_date) ? ' ⚠️' : '';
  return `### ${unlock.unlock_date}${warningFlag}`;
});
```

#### Report Sections

1. **Executive Summary**: High-level governance metrics
2. **Voting Power Distribution**: Visual and tabular analysis
3. **Top Holders**: Leaderboard with governance tiers
4. **Top NFTs**: Individual NFT rankings
5. **Unlock Schedule**: Future unlock impact analysis
6. **Governance Risk**: Concentration and centralization analysis

## Database Schema

### Overview

The veEQUAL Dashboard uses DuckDB as its primary analytics database, optimized for fast OLAP queries on governance data. The schema is designed around a multi-stage transformation pipeline that processes raw NFT data into comprehensive analytics insights.

### Database Engine

**DuckDB** is chosen for its exceptional performance characteristics:
- **Columnar Storage**: Optimized for analytics workloads
- **Vectorized Execution**: Fast aggregation and analytical queries
- **Parquet Integration**: Native support for data export/import
- **SQL Compliance**: Full SQL standard support
- **Embedded Design**: Zero-configuration deployment

### Core Tables

#### Primary Data Table: `venfts`

The foundation table storing raw NFT data collected from the Sonic blockchain.

```sql
CREATE TABLE venfts (
  token_id BIGINT PRIMARY KEY,           -- Unique NFT identifier
  owner VARCHAR NOT NULL,                -- Current owner wallet address
  balance_raw VARCHAR NOT NULL,          -- Raw token balance (wei format)
  balance_formatted DOUBLE NOT NULL,     -- Human-readable voting power
  unlock_timestamp BIGINT NOT NULL,      -- Unix timestamp of unlock date
  unlock_date VARCHAR,                   -- ISO date string (YYYY-MM-DD)
  snapshot_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data collection time
);

-- Indexes for performance
CREATE INDEX idx_venfts_owner ON venfts(owner);
CREATE INDEX idx_venfts_balance ON venfts(balance_formatted DESC);
CREATE INDEX idx_venfts_unlock ON venfts(unlock_timestamp);
CREATE INDEX idx_venfts_snapshot ON venfts(snapshot_time);
```

**Column Details:**
- `token_id`: Maps to NFT contract token IDs (0 to N)
- `owner`: Ethereum address in lowercase hex format
- `balance_raw`: Original blockchain value in wei (18 decimals)
- `balance_formatted`: Converted to human-readable decimals
- `unlock_timestamp`: When the NFT lock expires (0 = never locked)
- `unlock_date`: Formatted date for reporting (NULL for permanent locks)

#### Analytics Tables

The following tables are generated through SQL transformations and store processed analytics data:

#### `owner_daily` - Daily Owner Aggregation

```sql
CREATE TABLE owner_daily AS
SELECT
  CAST(snapshot_time AS DATE) as snapshot_date,    -- Aggregation date
  owner VARCHAR,                                    -- Wallet address
  nft_count INTEGER,                               -- Number of NFTs owned
  total_voting_power DOUBLE,                       -- Sum of all voting power
  next_overall_unlock_date VARCHAR,                -- Next unlock date across all NFTs
  last_nft_snapshot_within_day TIMESTAMP          -- Latest data update time
FROM venfts
WHERE balance_formatted > 0
GROUP BY CAST(snapshot_time AS DATE), owner;
```

#### `total_supply` - System-wide Metrics

```sql
CREATE TABLE total_supply AS
SELECT
  calculation_date DATE,                -- Date of calculation
  total_voting_power DOUBLE,           -- Total locked voting power
  total_nfts INTEGER,                   -- Total active NFTs
  unique_holders INTEGER,               -- Unique wallet count
  avg_voting_power DOUBLE,              -- Average power per NFT
  median_voting_power DOUBLE,           -- Median power distribution
  total_locked_value DOUBLE            -- Total economic value locked
FROM aggregated_metrics;
```

#### `concentration` - Governance Concentration Analysis

```sql
CREATE TABLE concentration AS
SELECT
  analysis_date DATE,                   -- Analysis date
  gini_coefficient DOUBLE,              -- Wealth distribution (0-1)
  top_1_percent_share DOUBLE,           -- Power held by top 1%
  top_5_percent_share DOUBLE,           -- Power held by top 5%
  top_10_percent_share DOUBLE,          -- Power held by top 10%
  herfindahl_index DOUBLE,              -- Market concentration index
  nakamoto_coefficient INTEGER,         -- Decentralization metric
  power_distribution_entropy DOUBLE     -- Information entropy of distribution
FROM concentration_analysis;
```

#### `whale_analysis` - Governance Tier Classification

```sql
CREATE TABLE whale_analysis AS
SELECT
  tier VARCHAR,                         -- Governance tier name
  holder_count INTEGER,                 -- Number of holders in tier
  tier_voting_power DOUBLE,             -- Total power of tier
  power_percentage DOUBLE,              -- Percentage of total power
  avg_power_per_holder DOUBLE,          -- Average power per holder
  min_power_threshold DOUBLE,           -- Minimum power for tier
  max_power_in_tier DOUBLE             -- Maximum power in tier
FROM tier_classification;
```

**Governance Tiers:**
- **M.E.G.A Whale (≥50K)**: Maximum governance influence
- **Major Holder (20K-50K)**: Significant voting power
- **Equalest (5K-20K)**: Core governance participants
- **More Equal (1K-5K)**: Active community members
- **Equal (<1K)**: Base participation level

#### `unlock_hist` - Historical Unlock Analysis

```sql
CREATE TABLE unlock_hist AS
SELECT
  unlock_date DATE,                     -- Unlock event date
  nfts_unlocking INTEGER,               -- Number of NFTs unlocking
  total_power_unlocking DOUBLE,         -- Voting power being unlocked
  percentage_of_supply DOUBLE,          -- % of total supply unlocking
  affected_holders INTEGER,             -- Number of holders affected
  cumulative_unlocked DOUBLE           -- Running total of unlocked power
FROM unlock_events;
```

#### `unlock_impact` - Future Unlock Impact Projections

```sql
CREATE TABLE unlock_impact AS
SELECT
  unlock_month VARCHAR,                 -- Month of unlock events (YYYY-MM)
  unlocking_nfts INTEGER,               -- NFTs unlocking in month
  unlocking_power DOUBLE,               -- Total power unlocking
  affected_holders INTEGER,             -- Holders affected
  power_impact_percentage DOUBLE,       -- % impact on governance
  nft_impact_percentage DOUBLE,         -- % of NFTs affected
  holder_impact_percentage DOUBLE,      -- % of holders affected
  cumulative_power_percentage DOUBLE    -- Cumulative impact
FROM impact_projections;
```

#### `wallet_changes` - Wallet Movement Tracking

```sql
CREATE TABLE wallet_changes AS
SELECT
  owner VARCHAR,                        -- Wallet address
  snapshot_date DATE,                   -- Change detection date
  previous_power DOUBLE,                -- Previous voting power
  current_power DOUBLE,                 -- Current voting power
  power_change DOUBLE,                  -- Absolute change
  change_percentage DOUBLE,             -- Percentage change
  change_type VARCHAR,                  -- 'increase', 'decrease', 'new', 'exit'
  nft_count_change INTEGER             -- Change in NFT count
FROM power_changes;
```

#### `ens_names` - ENS Domain Resolution

```sql
CREATE TABLE ens_names (
  address TEXT PRIMARY KEY,             -- Ethereum address
  name TEXT,                           -- ENS domain name
  updated_at TIMESTAMP                 -- Last resolution update
);
```

### Data Relationships

```mermaid
erDiagram
    venfts ||--o{ owner_daily : "aggregates"
    venfts ||--o{ whale_analysis : "classifies"
    venfts ||--o{ unlock_hist : "tracks"
    venfts ||--o{ unlock_impact : "projects"
    owner_daily ||--o{ wallet_changes : "compares"
    owner_daily ||--o{ concentration : "analyzes"
    owner_daily ||--o{ total_supply : "summarizes"
    venfts ||--o| ens_names : "resolves"

    venfts {
        bigint token_id PK
        varchar owner FK
        varchar balance_raw
        double balance_formatted
        bigint unlock_timestamp
        varchar unlock_date
        timestamp snapshot_time
    }

    owner_daily {
        date snapshot_date PK
        varchar owner PK
        integer nft_count
        double total_voting_power
        varchar next_overall_unlock_date
        timestamp last_nft_snapshot_within_day
    }

    whale_analysis {
        varchar tier PK
        integer holder_count
        double tier_voting_power
        double power_percentage
        double avg_power_per_holder
    }

    ens_names {
        text address PK
        text name
        timestamp updated_at
    }
```

### Query Patterns

#### Common Query Examples

**Top Holders by Voting Power:**
```sql
SELECT
  owner,
  total_voting_power,
  nft_count,
  RANK() OVER (ORDER BY total_voting_power DESC) as rank
FROM owner_daily
WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM owner_daily)
ORDER BY total_voting_power DESC
LIMIT 50;
```

**Governance Concentration Analysis:**
```sql
WITH power_distribution AS (
  SELECT
    owner,
    total_voting_power,
    SUM(total_voting_power) OVER () as total_power,
    PERCENT_RANK() OVER (ORDER BY total_voting_power) as percentile
  FROM owner_daily
  WHERE snapshot_date = CURRENT_DATE
)
SELECT
  COUNT(*) FILTER (WHERE percentile >= 0.99) as top_1_percent_holders,
  SUM(total_voting_power) FILTER (WHERE percentile >= 0.99) /
    MAX(total_power) * 100 as top_1_percent_power_share
FROM power_distribution;
```

**Upcoming Unlock Impact:**
```sql
SELECT
  unlock_date,
  COUNT(*) as nfts_unlocking,
  SUM(balance_formatted) as power_unlocking,
  SUM(balance_formatted) / (
    SELECT SUM(balance_formatted) FROM venfts
  ) * 100 as percentage_impact
FROM venfts
WHERE unlock_timestamp > UNIXEPOCH('now')
  AND unlock_timestamp <= UNIXEPOCH('now') + 2592000  -- Next 30 days
GROUP BY unlock_date
ORDER BY unlock_date;
```

**Whale Tier Distribution:**
```sql
SELECT
  tier,
  holder_count,
  tier_voting_power,
  ROUND(power_percentage, 2) as power_share,
  ROUND(avg_power_per_holder, 0) as avg_power
FROM whale_analysis
ORDER BY tier_voting_power DESC;
```

### Performance Optimization

#### Index Strategy

```sql
-- Primary performance indexes
CREATE INDEX idx_venfts_owner_balance ON venfts(owner, balance_formatted DESC);
CREATE INDEX idx_venfts_unlock_date ON venfts(unlock_date) WHERE unlock_date IS NOT NULL;
CREATE INDEX idx_owner_daily_date_power ON owner_daily(snapshot_date, total_voting_power DESC);

-- Partial indexes for filtered queries
CREATE INDEX idx_venfts_active ON venfts(balance_formatted) WHERE balance_formatted > 0;
CREATE INDEX idx_future_unlocks ON venfts(unlock_timestamp) WHERE unlock_timestamp > UNIXEPOCH('now');
```

#### Query Optimization Techniques

1. **Materialized Views**: Pre-compute expensive aggregations
2. **Columnar Storage**: Leverage DuckDB's columnar architecture
3. **Partition Pruning**: Use date-based filtering for large datasets
4. **Vectorized Operations**: Batch process analytical queries

### Data Lifecycle

#### Collection Pipeline

1. **Extraction**: Fetch NFT data from Sonic blockchain
2. **Transformation**: Process through 8 SQL stages
3. **Loading**: Insert/update into DuckDB tables
4. **Validation**: Verify data integrity and consistency
5. **Export**: Generate Parquet files for backup

#### Retention Policy

- **Raw Data**: Retained indefinitely for historical analysis
- **Daily Snapshots**: Kept for 2 years with daily granularity
- **Hourly Data**: Retained for 30 days for detailed analysis
- **Audit Logs**: Maintained for compliance and debugging

#### Backup Strategy

```bash
# Daily backup to Parquet format
COPY venfts TO 'backups/venfts_2024_01_15.parquet' (FORMAT PARQUET);
COPY owner_daily TO 'backups/owner_daily_2024_01_15.parquet' (FORMAT PARQUET);

# Full database backup
cp data/veEqual.duckdb backups/veEqual_2024_01_15.duckdb
```

### Schema Evolution

#### Migration Strategy

```sql
-- Example migration: Add new column to track NFT categories
ALTER TABLE venfts ADD COLUMN category VARCHAR DEFAULT 'standard';

-- Update existing data
UPDATE venfts SET category = 'whale' WHERE balance_formatted >= 50000;
UPDATE venfts SET category = 'major' WHERE balance_formatted >= 20000 AND balance_formatted < 50000;
```

#### Version Control

- **Schema versions** tracked in dedicated `schema_migrations` table
- **Backward compatibility** maintained for API consumers
- **Gradual rollout** of schema changes across environments

## API Reference

### Overview

The veEQUAL Dashboard provides a comprehensive REST API for accessing governance analytics data. All endpoints return JSON responses with consistent structure and include data freshness timestamps.

### Base URL

```
http://localhost:3000/api
```

For production deployment:
```
https://your-domain.com/api
```

### Authentication

The API currently operates in public read-only mode and does not require authentication. All endpoints support CORS for browser-based applications.

### Response Format

All API responses follow a consistent structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  lastUpdated?: string;
  count?: number;
}
```

### Core Endpoints

#### GET /api/summary

Returns high-level governance metrics and system overview.

**Response Schema:**
```typescript
interface SummaryResponse {
  totalVotingPower: string;      // Formatted total voting power (e.g., "2.1M")
  totalNFTs: number;             // Total number of active NFTs
  uniqueHolders: number;         // Number of unique wallet addresses
  lastUpdated: string;           // ISO timestamp of last data update
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalVotingPower": "2.1M",
    "totalNFTs": 4934,
    "uniqueHolders": 3684,
    "lastUpdated": "2025-05-25T22:10:34.641Z"
  },
  "count": 1
}
```

**Use Cases:**
- Dashboard header metrics
- System health monitoring
- Real-time governance overview

#### GET /api/top-holders

Returns the top 50 holders by voting power with governance tier classification.

**Response Schema:**
```typescript
interface Holder {
  owner: string;                 // Wallet address
  votingPower: number;           // Raw voting power
  formattedVotingPower: string;  // Human-readable power (e.g., "1.2M")
  nftCount: number;              // Number of NFTs owned
  tier: string;                  // Governance tier classification
  nextUnlockDate?: string;       // ISO date of next unlock (if any)
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "owner": "0x1234...5678",
      "votingPower": 1250000,
      "formattedVotingPower": "1.25M",
      "nftCount": 5,
      "tier": "M.E.G.A Whale (≥50K)",
      "nextUnlockDate": "2025-12-31"
    }
  ],
  "lastUpdated": "2025-05-25T22:10:34.641Z",
  "count": 50
}
```

**Governance Tiers:**
- **M.E.G.A Whale (≥50K)**: Maximum governance influence
- **Major Holder (20K-50K)**: Significant voting power
- **Equalest (5K-20K)**: Core governance participants
- **More Equal (1K-5K)**: Active community members
- **Equal (<1K)**: Base participation level

#### GET /api/top-nfts

Returns the top 50 individual NFTs by voting power.

**Response Schema:**
```typescript
interface NFT {
  tokenId: string;               // NFT token ID
  owner: string;                 // Current owner address
  votingPower: number;           // NFT voting power
  formattedVotingPower: string;  // Formatted power display
  unlockDate?: string;           // Unlock date (if locked)
  lastUpdated: string;           // Last data update timestamp
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "tokenId": "1337",
      "owner": "0x1234...5678",
      "votingPower": 750000,
      "formattedVotingPower": "750K",
      "unlockDate": "2025-12-31",
      "lastUpdated": "2025-05-25T22:10:34.641Z"
    }
  ],
  "lastUpdated": "2025-05-25T22:10:34.641Z",
  "count": 50
}
```

#### GET /api/charts

Returns time-series data optimized for chart visualizations.

**Response Schema:**
```typescript
interface ChartData {
  concentrationHistory: ConcentrationPoint[];
  unlockSchedule: UnlockEvent[];
  powerDistribution: DistributionPoint[];
  whaleAnalysis: WhaleTier[];
}

interface ConcentrationPoint {
  date: string;
  giniCoefficient: number;
  top1PercentShare: number;
  top5PercentShare: number;
}

interface UnlockEvent {
  date: string;
  nftsUnlocking: number;
  powerUnlocking: number;
  impactPercentage: number;
}
```

**Use Cases:**
- Historical trend analysis
- Governance concentration tracking
- Unlock impact visualization
- Risk assessment dashboards

#### GET /api/dashboard

Returns comprehensive dataset combining all major analytics for complete dashboard views.

**Response includes:**
- Summary metrics
- Top holders and NFTs
- Concentration analysis
- Unlock schedule
- Whale tier distribution
- Recent governance changes

#### GET /api/wallet-nfts

Returns wallet-to-NFT ownership mapping for detailed portfolio analysis.

**Response Schema:**
```typescript
interface WalletNFTs {
  [walletAddress: string]: {
    nfts: string[];              // Array of owned NFT token IDs
    totalVotingPower: number;    // Sum of all NFT voting power
    nftCount: number;            // Number of NFTs owned
  }
}
```

#### GET /api/analytics

Advanced analytics endpoint with governance risk metrics and projections.

**Note:** Currently disabled pending schema validation. Returns 503 status.

### Error Handling

The API uses standard HTTP status codes and provides detailed error messages:

**Error Response Format:**
```json
{
  "success": false,
  "error": "Detailed error message"
}
```

**Common Status Codes:**
- `200` - Success
- `404` - Endpoint not found
- `500` - Internal server error
- `503` - Service temporarily unavailable

### Rate Limiting

Currently no rate limiting is implemented. The API serves pre-computed data with sub-millisecond response times.

### Data Freshness

All responses include a `lastUpdated` timestamp indicating when the underlying data was last refreshed. Data is typically updated:

- **Real-time**: API responses (served from cache)
- **Daily**: Automated data collection via GitHub Actions
- **On-demand**: Manual updates via `bun run update`

### CORS Support

The API includes CORS headers to support browser-based applications:

```typescript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
}
```

### Usage Examples

#### JavaScript/TypeScript

```typescript
// Fetch summary data
const response = await fetch('http://localhost:3000/api/summary');
const { data } = await response.json();
console.log(`Total Voting Power: ${data.totalVotingPower}`);

// Get top holders with error handling
try {
  const response = await fetch('http://localhost:3000/api/top-holders');
  if (!response.ok) throw new Error('API request failed');

  const { success, data, error } = await response.json();
  if (!success) throw new Error(error);

  console.log(`Top holder: ${data[0].owner} with ${data[0].formattedVotingPower}`);
} catch (error) {
  console.error('Failed to fetch holders:', error);
}
```

#### cURL

```bash
# Get summary metrics
curl http://localhost:3000/api/summary

# Get top holders with formatted output
curl -s http://localhost:3000/api/top-holders | jq '.data[0]'

# Check API health
curl -I http://localhost:3000/api/summary
```

#### Python

```python
import requests
import json

# Fetch governance data
def get_governance_summary():
    response = requests.get('http://localhost:3000/api/summary')
    response.raise_for_status()

    data = response.json()
    if not data['success']:
        raise Exception(data.get('error', 'API request failed'))

    return data['data']

# Usage
summary = get_governance_summary()
print(f"Unique Holders: {summary['uniqueHolders']}")
```

### Performance Characteristics

- **Response Time**: Sub-millisecond (data served from pre-computed JSON files)
- **Throughput**: High (limited by network and parsing, not computation)
- **Data Size**: Optimized JSON payloads (typically 1-100KB per endpoint)
- **Caching**: File-system based caching with manual invalidation

### Development and Testing

#### Local Development

```bash
# Start the API server
bun run api

# Update data and start server
bun run dev

# Test endpoints
curl http://localhost:3000/api/summary
```

#### API Testing

```bash
# Test all endpoints
for endpoint in summary top-holders top-nfts charts dashboard wallet-nfts; do
  echo "Testing /api/$endpoint"
  curl -s "http://localhost:3000/api/$endpoint" | jq '.success'
done
```

## RPC Management

### Overview

The veEQUAL Dashboard utilizes RPC (Remote Procedure Call) connections to interact with blockchain networks. The RPC management system handles connection pooling, failover, rate limiting, and monitoring.

### RPC Configuration

#### Primary RPC Endpoints

```typescript
// config/rpc.ts
export const RPC_ENDPOINTS = {
  mainnet: {
    primary: 'https://mainnet.base.org',
    fallbacks: [
      'https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
      'https://base.publicnode.com',
      'https://base-rpc.publicnode.com'
    ]
  },
  testnet: {
    primary: 'https://sepolia.base.org',
    fallbacks: [
      'https://base-sepolia.g.alchemy.com/v2/YOUR-API-KEY',
      'https://sepolia.base.org'
    ]
  }
} as const;

export const RPC_CONFIG = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  maxConcurrent: 10,
  rateLimitPerSecond: 50
} as const;
```

#### RPC Provider Management

```typescript
// lib/rpc/provider-manager.ts
import { JsonRpcProvider, FallbackProvider } from 'ethers';

export class RPCProviderManager {
  private providers: Map<string, FallbackProvider> = new Map();
  private healthChecks: Map<string, boolean> = new Map();

  constructor(private config: typeof RPC_ENDPOINTS) {
    this.initializeProviders();
    this.startHealthChecking();
  }

  private initializeProviders(): void {
    Object.entries(this.config).forEach(([network, endpoints]) => {
      const providers = [endpoints.primary, ...endpoints.fallbacks]
        .map(url => new JsonRpcProvider(url));

      const fallbackProvider = new FallbackProvider(
        providers.map((provider, index) => ({
          provider,
          priority: index,
          weight: index === 0 ? 2 : 1
        }))
      );

      this.providers.set(network, fallbackProvider);
    });
  }

  async getProvider(network: string): Promise<FallbackProvider> {
    const provider = this.providers.get(network);
    if (!provider) {
      throw new Error(`No provider configured for network: ${network}`);
    }
    return provider;
  }

  private async startHealthChecking(): void {
    setInterval(async () => {
      await this.checkProviderHealth();
    }, 30000); // Check every 30 seconds
  }

  private async checkProviderHealth(): Promise<void> {
    for (const [network, provider] of this.providers) {
      try {
        await provider.getBlockNumber();
        this.healthChecks.set(network, true);
      } catch (error) {
        console.error(`Health check failed for ${network}:`, error);
        this.healthChecks.set(network, false);
      }
    }
  }
}
```

### Rate Limiting

```typescript
// lib/rpc/rate-limiter.ts
export class RPCRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs = 1000; // 1 second window

  async checkLimit(endpoint: string, maxRequests: number): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(endpoint) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }

    validRequests.push(now);
    this.requests.set(endpoint, validRequests);
    return true;
  }

  async waitForSlot(endpoint: string, maxRequests: number): Promise<void> {
    while (!(await this.checkLimit(endpoint, maxRequests))) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

### Connection Pooling

```typescript
// lib/rpc/connection-pool.ts
import { Connection } from 'ethers';

export class RPCConnectionPool {
  private pool: Connection[] = [];
  private busy: Set<Connection> = new Set();
  private readonly maxConnections = 10;
  private readonly minConnections = 2;

  constructor(private providerUrl: string) {
    this.initializePool();
  }

  private async initializePool(): Promise<void> {
    for (let i = 0; i < this.minConnections; i++) {
      const connection = new Connection(this.providerUrl);
      this.pool.push(connection);
    }
  }

  async getConnection(): Promise<Connection> {
    // Get available connection from pool
    const available = this.pool.find(conn => !this.busy.has(conn));

    if (available) {
      this.busy.add(available);
      return available;
    }

    // Create new connection if under limit
    if (this.pool.length < this.maxConnections) {
      const connection = new Connection(this.providerUrl);
      this.pool.push(connection);
      this.busy.add(connection);
      return connection;
    }

    // Wait for connection to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const available = this.pool.find(conn => !this.busy.has(conn));
        if (available) {
          clearInterval(checkInterval);
          this.busy.add(available);
          resolve(available);
        }
      }, 50);
    });
  }

  releaseConnection(connection: Connection): void {
    this.busy.delete(connection);
  }
}
```

## Configuration

### Overview

The veEQUAL Dashboard supports comprehensive configuration through environment variables, configuration files, and runtime parameters. This section covers all available configuration options and best practices.

### Environment Variables

#### Core Application Settings

```bash
# Application Configuration
NODE_ENV=production                    # Environment: development, staging, production
PORT=3000                             # API server port
HOST=0.0.0.0                          # Server bind address
APP_VERSION=1.0.0                     # Application version for monitoring

# Logging Configuration
LOG_LEVEL=info                        # Logging level: error, warn, info, debug
LOG_FORMAT=json                       # Log format: json, simple
LOG_OUTPUT=console                    # Output: console, file, both

# Database Configuration
DB_FILE=data/veEqual.duckdb           # DuckDB database file path
DB_MEMORY_LIMIT=1GB                   # Memory limit for DuckDB operations
DB_THREADS=4                          # Number of threads for parallel operations
```

#### Blockchain Configuration

```bash
# Sonic Blockchain Settings
SONIC_RPC_URL=https://rpc.soniclabs.com   # Primary RPC endpoint
VE_EQUAL=0x3045119766352fF250b3d45312Bd0973CBF7235a  # veEQUAL contract address
CHAIN_ID=146                               # Sonic chain ID

# RPC Provider Settings
RPC_TIMEOUT=30000                         # Request timeout in milliseconds
RPC_RETRIES=3                            # Number of retry attempts
RPC_RETRY_DELAY=1000                     # Delay between retries (ms)
RPC_MAX_CONCURRENT=10                    # Maximum concurrent requests
RPC_RATE_LIMIT=50                        # Requests per second limit

# Data Collection Settings
CHUNK_SIZE=500                           # Batch size for NFT fetching
PARALLEL_REQUESTS=4                      # Parallel request limit
UPDATE_INTERVAL=86400                    # Update interval in seconds (24h)
```

#### Monitoring and Observability

```bash
# Prometheus Metrics
METRICS_ENABLED=true                     # Enable metrics collection
METRICS_PORT=9090                        # Metrics server port
METRICS_PATH=/metrics                    # Metrics endpoint path

# Logging and Tracing
ELASTICSEARCH_URL=http://localhost:9200  # Elasticsearch for log aggregation
JAEGER_ENDPOINT=http://localhost:14268   # Jaeger tracing endpoint
SENTRY_DSN=https://...                   # Sentry error tracking DSN

# Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/...  # Slack notifications
PAGERDUTY_API_KEY=your_api_key               # PagerDuty integration
EMAIL_SMTP_HOST=smtp.gmail.com               # SMTP server for alerts
EMAIL_SMTP_PORT=587                          # SMTP port
EMAIL_FROM=alerts@example.com               # Alert sender email
```

#### Performance Configuration

```bash
# Caching
CACHE_ENABLED=true                       # Enable in-memory caching
CACHE_TTL=300                           # Cache TTL in seconds (5 min)
CACHE_MAX_SIZE=1000                     # Maximum cache entries

# API Rate Limiting
RATE_LIMIT_ENABLED=true                 # Enable API rate limiting
RATE_LIMIT_WINDOW=900000                # Rate limit window (15 min)
RATE_LIMIT_MAX_REQUESTS=1000            # Max requests per window per IP

# File Processing
MAX_FILE_SIZE=100MB                     # Maximum upload file size
TEMP_DIR=/tmp/veequal                   # Temporary file directory
CLEANUP_INTERVAL=3600                   # Cleanup interval (1 hour)
```

### Configuration Files

#### Application Configuration

```typescript
// config/app.config.ts
export interface AppConfig {
  server: {
    port: number;
    host: string;
    environment: 'development' | 'staging' | 'production';
  };
  database: {
    file: string;
    memoryLimit: string;
    threads: number;
  };
  blockchain: {
    rpcUrl: string;
    contractAddress: string;
    chainId: number;
  };
  monitoring: {
    metricsEnabled: boolean;
    tracingEnabled: boolean;
    loggingLevel: string;
  };
}

export const config: AppConfig = {
  server: {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    environment: (process.env.NODE_ENV as any) || 'development'
  },
  database: {
    file: process.env.DB_FILE || 'data/veEqual.duckdb',
    memoryLimit: process.env.DB_MEMORY_LIMIT || '1GB',
    threads: Number(process.env.DB_THREADS) || 4
  },
  blockchain: {
    rpcUrl: process.env.SONIC_RPC_URL || 'https://rpc.soniclabs.com',
    contractAddress: process.env.VE_EQUAL || '0x3045119766352fF250b3d45312Bd0973CBF7235a',
    chainId: Number(process.env.CHAIN_ID) || 146
  },
  monitoring: {
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
    tracingEnabled: process.env.TRACING_ENABLED === 'true',
    loggingLevel: process.env.LOG_LEVEL || 'info'
  }
};
```

#### Development Configuration

```typescript
// config/development.ts
export const developmentConfig: Partial<AppConfig> = {
  server: {
    port: 3000,
    host: 'localhost',
    environment: 'development'
  },
  monitoring: {
    metricsEnabled: false,
    tracingEnabled: true,
    loggingLevel: 'debug'
  }
};
```

#### Production Configuration

```typescript
// config/production.ts
export const productionConfig: Partial<AppConfig> = {
  server: {
    port: Number(process.env.PORT) || 8080,
    host: '0.0.0.0',
    environment: 'production'
  },
  monitoring: {
    metricsEnabled: true,
    tracingEnabled: true,
    loggingLevel: 'info'
  }
};
```

### Configuration Validation

#### Schema Validation

```typescript
// lib/config/validator.ts
import Joi from 'joi';

const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().ip().default('0.0.0.0'),

  // Database validation
  DB_FILE: Joi.string().required(),
  DB_MEMORY_LIMIT: Joi.string().regex(/^\d+[GM]B$/).default('1GB'),
  DB_THREADS: Joi.number().min(1).max(16).default(4),

  // Blockchain validation
  SONIC_RPC_URL: Joi.string().uri().required(),
  VE_EQUAL: Joi.string().regex(/^0x[a-fA-F0-9]{40}$/).required(),
  CHAIN_ID: Joi.number().default(146),

  // Performance optimization
  CHUNK_SIZE: Joi.number().min(100).max(1000).default(500),
  PARALLEL_REQUESTS: Joi.number().min(1).max(10).default(4),

  // Optional monitoring
  METRICS_ENABLED: Joi.boolean().default(false),
  SENTRY_DSN: Joi.string().uri().optional(),
  SLACK_WEBHOOK_URL: Joi.string().uri().optional()
});

export function validateConfig(): void {
  const { error, value } = configSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: false
  });

  if (error) {
    throw new Error(`Configuration validation failed: ${error.message}`);
  }

  // Set validated values back to process.env
  Object.assign(process.env, value);
}
```

#### Runtime Configuration Loading

```typescript
// lib/config/loader.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateConfig } from './validator';

export function loadConfiguration(): void {
  const environment = process.env.NODE_ENV || 'development';

  // Load environment-specific .env file
  const envFiles = [
    `.env.${environment}.local`,
    `.env.${environment}`,
    '.env.local',
    '.env'
  ];

  for (const envFile of envFiles) {
    try {
      const envPath = join(process.cwd(), envFile);
      const envContent = readFileSync(envPath, 'utf8');

      // Parse and set environment variables
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });

      console.log(`Loaded configuration from ${envFile}`);
      break;
    } catch (error) {
      // File doesn't exist, continue to next
      continue;
    }
  }

  // Validate configuration
  validateConfig();
}
```

### Configuration Best Practices

#### Security Guidelines

1. **Never commit sensitive values** to version control
2. **Use environment-specific files** (`.env.production`, `.env.staging`)
3. **Validate all configuration** at startup
4. **Use strong defaults** for non-sensitive values
5. **Rotate API keys** and secrets regularly

#### Example Configuration Files

**.env.example**:
```bash
# Copy to .env and fill in your values

# Application
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DB_FILE=data/veEqual.duckdb

# Blockchain
SONIC_RPC_URL=https://rpc.soniclabs.com
VE_EQUAL=0x3045119766352fF250b3d45312Bd0973CBF7235a

# Monitoring (optional)
METRICS_ENABLED=false
SENTRY_DSN=
SLACK_WEBHOOK_URL=
```

**.env.production**:
```bash
# Production configuration
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Enhanced monitoring
METRICS_ENABLED=true
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn

# Production database settings
DB_MEMORY_LIMIT=4GB
DB_THREADS=8

# Performance optimization
CACHE_ENABLED=true
RATE_LIMIT_ENABLED=true
```

## Deployment

### Overview

The veEQUAL Dashboard supports multiple deployment strategies including containerized deployments, serverless functions, and traditional server deployments. This section provides comprehensive deployment guidance.

### Container Deployment

#### Dockerfile

```dockerfile
# Multi-stage build for optimal production image
FROM oven/bun:1-alpine as dependencies
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1-alpine as build
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-alpine as runtime
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built application
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# Create data directory with proper permissions
RUN mkdir -p /app/data && \
    chown -R nextjs:nodejs /app/data

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun run health-check || exit 1

# Start application
CMD ["bun", "run", "start"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  veequal-dashboard:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_FILE=/app/data/veEqual.duckdb
      - SONIC_RPC_URL=${SONIC_RPC_URL}
      - VE_EQUAL=${VE_EQUAL}
    volumes:
      - veequal_data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "bun", "run", "health-check"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - veequal_network

  # Optional: Reverse proxy with SSL
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - veequal-dashboard
    restart: unless-stopped
    networks:
      - veequal_network

  # Optional: Monitoring stack
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    networks:
      - veequal_network

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - veequal_network

volumes:
  veequal_data:
  prometheus_data:
  grafana_data:

networks:
  veequal_network:
    driver: bridge
```

#### Kubernetes Deployment

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: veequal-dashboard

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: veequal-config
  namespace: veequal-dashboard
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  METRICS_ENABLED: "true"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: veequal-secrets
  namespace: veequal-dashboard
type: Opaque
data:
  SONIC_RPC_URL: <base64-encoded-rpc-url>
  SENTRY_DSN: <base64-encoded-sentry-dsn>
  SLACK_WEBHOOK_URL: <base64-encoded-webhook-url>

---
# k8s/persistent-volume.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: veequal-data
  namespace: veequal-dashboard
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: fast-ssd

---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: veequal-dashboard
  namespace: veequal-dashboard
  labels:
    app: veequal-dashboard
spec:
  replicas: 2
  selector:
    matchLabels:
      app: veequal-dashboard
  template:
    metadata:
      labels:
        app: veequal-dashboard
    spec:
      containers:
      - name: veequal-dashboard
        image: veequal/dashboard:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: veequal-config
        - secretRef:
            name: veequal-secrets
        volumeMounts:
        - name: data-volume
          mountPath: /app/data
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: veequal-data

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: veequal-dashboard-service
  namespace: veequal-dashboard
spec:
  selector:
    app: veequal-dashboard
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: veequal-dashboard-ingress
  namespace: veequal-dashboard
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - dashboard.veequal.com
    secretName: veequal-tls
  rules:
  - host: dashboard.veequal.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: veequal-dashboard-service
            port:
              number: 80
```

### Serverless Deployment

#### Vercel Deployment

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "api.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "PORT": "3000",
    "DB_FILE": "/app/data/veEqual.duckdb",
    "SONIC_RPC_URL": "@sonic_rpc_url",
    "VE_EQUAL": "@ve_equal_address"
  },
  "functions": {
    "api.ts": {
      "maxDuration": 30
    }
  }
}
```

#### AWS Lambda Deployment

```typescript
// lambda/handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createServer } from '../api';

let cachedServer: any;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!cachedServer) {
    cachedServer = await createServer();
  }

  // Convert Lambda event to Express-compatible request
  const request = {
    method: event.httpMethod,
    url: event.path + (event.queryStringParameters
      ? '?' + new URLSearchParams(event.queryStringParameters).toString()
      : ''),
    headers: event.headers,
    body: event.body
  };

  try {
    const response = await cachedServer.fetch(request);

    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
      isBase64Encoded: false
    };
  } catch (error) {
    console.error('Lambda handler error:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
      isBase64Encoded: false
    };
  }
};
```

#### AWS SAM Template

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Parameters:
  SonicRpcUrl:
    Type: String
    Description: Sonic RPC endpoint URL
  VeEqualAddress:
    Type: String
    Description: veEQUAL contract address

Resources:
  VeEqualDashboardFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: handler.handler
      Runtime: nodejs18.x
      Timeout: 30
      MemorySize: 1024
      Environment:
        Variables:
          NODE_ENV: production
          SONIC_RPC_URL: !Ref SonicRpcUrl
          VE_EQUAL: !Ref VeEqualAddress
      Events:
        Api:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
            RestApiId: !Ref VeEqualApi

  VeEqualApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowMethods: "'*'"
        AllowHeaders: "'*'"
        AllowOrigin: "'*'"

  VeEqualDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "veequal-data-${AWS::AccountId}"
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

Outputs:
  VeEqualDashboardApi:
    Description: "API Gateway endpoint URL"
    Value: !Sub "https://${VeEqualApi}.execute-api.${AWS::Region}.amazonaws.com/prod/"
```

### CI/CD Pipeline

#### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy veEQUAL Dashboard

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest

    - name: Install dependencies
      run: bun install

    - name: Run tests
      run: bun test

    - name: Run linting
      run: bun run lint

    - name: Type check
      run: bun run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - uses: actions/checkout@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging

    steps:
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment"
        # Add staging deployment commands

  deploy-production:
    needs: [build, deploy-staging]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production environment"
        # Add production deployment commands
```

### Production Deployment Guidelines

#### Pre-deployment Checklist

- [ ] **Security Review**: Verify all secrets are properly configured
- [ ] **Performance Testing**: Load test the application
- [ ] **Database Migration**: Ensure data compatibility
- [ ] **Monitoring Setup**: Configure alerting and dashboards
- [ ] **Backup Strategy**: Implement automated backups
- [ ] **SSL Certificates**: Configure HTTPS with valid certificates
- [ ] **Environment Variables**: Verify all production settings
- [ ] **Health Checks**: Test all health and readiness endpoints

#### Post-deployment Verification

1. **Service Health**: Verify all endpoints respond correctly
2. **Data Accuracy**: Compare data output with previous version
3. **Performance Metrics**: Monitor response times and throughput
4. **Error Rates**: Check for any new error patterns
5. **Resource Usage**: Monitor CPU, memory, and disk usage

#### Rollback Procedures

```bash
# Docker rollback
docker service update --rollback veequal-dashboard

# Kubernetes rollback
kubectl rollout undo deployment/veequal-dashboard -n veequal-dashboard

# Database rollback (if needed)
# Restore from backup taken before deployment
```

## Monitoring & Observability

### Overview

The veEQUAL Dashboard implements comprehensive monitoring and observability through metrics collection, logging, tracing, and alerting systems.

### Metrics Collection

#### Prometheus Integration

```typescript
// lib/metrics/prometheus.ts
import { createPrometheusMetrics } from '@prometheus/client';

export const metrics = {
  // HTTP metrics
  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
  }),

  httpRequestTotal: new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  }),

  // Database metrics
  dbConnectionsActive: new Gauge({
    name: 'db_connections_active',
    help: 'Number of active database connections'
  }),

  dbQueryDuration: new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table']
  }),

  // Blockchain metrics
  rpcRequestDuration: new Histogram({
    name: 'rpc_request_duration_seconds',
    help: 'Duration of RPC requests in seconds',
    labelNames: ['network', 'method']
  }),

  blockProcessingLag: new Gauge({
    name: 'block_processing_lag_seconds',
    help: 'Lag between latest block and processed block'
  }),

  // Application metrics
  activeUsers: new Gauge({
    name: 'active_users_total',
    help: 'Number of active users'
  }),

  cacheHitRate: new Gauge({
    name: 'cache_hit_rate',
    help: 'Cache hit rate percentage',
    labelNames: ['cache_type']
  })
};
```

#### Custom Metrics Middleware

```typescript
// middleware/metrics.ts
import { Request, Response, NextFunction } from 'express';
import { metrics } from '../lib/metrics/prometheus';

export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path;

      metrics.httpRequestDuration
        .labels(req.method, route, res.statusCode.toString())
        .observe(duration);

      metrics.httpRequestTotal
        .labels(req.method, route, res.statusCode.toString())
        .inc();
    });

    next();
  };
}
```

### Logging

#### Structured Logging Setup

```typescript
// lib/logger.ts
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      service: 'veequal-dashboard',
      version: process.env.APP_VERSION,
      environment: process.env.NODE_ENV,
      ...meta
    });
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Add Elasticsearch transport in production
if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
  transports.push(
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: process.env.ELASTICSEARCH_URL },
      index: 'veequal-dashboard-logs'
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exceptionHandlers: transports,
  rejectionHandlers: transports
});
```

#### Request Logging

```typescript
// middleware/logging.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export function requestLogging() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
      });
    });

    next();
  };
}
```

### Distributed Tracing

#### OpenTelemetry Setup

```typescript
// lib/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'veequal-dashboard',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
  }),
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()]
});

export function initializeTracing(): void {
  sdk.start();

  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
}
```

#### Custom Spans

```typescript
// lib/tracing/custom.ts
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('veequal-dashboard');

export async function tracedFunction<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number>
): Promise<T> {
  const span = tracer.startSpan(name, { attributes });

  try {
    const result = await context.with(trace.setSpan(context.active(), span), fn);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  } finally {
    span.end();
  }
}
```

### Error Tracking

#### Sentry Integration

```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initializeSentry(): void {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: undefined })
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Filter out known issues
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error && error.message.includes('Network timeout')) {
          return null; // Don't send network timeouts
        }
      }
      return event;
    }
  });
}

export function captureError(error: Error, context?: Record<string, any>): void {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
}
```

### Application Performance Monitoring

#### Performance Metrics

```typescript
// lib/performance.ts
import { performance, PerformanceObserver } from 'perf_hooks';

class PerformanceMonitor {
  private observer: PerformanceObserver;

  constructor() {
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.recordMeasurement(entry.name, entry.duration);
        }
      }
    });

    this.observer.observe({ entryTypes: ['measure'] });
  }

  markStart(name: string): void {
    performance.mark(`${name}-start`);
  }

  markEnd(name: string): void {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }

  private recordMeasurement(name: string, duration: number): void {
    // Send to metrics system
    metrics.performanceDuration
      .labels(name)
      .observe(duration / 1000); // Convert to seconds
  }

  async timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.markStart(name);
    try {
      return await fn();
    } finally {
      this.markEnd(name);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

### Alerting

#### Alert Rules Configuration

```yaml
# monitoring/alerts.yml
groups:
- name: veequal-dashboard
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High error rate detected
      description: "Error rate is {{ $value }} errors per second"

  - alert: DatabaseConnectionsHigh
    expr: db_connections_active > 80
    for: 2m
    annotations:
      summary: High database connection usage
      description: "{{ $value }} active connections"

  - alert: BlockProcessingLag
    expr: block_processing_lag_seconds > 300
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: Block processing is lagging
      description: "Processing lag is {{ $value }} seconds"

  - alert: ServiceDown
    expr: up{job="veequal-dashboard"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: Service is down
      description: "veEQUAL Dashboard service is not responding"
```

#### Notification Channels

```typescript
// lib/alerting/notifications.ts
export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class NotificationService {
  async sendAlert(notification: AlertNotification): Promise<void> {
    // Send to multiple channels based on severity
    const promises: Promise<void>[] = [];

    if (notification.severity === 'critical') {
      promises.push(this.sendSlack(notification));
      promises.push(this.sendEmail(notification));
      promises.push(this.sendPagerDuty(notification));
    } else if (notification.severity === 'warning') {
      promises.push(this.sendSlack(notification));
    }

    await Promise.allSettled(promises);
  }

  private async sendSlack(notification: AlertNotification): Promise<void> {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) return;

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 ${notification.title}`,
        attachments: [{
          color: notification.severity === 'critical' ? 'danger' : 'warning',
          fields: [{
            title: 'Message',
            value: notification.message,
            short: false
          }]
        }]
      })
    });
  }

  private async sendEmail(notification: AlertNotification): Promise<void> {
    // Implementation for email notifications
  }

  private async sendPagerDuty(notification: AlertNotification): Promise<void> {
    // Implementation for PagerDuty integration
  }
}
```

### Dashboards

#### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "veEQUAL Dashboard Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{ method }} {{ route }}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
            "legendFormat": "5xx Errors"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "db_connections_active",
            "legendFormat": "Active Connections"
          }
        ]
      }
    ]
  }
}
```

## Testing

### Overview

The veEQUAL Dashboard implements a comprehensive testing strategy covering unit tests, integration tests, API testing, and end-to-end validation. Testing ensures data accuracy, system reliability, and governance metrics integrity.

### Testing Philosophy

1. **Data Integrity First**: All governance calculations must be mathematically correct
2. **API Reliability**: Every endpoint must handle errors gracefully
3. **Pipeline Validation**: Data transformations must be reproducible and accurate
4. **Performance Verification**: System must meet response time requirements
5. **Security Testing**: All inputs must be properly validated and sanitized

### Test Structure

```
tests/
├── unit/                    # Unit tests for individual functions
│   ├── lib/                 # Library function tests
│   ├── src/                 # Source code tests
│   └── sql/                 # SQL query validation tests
├── integration/             # Integration tests
│   ├── api/                 # API endpoint tests
│   ├── database/            # Database operation tests
│   └── rpc/                 # RPC provider tests
├── e2e/                     # End-to-end tests
│   ├── pipeline/            # Full data pipeline tests
│   └── governance/          # Governance calculation tests
├── fixtures/                # Test data and mocks
├── helpers/                 # Test utilities
└── scripts/                 # Test automation scripts
```

### Unit Testing

#### Database Operations Testing

```typescript
// tests/unit/lib/db.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { db } from '../../../lib/db';

describe('Database Operations', () => {
  beforeEach(async () => {
    // Create test database
    await db.run('CREATE TEMP TABLE test_venfts AS SELECT * FROM venfts LIMIT 0');
  });

  afterEach(async () => {
    // Clean up test data
    await db.run('DROP TABLE IF EXISTS test_venfts');
  });

  it('should correctly calculate total voting power', async () => {
    // Arrange
    await db.run(`
      INSERT INTO test_venfts (token_id, owner, balance_formatted, unlock_timestamp)
      VALUES
        (1, '0x123', 1000.0, 1735689600),
        (2, '0x456', 2000.0, 1735689600)
    `);

    // Act
    const result = await db.query(`
      SELECT SUM(balance_formatted) as total_power
      FROM test_venfts
    `);
    const data = (result as any).toArray();

    // Assert
    expect(data[0].total_power).toBe(3000.0);
  });

  it('should handle empty database gracefully', async () => {
    // Act
    const result = await db.query(`
      SELECT COUNT(*) as count FROM test_venfts
    `);
    const data = (result as any).toArray();

    // Assert
    expect(data[0].count).toBe(0);
  });
});
```

#### Utility Functions Testing

```typescript
// tests/unit/lib/formatUtils.test.ts
import { describe, it, expect } from 'bun:test';
import { formatVotingPower, formatAddress } from '../../../lib/formatUtils';

describe('Format Utilities', () => {
  describe('formatVotingPower', () => {
    it('should format numbers above 1M with M suffix', () => {
      expect(formatVotingPower(1500000)).toBe('1.50M');
      expect(formatVotingPower(2100000)).toBe('2.10M');
    });

    it('should format numbers above 1K with K suffix', () => {
      expect(formatVotingPower(1500)).toBe('1.50K');
      expect(formatVotingPower(999)).toBe('999');
    });

    it('should handle edge cases', () => {
      expect(formatVotingPower(0)).toBe('0');
      expect(formatVotingPower(1000)).toBe('1.00K');
      expect(formatVotingPower(1000000)).toBe('1.00M');
    });
  });

  describe('formatAddress', () => {
    it('should format Ethereum addresses correctly', () => {
      const address = '0x1234567890123456789012345678901234567890';
      expect(formatAddress(address)).toBe('0x1234...7890');
    });

    it('should handle invalid addresses', () => {
      expect(formatAddress('invalid')).toBe('invalid');
      expect(formatAddress('')).toBe('');
    });
  });
});
```

#### SQL Query Testing

```typescript
// tests/unit/sql/governance.test.ts
import { describe, it, expect, beforeAll } from 'bun:test';
import { db } from '../../../lib/db';
import { readFileSync } from 'fs';

describe('SQL Governance Calculations', () => {
  beforeAll(async () => {
    // Load test data
    await db.run(`
      CREATE TEMP TABLE test_owner_daily AS
      SELECT * FROM owner_daily LIMIT 0
    `);

    // Insert known test data
    await db.run(`
      INSERT INTO test_owner_daily (owner, total_voting_power, nft_count)
      VALUES
        ('0x001', 100000, 2),  -- M.E.G.A Whale
        ('0x002', 30000, 1),   -- Major Holder
        ('0x003', 10000, 1),   -- Equalest
        ('0x004', 2000, 1),    -- More Equal
        ('0x005', 500, 1)      -- Equal
    `);
  });

  it('should correctly classify governance tiers', async () => {
    const whaleAnalysisSQL = readFileSync('sql/06_whale_analysis.sql', 'utf8');

    // Execute whale analysis on test data
    const modifiedSQL = whaleAnalysisSQL.replace('owner_daily', 'test_owner_daily');
    await db.run(`CREATE TEMP TABLE test_whale_analysis AS ${modifiedSQL}`);

    const result = await db.query(`
      SELECT tier, holder_count, tier_voting_power
      FROM test_whale_analysis
      ORDER BY tier_voting_power DESC
    `);
    const tiers = (result as any).toArray();

    // Verify tier classifications
    expect(tiers.find(t => t.tier.includes('M.E.G.A')).holder_count).toBe(1);
    expect(tiers.find(t => t.tier.includes('Major')).holder_count).toBe(1);
    expect(tiers.find(t => t.tier.includes('Equalest')).holder_count).toBe(1);
  });

  it('should calculate Gini coefficient correctly', async () => {
    const concentrationSQL = readFileSync('sql/03_concentration.sql', 'utf8');

    // Test with known distribution
    const modifiedSQL = concentrationSQL.replace('owner_daily', 'test_owner_daily');
    await db.run(`CREATE TEMP TABLE test_concentration AS ${modifiedSQL}`);

    const result = await db.query(`
      SELECT gini_coefficient FROM test_concentration
    `);
    const data = (result as any).toArray();

    // Gini coefficient should be between 0 and 1
    expect(data[0].gini_coefficient).toBeGreaterThan(0);
    expect(data[0].gini_coefficient).toBeLessThan(1);
  });
});
```

### Integration Testing

#### API Endpoint Testing

```typescript
// tests/integration/api/endpoints.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

describe('API Endpoints Integration', () => {
  const baseURL = 'http://localhost:3000';
  let server: any;

  beforeAll(async () => {
    // Start test server
    const { spawn } = await import('bun');
    server = spawn(['bun', 'run', 'api.ts'], {
      env: { ...process.env, PORT: '3000' }
    });

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (server) {
      server.kill();
    }
  });

  it('should return valid summary data', async () => {
    const response = await fetch(`${baseURL}/api/summary`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('totalVotingPower');
    expect(data.data).toHaveProperty('totalNFTs');
    expect(data.data).toHaveProperty('uniqueHolders');
    expect(data.data).toHaveProperty('lastUpdated');
  });

  it('should return top holders with proper structure', async () => {
    const response = await fetch(`${baseURL}/api/top-holders`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.count).toBeGreaterThan(0);

    // Verify holder structure
    const firstHolder = data.data[0];
    expect(firstHolder).toHaveProperty('owner');
    expect(firstHolder).toHaveProperty('votingPower');
    expect(firstHolder).toHaveProperty('formattedVotingPower');
    expect(firstHolder).toHaveProperty('nftCount');
  });

  it('should handle invalid endpoints gracefully', async () => {
    const response = await fetch(`${baseURL}/api/invalid-endpoint`);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should include proper CORS headers', async () => {
    const response = await fetch(`${baseURL}/api/summary`);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});
```

#### Database Integration Testing

```typescript
// tests/integration/database/pipeline.test.ts
import { describe, it, expect, beforeAll } from 'bun:test';
import { db } from '../../../lib/db';
import { execSync } from 'child_process';

describe('Database Pipeline Integration', () => {
  beforeAll(async () => {
    // Ensure fresh database state
    await db.run('DROP TABLE IF EXISTS test_pipeline_venfts');

    // Create test NFT data
    await db.run(`
      CREATE TABLE test_pipeline_venfts AS
      SELECT
        token_id,
        owner,
        balance_formatted,
        unlock_timestamp,
        snapshot_time
      FROM venfts
      LIMIT 100
    `);
  });

  it('should execute SQL pipeline without errors', async () => {
    const sqlFiles = [
      '01_owner_daily.sql',
      '02_total_supply.sql',
      '03_concentration.sql',
      '06_whale_analysis.sql'
    ];

    for (const sqlFile of sqlFiles) {
      const sql = readFileSync(`sql/${sqlFile}`, 'utf8');

      // Modify SQL to use test table
      const testSQL = sql.replace(/FROM venfts/g, 'FROM test_pipeline_venfts')
                        .replace(/owner_daily/g, 'test_owner_daily');

      expect(async () => {
        await db.run(testSQL);
      }).not.toThrow();
    }
  });

  it('should maintain data consistency across transformations', async () => {
    // Verify total voting power consistency
    const originalTotal = await db.query(`
      SELECT SUM(balance_formatted) as total
      FROM test_pipeline_venfts
    `);
    const originalData = (originalTotal as any).toArray();

    const aggregatedTotal = await db.query(`
      SELECT SUM(total_voting_power) as total
      FROM test_owner_daily
    `);
    const aggregatedData = (aggregatedTotal as any).toArray();

    expect(Math.abs(originalData[0].total - aggregatedData[0].total)).toBeLessThan(0.01);
  });
});
```

### End-to-End Testing

#### Full Pipeline Testing

```typescript
// tests/e2e/pipeline/complete.test.ts
import { describe, it, expect } from 'bun:test';
import { execSync } from 'child_process';

describe('Complete Data Pipeline E2E', () => {
  it('should run full data update successfully', async () => {
    expect(() => {
      execSync('bun run src/update.ts', {
        timeout: 300000, // 5 minute timeout
        stdio: 'pipe'
      });
    }).not.toThrow();
  });

  it('should generate all required API files', async () => {
    const requiredFiles = [
      'data/api/summary.json',
      'data/api/top-holders.json',
      'data/api/top-nfts.json',
      'data/api/charts.json',
      'data/api/dashboard.json'
    ];

    for (const file of requiredFiles) {
      expect(await Bun.file(file).exists()).toBe(true);

      // Verify file contains valid JSON
      const content = await Bun.file(file).text();
      expect(() => JSON.parse(content)).not.toThrow();
    }
  });

  it('should generate markdown report', async () => {
    expect(await Bun.file('veEQUAL.md').exists()).toBe(true);

    const content = await Bun.file('veEQUAL.md').text();
    expect(content).toContain('# veEQUAL Governance Analytics');
    expect(content).toContain('## Summary');
  });
});
```

#### Governance Calculations Testing

```typescript
// tests/e2e/governance/accuracy.test.ts
import { describe, it, expect } from 'bun:test';
import { db } from '../../../lib/db';

describe('Governance Calculations Accuracy', () => {
  it('should calculate whale tiers correctly', async () => {
    const result = await db.query(`
      SELECT
        tier,
        MIN(total_voting_power) as min_power,
        MAX(total_voting_power) as max_power
      FROM whale_analysis wa
      JOIN owner_daily od ON 1=1  -- Cross join to get power ranges
      GROUP BY tier
    `);
    const tiers = (result as any).toArray();

    // Verify tier boundaries
    const megaWhale = tiers.find(t => t.tier.includes('M.E.G.A'));
    if (megaWhale) {
      expect(megaWhale.min_power).toBeGreaterThanOrEqual(50000);
    }
  });

  it('should have consistent total supplies', async () => {
    // Compare different calculation methods
    const directSum = await db.query(`
      SELECT SUM(balance_formatted) as total FROM venfts
    `);
    const directData = (directSum as any).toArray();

    const aggregatedSum = await db.query(`
      SELECT total_voting_power as total FROM total_supply
    `);
    const aggregatedData = (aggregatedSum as any).toArray();

    expect(Math.abs(directData[0].total - aggregatedData[0].total)).toBeLessThan(1);
  });
});
```

### Performance Testing

#### API Performance Testing

```typescript
// tests/performance/api.bench.ts
import { describe, it, expect } from 'bun:test';

describe('API Performance', () => {
  const baseURL = 'http://localhost:3000';

  it('should respond to summary endpoint under 100ms', async () => {
    const start = Date.now();
    const response = await fetch(`${baseURL}/api/summary`);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100);
  });

  it('should handle concurrent requests efficiently', async () => {
    const concurrentRequests = 10;
    const start = Date.now();

    const promises = Array(concurrentRequests).fill(null).map(() =>
      fetch(`${baseURL}/api/top-holders`)
    );

    const responses = await Promise.all(promises);
    const duration = Date.now() - start;

    // All requests should succeed
    expect(responses.every(r => r.status === 200)).toBe(true);

    // Average response time should be reasonable
    expect(duration / concurrentRequests).toBeLessThan(200);
  });
});
```

#### Database Performance Testing

```typescript
// tests/performance/database.bench.ts
import { describe, it, expect } from 'bun:test';
import { db } from '../../lib/db';

describe('Database Performance', () => {
  it('should execute complex aggregations under 1 second', async () => {
    const start = Date.now();

    await db.query(`
      WITH ranked_holders AS (
        SELECT
          owner,
          total_voting_power,
          RANK() OVER (ORDER BY total_voting_power DESC) as rank
        FROM owner_daily
      )
      SELECT
        COUNT(*) as total_holders,
        SUM(total_voting_power) as total_power,
        AVG(total_voting_power) as avg_power
      FROM ranked_holders
      WHERE rank <= 100
    `);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });
});
```

### Test Data Management

#### Test Fixtures

```typescript
// tests/fixtures/governance-data.ts
export const testNFTData = [
  {
    token_id: 1,
    owner: '0x1111111111111111111111111111111111111111',
    balance_formatted: 100000.0,
    unlock_timestamp: 1735689600
  },
  {
    token_id: 2,
    owner: '0x2222222222222222222222222222222222222222',
    balance_formatted: 75000.0,
    unlock_timestamp: 1735689600
  }
];

export const expectedGovernanceTiers = {
  'M.E.G.A Whale (≥50K)': { minPower: 50000, holders: ['0x1111...'] },
  'Major Holder (20K-50K)': { minPower: 20000, maxPower: 49999, holders: [] },
  'Equalest (5K-20K)': { minPower: 5000, maxPower: 19999, holders: [] }
};
```

### Running Tests

#### Test Scripts

```json
// package.json scripts
{
  "scripts": {
    "test": "bun test",
    "test:unit": "bun test tests/unit/",
    "test:integration": "bun test tests/integration/",
    "test:e2e": "bun test tests/e2e/",
    "test:performance": "bun test tests/performance/",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

#### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run unit tests
        run: bun run test:unit

      - name: Run integration tests
        run: bun run test:integration

      - name: Run E2E tests
        run: bun run test:e2e

      - name: Performance benchmarks
        run: bun run test:performance
```

### Test Quality Guidelines

1. **Test Coverage**: Aim for >90% code coverage on critical paths
2. **Test Isolation**: Each test should be independent and reproducible
3. **Data Validation**: Test edge cases and boundary conditions
4. **Error Scenarios**: Verify graceful error handling
5. **Performance Baselines**: Establish and monitor performance benchmarks

### Debugging Tests

```bash
# Run specific test file
bun test tests/unit/lib/db.test.ts

# Run tests with verbose output
bun test --verbose

# Debug specific test
bun test --grep "should calculate total voting power"

# Run tests in watch mode
bun test --watch tests/unit/
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

**Problem**: Application fails to connect to PostgreSQL database

**Symptoms**:
- `ECONNREFUSED` errors in logs
- Application startup failures
- Timeout errors during database queries

**Solutions**:
```bash
# Check database connectivity
pg_isready -h localhost -p 5432 -U postgres

# Verify connection string format
DATABASE_URL="postgresql://username:password@host:port/database"

# Check database logs
docker logs <postgres-container-id>

# Test connection manually
psql "postgresql://username:password@host:port/database"
```

#### RPC Connection Failures

**Problem**: Unable to connect to blockchain RPC endpoints

**Symptoms**:
- Network timeout errors
- `eth_blockNumber` RPC call failures
- Stale data in dashboard

**Solutions**:
```typescript
// Test RPC connectivity
const testRPC = async () => {
  try {
    const response = await fetch(process.env.RPC_URL_MAINNET!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    });

    const result = await response.json();
    console.log('Latest block:', parseInt(result.result, 16));
  } catch (error) {
    console.error('RPC connection failed:', error);
  }
};
```

#### Memory Leaks

**Problem**: Application memory usage continuously increases

**Symptoms**:
- High memory usage in monitoring
- Out of memory errors
- Performance degradation over time

**Debugging**:
```bash
# Enable Node.js heap profiling
node --inspect --max-old-space-size=4096 dist/server.js

# Generate heap dump
kill -USR2 <process-id>

# Analyze with clinic.js
npx clinic doctor -- node dist/server.js
```

#### Performance Issues

**Problem**: Slow response times and high latency

**Common Causes**:
1. **Unoptimized Database Queries**
   ```sql
   -- Check slow queries
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Missing Database Indexes**
   ```sql
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY idx_transactions_user_id ON transactions(user_id);
   CREATE INDEX CONCURRENTLY idx_votes_created_at ON votes(created_at);
   ```

3. **Inefficient Caching**
   ```typescript
   // Implement proper cache invalidation
   const invalidateCache = async (pattern: string) => {
     const keys = await redis.keys(pattern);
     if (keys.length > 0) {
       await redis.del(...keys);
     }
   };
   ```

### Debug Mode

#### Enabling Debug Logging

```bash
# Set debug environment variables
DEBUG=*
LOG_LEVEL=debug
NODE_ENV=development

# Enable specific debug namespaces
DEBUG=app:database,app:rpc,app:cache
```

#### Database Query Logging

```typescript
// Enable query logging in development
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  log: process.env.NODE_ENV === 'development' ? console.log : undefined
});
```

#### Performance Profiling

```typescript
// Enable performance profiling
if (process.env.NODE_ENV === 'development') {
  const { createProfilingSession } = require('v8-profiler-next');

  // Start profiling
  const session = createProfilingSession();
  session.start();

  // Stop after 30 seconds
  setTimeout(() => {
    session.stop((err, profile) => {
      if (!err) {
        require('fs').writeFileSync('./profile.cpuprofile', JSON.stringify(profile));
      }
    });
  }, 30000);
}
```

### Diagnostic Tools

#### Health Check Endpoint

```typescript
// GET /api/health
export async function healthCheck(): Promise<HealthStatus> {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkRPC(),
    checkExternalAPIs()
  ]);

  return {
    status: checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status === 'fulfilled',
      redis: checks[1].status === 'fulfilled',
      rpc: checks[2].status === 'fulfilled',
      external_apis: checks[3].status === 'fulfilled'
    },
    version: process.env.APP_VERSION
  };
}
```

#### System Information Endpoint

```typescript
// GET /api/system
export function getSystemInfo() {
  return {
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV,
    pid: process.pid
  };
}
```

## Performance Optimization

### Database Optimization

#### Query Optimization

```sql
-- Use EXPLAIN ANALYZE to identify slow queries
EXPLAIN ANALYZE SELECT * FROM transactions
WHERE user_id = $1
AND created_at > $2
ORDER BY created_at DESC
LIMIT 20;

-- Create composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_transactions_user_created
ON transactions(user_id, created_at DESC);

-- Optimize JOIN queries
CREATE INDEX CONCURRENTLY idx_votes_proposal_id
ON votes(proposal_id)
WHERE status = 'active';
```

#### Connection Pooling

```typescript
// Optimize connection pool settings
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),

  // Pool configuration
  min: 5,                    // Minimum connections
  max: 20,                   // Maximum connections
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast on connection timeout

  // Statement timeout
  statement_timeout: 10000,  // 10 second query timeout

  // Keep alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});
```

#### Database Partitioning

```sql
-- Partition large tables by date
CREATE TABLE transactions_2024 PARTITION OF transactions
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE transactions_2023 PARTITION OF transactions
FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

-- Create indexes on partitions
CREATE INDEX CONCURRENTLY idx_transactions_2024_user_id
ON transactions_2024(user_id);
```

### Caching Strategy

#### Multi-Level Caching

```typescript
// L1: In-memory cache (Node.js Map)
// L2: Redis cache
// L3: Database

class CacheManager {
  private l1Cache = new Map<string, { data: any; expiry: number }>();

  async get<T>(key: string): Promise<T | null> {
    // Check L1 cache first
    const l1Result = this.l1Cache.get(key);
    if (l1Result && l1Result.expiry > Date.now()) {
      return l1Result.data;
    }

    // Check L2 cache (Redis)
    const l2Result = await this.redis.get(key);
    if (l2Result) {
      const data = JSON.parse(l2Result);
      // Populate L1 cache
      this.l1Cache.set(key, {
        data,
        expiry: Date.now() + 60000 // 1 minute L1 TTL
      });
      return data;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // Set in both caches
    this.l1Cache.set(key, {
      data: value,
      expiry: Date.now() + Math.min(ttl, 60000)
    });

    await this.redis.setex(key, ttl / 1000, JSON.stringify(value));
  }
}
```

#### Cache Invalidation Patterns

```typescript
// Tag-based cache invalidation
class TaggedCache {
  private tags = new Map<string, Set<string>>();

  async setWithTags(key: string, value: any, ttl: number, tags: string[]): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));

    // Track tags
    tags.forEach(tag => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(key);
    });
  }

  async invalidateTag(tag: string): Promise<void> {
    const keys = this.tags.get(tag);
    if (keys && keys.size > 0) {
      await this.redis.del(...Array.from(keys));
      this.tags.delete(tag);
    }
  }
}

// Usage
await cache.setWithTags('user:123:profile', userData, 3600, ['user:123', 'profiles']);
await cache.invalidateTag('user:123'); // Invalidates all user data
```

### Frontend Optimization

#### Code Splitting

```typescript
// Dynamic imports for route-based code splitting
const DashboardPage = lazy(() => import('../pages/Dashboard'));
const AnalyticsPage = lazy(() => import('../pages/Analytics'));
const SettingsPage = lazy(() => import('../pages/Settings'));

// Component-based code splitting
const HeavyChart = lazy(() => import('../components/HeavyChart'));

// Preload critical routes
const preloadRoute = (routeComponent: () => Promise<any>) => {
  const componentImport = routeComponent();
  return componentImport;
};

// Preload on hover
<Link
  to="/analytics"
  onMouseEnter={() => preloadRoute(() => import('../pages/Analytics'))}
>
  Analytics
</Link>
```

#### Bundle Optimization

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },

  webpack: (config, { isServer }) => {
    // Analyze bundle size
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
    }

    // Optimize for production
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
        }
      };
    }

    return config;
  }
};
```

### API Optimization

#### Response Compression

```typescript
// Enable gzip compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));
```

#### Response Time Optimization

```typescript
// Implement response time headers
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    res.set('X-Response-Time', `${duration}ms`);
  });

  next();
});

// Set appropriate cache headers
app.use('/api/static', (req, res, next) => {
  res.set({
    'Cache-Control': 'public, max-age=31536000', // 1 year
    'ETag': generateETag(req.url)
  });
  next();
});
```

## Security Considerations

### Overview

The veEQUAL Dashboard implements comprehensive security measures to protect against common attack vectors and ensure the integrity of governance data. This section covers security architecture, best practices, and implementation guidelines.

### Authentication and Authorization

#### API Key Management

```typescript
// lib/auth/api-keys.ts
import crypto from 'crypto';
import { db } from '../db';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export class ApiKeyManager {
  private static readonly KEY_PREFIX = 'veeq_';
  private static readonly KEY_LENGTH = 32;

  static generateApiKey(): string {
    const randomBytes = crypto.randomBytes(this.KEY_LENGTH);
    return this.KEY_PREFIX + randomBytes.toString('hex');
  }

  static async createApiKey(
    name: string,
    permissions: string[],
    expiresIn?: number
  ): Promise<ApiKey> {
    const key = this.generateApiKey();
    const hashedKey = this.hashApiKey(key);

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : undefined;

    const apiKey: ApiKey = {
      id: crypto.randomUUID(),
      name,
      key: hashedKey,
      permissions,
      createdAt: new Date(),
      expiresAt,
      isActive: true
    };

    await db.query(`
      INSERT INTO api_keys (id, name, key_hash, permissions, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [apiKey.id, name, hashedKey, JSON.stringify(permissions), expiresAt, true]);

    return { ...apiKey, key }; // Return unhashed key only once
  }

  static async validateApiKey(key: string): Promise<ApiKey | null> {
    const hashedKey = this.hashApiKey(key);

    const result = await db.query(`
      SELECT * FROM api_keys
      WHERE key_hash = ? AND is_active = true
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `, [hashedKey]);

    if (result.length === 0) return null;

    const apiKey = result[0] as ApiKey;

    // Update last used timestamp
    await db.query(`
      UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = ?
    `, [apiKey.id]);

    return apiKey;
  }

  private static hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
```

#### JWT Token Authentication

```typescript
// lib/auth/jwt.ts
import jwt from 'jsonwebtoken';
import { ApiKey } from './api-keys';

export interface JwtPayload {
  sub: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export class JwtManager {
  private static readonly SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly EXPIRY = '1h';

  static generateToken(apiKey: ApiKey): string {
    const payload: JwtPayload = {
      sub: apiKey.id,
      permissions: apiKey.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };

    return jwt.sign(payload, this.SECRET, {
      algorithm: 'HS256',
      expiresIn: this.EXPIRY
    });
  }

  static verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.SECRET) as JwtPayload;
    } catch (error) {
      return null;
    }
  }
}
```

#### Permission-based Access Control

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { ApiKeyManager } from '../lib/auth/api-keys';
import { JwtManager } from '../lib/auth/jwt';

interface AuthenticatedRequest extends Request {
  apiKey?: ApiKey;
  permissions?: string[];
}

export function requireAuth(requiredPermissions: string[] = []) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    let apiKey: ApiKey | null = null;

    if (authHeader.startsWith('Bearer ')) {
      // JWT token authentication
      const token = authHeader.substring(7);
      const payload = JwtManager.verifyToken(token);

      if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.permissions = payload.permissions;
    } else if (authHeader.startsWith('ApiKey ')) {
      // API key authentication
      const key = authHeader.substring(7);
      apiKey = await ApiKeyManager.validateApiKey(key);

      if (!apiKey) {
        return res.status(401).json({ error: 'Invalid or expired API key' });
      }

      req.apiKey = apiKey;
      req.permissions = apiKey.permissions;
    } else {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every(permission =>
        req.permissions?.includes(permission) || req.permissions?.includes('admin')
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredPermissions,
          granted: req.permissions
        });
      }
    }

    next();
  };
}
```

### Data Protection

#### Input Validation and Sanitization

```typescript
// lib/validation/schemas.ts
import Joi from 'joi';

export const schemas = {
  // Address validation
  ethereumAddress: Joi.string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Must be a valid Ethereum address'
    }),

  // Token ID validation
  tokenId: Joi.alternatives().try(
    Joi.number().integer().min(0),
    Joi.string().regex(/^\d+$/)
  ).required(),

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(50)
  }),

  // Date range validation
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }),

  // API key creation
  createApiKey: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    permissions: Joi.array().items(Joi.string().valid(
      'read:dashboard',
      'read:analytics',
      'write:config',
      'admin'
    )).min(1).required(),
    expiresIn: Joi.number().integer().min(3600).max(31536000) // 1 hour to 1 year
  })
};

// Validation middleware
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body = value;
    next();
  };
}

export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Query validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.query = value;
    next();
  };
}
```

#### SQL Injection Prevention

```typescript
// lib/db/safe-query.ts
import { db } from '../db';

export class SafeQuery {
  private query: string;
  private params: any[];

  constructor(query: string) {
    this.query = query;
    this.params = [];
  }

  // Parameterized query builder
  static select(table: string): SafeQuery {
    return new SafeQuery(`SELECT * FROM ${this.sanitizeIdentifier(table)}`);
  }

  where(condition: string, value: any): SafeQuery {
    this.query += ` WHERE ${condition} = ?`;
    this.params.push(value);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): SafeQuery {
    const safeColumn = SafeQuery.sanitizeIdentifier(column);
    this.query += ` ORDER BY ${safeColumn} ${direction}`;
    return this;
  }

  limit(count: number, offset: number = 0): SafeQuery {
    this.query += ` LIMIT ? OFFSET ?`;
    this.params.push(count, offset);
    return this;
  }

  async execute(): Promise<any[]> {
    try {
      const result = await db.query(this.query, this.params);
      return (result as any).toArray();
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query:', this.query);
      console.error('Params:', this.params);
      throw new Error('Database operation failed');
    }
  }

  // Sanitize SQL identifiers (table names, column names)
  private static sanitizeIdentifier(identifier: string): string {
    // Allow only alphanumeric characters and underscores
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new Error(`Invalid identifier: ${identifier}`);
    }
    return identifier;
  }
}

// Usage example
export async function getHoldersByVotingPower(
  minPower: number,
  maxPower: number,
  limit: number = 50
): Promise<any[]> {
  return await SafeQuery
    .select('owner_daily')
    .where('total_voting_power >= ?', minPower)
    .where('total_voting_power <= ?', maxPower)
    .orderBy('total_voting_power', 'DESC')
    .limit(limit)
    .execute();
}
```

### Network Security

#### Rate Limiting

```typescript
// middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Redis connection for distributed rate limiting
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// General API rate limiting
export const generalRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use API key or IP address
    const apiKey = req.headers.authorization?.substring(7);
    return apiKey || req.ip;
  }
});

// Strict rate limiting for sensitive endpoints
export const strictRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit to 100 requests per hour
  message: {
    error: 'Rate limit exceeded for sensitive operation',
    retryAfter: '1 hour'
  }
});

// Per-user rate limiting
export const userRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per user
  keyGenerator: (req) => {
    return req.apiKey?.id || req.ip;
  }
});
```

#### HTTPS and TLS Configuration

```typescript
// lib/server/tls.ts
import https from 'https';
import fs from 'fs';
import { Express } from 'express';

export interface TLSConfig {
  keyPath: string;
  certPath: string;
  caPath?: string;
  port: number;
}

export function createHTTPSServer(app: Express, config: TLSConfig): https.Server {
  const tlsOptions = {
    key: fs.readFileSync(config.keyPath),
    cert: fs.readFileSync(config.certPath),
    ca: config.caPath ? fs.readFileSync(config.caPath) : undefined,

    // Security hardening
    honorCipherOrder: true,
    ciphers: [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-SHA256',
      'ECDHE-RSA-AES256-SHA384'
    ].join(':'),
    secureOptions: require('constants').SSL_OP_NO_SSLv2 |
                   require('constants').SSL_OP_NO_SSLv3 |
                   require('constants').SSL_OP_NO_TLSv1 |
                   require('constants').SSL_OP_NO_TLSv1_1,
    secureProtocol: 'TLSv1_2_method'
  };

  return https.createServer(tlsOptions, app);
}
```

#### CORS Configuration

```typescript
// middleware/cors.ts
import cors from 'cors';

export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://dashboard.veequal.com',
      'https://veequal.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    // Allow subdomains
    const allowedDomains = ['veequal.com'];
    const isSubdomainAllowed = allowedDomains.some(domain =>
      origin.endsWith(`.${domain}`)
    );

    if (allowedOrigins.includes(origin) || isSubdomainAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

export const corsMiddleware = cors(corsOptions);
```

### Data Privacy

#### PII Protection

```typescript
// lib/privacy/data-anonymization.ts
import crypto from 'crypto';

export class DataAnonymizer {
  private static readonly SALT = process.env.ANONYMIZATION_SALT || 'default-salt';

  // Hash Ethereum addresses for analytics while preserving uniqueness
  static anonymizeAddress(address: string): string {
    const hash = crypto
      .createHmac('sha256', this.SALT)
      .update(address.toLowerCase())
      .digest('hex');

    return `anon_${hash.substring(0, 16)}`;
  }

  // Anonymize user data for external analytics
  static anonymizeUserData(data: any): any {
    const anonymized = { ...data };

    // Remove or hash PII fields
    if (anonymized.owner) {
      anonymized.owner = this.anonymizeAddress(anonymized.owner);
    }

    if (anonymized.email) {
      anonymized.email = this.hashPII(anonymized.email);
    }

    // Remove IP addresses
    delete anonymized.ip;
    delete anonymized.userAgent;

    return anonymized;
  }

  private static hashPII(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data + this.SALT)
      .digest('hex')
      .substring(0, 16);
  }
}
```

#### Data Retention Policy

```typescript
// lib/privacy/retention.ts
import { db } from '../db';
import { logger } from '../logger';

export class DataRetentionManager {
  private static readonly RETENTION_PERIODS = {
    logs: 90 * 24 * 60 * 60 * 1000, // 90 days
    analytics: 365 * 24 * 60 * 60 * 1000, // 1 year
    api_keys: 730 * 24 * 60 * 60 * 1000, // 2 years
    user_sessions: 30 * 24 * 60 * 60 * 1000 // 30 days
  };

  static async cleanupExpiredData(): Promise<void> {
    const now = new Date();

    try {
      // Clean up expired logs
      const logCutoff = new Date(now.getTime() - this.RETENTION_PERIODS.logs);
      await db.query(`
        DELETE FROM application_logs
        WHERE created_at < ?
      `, [logCutoff]);

      // Clean up old analytics data
      const analyticsCutoff = new Date(now.getTime() - this.RETENTION_PERIODS.analytics);
      await db.query(`
        DELETE FROM user_analytics
        WHERE created_at < ?
      `, [analyticsCutoff]);

      // Clean up expired API keys
      await db.query(`
        DELETE FROM api_keys
        WHERE expires_at < ? AND expires_at IS NOT NULL
      `, [now]);

      // Clean up expired sessions
      const sessionCutoff = new Date(now.getTime() - this.RETENTION_PERIODS.user_sessions);
      await db.query(`
        DELETE FROM user_sessions
        WHERE last_activity < ?
      `, [sessionCutoff]);

      logger.info('Data retention cleanup completed successfully');
    } catch (error) {
      logger.error('Data retention cleanup failed:', error);
      throw error;
    }
  }

  static async scheduleCleanup(): Promise<void> {
    // Run cleanup daily at 2 AM
    const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours

    setInterval(async () => {
      try {
        await this.cleanupExpiredData();
      } catch (error) {
        logger.error('Scheduled cleanup failed:', error);
      }
    }, cleanupInterval);

    // Run initial cleanup
    await this.cleanupExpiredData();
  }
}
```

### Security Headers

```typescript
// middleware/security-headers.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.veequal.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options
  noSniff: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: false,

  // X-Download-Options
  ieNoOpen: true,

  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false
  }
});
```

### Security Monitoring

#### Intrusion Detection

```typescript
// lib/security/intrusion-detection.ts
import { logger } from '../logger';
import { NotificationService } from '../monitoring/notifications';

export class IntrusionDetectionSystem {
  private static suspiciousPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /<script>/i,
    /javascript:/i,
    /\.\.\//,
    /etc\/passwd/i
  ];

  private static rateLimitTracker = new Map<string, number[]>();

  static detectSuspiciousActivity(req: any): boolean {
    const url = req.url;
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip;

    // Check for SQL injection patterns
    if (this.checkSQLInjection(url)) {
      this.reportThreat('SQL_INJECTION_ATTEMPT', { ip, url, userAgent });
      return true;
    }

    // Check for XSS patterns
    if (this.checkXSS(url)) {
      this.reportThreat('XSS_ATTEMPT', { ip, url, userAgent });
      return true;
    }

    // Check for path traversal
    if (this.checkPathTraversal(url)) {
      this.reportThreat('PATH_TRAVERSAL_ATTEMPT', { ip, url, userAgent });
      return true;
    }

    // Check for rapid requests (potential DoS)
    if (this.checkRapidRequests(ip)) {
      this.reportThreat('RAPID_REQUESTS', { ip, userAgent });
      return true;
    }

    return false;
  }

  private static checkSQLInjection(input: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  private static checkXSS(input: string): boolean {
    const xssPatterns = [/<script>/i, /javascript:/i, /on\w+\s*=/i];
    return xssPatterns.some(pattern => pattern.test(input));
  }

  private static checkPathTraversal(input: string): boolean {
    return input.includes('../') || input.includes('..\\');
  }

  private static checkRapidRequests(ip: string): boolean {
    const now = Date.now();
    const window = 60000; // 1 minute
    const maxRequests = 100;

    if (!this.rateLimitTracker.has(ip)) {
      this.rateLimitTracker.set(ip, []);
    }

    const requests = this.rateLimitTracker.get(ip)!;

    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < window);

    // Add current request
    recentRequests.push(now);
    this.rateLimitTracker.set(ip, recentRequests);

    return recentRequests.length > maxRequests;
  }

  private static async reportThreat(
    type: string,
    details: any
  ): Promise<void> {
    logger.error(`Security threat detected: ${type}`, details);

    // Send immediate alert for critical threats
    const criticalThreats = ['SQL_INJECTION_ATTEMPT', 'XSS_ATTEMPT'];
    if (criticalThreats.includes(type)) {
      const notificationService = new NotificationService();
      await notificationService.sendAlert({
        title: `Security Alert: ${type}`,
        message: `Potential attack detected from IP: ${details.ip}`,
        severity: 'critical',
        timestamp: new Date()
      });
    }
  }
}

// Middleware integration
export function intrusionDetectionMiddleware() {
  return (req: any, res: any, next: any) => {
    if (IntrusionDetectionSystem.detectSuspiciousActivity(req)) {
      return res.status(403).json({ error: 'Suspicious activity detected' });
    }
    next();
  };
}
```

### Security Audit Checklist

#### Regular Security Reviews

- [ ] **Dependency Scanning**: Check for vulnerable dependencies
- [ ] **Code Review**: Manual security code review
- [ ] **Penetration Testing**: Professional security testing
- [ ] **Access Control**: Review API key permissions and access logs
- [ ] **Data Encryption**: Verify data at rest and in transit encryption
- [ ] **Backup Security**: Ensure backups are encrypted and secure
- [ ] **Incident Response**: Test incident response procedures
- [ ] **Security Training**: Keep team updated on security best practices

#### Automated Security Tools

```typescript
// scripts/security-scan.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function runSecurityScan(): Promise<void> {
  console.log('Running security scan...');

  try {
    // Dependency vulnerability scan
    console.log('Scanning dependencies...');
    await execAsync('bun audit');

    // Static code analysis
    console.log('Running static analysis...');
    await execAsync('bun run lint:security');

    // License compliance check
    console.log('Checking licenses...');
    await execAsync('bun run license-check');

    console.log('Security scan completed successfully');
  } catch (error) {
    console.error('Security scan failed:', error);
    throw error;
  }
}

// Run as part of CI/CD pipeline
if (require.main === module) {
  runSecurityScan().catch(process.exit);
}
```

## Contributing

### Development Workflow

#### Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/veEQUAL-dashboard.git
   cd veEQUAL-dashboard
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Database Setup**
   ```bash
   bun run db:setup
   bun run db:migrate
   bun run db:seed
   ```

5. **Start Development Server**
   ```bash
   bun run dev
   ```

#### Branch Strategy

```bash
# Feature development
git checkout -b feature/add-new-dashboard-widget
git checkout -b fix/transaction-display-bug
git checkout -b docs/update-api-documentation

# Release preparation
git checkout -b release/v1.2.0

# Hotfixes
git checkout -b hotfix/critical-security-patch
```

#### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Format
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

# Examples
feat(dashboard): add real-time price updates
fix(api): resolve transaction filtering bug
docs(readme): update installation instructions
style(components): improve button hover states
refactor(database): optimize query performance
test(api): add integration tests for auth endpoints
chore(deps): update dependencies to latest versions

# Breaking changes
feat(api)!: change response format for /api/transactions

BREAKING CHANGE: The response format has changed from array to object with pagination metadata.
```

### Code Review Process

#### Pull Request Guidelines

1. **PR Title**: Use conventional commit format
2. **Description**: Include:
   - What changes were made and why
   - Screenshots for UI changes
   - Testing instructions
   - Breaking changes (if any)

3. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix (non-breaking change which fixes an issue)
   - [ ] New feature (non-breaking change which adds functionality)
   - [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Screenshots (if applicable)

   ## Checklist
   - [ ] My code follows the project's style guidelines
   - [ ] I have performed a self-review of my code
   - [ ] I have commented my code, particularly in hard-to-understand areas
   - [ ] I have made corresponding changes to the documentation
   - [ ] My changes generate no new warnings
   - [ ] I have added tests that prove my fix is effective or that my feature works
   ```

#### Review Checklist

**Code Quality**:
- [ ] Code follows established patterns and conventions
- [ ] Functions are small and focused
- [ ] Variables and functions have descriptive names
- [ ] No code duplication
- [ ] Error handling is appropriate

**Security**:
- [ ] Input validation is implemented
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Authentication/authorization checks

**Performance**:
- [ ] Database queries are optimized
- [ ] Caching is implemented where appropriate
- [ ] Bundle size impact is minimal

**Testing**:
- [ ] Unit tests cover new functionality
- [ ] Integration tests pass
- [ ] Edge cases are tested

### Issue Reporting

#### Bug Reports

Use the bug report template:

```markdown
## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]
- Node.js version: [e.g. 18.17.0]

## Additional Context
Add any other context about the problem here.
```

#### Feature Requests

```markdown
## Feature Description
A clear and concise description of what you want to happen.

## Problem Statement
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

## Proposed Solution
A clear and concise description of what you want to happen.

## Alternatives Considered
A clear and concise description of any alternative solutions or features you've considered.

## Additional Context
Add any other context or screenshots about the feature request here.
```

### Release Process

#### Version Management

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

```bash
# Prepare release
bun run version:patch  # 1.0.0 -> 1.0.1
bun run version:minor  # 1.0.0 -> 1.1.0
bun run version:major  # 1.0.0 -> 2.0.0

# Generate changelog
bun run changelog

# Create release
git tag v1.2.0
git push origin v1.2.0
```

#### Release Checklist

- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Changelog is generated
- [ ] Version is bumped
- [ ] Security vulnerabilities are checked
- [ ] Performance benchmarks are run
- [ ] Deployment to staging is successful
- [ ] Manual testing on staging
- [ ] Release notes are prepared

## Coding Guidance

### Code Style & Standards

#### TypeScript Guidelines

```typescript
// Use strict TypeScript configuration
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}

// Prefer interfaces over types for object shapes
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Use enums for constants
enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

// Use strict typing for functions
function processTransaction(
  transaction: Transaction,
  options: ProcessingOptions
): Promise<ProcessedTransaction> {
  // Implementation
}

// Use generic types appropriately
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

// Prefer readonly arrays and objects where applicable
interface ReadonlyConfig {
  readonly apiUrl: string;
  readonly features: readonly string[];
}
```

#### Naming Conventions

```typescript
// Variables and functions: camelCase
const userName = 'john_doe';
const getUserProfile = () => { /* */ };

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Classes: PascalCase
class UserService {
  private readonly apiClient: ApiClient;
}

// Interfaces: PascalCase with descriptive names
interface DatabaseConnection {
  host: string;
  port: number;
}

// Types: PascalCase
type UserRole = 'admin' | 'user' | 'moderator';

// Files: kebab-case
// user-service.ts
// transaction-processor.ts
// api-client.ts

// Components: PascalCase
// UserProfile.tsx
// TransactionHistory.tsx
// DashboardWidget.tsx
```

#### Code Organization

```typescript
// File structure
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components
│   ├── forms/           # Form-specific components
│   └── charts/          # Chart components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── services/            # Business logic
├── utils/               # Utility functions
├── types/               # Type definitions
├── constants/           # Application constants
└── styles/              # Styling files

// Import organization
// 1. Node modules
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';

// 2. Internal modules (absolute imports)
import { UserService } from '@/services/user-service';
import { Button } from '@/components/common/Button';

// 3. Relative imports
import './Dashboard.styles.css';

// Group related imports
import {
  validateEmail,
  validatePassword,
  formatCurrency
} from '@/utils/validation';
```

### Best Practices

#### Error Handling

```typescript
// Use custom error classes
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Implement proper error boundaries
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error reporting service
  }
}

// Use Result pattern for operations that can fail
type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await userService.getById(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

#### Async/Await Patterns

```typescript
// Prefer async/await over .then()
// Good
async function processData() {
  try {
    const data = await fetchData();
    const processed = await processData(data);
    return processed;
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
}

// Handle multiple async operations
async function loadDashboardData() {
  try {
    // Parallel execution for independent operations
    const [user, transactions, analytics] = await Promise.all([
      userService.getCurrentUser(),
      transactionService.getRecent(),
      analyticsService.getSummary()
    ]);

    return { user, transactions, analytics };
  } catch (error) {
    // Handle errors appropriately
    throw new Error(`Failed to load dashboard: ${error.message}`);
  }
}

// Use Promise.allSettled for operations that should not fail together
async function loadOptionalData() {
  const results = await Promise.allSettled([
    fetchCriticalData(),
    fetchOptionalData1(),
    fetchOptionalData2()
  ]);

  const criticalData = results[0].status === 'fulfilled'
    ? results[0].value
    : null;

  return {
    critical: criticalData,
    optional1: results[1].status === 'fulfilled' ? results[1].value : null,
    optional2: results[2].status === 'fulfilled' ? results[2].value : null
  };
}
```

#### Performance Guidelines

```typescript
// Memoization for expensive calculations
const expensiveCalculation = useMemo(() => {
  return calculateComplexMetrics(data);
}, [data]);

// Callback memoization
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

// Lazy loading for large components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Debounce user input
const debouncedSearch = useDebounce(searchTerm, 300);

// Virtual scrolling for large lists
<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
  itemData={items}
>
  {Row}
</FixedSizeList>
```

#### Testing Guidelines

```typescript
// Write descriptive test names
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user data when user exists', async () => {
      // Arrange
      const userId = '123';
      const expectedUser = { id: userId, name: 'John Doe' };
      mockRepository.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user does not exist', async () => {
      // Arrange
      const userId = 'nonexistent';
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(userId))
        .rejects
        .toThrow('User not found');
    });
  });
});

// Use test data builders
class UserBuilder {
  private user: Partial<User> = {};

  withId(id: string): UserBuilder {
    this.user.id = id;
    return this;
  }

  withEmail(email: string): UserBuilder {
    this.user.email = email;
    return this;
  }

  build(): User {
    return {
      id: this.user.id || 'default-id',
      email: this.user.email || 'test@example.com',
      name: this.user.name || 'Test User',
      createdAt: this.user.createdAt || new Date()
    };
  }
}

// Usage
const testUser = new UserBuilder()
  .withId('123')
  .withEmail('john@example.com')
  .build();
```

#### JSDoc Comments

```typescript
/**
 * Processes a financial transaction and updates the user's balance.
 *
 * @param transaction - The transaction to process
 * @param options - Processing options
 * @param options.validateBalance - Whether to validate sufficient balance
 * @param options.skipNotification - Whether to skip sending notifications
 * @returns Promise that resolves to the processed transaction
 *
 * @throws {ValidationError} When transaction data is invalid
 * @throws {InsufficientFundsError} When user has insufficient balance
 *
 * @example
 * ```typescript
 * const transaction = {
 *   userId: '123',
 *   amount: 100,
 *   type: 'withdrawal'
 * };
 *
 * const result = await processTransaction(transaction, {
 *   validateBalance: true,
 *   skipNotification: false
 * });
 * ```
 */
async function processTransaction(
  transaction: Transaction,
  options: ProcessingOptions = {}
): Promise<ProcessedTransaction> {
  // Implementation
}
```

#### README Standards

```markdown
# Component/Module Name

Brief description of what this component/module does.

## Usage

```typescript
import { ComponentName } from './ComponentName';

// Basic usage
<ComponentName prop1="value1" prop2="value2" />

// Advanced usage
<ComponentName
  prop1="value1"
  prop2="value2"
  onEvent={(data) => console.log(data)}
/>
```

## Props/Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description of prop1 |
| prop2 | number | 0 | Description of prop2 |

## Examples

### Basic Example
[Include simple example]

### Advanced Example
[Include complex example]

## Notes

- Important implementation details
- Gotchas or limitations
- Performance considerations
```
