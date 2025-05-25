import { db } from '../lib/db.ts';
import { formatBalance, formatBalanceString, formatLargeNumber } from '../lib/formatUtils.ts';
import { writeFile } from 'fs/promises';
import { MD_FILE } from './constants.ts';
// import { analyzeEqualGovernance } from './equalGovernance.ts';

// --- Interfaces ---
interface SummaryData {
  total_owners: number;
  total_nfts: number;
  last_built_raw: string | null;
}

interface NftRow {
  token_id: string;
  owner: string;
  balance_raw: string; // Raw voting power
  token_balance_raw: string; // Raw token balance
  unlock_date: string | null;
}

interface HolderRow {
  owner: string;
  nft_count: number;
  total_voting_power: number; // This will be calculated in SQL as formatted
  total_token_balance?: number; // This will be calculated in SQL as formatted
  next_unlock_date: string | null;
}

interface LeaderboardHolder {
  owner: string;
  total_voting_power: number; // This will be calculated in SQL as formatted
  total_token_balance?: number; // This will be calculated in SQL as formatted
  // nft_count is implicitly derived or can be fetched if needed per holder for display
}

interface LeaderboardNftItem {
  token_id: string;
  unlock_date: string | null;
  token_balance_raw: string; // Raw token balance
}

interface GrandTotalVotingPower {
    grand_total_vp: number;
}

interface UnlockScheduleData {
  month: string;
  token_balance?: number; // New field for token balance
  nft_count: number;
}

interface ConcentrationData {
  top1_percent: number;
  top5_percent: number;
  top10_percent: number;
  gini_coefficient: number;
}

interface PowerDistributionBand {
  range: string;
  count: number;
  total_power: number;
  percentage: number;
}

interface GovernanceAnalysis {
  total_equal_supply: number;
  total_veequal_locked: number;
  participation_rate: number;
  dormant_equal_supply: number;
  potential_max_voting_power: number;
  current_gini: number;
  potential_gini: number;
  concentration_risk_shift: {
    current_top1_percent: number;
    potential_top1_percent: number;
    current_top10_percent: number;
    potential_top10_percent: number;
  };
}

// --- Helper Functions ---
function formatVotingPower(power: number | null | undefined): string {
  if (power == null) return '0';
  if (power >= 1000000) {
    return `${(power / 1000000).toFixed(2)}M`;
  } else if (power >= 1000) {
    return `${(power / 1000).toFixed(2)}K`;
  }
  return power.toFixed(2);
}

