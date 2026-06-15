USE blitzhashpi;

-- user_ranks 字段由服务启动时的兼容迁移补齐，避免旧 MySQL 不支持 ADD COLUMN IF NOT EXISTS。

CREATE TABLE IF NOT EXISTS rank_monthly_season_settlements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  season_no VARCHAR(32) NOT NULL,
  uid VARCHAR(64) NOT NULL,
  rank_no INT NOT NULL,
  rank_key VARCHAR(32) NOT NULL,
  rank_name VARCHAR(32) NOT NULL,
  stars INT NOT NULL DEFAULT 0,
  win_count INT NOT NULL DEFAULT 0,
  lose_count INT NOT NULL DEFAULT 0,
  reward_points INT NOT NULL DEFAULT 0,
  reset_rank_key VARCHAR(32) NOT NULL DEFAULT 'bronze',
  reset_rank_name VARCHAR(32) NOT NULL DEFAULT '青铜',
  reset_stars INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_rank_monthly_season_uid (season_no, uid),
  KEY idx_rank_monthly_season_rank (season_no, rank_no)
);

CREATE TABLE IF NOT EXISTS rank_monthly_season_runs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  season_no VARCHAR(32) NOT NULL,
  reward_count INT NOT NULL DEFAULT 0,
  total_reward_points INT NOT NULL DEFAULT 0,
  reset_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_rank_monthly_run_season (season_no)
);
