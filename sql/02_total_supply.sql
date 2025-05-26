-- Total supply metrics over time
DROP TABLE IF EXISTS total_supply;
CREATE TABLE total_supply AS
WITH daily_supply AS (
  SELECT
    CAST(snapshot_time AS DATE) as date,
    SUM(balance_formatted) as total_supply_value, -- Renamed for clarity in CTE
    COUNT(*) as total_nfts,
    COUNT(DISTINCT owner) as unique_holders,
    AVG(balance_formatted) as avg_voting_power,
    MAX(balance_formatted) as max_voting_power,
    MIN(balance_formatted) as min_voting_power
  FROM venfts
  WHERE balance_formatted > 0
  GROUP BY CAST(snapshot_time AS DATE)
)
SELECT
  ds.date,
  ds.total_supply_value as total_supply, -- Final column name
  ds.total_nfts,
  ds.unique_holders,
  ds.avg_voting_power,
  ds.max_voting_power,
  ds.min_voting_power,
  (ds.total_supply_value - LAG(ds.total_supply_value, 1, ds.total_supply_value) OVER (ORDER BY ds.date)) as daily_supply_change_value -- Pre-calculated
FROM daily_supply ds
ORDER BY ds.date DESC;
