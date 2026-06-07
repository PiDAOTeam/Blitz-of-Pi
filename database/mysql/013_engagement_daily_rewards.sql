CREATE TABLE IF NOT EXISTS engagement_daily_claims (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(64) NOT NULL,
  claim_date DATE NOT NULL,
  claim_type VARCHAR(32) NOT NULL,
  task_key VARCHAR(64) NOT NULL DEFAULT '',
  title VARCHAR(64) NOT NULL DEFAULT '',
  reward_amount DECIMAL(18,8) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'claimed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_engagement_claim_once (uid, claim_date, claim_type, task_key),
  KEY idx_engagement_claim_date_id (claim_date, id),
  KEY idx_engagement_claim_uid_id (uid, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
