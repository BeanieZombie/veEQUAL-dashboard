DROP TABLE IF EXISTS whale_analysis;
CREATE TABLE whale_analysis AS
WITH holder_tiers AS (
  SELECT
    owner,
    total_voting_power,
    nft_count,
    CASE
      WHEN total_voting_power >= 50000 THEN 'M.E.G.A Whale (≥50K)'
      WHEN total_voting_power >= 20000 THEN 'Major Holder (20K-50K)'
      WHEN total_voting_power >= 5000 THEN 'Equalest (5K-20K)'
      WHEN total_voting_power >= 1000 THEN 'More Equal (1K-5K)'
      ELSE 'Equal (<1K)'
    END as tier,
    ROW_NUMBER() OVER (ORDER BY total_voting_power DESC) as rank
  FROM (
    SELECT
      owner,
      SUM(CAST(balance_raw AS DECIMAL(38,0)) / 1e18) as total_voting_power,
      COUNT(*) as nft_count
    FROM venfts
    WHERE CAST(balance_raw AS DECIMAL(38,0)) > 0
    GROUP BY owner
  )
)
SELECT
  tier,
  COUNT(*) as holder_count,
  SUM(total_voting_power) as tier_voting_power,
  ROUND(SUM(total_voting_power) * 100.0 / SUM(SUM(total_voting_power)) OVER (), 2) as power_percentage,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as holder_percentage,
  AVG(total_voting_power) as avg_power_per_holder,
  AVG(nft_count) as avg_nfts_per_holder
FROM holder_tiers
GROUP BY tier
ORDER BY
  CASE tier
    WHEN 'M.E.G.A Whale (≥50K)' THEN 1
    WHEN 'Major Holder (20K-50K)' THEN 2
    WHEN 'Equalest (5K-20K)' THEN 3
    WHEN 'More Equal (1K-5K)' THEN 4
    ELSE 5
  END;
