-- Owner aggregation for daily reporting
DROP TABLE IF EXISTS owner_daily;
CREATE TABLE owner_daily AS
SELECT
  CAST(snapshot_time AS DATE) as snapshot_date,
  owner,
  COUNT(*) as nft_count,
  SUM(CAST(balance_raw AS DOUBLE) / 1e18) as total_voting_power,
  -- The following two columns are useful for a per-owner summary but not strictly for daily changes.
  -- They represent the overall next unlock for an owner based on all their NFTs ever recorded in venfts for that day.
  MIN(CASE WHEN unlock_timestamp > 0 THEN unlock_date ELSE NULL END) as next_overall_unlock_date,
  MAX(snapshot_time) as last_nft_snapshot_within_day -- Clarifies this is the latest NFT record time for that owner on that day
FROM venfts
WHERE CAST(balance_raw AS DOUBLE) / 1e18 > 0
GROUP BY CAST(snapshot_time AS DATE), owner
ORDER BY snapshot_date DESC, total_voting_power DESC;
