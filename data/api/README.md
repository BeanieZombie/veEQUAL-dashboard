# API Data Directory

This directory contains generated JSON files that power the veEQUAL dashboard API endpoints.

## Files (Auto-Generated)

These files are automatically generated by the GitHub Actions workflow and should **NOT** be committed to git:

- `dashboard.json` - Main dashboard metrics and summary data
- `analytics.json` - Advanced analytics and concentration metrics
- `summary.json` - High-level summary statistics
- `top-holders.json` - Top wallet holders by voting power
- `top-nfts.json` - Top individual NFTs by balance
- `wallet-nfts.json` - Mapping of wallets to their NFTs
- `charts.json` - Chart data for visualizations
- `index.html` - API documentation page

## Generation Process

1. **Daily Update**: GitHub Actions runs `bun run src/update.ts` daily at 00:33 UTC
2. **Data Collection**: Fetches latest veEQUAL NFT data from Sonic Network
3. **Processing**: Runs SQL transformations and generates analytics
4. **API Export**: Creates JSON files via `src/generateJSON.ts`
5. **Deployment**: Files are served via GitHub Pages

## Local Development

To generate fresh data locally:

```bash
bun run src/update.ts
```

This will update all JSON files in this directory.

## API Endpoints

When deployed, these files are available at:

- `https://beaniezombie.github.io/veEQUAL-dashboard/data/api/dashboard.json`
- `https://beaniezombie.github.io/veEQUAL-dashboard/data/api/analytics.json`
- etc.

See `index.html` for complete API documentation.
