USE blitzhashpi;

CREATE TABLE IF NOT EXISTS wallets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uid VARCHAR(64) NOT NULL UNIQUE,
  available_balance DECIMAL(18, 8) NOT NULL DEFAULT 0,
  locked_balance DECIMAL(18, 8) NOT NULL DEFAULT 0,
  total_recharge DECIMAL(18, 8) NOT NULL DEFAULT 0,
  total_withdraw DECIMAL(18, 8) NOT NULL DEFAULT 0,
  total_reward DECIMAL(18, 8) NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_wallet_uid (uid)
);

CREATE TABLE IF NOT EXISTS wallet_ledgers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uid VARCHAR(64) NOT NULL,
  type VARCHAR(32) NOT NULL,
  direction VARCHAR(8) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  balance_after DECIMAL(18, 8) NOT NULL,
  related_type VARCHAR(64) DEFAULT NULL,
  related_id VARCHAR(128) DEFAULT NULL,
  remark VARCHAR(255) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ledger_uid_id (uid, id),
  KEY idx_ledger_related (related_type, related_id),
  UNIQUE KEY uk_wallet_ledger_related (related_type, related_id)
);

CREATE TABLE IF NOT EXISTS payment_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  uid VARCHAR(64) NOT NULL,
  pi_payment_id VARCHAR(128) DEFAULT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  memo VARCHAR(255) DEFAULT '',
  metadata JSON DEFAULT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'created',
  txid VARCHAR(128) DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_payment_uid_id (uid, id),
  UNIQUE KEY uk_payment_pi_payment_id (pi_payment_id),
  UNIQUE KEY uk_payment_txid (txid),
  KEY idx_payment_status (status)
);

CREATE TABLE IF NOT EXISTS user_ranks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uid VARCHAR(64) NOT NULL UNIQUE,
  rank_score INT NOT NULL DEFAULT 1000,
  rank_name VARCHAR(32) NOT NULL DEFAULT '青铜',
  win_count INT NOT NULL DEFAULT 0,
  lose_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rank_match_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_no VARCHAR(64) NOT NULL UNIQUE,
  winner_uid VARCHAR(64) NOT NULL,
  loser_uid VARCHAR(64) NOT NULL,
  entry_fee DECIMAL(18, 8) NOT NULL DEFAULT 0,
  reward_amount DECIMAL(18, 8) NOT NULL DEFAULT 0,
  winner_score_delta INT NOT NULL DEFAULT 0,
  loser_score_delta INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_rank_match_users (winner_uid, loser_uid)
);

UPDATE system_configs
SET config_value = JSON_SET(
  config_value,
  '$.projectName',
  'Pi闪电战',
  '$.banners[0].title',
  'Pi闪电战'
)
WHERE config_group = 'home' AND config_key = 'home_page_config';
