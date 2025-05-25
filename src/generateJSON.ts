import { db } from '../lib/db.ts';

export interface DashboardData {
  summary: {
    totalVotingPower: string;
    totalNFTs: number;
    uniqueHolders: number;
    lastUpdated: string;
  };
  topNFTs: Array<{
    rank: number;
    nftId: string;
    unlockDate: string;
    owner: string;
    votingPower: string;
    // Add is_locked and owner_ens_name for consistency with js/dashboard.js expectations
    is_locked?: boolean;
    owner_ens_name?: string;
    lock_end_timestamp?: number; // Added for consistency
  }>;
  topHolders: Array<{
    rank: number;
    owner: string;
    votingPower: string;
    nftCount: number;
    topNFTId?: string;
    // Add holder_address, ens_name, percentage_of_total_vp for consistency
    holder_address: string;
    ens_name?: string;
    percentage_of_total_vp: number;
  }>;
  allNFTs: Array<{ // New field for all NFTs
    token_id: string; // Changed from nftId to match typical table rendering
    owner_address: string; // Changed from owner
    voting_power: string;
    lock_end_timestamp?: number; // Changed from unlockDate for consistency
    is_locked: boolean;
    owner_ens_name?: string; // Added for consistency
    unlock_date?: string; // Keep original unlock_date if needed by other parts
  }>;
  allHolders: Array<{ // New field for all holders
    rank: number;
    holder_address: string; // Changed from owner
    ens_name?: string;
    voting_power: string;
    percentage_of_total_vp: number; // Added
    nft_count: number;
  }>;
  charts: {
    votingPowerDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    unlockTimeline: Array<{
      date: string;
      count: number;
      totalPower: string;
    }>;
  };
}

