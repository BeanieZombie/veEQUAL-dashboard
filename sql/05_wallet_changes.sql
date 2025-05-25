DROP TABLE IF EXISTS wallet_changes;
CREATE TABLE wallet_changes AS
WITH daily_power AS (
  SELECT
    snapshot_date,
    owner,
    total_voting_power
  FROM owner_daily
),
lagged_power AS (
  SELECT
    snapshot_date,
    owner,
    total_voting_power,
    LAG(total_voting_power, 1, 0.0) OVER (PARTITION BY owner ORDER BY snapshot_date) as previous_day_power
  FROM daily_power
)
SELECT
  lp.snapshot_date as date,
  lp.owner as wallet,
  (lp.total_voting_power - lp.previous_day_power) as change_amount
FROM lagged_power lp
ORDER BY date DESC, wallet;
