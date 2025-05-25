DROP TABLE IF EXISTS total_supply;
CREATE TABLE total_supply AS
WITH daily_supply AS (
  SELECT
    CAST(snapshot_time AS DATE) as date,
    SUM(CAST(balance_raw AS DECIMAL(38,0)) / 1e18) as total_supply_value,
    COUNT(*) as total_nfts,
    COUNT(DISTINCT owner) as unique_holders,
    AVG(CAST(balance_raw AS DECIMAL(38,0)) / 1e18) as avg_voting_power,
    MAX(CAST(balance_raw AS DECIMAL(38,0)) / 1e18) as max_voting_power,
    MIN(CAST(balance_raw AS DECIMAL(38,0)) / 1e18) as min_voting_power
  FROM venfts
  WHERE CAST(balance_raw AS DECIMAL(38,0)) > 0
  GROUP BY CAST(snapshot_time AS DATE)
)
SELECT
  ds.date,
  ds.total_supply_value as total_supply,
  ds.total_nfts,
  ds.unique_holders,
  ds.avg_voting_power,
  ds.max_voting_power,
  ds.min_voting_power,
  (ds.total_supply_value - LAG(ds.total_supply_value, 1, ds.total_supply_value) OVER (ORDER BY ds.date)) as daily_supply_change_value
FROM daily_supply ds
ORDER BY ds.date DESC;