export async function generateDashboardData(): Promise<DashboardData> {
  console.log('📊 Generating dashboard JSON data...');

  try {
    // Summary statistics
    const summaryResult = await db.query(`
      SELECT
        SUM(balance_formatted) as total_voting_power,
        COUNT(*) as total_nfts,
        COUNT(DISTINCT owner) as unique_holders
      FROM venfts
      WHERE balance_formatted > 0
    `);

    const summaryArray = (summaryResult as any).toArray();
    console.log('Summary result:', summaryArray);
    const summary = summaryArray[0];

    if (!summary) {
      throw new Error('No summary data returned from database');
    }

    // Top NFTs by voting power
    const topNFTsResult = await db.query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY venfts.balance_formatted DESC) as rank,
        venfts.token_id as nft_id,
        venfts.unlock_date,
        venfts.owner,
        venfts.balance_formatted as voting_power,
        venfts.is_locked,
        venfts.lock_end_timestamp,
        ens_names.name as owner_ens_name
      FROM venfts
      LEFT JOIN ens_names ON venfts.owner = ens_names.address
      WHERE venfts.balance_formatted > 0
      ORDER BY venfts.balance_formatted DESC
      LIMIT 50
    `);
    const topNFTsArray = (topNFTsResult as any).toArray();

    // Top holders by total voting power
    const topHoldersResult = await db.query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY total_voting_power DESC) as rank,
        s.owner as holder_address,
        s.total_voting_power,
        s.nft_count,
        s.top_nft_id,
        ens_names.name as ens_name,
        (s.total_voting_power / SUM(s.total_voting_power) OVER ()) * 100 as percentage_of_total_vp
      FROM (
        SELECT
          owner,
          SUM(balance_formatted) as total_voting_power,
          COUNT(*) as nft_count,
          FIRST(token_id ORDER BY balance_formatted DESC) as top_nft_id
        FROM venfts
        WHERE balance_formatted > 0
        GROUP BY owner
      ) s
      LEFT JOIN ens_names ON s.owner = ens_names.address
      ORDER BY total_voting_power DESC
      LIMIT 100
    `);
    const topHoldersArray = (topHoldersResult as any).toArray();

    // Voting power distribution for charts
    const distributionResult = await db.query(`
      WITH power_ranges AS (
        SELECT
          CASE
            WHEN balance_formatted >= 20000 THEN 'M.E.G.A (≥20K)'
            WHEN balance_formatted >= 5000 THEN 'Equalest (5K-20K)'
            WHEN balance_formatted >= 1000 THEN 'More Equal (1K-5K)'
            ELSE 'Equal (<1K)'
          END as range,
          balance_formatted as voting_power
        FROM venfts
        WHERE balance_formatted > 0
      )
      SELECT
        range,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM power_ranges
      GROUP BY range
      ORDER BY
        CASE range
          WHEN 'M.E.G.A (≥20K)' THEN 1
          WHEN 'Equalest (5K-20K)' THEN 2
          WHEN 'More Equal (1K-5K)' THEN 3
          ELSE 4
        END
    `);
    const distributionArray = (distributionResult as any).toArray();

    // Unlock timeline
    const unlockTimelineResult = await db.query(`
      SELECT
        unlock_date as date,
        COUNT(*) as count,
        SUM(balance_formatted) as total_power
      FROM venfts
      WHERE balance_formatted > 0 AND unlock_date IS NOT NULL
      GROUP BY unlock_date
      ORDER BY unlock_date
      LIMIT 20
    `);
    const unlockTimelineArray = (unlockTimelineResult as any).toArray();

    // Fetch ALL NFTs
    const allNFTsResult = await db.query(`
      SELECT
        v.token_id,
        v.owner as owner_address,
        v.balance_formatted as voting_power,
        v.unlock_date,
        v.lock_end_timestamp,
        v.is_locked,
        e.name as owner_ens_name
      FROM venfts v
      LEFT JOIN ens_names e ON v.owner = e.address
      WHERE v.balance_formatted > 0
      ORDER BY v.balance_formatted DESC
    `);
    const allNFTsArray = (allNFTsResult as any).toArray();

    // Fetch ALL Holders
    const allHoldersResult = await db.query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY s.total_voting_power DESC) as rank,
        s.owner as holder_address,
        e.name as ens_name,
        s.total_voting_power,
        (s.total_voting_power / SUM(s.total_voting_power) OVER ()) * 100 as percentage_of_total_vp,
        s.nft_count
      FROM (
        SELECT
          owner,
          SUM(balance_formatted) as total_voting_power,
          COUNT(*) as nft_count
        FROM venfts
        WHERE balance_formatted > 0
        GROUP BY owner
      ) s
      LEFT JOIN ens_names e ON s.owner = e.address
      ORDER BY s.total_voting_power DESC
    `);
    const allHoldersArray = (allHoldersResult as any).toArray();


    // Format the data
    const dashboardData: DashboardData = {
      summary: {
        totalVotingPower: formatNumber(summary.total_voting_power || 0),
        totalNFTs: Number(summary.total_nfts) || 0,
        uniqueHolders: Number(summary.unique_holders) || 0,
        lastUpdated: new Date().toISOString()
      },
      topNFTs: topNFTsArray.map((row: any) => ({
        rank: Number(row.rank),
        nftId: `${row.nft_id}`, // This is token_id
        unlockDate: row.unlock_date || '–',
        owner: row.owner, // This is owner_address
        votingPower: formatNumber(row.voting_power),
        is_locked: Boolean(row.is_locked),
        owner_ens_name: row.owner_ens_name,
        lock_end_timestamp: row.lock_end_timestamp ? Number(row.lock_end_timestamp) : undefined
      })),
      topHolders: topHoldersArray.map((row: any) => ({
        rank: Number(row.rank),
        owner: row.holder_address, // This is holder_address
        votingPower: formatNumber(row.total_voting_power),
        nftCount: Number(row.nft_count),
        topNFTId: row.top_nft_id ? `${row.top_nft_id}` : undefined,
        holder_address: row.holder_address,
        ens_name: row.ens_name,
        percentage_of_total_vp: parseFloat(Number(row.percentage_of_total_vp).toFixed(2))
      })),
      allNFTs: allNFTsArray.map((row: any) => ({
        token_id: `${row.token_id}`,
        owner_address: row.owner_address,
        voting_power: formatNumber(row.voting_power),
        lock_end_timestamp: row.lock_end_timestamp ? Number(row.lock_end_timestamp) : undefined,
        is_locked: Boolean(row.is_locked),
        owner_ens_name: row.owner_ens_name,
        unlock_date: row.unlock_date || '–'
      })),
      allHolders: allHoldersArray.map((row: any) => ({
        rank: Number(row.rank),
        holder_address: row.holder_address,
        ens_name: row.ens_name,
        voting_power: formatNumber(row.total_voting_power),
        percentage_of_total_vp: parseFloat(Number(row.percentage_of_total_vp).toFixed(2)),
        nft_count: Number(row.nft_count)
      })),
      charts: {
        votingPowerDistribution: distributionArray.map((row: any) => ({
          range: row.range,
          count: Number(row.count),
          percentage: Number(row.percentage)
        })),
        unlockTimeline: unlockTimelineArray.map((row: any) => ({
          date: row.date,
          count: Number(row.count),
          totalPower: formatNumber(row.total_power)
        }))
      }
    };

    return dashboardData;
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    throw error;
  }
}

export async function exportDashboardJSON() {
  const data = await generateDashboardData();

  // Export main dashboard data (for the HTML to load)
  await Bun.write('data/api/dashboard.json', JSON.stringify(data, null, 2));

  // Export individual endpoints for API-like access
  await Bun.write('data/api/summary.json', JSON.stringify(data.summary, null, 2));
  await Bun.write('data/api/top-nfts.json', JSON.stringify(data.topNFTs, null, 2));
  await Bun.write('data/api/top-holders.json', JSON.stringify(data.topHolders, null, 2));
  await Bun.write('data/api/charts.json', JSON.stringify(data.charts, null, 2));

  console.log('✅ Dashboard JSON data exported');
}

export async function generateWalletNFTMapping(): Promise<void> {
  console.log('🔗 Generating wallet-to-NFT mapping...');

  try {
    const result = await db.query(`
      SELECT
        owner,
        SUM(balance_formatted) as total_voting_power,
        COUNT(*) as nft_count
      FROM venfts
      WHERE balance_formatted > 0
      GROUP BY owner
      ORDER BY total_voting_power DESC
    `);

    const resultArray = (result as any).toArray();
    const walletMapping: Record<string, any> = {};

    for (const row of resultArray) {
      // Get individual NFTs for this wallet
      const nftsResult = await db.query(`
        SELECT
          token_id as nft_id,
          balance_formatted as voting_power,
          unlock_date,
          unlock_timestamp
        FROM venfts
        WHERE owner = '${row.owner}' AND balance_formatted > 0
        ORDER BY balance_formatted DESC
      `);

      const nftsArray = (nftsResult as any).toArray();

      walletMapping[row.owner] = {
        totalVotingPower: formatNumber(row.total_voting_power),
        nftCount: Number(row.nft_count),
        nfts: nftsArray.map((nft: any) => ({
          nftId: String(nft.nft_id),
          votingPower: formatNumber(nft.voting_power),
          unlockDate: nft.unlock_date,
          unlockTimestamp: Number(nft.unlock_timestamp)
        }))
      };
    }

    await Bun.write(
      'data/api/wallet-nfts.json',
      JSON.stringify(walletMapping, null, 2)
    );

    console.log('✅ Wallet-to-NFT mapping generated successfully');
  } catch (error) {
    console.error('❌ Error generating wallet-to-NFT mapping:', error);
    throw error;
  }
}

export async function generateAdvancedAnalytics(): Promise<void> {
  console.log('📈 Generating advanced analytics...');

  try {
    // Whale analysis
    const whaleResult = await db.query(`SELECT * FROM whale_analysis ORDER BY tier_voting_power DESC`);
    const whaleArray = (whaleResult as any).toArray();

    // Unlock impact analysis
    const unlockImpactResult = await db.query(`SELECT * FROM unlock_impact ORDER BY unlock_month`);
    const unlockImpactArray = (unlockImpactResult as any).toArray();

    // Top 10 vs rest analysis
    const top10Result = await db.query(`
      WITH top_holders AS (
        SELECT
          owner,
          SUM(balance_formatted) as total_voting_power,
          ROW_NUMBER() OVER (ORDER BY SUM(balance_formatted) DESC) as rank
        FROM venfts
        WHERE balance_formatted > 0
        GROUP BY owner
      )
      SELECT
        CASE WHEN rank <= 10 THEN 'Top 10' ELSE 'Rest' END as group_type,
        COUNT(*) as holder_count,
        SUM(total_voting_power) as total_power,
        AVG(total_voting_power) as avg_power
      FROM top_holders
      GROUP BY CASE WHEN rank <= 10 THEN 'Top 10' ELSE 'Rest' END
    `);
    const top10Array = (top10Result as any).toArray();

    // NFT size distribution
    const nftSizeResult = await db.query(`
      WITH nft_ranges AS (
        SELECT
          CASE
            WHEN balance_formatted >= 50000 THEN 'M.E.G.A (≥50K)'
            WHEN balance_formatted >= 20000 THEN 'Major (20K-50K)'
            WHEN balance_formatted >= 5000 THEN 'Equalest (5K-20K)'
            WHEN balance_formatted >= 1000 THEN 'More Equal (1K-5K)'
            ELSE 'Equal (<1K)'
          END as range,
          balance_formatted
        FROM venfts
        WHERE balance_formatted > 0
      )
      SELECT
        range,
        COUNT(*) as nft_count,
        SUM(balance_formatted) as total_power,
        AVG(balance_formatted) as avg_power,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM nft_ranges
      GROUP BY range
      ORDER BY AVG(balance_formatted) DESC
    `);
    const nftSizeArray = (nftSizeResult as any).toArray();

    const analytics = {
      whaleAnalysis: whaleArray.map((row: any) => ({
        tier: row.tier,
        holderCount: Number(row.holder_count),
        tierVotingPower: formatNumber(row.tier_voting_power),
        powerPercentage: Number(row.power_percentage),
        holderPercentage: Number(row.holder_percentage),
        avgPowerPerHolder: formatNumber(row.avg_power_per_holder),
        avgNftsPerHolder: Number(row.avg_nfts_per_holder)
      })),
      unlockImpact: unlockImpactArray.map((row: any) => ({
        month: row.unlock_month,
        unlockingNfts: Number(row.unlocking_nfts),
        unlockingPower: formatNumber(row.unlocking_power),
        affectedHolders: Number(row.affected_holders),
        powerImpactPercentage: Number(row.power_impact_percentage),
        nftImpactPercentage: Number(row.nft_impact_percentage),
        holderImpactPercentage: Number(row.holder_impact_percentage),
        cumulativePowerPercentage: Number(row.cumulative_power_percentage)
      })),
      top10Analysis: top10Array.map((row: any) => ({
        groupType: row.group_type,
        holderCount: Number(row.holder_count),
        totalPower: formatNumber(row.total_power),
        avgPower: formatNumber(row.avg_power)
      })),
      nftSizeDistribution: nftSizeArray.map((row: any) => ({
        range: row.range,
        nftCount: Number(row.nft_count),
        totalPower: formatNumber(row.total_power),
        avgPower: formatNumber(row.avg_power),
        percentage: Number(row.percentage)
      })),
      lastUpdated: new Date().toISOString()
    };

    await Bun.write(
      'data/api/analytics.json',
      JSON.stringify(analytics, null, 2)
    );

    console.log('✅ Advanced analytics generated successfully');
  } catch (error) {
    console.error('❌ Error generating advanced analytics:', error);
    throw error;
  }
}

function formatNumber(num: number): string {
  if (num === null || num === undefined) return '0'; // Handle null or undefined
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`; // One decimal place for millions
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`; // One decimal place for thousands
  }
  // For numbers less than 1000, show with commas and 2 decimal places
  // Ensure it's treated as a number before calling toLocaleString
  const numericValue = Number(num);
  if (isNaN(numericValue)) return '0'; // Handle cases where conversion to Number fails
  return numericValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
