import { fetchSnapshot } from '../lib/fetch.ts';
import { runAllSql } from '../lib/runSql.ts';
import { writeMd } from './writeMd.ts';
import { db } from '../lib/db.ts';

async function main() {
  console.log('🚀 Starting veEQUAL data pipeline...');

  try {
    // Step 1: Fetch snapshot data from blockchain
    console.log('📥 Fetching blockchain data...');
    await fetchSnapshot();

    // Step 2: Run SQL transformations
    console.log('⚙️ Processing data transformations...');
    await runAllSql();

    // Step 3: Generate markdown report
    console.log('📄 Generating markdown report...');
    await writeMd();

    console.log('✅ Data pipeline completed successfully!');
    console.log('📊 Data available via API endpoints');
    console.log('📄 Markdown report: veEQUAL.md');

  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  } finally {
    // Always close the database connection
    await db.close();
  }
}

main();