function truncateAddress(address: string): string {
  if (!address || address.length <= 10) return address || 'N/A';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function createDebankLink(address: string): string {
    if (!address) return '#';
    return `https://debank.com/profile/${address}?chain=sonic`;
}

function createNftLink(nftId: string): string {
  if (!nftId) return nftId; // Return original if no ID, or handle as needed
  const contractAddress = "0x3045119766352fF250b3d45312Bd0973CBF7235a";
  return `[${nftId}](https://paintswap.io/sonic/assets/${contractAddress}/${nftId}?fromCollection=true)`;
}

function isUnlockingSoon(unlockDateStr: string | null | undefined, days: number = 30): boolean {
  if (!unlockDateStr) return false;
  try {
    const unlockDate = new Date(unlockDateStr);
    if (isNaN(unlockDate.getTime())) return false; // Invalid date

    const currentDate = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(currentDate.getDate() + days);

    return unlockDate > currentDate && unlockDate <= thresholdDate;
  } catch (e) {
    return false;
  }
}

function formatUnlockDateDisplay(unlockDateStr: string | null | undefined): string {
    return unlockDateStr ? unlockDateStr.split('T')[0] : '–';
}

// function calculateGiniCoefficient(values: number[]): number {
//   if (values.length === 0) return 0;

//   const sortedValues = values.sort((a, b) => a - b);
//   const n = sortedValues.length;
//   const sum = sortedValues.reduce((acc, val) => acc + val, 0);

//   if (sum === 0) return 0;

//   let numerator = 0;
//   for (let i = 0; i < n; i++) {
//     numerator += (2 * (i + 1) - n - 1) * sortedValues[i];
//   }

//   return numerator / (n * sum);
// }

function createProgressBar(percentage: number, width: number = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getRiskLevel(percentage: number): string {
  if (percentage >= 50) return 'CRITICAL';
  if (percentage >= 30) return 'HIGH';
  if (percentage >= 15) return 'MEDIUM';
  return 'LOW';
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// --- Main Export ---
export async function writeMd(): Promise<void> {
  console.log('Generating markdown report...');

  try {
    // Run independent queries in parallel for better performance
    console.log('🔄 Running parallel queries...');

    const [
      summaryResultArray,
      topNftsResult,
      topHoldersResult,
      leaderboardHoldersResult,
      grandTotalVpResultArray,
      concentrationStatsResult,
      unlockScheduleResult
    ] = await Promise.all([
      // 1. Summary Data
      db.query(`
        SELECT
          (SELECT COUNT(DISTINCT owner) FROM owner_daily WHERE total_voting_power > 0) as total_owners,
          (SELECT SUM(nft_count) FROM owner_daily WHERE total_voting_power > 0) as total_nfts,
          (SELECT MAX(last_nft_snapshot_within_day) FROM owner_daily) as last_built_raw
      `).then((result: any) => result.toArray()),

      // 2. Top 10 NFTs by Balance
      db.query(`
        SELECT token_id, owner, balance_raw, token_balance_raw, unlock_date
        FROM venfts
        WHERE CAST(token_balance_raw AS DECIMAL(38,0)) > 0
        ORDER BY CAST(token_balance_raw AS DECIMAL(38,0)) DESC
        LIMIT 10
      `).then((result: any) => result.toArray()),

      // 3. Top 10 Holders by Total Voting Power
      db.query(`
        SELECT
          od.owner,
          od.nft_count,
          od.total_voting_power,
          SUM(CAST(vf.token_balance_raw AS DECIMAL(38,0)) / 1e18) as total_token_balance,
          od.next_overall_unlock_date as next_unlock_date
        FROM owner_daily od
        JOIN venfts vf ON od.owner = vf.owner
        WHERE od.total_voting_power > 0
        GROUP BY od.owner, od.nft_count, od.total_voting_power, od.next_overall_unlock_date
        ORDER BY od.total_voting_power DESC
        LIMIT 10
      `).then((result: any) => result.toArray()),

      // 4. Leaderboard Holders Data
      db.query(`
        SELECT
          od.owner,
          od.total_voting_power,
          SUM(CAST(vf.token_balance_raw AS DECIMAL(38,0)) / 1e18) as total_token_balance
        FROM owner_daily od
        JOIN venfts vf ON od.owner = vf.owner
        WHERE od.total_voting_power > 0
        GROUP BY od.owner, od.total_voting_power
        ORDER BY od.total_voting_power DESC
      `).then((result: any) => result.toArray()),

      // 5. Grand Total Voting Power
      db.query(`SELECT SUM(total_voting_power) as grand_total_vp FROM owner_daily WHERE total_voting_power > 0`)
        .then((result: any) => result.toArray()),

      // 6. Concentration Statistics (Gini)
      db.query(`
        SELECT gini_coefficient
        FROM concentration
        ORDER BY analysis_date DESC
        LIMIT 1
      `).then((result: any) => result.toArray()),

      // 7. Unlock Schedule Analysis
      db.query(`
        SELECT
          substr(unlock_date, 1, 7) as month,
          SUM(CAST(token_balance_raw AS DECIMAL(38,0)) / 1e18) as token_balance,
          COUNT(*) as nft_count
        FROM venfts
        WHERE unlock_date IS NOT NULL
          AND unlock_date > '${new Date().toISOString().split('T')[0]}'
          AND CAST(token_balance_raw AS DECIMAL(38,0)) / 1e18 > 0
        GROUP BY substr(unlock_date, 1, 7)
        ORDER BY month
        LIMIT 12
      `).then((result: any) => result.toArray())
    ]);

    console.log('✅ Parallel queries completed');

    // Process results from parallel queries
    const summaryData: SummaryData = summaryResultArray[0] || { total_owners: 0, total_nfts: 0, last_built_raw: null };
    const totalOwners = summaryData.total_owners || 0;
    const totalNFTs = summaryData.total_nfts || 0;
    const lastBuiltDate = summaryData.last_built_raw ? new Date(summaryData.last_built_raw).toUTCString() : 'N/A';

    const topNfts: NftRow[] = topNftsResult.map((row: any) => row as NftRow);
    const topHolders: HolderRow[] = topHoldersResult.map((row: any) => row as HolderRow);
    const leaderboardHoldersData: LeaderboardHolder[] = leaderboardHoldersResult.map((row: any) => row as LeaderboardHolder);

    const grandTotalVpData: GrandTotalVotingPower = grandTotalVpResultArray[0] || { grand_total_vp: 0 };
    const grandTotalVotingPower = grandTotalVpData.grand_total_vp || 0;

    const giniCoefficient = concentrationStatsResult[0]?.gini_coefficient || 0;

    const unlockScheduleData: UnlockScheduleData[] = unlockScheduleResult.map((row: any) => ({
      month: row.month,
      token_balance: row.token_balance || 0,
      nft_count: row.nft_count || 0
    }));

    // Calculate top percentile concentrations
    const totalHolders = leaderboardHoldersData.length;
    const top1Count = Math.max(1, Math.ceil(totalHolders * 0.01));
    const top5Count = Math.max(1, Math.ceil(totalHolders * 0.05));
    const top10Count = Math.max(1, Math.ceil(totalHolders * 0.10));

    const top1Power = leaderboardHoldersData.slice(0, top1Count).reduce((sum, h) => sum + h.total_voting_power, 0);
    const top5Power = leaderboardHoldersData.slice(0, top5Count).reduce((sum, h) => sum + h.total_voting_power, 0);
    const top10Power = leaderboardHoldersData.slice(0, top10Count).reduce((sum, h) => sum + h.total_voting_power, 0);

    // 7. Power Distribution Bands
    const distributionBands = [
      { min: 100000, max: Infinity, label: '100K+' },
      { min: 50000, max: 99999, label: '50K-100K' },
      { min: 10000, max: 49999, label: '10K-50K' },
      { min: 1000, max: 9999, label: '1K-10K' },
      { min: 100, max: 999, label: '100-1K' },
      { min: 0, max: 99, label: '<100' }
    ];

    const powerDistribution: PowerDistributionBand[] = distributionBands.map(band => {
      const holders = leaderboardHoldersData.filter(h =>
        h.total_voting_power >= band.min && h.total_voting_power <= band.max
      );
      const totalPower = holders.reduce((sum, h) => sum + h.total_voting_power, 0);
      const percentage = grandTotalVotingPower > 0 ? (totalPower / grandTotalVotingPower) * 100 : 0;

      return {
        range: band.label,
        count: holders.length,
        total_power: totalPower,
        percentage
      };
    });

    const nftsByOwnerForLeaderboard: { [owner: string]: LeaderboardNftItem[] } = {};
    if (leaderboardHoldersData.length > 0) {
      const holderAddresses = leaderboardHoldersData.map(h => h.owner);
      // Properly escape single quotes for SQL IN clause
      const escapedHolderAddresses = holderAddresses.map(addr => `'${addr.replace(/'/g, "''")}'`).join(',');

      if (escapedHolderAddresses) { // Ensure there are addresses to query for
        const allNftsForLeaderboardQuery = `
          SELECT token_id, owner, unlock_date, balance_raw, token_balance_raw
          FROM venfts
          WHERE owner IN (${escapedHolderAddresses}) AND CAST(balance_raw AS DECIMAL(38,0)) > 0
        `;
        // Correctly access toArray()
        const allNftsForLeaderboardResult = (await db.query(allNftsForLeaderboardQuery) as any).toArray();
        const allNftsForLeaderboard: {token_id: string, owner: string, unlock_date: string | null, token_balance_raw: string}[] = allNftsForLeaderboardResult;

        allNftsForLeaderboard.forEach(nft => {
          nftsByOwnerForLeaderboard[nft.owner] = nftsByOwnerForLeaderboard[nft.owner] || [];
          nftsByOwnerForLeaderboard[nft.owner].push({
            token_id: nft.token_id,
            unlock_date: nft.unlock_date,
            token_balance_raw: nft.token_balance_raw
          });
        });
      }
    }

    // --- Start Markdown Generation ---
    let markdown = `# veEqualSonic\n\n`; // Match title from image
    markdown += `Total Owners: **${totalOwners.toLocaleString()}**, Total NFTs: **${totalNFTs.toLocaleString()}**\n`;
    markdown += `Last built: **${lastBuiltDate}**\n\n`;

    // Executive Summary with Risk Assessment
    const top1Percentage = grandTotalVotingPower > 0 ? (top1Power / grandTotalVotingPower) * 100 : 0;
    const top10Percentage = grandTotalVotingPower > 0 ? (top10Power / grandTotalVotingPower) * 100 : 0;

    markdown += `## Executive Summary\n\n`;
    markdown += `| Metric | Value | Risk Level |\n`;
    markdown += `|--------|-------|------------|\n`;
    markdown += `| Total Voting Power | ${formatVotingPower(grandTotalVotingPower)} | - |\n`;
    markdown += `| Top 1% Control | ${top1Percentage.toFixed(2)}% | ${top1Percentage >= 50 ? 'CRITICAL' : top1Percentage >= 30 ? 'HIGH' : 'MEDIUM'} |\n`;
    markdown += `| Top 10% Control | ${top10Percentage.toFixed(2)}% | ${top10Percentage >= 80 ? 'CRITICAL' : top10Percentage >= 60 ? 'HIGH' : 'MEDIUM'} |\n`;
    markdown += `| Gini Coefficient | ${giniCoefficient.toFixed(4)} | ${giniCoefficient >= 0.8 ? 'HIGH' : giniCoefficient >= 0.6 ? 'MEDIUM' : 'LOW'} |\n\n`;

    // EQUAL Token Governance Context - REMOVED
    /*
    // This entire section has been removed as per the plan.
    // The original commented out code was extensive and has been deleted for clarity.
    */

    // Voting Power Distribution Chart (Mermaid)
    markdown += `## Voting Power Distribution\n\n`;
    markdown += '```mermaid\n';
    markdown += 'pie title Voting Power Distribution\n';
    powerDistribution.forEach(band => {
      if (band.percentage > 0.1) { // Only show bands with >0.1% to keep chart clean
        markdown += `    "${band.range}" : ${band.percentage.toFixed(1)}\n`;
      }
    });
    markdown += '```\n\n';

    // Distribution Table
    markdown += `| Range | Holders | Total Power | Share | Distribution |\n`;
    markdown += `|-------|---------|-------------|-------|-------------|\n`;
    powerDistribution.forEach(band => {
      const progressBar = createProgressBar(band.percentage, 15);
      markdown += `| ${band.range} | ${band.count.toLocaleString()} | ${formatVotingPower(band.total_power)} | ${band.percentage.toFixed(2)}% | ${progressBar} |\n`;
    });
    markdown += '\n';

    // Unlock Schedule Analysis
    if (unlockScheduleData.length > 0) {
      markdown += `## Unlock Schedule Analysis (Based on Token Balance)\n\n`; // Updated title
      markdown += '```mermaid\n';
      markdown += 'gantt\n';
      markdown += '    title Token Balance Unlock Timeline\n'; // Updated title
      markdown += '    dateFormat  YYYY-MM\n';
      markdown += '    section Unlocks\n';

      unlockScheduleData.slice(0, 6).forEach(item => {
        const startDate = item.month;
        const endDate = item.month;
        const balanceK = Math.round((item.token_balance || 0) / 1000); // New logic based on token_balance
        markdown += `    ${balanceK}K Tokens (${item.nft_count} NFTs) :${startDate}, ${endDate}\n`; // Updated label
      });
      markdown += '```\n\n';

      markdown += `| Month | Token Balance | NFTs | Impact (vs Total Locked) | Risk |\n`; // Updated header
      markdown += `|-------|---------------|------|--------------------------|------|\n`; // Updated header
      // Need total locked tokens for impact calculation
      const totalLockedTokensQuery = `SELECT SUM(CAST(token_balance_raw AS DECIMAL(38,0)) / 1e18) as total_locked FROM venfts WHERE CAST(token_balance_raw AS DECIMAL(38,0)) > 0`;
      const totalLockedResultArray = (await db.query(totalLockedTokensQuery) as any).toArray();
      const totalLockedTokens = totalLockedResultArray[0]?.total_locked || 0;

      unlockScheduleData.forEach(item => {
        const impactPercentage = totalLockedTokens > 0 ? ((item.token_balance || 0) / totalLockedTokens) * 100 : 0; // New logic
        const riskLevel = impactPercentage >= 10 ? 'HIGH' : impactPercentage >= 5 ? 'MEDIUM' : 'LOW';
        markdown += `| ${formatMonth(item.month + '-01')} | ${formatVotingPower(item.token_balance || 0)} | ${item.nft_count.toLocaleString()} | ${impactPercentage.toFixed(2)}% | ${riskLevel} |\n`; // Updated data point
      });
      markdown += '\n';
    }

    // Concentration Risk Flow (Mermaid)
    markdown += `## Governance Risk Analysis\n\n`;
    markdown += `<!-- The flowchart below is a static representation of general governance risk factors. -->\n`;
    markdown += '```mermaid\n';
    markdown += 'flowchart TD\n'; // Add diagram type
    markdown += `    A[Total Holders: ${totalHolders.toLocaleString()}] --> B[Top 1%: ${top1Count} holders]\n`;
    markdown += `    A --> C[Top 5%: ${top5Count} holders]\n`;
    markdown += `    A --> D[Top 10%: ${top10Count} holders]\n`;
    markdown += `    B --> E[Controls ${top1Percentage.toFixed(1)}% of votes]\n`;
    markdown += `    C --> F[Controls ${(grandTotalVotingPower > 0 ? (top5Power / grandTotalVotingPower) * 100 : 0).toFixed(1)}% of votes]\n`;
    markdown += `    D --> G[Controls ${top10Percentage.toFixed(1)}% of votes]\n`;

    if (top1Percentage >= 50) {
      markdown += `    E --> H[CRITICAL: Governance centralization risk]\n`;
    } else if (top10Percentage >= 60) {
      markdown += `    G --> H[HIGH: Minority control risk]\n`;
    } else {
      markdown += `    G --> H[MEDIUM: Acceptable distribution]\n`;
    }
    markdown += '```\n\n';

    markdown += `## Top 10 NFTs by Balance\n\n`;
    markdown += `| Rank | NFT ID | Owner | True Balance | Voting Power | Unlock Date |\n`;
    markdown += `|------|--------|-------|--------------|--------------|-------------|\n`;
    topNfts.forEach((nft, index) => {
      const unlockWarning = isUnlockingSoon(nft.unlock_date) ? ' ⚠️' : '';
      const ownerLink = `[${truncateAddress(nft.owner)}](${createDebankLink(nft.owner)})`;
      const tokenBalance = formatBalance(nft.token_balance_raw);
      const votingPower = formatBalance(nft.balance_raw);
      const nftLink = createNftLink(nft.token_id);
      markdown += `| ${index + 1} | ${nftLink} | ${ownerLink} | ${formatVotingPower(tokenBalance)} | ${formatVotingPower(votingPower)} | ${formatUnlockDateDisplay(nft.unlock_date)}${unlockWarning} |\n`;
    });
    markdown += '\n';

    markdown += `## Top 10 Holders by Total Voting Power\n\n`;
    markdown += `| Rank | Owner | True Balance | Voting Power | NFTs Count | Next Unlock |\n`;
    markdown += `|------|-------|--------------|--------------|------------|-----------|\n`;
    topHolders.forEach((holder, index) => {
      const nextUnlockWarning = isUnlockingSoon(holder.next_unlock_date) ? ' ⚠️' : '';
      const ownerLink = `[${truncateAddress(holder.owner)}](${createDebankLink(holder.owner)})`;
      markdown += `| ${index + 1} | ${ownerLink} | ${formatVotingPower(holder.total_token_balance || 0)} | ${formatVotingPower(holder.total_voting_power)} | ${Number(holder.nft_count).toLocaleString()} | ${formatUnlockDateDisplay(holder.next_unlock_date)}${nextUnlockWarning} |\n`;
    });
    markdown += '\n';

    // Unlockable veEQUAL (Expired NFTs) section
    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().split('T')[0];

    const unlockableNftsQuery = `
      SELECT token_id, owner, balance_raw, token_balance_raw, unlock_date
      FROM venfts
      WHERE unlock_date IS NOT NULL
        AND unlock_date <= '${currentDateStr}'
        AND CAST(token_balance_raw AS DECIMAL(38,0)) > 0
      ORDER BY CAST(token_balance_raw AS DECIMAL(38,0)) DESC
    `;

    const unlockableNftsResult = (await db.query(unlockableNftsQuery) as any).toArray();
    const unlockableNfts: NftRow[] = unlockableNftsResult.map((row: any) => row as NftRow);

    markdown += `## Unlockable veEQUAL\n\n`;
    if (unlockableNfts.length > 0) {
      markdown += `*${unlockableNfts.length} NFTs are ready to unlock (sorted by True Balance)*\n\n`;
      markdown += `| NFT ID | Owner | True Balance | Voting Power | Unlock Date |\n`;
      markdown += `|--------|-------|--------------|--------------|-------------|\n`;
      unlockableNfts.forEach((nft) => {
        const ownerLink = `[${truncateAddress(nft.owner)}](${createDebankLink(nft.owner)})`;
        const tokenBalance = formatBalance(nft.token_balance_raw);
        const votingPower = formatBalance(nft.balance_raw);
        const nftLink = createNftLink(nft.token_id);
        markdown += `| ${nftLink} | ${ownerLink} | ${formatVotingPower(tokenBalance)} | ${formatVotingPower(votingPower)} | ${formatUnlockDateDisplay(nft.unlock_date)} |\n`;
      });
    } else {
      markdown += `*No NFTs are currently ready to unlock.*\n`;
    }
    markdown += '\n';

    // Pending NFT Unlock: 90 Days section (grouped by unlock date)
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(currentDate.getDate() + 90);

    const pendingUnlocksQuery = `
      SELECT token_id, owner, balance_raw, token_balance_raw, unlock_date
      FROM venfts
      WHERE unlock_date IS NOT NULL
        AND unlock_date > '${currentDateStr}'
        AND unlock_date <= '${ninetyDaysFromNow.toISOString().split('T')[0]}'
        AND CAST(token_balance_raw AS DECIMAL(38,0)) > 0
      ORDER BY unlock_date ASC, CAST(token_balance_raw AS DECIMAL(38,0)) DESC
    `;

    const pendingUnlocksResult = (await db.query(pendingUnlocksQuery) as any).toArray();
    const pendingUnlocks: NftRow[] = pendingUnlocksResult.map((row: any) => row as NftRow);

    markdown += `## Pending NFT Unlock: 90 Days\n\n`;
    if (pendingUnlocks.length > 0) {
      // Group NFTs by unlock date
      const groupedUnlocks: { [date: string]: NftRow[] } = {};
      pendingUnlocks.forEach(nft => {
        const unlockDate = formatUnlockDateDisplay(nft.unlock_date);
        if (!groupedUnlocks[unlockDate]) {
          groupedUnlocks[unlockDate] = [];
        }
        groupedUnlocks[unlockDate].push(nft);
      });

      const sortedDates = Object.keys(groupedUnlocks).sort();

      sortedDates.forEach(date => {
        const nftsForDate = groupedUnlocks[date];
        const totalTokenBalance = nftsForDate.reduce((sum, nft) => sum + formatBalance(nft.token_balance_raw), 0);
        const isUnlockingSoonDate = isUnlockingSoon(nftsForDate[0].unlock_date, 30);

        markdown += `### ${date}${isUnlockingSoonDate ? ' ⚠️' : ''}\n`;
        markdown += `*${nftsForDate.length} NFTs unlocking • Total: ${formatVotingPower(totalTokenBalance)} tokens*\n\n`;
        markdown += `| NFT ID | Owner | True Balance | Voting Power |\n`;
        markdown += `|--------|-------|--------------|-------------|\n`;

        nftsForDate.forEach((nft) => {
          const ownerLink = `[${truncateAddress(nft.owner)}](${createDebankLink(nft.owner)})`;
          const tokenBalance = formatBalance(nft.token_balance_raw);
          const votingPower = formatBalance(nft.balance_raw);
          const nftLink = createNftLink(nft.token_id);
          markdown += `| ${nftLink} | ${ownerLink} | ${formatVotingPower(tokenBalance)} | ${formatVotingPower(votingPower)} |\n`;
        });
        markdown += '\n';
      });
    } else {
      markdown += `*No NFTs scheduled to unlock in the next 90 days.*\n`;
    }
    markdown += '\n';

    markdown += `## veEQUAL Leaderboard\n\n`;
    markdown += `| Rank | Owner | True Balance | Voting Power | Influence (VP) | NFTs Id (Unlock ⚠️) |\n`;
    markdown += `|------|-------|--------------|--------------|----------------|----------------------|\n`;
    leaderboardHoldersData.forEach((holder, index) => {
      const influence = grandTotalVotingPower > 0 ? ((holder.total_voting_power / grandTotalVotingPower) * 100).toFixed(5) + '%' : '0.00000%';
      const ownerNfts = nftsByOwnerForLeaderboard[holder.owner] || [];
      const nftIdList = ownerNfts.map(nft =>
        `${createNftLink(nft.token_id)}${isUnlockingSoon(nft.unlock_date) ? '⚠️' : ''}`
      ).join(', ');
      const ownerLink = `[${truncateAddress(holder.owner)}](${createDebankLink(holder.owner)})`;
      markdown += `| ${index + 1} | ${ownerLink} | ${formatVotingPower(holder.total_token_balance || 0)} | ${formatVotingPower(holder.total_voting_power)} | ${influence} | ${nftIdList || '–'} |\n`;
    });
    markdown += '\n';

    markdown += `\n---\n\n*Data sourced from Sonic blockchain veEQUAL contract: \`0x3045119766352fF250b3d45312Bd0973CBF7235a\`*\n`;
    markdown += `*Unlock warning (⚠️) indicates an NFT is scheduled to unlock within the next 30 days.*\n`;

    await writeFile(MD_FILE, markdown, 'utf-8');
    console.log(`Report written to ${MD_FILE}`);

  } catch (error) {
    console.error('Error generating markdown report:', error);
    throw error;
  }
}

// If this file is run directly (e.g. for testing)
if (import.meta.main) {
  writeMd().catch(console.error);
}
