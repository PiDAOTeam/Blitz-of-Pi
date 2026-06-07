USE blitzhashpi;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'withdraw_orders' AND column_name = 'fee_amount'
);
SET @sql := IF(@column_exists = 0, 'ALTER TABLE withdraw_orders ADD COLUMN fee_amount DECIMAL(18, 8) NOT NULL DEFAULT 0 AFTER amount', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'withdraw_orders' AND column_name = 'payout_amount'
);
SET @sql := IF(@column_exists = 0, 'ALTER TABLE withdraw_orders ADD COLUMN payout_amount DECIMAL(18, 8) NOT NULL DEFAULT 0 AFTER fee_amount', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'withdraw_orders' AND column_name = 'wallet_check_status'
);
SET @sql := IF(@column_exists = 0, 'ALTER TABLE withdraw_orders ADD COLUMN wallet_check_status VARCHAR(32) NOT NULL DEFAULT ''unchecked'' AFTER wallet_address', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'withdraw_orders' AND column_name = 'wallet_check_message'
);
SET @sql := IF(@column_exists = 0, 'ALTER TABLE withdraw_orders ADD COLUMN wallet_check_message VARCHAR(255) DEFAULT '''' AFTER wallet_check_status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'withdraw_orders' AND column_name = 'auto_payout_status'
);
SET @sql := IF(@column_exists = 0, 'ALTER TABLE withdraw_orders ADD COLUMN auto_payout_status VARCHAR(32) NOT NULL DEFAULT ''manual_review'' AFTER wallet_check_message', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'withdraw_orders' AND column_name = 'auto_payout_eligible'
);
SET @sql := IF(@column_exists = 0, 'ALTER TABLE withdraw_orders ADD COLUMN auto_payout_eligible TINYINT(1) NOT NULL DEFAULT 0 AFTER auto_payout_status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'withdraw_orders' AND column_name = 'auto_payout_attempts'
);
SET @sql := IF(@column_exists = 0, 'ALTER TABLE withdraw_orders ADD COLUMN auto_payout_attempts INT NOT NULL DEFAULT 0 AFTER auto_payout_eligible', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'withdraw_orders' AND column_name = 'auto_payout_error'
);
SET @sql := IF(@column_exists = 0, 'ALTER TABLE withdraw_orders ADD COLUMN auto_payout_error VARCHAR(500) DEFAULT '''' AFTER auto_payout_attempts', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'withdraw_orders'
    AND index_name = 'idx_withdraw_auto_payout'
);
SET @sql := IF(
  @index_exists = 0,
  'CREATE INDEX idx_withdraw_auto_payout ON withdraw_orders (status, auto_payout_status, auto_payout_eligible, id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE withdraw_orders
SET payout_amount = amount
WHERE payout_amount = 0;

CREATE TABLE IF NOT EXISTS user_withdraw_wallets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uid VARCHAR(64) NOT NULL,
  wallet_address VARCHAR(64) NOT NULL,
  label VARCHAR(40) NOT NULL DEFAULT 'Pi 主网钱包',
  use_count INT NOT NULL DEFAULT 0,
  last_used_at DATETIME DEFAULT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_withdraw_wallet (uid, wallet_address),
  KEY idx_user_withdraw_wallet_last_used (uid, status, last_used_at)
);
