-- Unlock impact analysis - what happens when locks expire
DROP TABLE IF EXISTS unlock_impact;
CREATE TABLE unlock_impact AS
WITH monthly_unlocks AS (
  SELECT 
    DATE_TRUNC('month', unlock_date::DATE) as unlock_month,
    COUNT(*) as unlocking_nfts,
    SUM(balance_formatted) as unlocking_power,
    COUNT(DISTINCT owner) as affected_holders
  FROM venfts 
  WHERE balance_formatted > 0 AND unlock_date IS NOT NULL
  GROUP BY DATE_TRUNC('month', unlock_date::DATE)
),
total_metrics AS (
  SELECT 
    SUM(balance_formatted) as total_voting_power,
    COUNT(*) as total_nfts,
    COUNT(DISTINCT owner) as total_holders
  FROM venfts 
  WHERE balance_formatted > 0
)
SELECT 
  u.unlock_month,
  u.unlocking_nfts,
  u.unlocking_power,
  u.affected_holders,
  ROUND(u.unlocking_power * 100.0 / t.total_voting_power, 2) as power_impact_percentage,
  ROUND(u.unlocking_nfts * 100.0 / t.total_nfts, 2) as nft_impact_percentage,
  ROUND(u.affected_holders * 100.0 / t.total_holders, 2) as holder_impact_percentage,
  -- Cumulative impact
  SUM(u.unlocking_power) OVER (ORDER BY u.unlock_month) as cumulative_unlocking_power,
  ROUND(SUM(u.unlocking_power) OVER (ORDER BY u.unlock_month) * 100.0 / t.total_voting_power, 2) as cumulative_power_percentage
FROM monthly_unlocks u
CROSS JOIN total_metrics t
WHERE u.unlock_month >= CURRENT_DATE
ORDER BY u.unlock_month
LIMIT 12;
