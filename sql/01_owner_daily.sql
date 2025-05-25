DROP TABLE IF EXISTS owner_daily;
CREATE TABLE owner_daily AS
SELECT
  CAST(snapshot_time AS DATE) as snapshot_date,
  owner,
  COUNT(*) as nft_count,
  SUM(CAST(balance_raw AS DECIMAL(38,0)) / 1e18) as total_voting_power,
  MIN(CASE WHEN lock_end_timestamp > 0 THEN unlock_date ELSE NULL END) as next_overall_unlock_date,
  MAX(snapshot_time) as last_nft_snapshot_within_day
FROM venfts
WHERE CAST(balance_raw AS DECIMAL(38,0)) > 0
GROUP BY CAST(snapshot_time AS DATE), owner
ORDER BY snapshot_date DESC, total_voting_power DESC;

-- Calculate total voting power per owner and rank them
SELECT
  owner,
  SUM(CAST(balance_raw AS DECIMAL(38,0)) / 1e18) AS total_voting_power,
  RANK() OVER (ORDER BY SUM(CAST(balance_raw AS DECIMAL(38,0)) / 1e18) DESC) AS rank_by_voting_power
FROM venfts
WHERE CAST(balance_raw AS DECIMAL(38,0)) > 0
GROUP BY owner
ORDER BY total_voting_power DESC;
