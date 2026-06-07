USE blitzhashpi;

CREATE TABLE IF NOT EXISTS withdraw_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  uid VARCHAR(64) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  txid VARCHAR(128) DEFAULT NULL,
  remark VARCHAR(255) DEFAULT '',
  audit_remark VARCHAR(255) DEFAULT '',
  audited_by VARCHAR(64) DEFAULT '',
  audited_at DATETIME DEFAULT NULL,
  paid_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_withdraw_uid_id (uid, id),
  KEY idx_withdraw_status_id (status, id),
  UNIQUE KEY uk_withdraw_txid (txid)
);

CREATE TABLE IF NOT EXISTS admin_operation_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  admin_username VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  target_type VARCHAR(64) DEFAULT '',
  target_id VARCHAR(128) DEFAULT '',
  detail JSON DEFAULT NULL,
  ip VARCHAR(64) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_admin_log_admin_id (admin_username, id),
  KEY idx_admin_log_target (target_type, target_id)
);
