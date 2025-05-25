DROP TABLE IF EXISTS owner_daily;
CREATE TABLE owner_daily AS
SELECT
  CAST(snapshot_time AS DATE) as snapshot_date,
  owner,
  COUNT(*) as nft_count,
  SUM(balance_formatted) as total_voting_power,
  MIN(CASE WHEN unlock_timestamp > 0 THEN unlock_date ELSE NULL END) as next_overall_unlock_date,
  MAX(snapshot_time) as last_nft_snapshot_within_day
FROM venfts
WHERE balance_formatted > 0
GROUP BY CAST(snapshot_time AS DATE), owner
ORDER BY snapshot_date DESC, total_voting_power DESC;
