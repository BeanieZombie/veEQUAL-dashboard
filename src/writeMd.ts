import { db } from '../lib/db.ts';
import { writeFile } from 'fs/promises';
import { MD_FILE } from './constants.ts';

interface OwnerRow {
  owner: string;
  nft_count: number;
  total_voting_power: number;
  next_unlock_date: string | null;
  last_nft_snapshot_within_day: string; // Changed from last_updated
}

function formatVotingPower(power: number): string {
  if (power >= 1000000) {
    return `${(power / 1000000).toFixed(2)}M`;
  } else if (power >= 1000) {
    return `${(power / 1000).toFixed(2)}K`;
  } else {
    return power.toFixed(2);
  }
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export async function writeMd(): Promise<void> {
  console.log('Generating markdown report...');

  try {
    // Get owner data
    const ownerResult = await db.query('SELECT * FROM owner_daily ORDER BY total_voting_power DESC LIMIT 100');
    const owners = (ownerResult as any).toArray() as OwnerRow[];

    // Get individual NFT data for detailed listing
    const nftResult = await db.query(`
      SELECT token_id, owner, balance_formatted, unlock_date
      FROM venfts
      WHERE balance_formatted > 0
      ORDER BY balance_formatted DESC
      LIMIT 50
    `);
    const nfts = (nftResult as any).toArray();

    if (owners.length === 0) {
      console.warn('No data found in owner_daily table');
      return;
    }

    const lastUpdated = new Date(owners[0].last_nft_snapshot_within_day).toISOString().split('T')[0];
    const totalVotingPower = owners.reduce((sum, owner) => sum + Number(owner.total_voting_power), 0);
    const totalNFTs = owners.reduce((sum, owner) => sum + Number(owner.nft_count), 0);

    let markdown = `# veEQUAL Dashboard

Last updated: **${lastUpdated}**

## Summary

- **Total Voting Power**: ${formatVotingPower(totalVotingPower)} veEQUAL
- **Total NFTs**: ${totalNFTs.toLocaleString()}
- **Unique Holders**: ${owners.length.toLocaleString()}

## Top NFTs by Voting Power

| Rank | NFT | Owner | Voting Power | Unlock Date |
|------|-----|-------|--------------|-------------|
`;

    // Show top NFTs in id(YYYY-MM-DD) format
    nfts.forEach((nft: any, index: number) => {
      const rank = index + 1;
      const nftId = `${nft.token_id}(${nft.unlock_date || '–'})`;
      const address = truncateAddress(nft.owner);
      const votingPower = formatVotingPower(Number(nft.balance_formatted));
      const unlockDate = nft.unlock_date || '–';

      markdown += `| ${rank} | \`${nftId}\` | \`${address}\` | ${votingPower} | ${unlockDate} |\n`;
    });

    markdown += `

## Top Holders by Total Voting Power

| Rank | Owner | Voting Power | NFTs | Next Unlock |
|------|-------|--------------|------|-------------|
`;

    owners.forEach((owner, index) => {
      const rank = index + 1;
      const address = truncateAddress(owner.owner);
      const votingPower = formatVotingPower(Number(owner.total_voting_power));
      const nftCount = Number(owner.nft_count).toLocaleString();
      const nextUnlock = owner.next_unlock_date || '–';

      markdown += `| ${rank} | \`${address}\` | ${votingPower} | ${nftCount} | ${nextUnlock} |\n`;
    });

    markdown += `
---

*Data sourced from Sonic blockchain veEQUAL contract: \`0x3045119766352fF250b3d45312Bd0973CBF7235a\`*
`;

    await writeFile(MD_FILE, markdown, 'utf-8');
    console.log(`Report written to ${MD_FILE}`);

  } catch (error) {
    console.error('Error generating markdown report:', error);
    throw error;
  }
}
