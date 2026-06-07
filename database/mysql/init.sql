CREATE DATABASE IF NOT EXISTS blitzhashpi
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE blitzhashpi;

CREATE TABLE IF NOT EXISTS system_configs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  config_group VARCHAR(64) NOT NULL,
  config_key VARCHAR(128) NOT NULL,
  config_name VARCHAR(128) NOT NULL,
  config_value JSON NOT NULL,
  value_type VARCHAR(32) NOT NULL DEFAULT 'json',
  description VARCHAR(255) DEFAULT '',
  is_public TINYINT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_config_group_key (config_group, config_key)
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
  'home',
  'home_page_config',
  '首页配置',
  JSON_OBJECT(
    'projectName', 'Pi闪电战',
    'englishName', 'Blitz of Pi',
    'heroButtons', JSON_ARRAY(
      JSON_OBJECT('code', 'quick_battle', 'label', '快速开战'),
      JSON_OBJECT('code', 'points_battle', 'label', '小富豪'),
      JSON_OBJECT('code', 'poc_battle', 'label', '大富豪'),
      JSON_OBJECT('code', 'pi_battle', 'label', '超级富豪')
    ),
    'announcements', JSON_ARRAY(
      JSON_OBJECT(
        'id', 1,
        'title', '欢迎来到 Pi闪电战',
        'summary', '快速开战免费练手，小富豪使用积分，大富豪使用 POC，超级富豪使用 Pi。'
      )
    ),
    'banners', JSON_ARRAY(
      JSON_OBJECT(
        'id', 1,
        'title', 'Pi闪电战',
        'subtitle', 'Blitz of Pi',
        'description', '移动端实时消除对战游戏'
      )
    )
  ),
  'json',
  '用户端首页配置',
  1,
  1
) ON DUPLICATE KEY UPDATE
  config_name = VALUES(config_name),
  config_value = VALUES(config_value),
  description = VALUES(description),
  is_public = VALUES(is_public),
  status = VALUES(status);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uid VARCHAR(64) NOT NULL UNIQUE,
  pi_user_id VARCHAR(128) DEFAULT NULL,
  pi_username VARCHAR(64) DEFAULT '',
  nickname VARCHAR(64) NOT NULL,
  avatar_url VARCHAR(255) DEFAULT '',
  avatar_key VARCHAR(32) NOT NULL DEFAULT 'avatar_1',
  profile_completed TINYINT NOT NULL DEFAULT 1,
  rank_name VARCHAR(32) NOT NULL DEFAULT '青铜',
  status TINYINT NOT NULL DEFAULT 1,
  last_login_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_pi_user_id (pi_user_id)
);

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
