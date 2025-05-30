-- Unlock date histogram - when veEQUAL tokens unlock
DROP TABLE IF EXISTS unlock_hist;
CREATE TABLE unlock_hist AS
WITH daily_unlocks AS (
  SELECT
    CAST(unlock_date AS DATE) as specific_unlock_date,
    SUM(CAST(balance_raw AS DOUBLE) / 1e18) as total_amount_unlocking
  FROM venfts
  WHERE CAST(balance_raw AS DOUBLE) / 1e18 > 0 AND unlock_timestamp > 0 -- Exclude 'Never' and potentially invalid past dates if not handled by 'Expired'
  GROUP BY CAST(unlock_date AS DATE)
),
unlock_buckets AS (
  SELECT
    token_id,
    owner,
    CAST(balance_raw AS DOUBLE) / 1e18 as balance_formatted,
    unlock_date, -- This is the specific unlock date for each NFT
    unlock_timestamp,
    CASE
      WHEN unlock_timestamp = 0 THEN 'Never'
      WHEN CAST(unlock_date AS DATE) <= CURRENT_DATE THEN 'Expired'
      WHEN CAST(unlock_date AS DATE) <= CURRENT_DATE + INTERVAL 1 MONTH THEN 'This Month'
      WHEN CAST(unlock_date AS DATE) <= CURRENT_DATE + INTERVAL 3 MONTH THEN '1-3 Months'
      WHEN CAST(unlock_date AS DATE) <= CURRENT_DATE + INTERVAL 6 MONTH THEN '3-6 Months'
      WHEN CAST(unlock_date AS DATE) <= CURRENT_DATE + INTERVAL 1 YEAR THEN '6-12 Months'
      WHEN CAST(unlock_date AS DATE) <= CURRENT_DATE + INTERVAL 2 YEAR THEN '1-2 Years'
      ELSE '2+ Years'
    END as unlock_bucket
  FROM venfts
  WHERE CAST(balance_raw AS DOUBLE) / 1e18 > 0
)
SELECT
  b.unlock_bucket,
  b.unlock_date as specific_unlock_date, -- Keep the specific date for detailed timeline
  COUNT(*) as nft_count,
  COUNT(DISTINCT b.owner) as holder_count,
  SUM(b.balance_formatted) as total_voting_power, -- This is the amount per bucket/specific_date combination
  du.total_amount_unlocking as total_daily_amount_unlocking, -- Amount unlocking on this specific day
  ROUND(SUM(b.balance_formatted) * 100.0 / (SELECT SUM(CAST(balance_raw AS DOUBLE) / 1e18) FROM venfts WHERE unlock_timestamp > 0), 2) as percentage_of_supply,
  ROUND(AVG(b.balance_formatted), 2) as avg_voting_power
FROM unlock_buckets b
LEFT JOIN daily_unlocks du ON CAST(b.unlock_date AS DATE) = du.specific_unlock_date
GROUP BY b.unlock_bucket, b.unlock_date, du.total_amount_unlocking -- Group by specific_unlock_date as well
ORDER BY
  CASE b.unlock_bucket
    WHEN 'Never' THEN 1
    WHEN 'Expired' THEN 2
    WHEN 'This Month' THEN 3
    WHEN '1-3 Months' THEN 4
    WHEN '3-6 Months' THEN 5
    WHEN '6-12 Months' THEN 6
    WHEN '1-2 Years' THEN 7
    WHEN '2+ Years' THEN 8
  END,
  b.unlock_date; -- Order by specific date within buckets
