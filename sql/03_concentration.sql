DROP TABLE IF EXISTS concentration;
CREATE TABLE concentration AS
WITH daily_owner_power AS (
  SELECT
    snapshot_date,
    owner,
    total_voting_power,
    ROW_NUMBER() OVER (PARTITION BY snapshot_date, owner ORDER BY last_nft_snapshot_within_day DESC) as rn
  FROM owner_daily
),
ranked_power AS (
  SELECT
    snapshot_date,
    owner,
    total_voting_power,
    RANK() OVER (PARTITION BY snapshot_date ORDER BY total_voting_power) AS rank_val,
    SUM(total_voting_power) OVER (PARTITION BY snapshot_date) AS total_daily_power,
    COUNT(*) OVER (PARTITION BY snapshot_date) AS num_holders
  FROM daily_owner_power
  WHERE rn = 1
),
gini_components AS (
  SELECT
    snapshot_date,
    SUM((2 * rank_val - num_holders - 1) * total_voting_power) AS gini_numerator,
    num_holders * total_daily_power AS gini_denominator
  FROM ranked_power
  GROUP BY snapshot_date, num_holders, total_daily_power
),
percentiles AS (
  SELECT
    snapshot_date,
    SUM(CASE WHEN rank_val >= num_holders * 0.9 THEN total_voting_power ELSE 0 END) * 100.0 / total_daily_power AS top_10_percentage,
    SUM(CASE WHEN rank_val >= num_holders * 0.5 THEN total_voting_power ELSE 0 END) * 100.0 / total_daily_power AS top_50_percentage,
    SUM(CASE WHEN rank_val <= num_holders * 0.1 THEN total_voting_power ELSE 0 END) * 100.0 / total_daily_power AS bottom_10_percentage
  FROM ranked_power
  GROUP BY snapshot_date, total_daily_power, num_holders
)
SELECT
  dop.snapshot_date AS analysis_date,
  COALESCE(gc.gini_numerator / NULLIF(gc.gini_denominator, 0), 0) AS gini_coefficient,
  p.top_10_percentage,
  p.top_50_percentage,
  p.bottom_10_percentage,
  CASE
    WHEN dop.total_voting_power >= 1000000 THEN '1M+'
    WHEN dop.total_voting_power >= 100000 THEN '100K-1M'
    WHEN dop.total_voting_power >= 10000 THEN '10K-100K'
    WHEN dop.total_voting_power >= 1000 THEN '1K-10K'
    WHEN dop.total_voting_power >= 100 THEN '100-1K'
    ELSE '<100'
  END as power_bucket,
  COUNT(DISTINCT dop.owner) as holder_count_in_bucket,
  SUM(dop.total_voting_power) as total_power_in_bucket,
  ROUND(SUM(dop.total_voting_power) * 100.0 / rp.total_daily_power, 2) as percentage_of_supply_in_bucket,
  rp.num_holders as total_holders_on_date,
  rp.total_daily_power as total_supply_on_date
FROM daily_owner_power dop
JOIN ranked_power rp ON dop.snapshot_date = rp.snapshot_date AND dop.owner = rp.owner
JOIN gini_components gc ON dop.snapshot_date = gc.snapshot_date
JOIN percentiles p ON dop.snapshot_date = p.snapshot_date
WHERE dop.rn = 1
GROUP BY
  dop.snapshot_date,
  gc.gini_numerator,
  gc.gini_denominator,
  p.top_10_percentage,
  p.top_50_percentage,
  p.bottom_10_percentage,
  power_bucket,
  rp.total_daily_power,
  rp.num_holders
ORDER BY
  analysis_date DESC,
  MIN(CASE
    WHEN dop.total_voting_power >= 1000000 THEN 1000000
    WHEN dop.total_voting_power >= 100000 THEN 100000
    WHEN dop.total_voting_power >= 10000 THEN 10000
    WHEN dop.total_voting_power >= 1000 THEN 1000
    WHEN dop.total_voting_power >= 100 THEN 100
    ELSE 0
  END) DESC;
