DROP TABLE IF EXISTS unlock_impact;
CREATE TABLE unlock_impact AS
WITH monthly_unlocks AS (
  SELECT
    DATE_TRUNC('month', unlock_date::DATE) as unlock_month,
    COUNT(*) as unlocking_nfts,
    SUM(CAST(balance_raw AS DECIMAL(38,0)) / 1e18) as unlocking_power,
    COUNT(DISTINCT owner) as affected_holders
  FROM venfts
  WHERE CAST(balance_raw AS DECIMAL(38,0)) > 0 AND unlock_date IS NOT NULL
  GROUP BY DATE_TRUNC('month', unlock_date::DATE)
),
total_metrics AS (
  SELECT
    SUM(CAST(balance_raw AS DECIMAL(38,0)) / 1e18) as total_voting_power,
    COUNT(*) as total_nfts,
    COUNT(DISTINCT owner) as total_holders
  FROM venfts
  WHERE CAST(balance_raw AS DECIMAL(38,0)) > 0
)
SELECT
  u.unlock_month,
  u.unlocking_nfts,
  u.unlocking_power,
  u.affected_holders,
  ROUND(u.unlocking_power * 100.0 / t.total_voting_power, 2) as power_impact_percentage,
  ROUND(u.unlocking_nfts * 100.0 / t.total_nfts, 2) as nft_impact_percentage,
  ROUND(u.affected_holders * 100.0 / t.total_holders, 2) as holder_impact_percentage,
  SUM(u.unlocking_power) OVER (ORDER BY u.unlock_month) as cumulative_unlocking_power,
  ROUND(SUM(u.unlocking_power) OVER (ORDER BY u.unlock_month) * 100.0 / t.total_voting_power, 2) as cumulative_power_percentage
FROM monthly_unlocks u
CROSS JOIN total_metrics t
WHERE u.unlock_month >= CURRENT_DATE
ORDER BY u.unlock_month
LIMIT 12;

-- NFTs unlocking in the next 90 days
SELECT
  token_id,
  owner,
  CAST(balance_raw AS DECIMAL(38,0)) / 1e18 as balance_formatted,
  unlock_date,
  days_to_unlock
FROM (
  SELECT
    token_id,
    owner,
    balance_raw,
    DATE_TRUNC('day', TO_TIMESTAMP(lock_end_timestamp)) AS unlock_date,
    (lock_end_timestamp - EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)) / (24 * 60 * 60) AS days_to_unlock
  FROM venfts
  WHERE CAST(balance_raw AS DECIMAL(38,0)) > 0 AND lock_end_timestamp IS NOT NULL
) sub
WHERE days_to_unlock BETWEEN 0 AND 90
ORDER BY days_to_unlock ASC, balance_formatted DESC;

-- Total voting power unlocking on each date in the next 90 days
SELECT
  unlock_date,
  SUM(CAST(balance_raw AS DECIMAL(38,0)) / 1e18) AS total_voting_power_unlocking
FROM (
  SELECT
    balance_raw,
    DATE_TRUNC('day', TO_TIMESTAMP(lock_end_timestamp)) AS unlock_date,
    (lock_end_timestamp - EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)) / (24 * 60 * 60) AS days_to_unlock
  FROM venfts
  WHERE CAST(balance_raw AS DECIMAL(38,0)) > 0
) sub
WHERE days_to_unlock BETWEEN 0 AND 90
GROUP BY unlock_date
ORDER BY unlock_date ASC;
