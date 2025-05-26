import { fetchSnapshot } from '../lib/fetch.ts';
import { runAllSql } from '../lib/runSql.ts';
import { writeMd } from './writeMd.ts';
import { exportDashboardJSON, generateWalletNFTMapping, generateAdvancedAnalytics } from './generateJSON.ts';
import { db } from '../lib/db.ts';

async function main() {
  console.log('Starting veEQUAL dashboard update...');

  try {
    // Step 1: Fetch snapshot data
    await fetchSnapshot();

    // Step 2: Run SQL transformations
    await runAllSql();

    // Step 3: Generate markdown report
    await writeMd();

    // Step 4: Export JSON data for frontend
    await exportDashboardJSON();

    // Step 5: Generate wallet-to-NFT mapping
    await generateWalletNFTMapping();

    // Step 6: Generate advanced analytics
    await generateAdvancedAnalytics();

    console.log('Update completed successfully!');

  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  } finally {
    // Always close the database connection
    await db.close();
  }
}

main();
