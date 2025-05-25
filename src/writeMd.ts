import { db } from '../lib/db.ts';
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
  balance_formatted: number;
  unlock_date: string | null;
}

interface HolderRow {
  owner: string;
  nft_count: number;
  total_voting_power: number;
  next_unlock_date: string | null;
}

interface LeaderboardHolder {
  owner: string;
  total_voting_power: number;
  // nft_count is implicitly derived or can be fetched if needed per holder for display
}

interface LeaderboardNftItem {
  token_id: string;
  unlock_date: string | null;
}

interface GrandTotalVotingPower {
    grand_total_vp: number;
}

interface UnlockScheduleData {
  month: string;
  voting_power: number;
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

function calculateGiniCoefficient(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sortedValues = values.sort((a, b) => a - b);
  const n = sortedValues.length;
  const sum = sortedValues.reduce((acc, val) => acc + val, 0);
  
  if (sum === 0) return 0;
  
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * sortedValues[i];
  }
  
  return numerator / (n * sum);
}

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
    // 1. Fetch Summary Data
    const summaryQuery = `
      SELECT
        (SELECT COUNT(DISTINCT owner) FROM owner_daily WHERE total_voting_power > 0) as total_owners,
        (SELECT SUM(nft_count) FROM owner_daily WHERE total_voting_power > 0) as total_nfts,
        (SELECT MAX(last_nft_snapshot_within_day) FROM owner_daily) as last_built_raw
    `;
    // Correctly access toArray()
    const summaryResultArray = (await db.query(summaryQuery) as any).toArray();
    const summaryData: SummaryData = summaryResultArray[0] || { total_owners: 0, total_nfts: 0, last_built_raw: null };
    const totalOwners = summaryData.total_owners || 0;
    const totalNFTs = summaryData.total_nfts || 0;
    const lastBuiltDate = summaryData.last_built_raw ? new Date(summaryData.last_built_raw).toUTCString() : 'N/A';

    // 1.5. Analyze EQUAL Token Governance Landscape
    console.log('🔍 Analyzing EQUAL token governance...');
    // const equalGovernanceAnalysis = await analyzeEqualGovernance();

    // 2. Fetch Top 10 NFTs by Balance
    const topNftsQuery = `
      SELECT token_id, owner, balance_formatted, unlock_date
      FROM venfts
      WHERE balance_formatted > 0
      ORDER BY balance_formatted DESC
      LIMIT 10
    `;
    // Correctly access toArray() before map
    const topNftsResult = (await db.query(topNftsQuery) as any).toArray();
    const topNfts: NftRow[] = topNftsResult.map((row: any) => row as NftRow);

    // 3. Fetch Top 10 Holders by Total Voting Power
    const topHoldersQuery = `
      SELECT owner, nft_count, total_voting_power, next_overall_unlock_date as next_unlock_date
      FROM owner_daily
      WHERE total_voting_power > 0
      ORDER BY total_voting_power DESC
      LIMIT 10
    `;
    // Correctly access toArray() before map
    const topHoldersResult = (await db.query(topHoldersQuery) as any).toArray();
    const topHolders: HolderRow[] = topHoldersResult.map((row: any) => row as HolderRow);

    // 4. Fetch Data for Leaderboard - Show ALL owners with NFTs
    const leaderboardHoldersQuery = `
      SELECT owner, total_voting_power
      FROM owner_daily
      WHERE total_voting_power > 0
      ORDER BY total_voting_power DESC
    `;
    // Correctly access toArray() before map
    const leaderboardHoldersResult = (await db.query(leaderboardHoldersQuery) as any).toArray();
    const leaderboardHoldersData: LeaderboardHolder[] = leaderboardHoldersResult.map((row: any) => row as LeaderboardHolder);

    const grandTotalVotingPowerQuery = `SELECT SUM(total_voting_power) as grand_total_vp FROM owner_daily WHERE total_voting_power > 0`;
    // Correctly access toArray()
    const grandTotalVpResultArray = (await db.query(grandTotalVotingPowerQuery) as any).toArray();
    const grandTotalVpData: GrandTotalVotingPower = grandTotalVpResultArray[0] || { grand_total_vp: 0 };
    const grandTotalVotingPower = grandTotalVpData.grand_total_vp || 0;

    // 5. Advanced Analytics - Concentration Risk
    const votingPowers = leaderboardHoldersData.map(h => h.total_voting_power);
    const giniCoefficient = calculateGiniCoefficient(votingPowers);
    
    // Calculate top percentile concentrations
    const totalHolders = leaderboardHoldersData.length;
    const top1Count = Math.max(1, Math.ceil(totalHolders * 0.01));
    const top5Count = Math.max(1, Math.ceil(totalHolders * 0.05));
    const top10Count = Math.max(1, Math.ceil(totalHolders * 0.10));
    
    const top1Power = leaderboardHoldersData.slice(0, top1Count).reduce((sum, h) => sum + h.total_voting_power, 0);
    const top5Power = leaderboardHoldersData.slice(0, top5Count).reduce((sum, h) => sum + h.total_voting_power, 0);
    const top10Power = leaderboardHoldersData.slice(0, top10Count).reduce((sum, h) => sum + h.total_voting_power, 0);

    // 6. Unlock Schedule Analysis
    const unlockScheduleQuery = `
      SELECT 
        substr(unlock_date, 1, 7) as month,
        SUM(balance_formatted) as voting_power,
        COUNT(*) as nft_count
      FROM venfts 
      WHERE unlock_date IS NOT NULL 
        AND unlock_date > '2025-05-24'
        AND balance_formatted > 0
      GROUP BY substr(unlock_date, 1, 7)
      ORDER BY month
      LIMIT 12
    `;
    const unlockScheduleResult = (await db.query(unlockScheduleQuery) as any).toArray();
    const unlockScheduleData: UnlockScheduleData[] = unlockScheduleResult.map((row: any) => ({
      month: row.month,
      voting_power: row.voting_power || 0,
      nft_count: row.nft_count || 0
    }));

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
          SELECT token_id, owner, unlock_date
          FROM venfts
          WHERE owner IN (${escapedHolderAddresses}) AND balance_formatted > 0
        `;
        // Correctly access toArray()
        const allNftsForLeaderboardResult = (await db.query(allNftsForLeaderboardQuery) as any).toArray();
        const allNftsForLeaderboard: {token_id: string, owner: string, unlock_date: string | null}[] = allNftsForLeaderboardResult;

        allNftsForLeaderboard.forEach(nft => {
          nftsByOwnerForLeaderboard[nft.owner] = nftsByOwnerForLeaderboard[nft.owner] || [];
          nftsByOwnerForLeaderboard[nft.owner].push({ token_id: nft.token_id, unlock_date: nft.unlock_date });
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

    // EQUAL Token Governance Context - TEMPORARILY DISABLED
    /*
    markdown += `## 🔍 EQUAL Token Governance Context\n\n`;
    markdown += `> **Critical Insight**: veEQUAL represents only ${equalGovernanceAnalysis.participation_rate.toFixed(2)}% of total EQUAL supply participation in governance.\n\n`;
    
    markdown += `| Metric | Current State | Potential Impact |\n`;
    markdown += `|--------|---------------|------------------|\n`;
    markdown += `| Total EQUAL Supply | ${formatVotingPower(equalGovernanceAnalysis.total_equal_supply)} | - |\n`;
    markdown += `| Locked in veEQUAL | ${formatVotingPower(equalGovernanceAnalysis.total_veequal_locked)} (${equalGovernanceAnalysis.participation_rate.toFixed(2)}%) | - |\n`;
    markdown += `| Dormant EQUAL | ${formatVotingPower(equalGovernanceAnalysis.dormant_equal_supply)} (${(100 - equalGovernanceAnalysis.participation_rate).toFixed(2)}%) | **Governance Risk** |\n`;
    markdown += `| Current Top 1% Control | ${equalGovernanceAnalysis.concentration_risk_shift.current_top1_percent.toFixed(2)}% | Could dilute to ${equalGovernanceAnalysis.concentration_risk_shift.potential_top1_percent.toFixed(2)}% |\n`;
    markdown += `| Current Top 10% Control | ${equalGovernanceAnalysis.concentration_risk_shift.current_top10_percent.toFixed(2)}% | Could dilute to ${equalGovernanceAnalysis.concentration_risk_shift.potential_top10_percent.toFixed(2)}% |\n\n`;

    // Governance Risk Assessment
    if (equalGovernanceAnalysis.participation_rate < 20) {
      markdown += `> ⚠️ **LOW PARTICIPATION ALERT**: Only ${equalGovernanceAnalysis.participation_rate.toFixed(2)}% of EQUAL holders participate in governance. This creates **concentration risk** and **governance attack vectors**.\n\n`;
    }
    
    if (equalGovernanceAnalysis.dormant_equal_supply > equalGovernanceAnalysis.total_veequal_locked) {
      markdown += `> 💰 **OPPORTUNITY**: ${formatVotingPower(equalGovernanceAnalysis.dormant_equal_supply)} EQUAL tokens could be locked to significantly improve governance decentralization.\n\n`;
    }

    // Participation vs Concentration Mermaid Chart
    markdown += `### Participation vs Concentration Analysis\n\n`;
    markdown += '```mermaid\n';
    markdown += 'sankey\n';
    markdown += `    Total EQUAL,Locked veEQUAL,${equalGovernanceAnalysis.total_veequal_locked.toFixed(0)}\n`;
    markdown += `    Total EQUAL,Dormant EQUAL,${equalGovernanceAnalysis.dormant_equal_supply.toFixed(0)}\n`;
    markdown += `    Locked veEQUAL,Top 1% Control,${(equalGovernanceAnalysis.total_veequal_locked * equalGovernanceAnalysis.concentration_risk_shift.current_top1_percent / 100).toFixed(0)}\n`;
    markdown += `    Locked veEQUAL,Other 99%,${(equalGovernanceAnalysis.total_veequal_locked * (100 - equalGovernanceAnalysis.concentration_risk_shift.current_top1_percent) / 100).toFixed(0)}\n`;
    markdown += '```\n\n';
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
      markdown += `## Unlock Schedule Analysis\n\n`;
      markdown += '```mermaid\n';
      markdown += 'gantt\n';
      markdown += '    title Voting Power Unlock Timeline\n';
      markdown += '    dateFormat  YYYY-MM\n';
      markdown += '    section Unlocks\n';
      
      unlockScheduleData.slice(0, 6).forEach(item => {
        const startDate = item.month;
        const endDate = item.month;
        const powerK = Math.round(item.voting_power / 1000);
        markdown += `    ${powerK}K VP (${item.nft_count} NFTs) :${startDate}, ${endDate}\n`;
      });
      markdown += '```\n\n';

      markdown += `| Month | Voting Power | NFTs | Impact | Risk |\n`;
      markdown += `|-------|-------------|------|--------|------|\n`;
      unlockScheduleData.forEach(item => {
        const impactPercentage = grandTotalVotingPower > 0 ? (item.voting_power / grandTotalVotingPower) * 100 : 0;
        const riskLevel = impactPercentage >= 10 ? 'HIGH' : impactPercentage >= 5 ? 'MEDIUM' : 'LOW';
        markdown += `| ${formatMonth(item.month + '-01')} | ${formatVotingPower(item.voting_power)} | ${item.nft_count} | ${impactPercentage.toFixed(2)}% | ${riskLevel} |\n`;
      });
      markdown += '\n';
    }

    // Concentration Risk Flow (Mermaid)
    markdown += `## Governance Risk Analysis\n\n`;
    markdown += '```mermaid\n';
    markdown += 'flowchart TD\n';
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
    markdown += `| Rank | NFT ID | Owner | Voting Power | Unlock Date |\n`;
    markdown += `|------|--------|-------|--------------|-------------|\n`;
    topNfts.forEach((nft, index) => {
      const unlockWarning = isUnlockingSoon(nft.unlock_date) ? ' ⚠️' : '';
      const ownerLink = `[${truncateAddress(nft.owner)}](${createDebankLink(nft.owner)})`;
      markdown += `| ${index + 1} | ${nft.token_id} | ${ownerLink} | ${formatVotingPower(nft.balance_formatted)} | ${formatUnlockDateDisplay(nft.unlock_date)}${unlockWarning} |\n`;
    });
    markdown += '\n';

    markdown += `## Top 10 Holders by Total Voting Power\n\n`;
    markdown += `| Rank | Owner | Voting Power | NFTs Count | Next Unlock |\n`;
    markdown += `|------|-------|--------------|------------|-----------|\n`;
    topHolders.forEach((holder, index) => {
      const nextUnlockWarning = isUnlockingSoon(holder.next_unlock_date) ? ' ⚠️' : '';
      const ownerLink = `[${truncateAddress(holder.owner)}](${createDebankLink(holder.owner)})`;
      markdown += `| ${index + 1} | ${ownerLink} | ${formatVotingPower(holder.total_voting_power)} | ${Number(holder.nft_count).toLocaleString()} | ${formatUnlockDateDisplay(holder.next_unlock_date)}${nextUnlockWarning} |\n`;
    });
    markdown += '\n';

    markdown += `## veEQUAL Leaderboard\n\n`;
    markdown += `| Rank | Owner | Voting Power | Influence | NFTs Id (Unlock ⚠️) |\n`;
    markdown += `|------|-------|--------------|-----------|----------------------|\n`;
    leaderboardHoldersData.forEach((holder, index) => {
      const influence = grandTotalVotingPower > 0 ? ((holder.total_voting_power / grandTotalVotingPower) * 100).toFixed(5) + '%' : '0.00000%';
      const ownerNfts = nftsByOwnerForLeaderboard[holder.owner] || [];
      const nftIdList = ownerNfts.map(nft =>
        `${nft.token_id}${isUnlockingSoon(nft.unlock_date) ? '⚠️' : ''}`
      ).join(', ');
      const ownerLink = `[${truncateAddress(holder.owner)}](${createDebankLink(holder.owner)})`;
      markdown += `| ${index + 1} | ${ownerLink} | ${formatVotingPower(holder.total_voting_power)} | ${influence} | ${nftIdList || '–'} |\n`;
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
