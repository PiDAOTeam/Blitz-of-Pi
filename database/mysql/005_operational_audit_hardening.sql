USE blitzhashpi;

SET @schema_name = DATABASE();

UPDATE payment_orders SET pi_payment_id = NULL WHERE pi_payment_id = '';
UPDATE payment_orders SET txid = NULL WHERE txid = '';
UPDATE wallet_ledgers SET related_type = NULL WHERE related_type = '';
UPDATE wallet_ledgers SET related_id = NULL WHERE related_id = '';

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE wallet_ledgers ADD UNIQUE KEY uk_wallet_ledger_related (related_type, related_id)',
    'SELECT 1'
  )
  FROM information_schema.statistics
  WHERE table_schema = @schema_name
    AND table_name = 'wallet_ledgers'
    AND index_name = 'uk_wallet_ledger_related'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE payment_orders ADD UNIQUE KEY uk_payment_pi_payment_id (pi_payment_id)',
    'SELECT 1'
  )
  FROM information_schema.statistics
  WHERE table_schema = @schema_name
    AND table_name = 'payment_orders'
    AND index_name = 'uk_payment_pi_payment_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE payment_orders ADD UNIQUE KEY uk_payment_txid (txid)',
    'SELECT 1'
  )
  FROM information_schema.statistics
  WHERE table_schema = @schema_name
    AND table_name = 'payment_orders'
    AND index_name = 'uk_payment_txid'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS battle_rooms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_no VARCHAR(64) NOT NULL UNIQUE,
  mode VARCHAR(32) NOT NULL DEFAULT 'quick_battle',
  status VARCHAR(32) NOT NULL DEFAULT 'playing',
  player_a_uid VARCHAR(64) NOT NULL,
  player_b_uid VARCHAR(64) NOT NULL,
  winner_uid VARCHAR(64) DEFAULT '',
  loser_uid VARCHAR(64) DEFAULT '',
  player_a_score INT NOT NULL DEFAULT 0,
  player_b_score INT NOT NULL DEFAULT 0,
  entry_fee DECIMAL(18, 8) NOT NULL DEFAULT 0,
  reward_amount DECIMAL(18, 8) NOT NULL DEFAULT 0,
  platform_fee_rate DECIMAL(6, 4) NOT NULL DEFAULT 0,
  is_bot_room TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_battle_status_id (status, id),
  KEY idx_battle_players (player_a_uid, player_b_uid)
);

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
  'game',
  'operation_config',
  '游戏运营配置',
  JSON_OBJECT(
    'quickBattle',
    JSON_OBJECT(
      'enabled', true,
      'entryFee', 0,
      'platformFeeRate', 0.1,
      'botRewardsEnabled', false
    )
  ),
  'json',
  '控制报名费、平台抽成、机器人局奖励等正式运营参数',
  0,
  1
) ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  updated_at = CURRENT_TIMESTAMP;
