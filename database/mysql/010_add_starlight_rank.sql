USE blitzhashpi;

UPDATE system_configs
SET config_value = JSON_ARRAY_INSERT(
  config_value,
  '$.operation.ranks[5]',
  JSON_OBJECT('key', 'starlight', 'name', '星耀', 'icon', '✷', 'color', '#e7a6ff', 'enabled', true)
)
WHERE config_group = 'game'
  AND config_key = 'operation_config'
  AND JSON_SEARCH(config_value, 'one', 'starlight', NULL, '$.operation.ranks[*].key') IS NULL;

UPDATE system_configs
SET config_value = JSON_SET(
  config_value,
  '$.operation.rankRules.chestRewards.starlight',
  CAST(0.012 AS DECIMAL(18, 8))
)
WHERE config_group = 'game'
  AND config_key = 'operation_config'
  AND JSON_EXTRACT(config_value, '$.operation.rankRules.chestRewards.starlight') IS NULL;
