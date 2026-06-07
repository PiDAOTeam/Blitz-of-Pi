USE blitzhashpi;

INSERT INTO system_configs (
  config_group,
  config_key,
  config_name,
  config_value,
  value_type,
  description,
  is_public,
  status
) VALUES (
  'pi',
  'runtime_config',
  'Pi运行环境配置',
  JSON_OBJECT(
    'runtimeMode', 'production',
    'frontendSandbox', false,
    'sandboxUrl', 'https://sandbox.minepi.com/app/blitz-of-pi',
    'productionUrl', 'https://blitz.hashpi.app'
  ),
  'json',
  '控制前端 Pi SDK 沙盒/主网模式，不保存 API Key',
  1,
  1
) ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  description = VALUES(description),
  is_public = VALUES(is_public),
  status = VALUES(status);
