USE blitzhashpi;

SET @has_pi_username := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'pi_username'
);
SET @sql := IF(
  @has_pi_username = 0,
  'ALTER TABLE users ADD COLUMN pi_username VARCHAR(64) DEFAULT '''' AFTER pi_user_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_avatar_key := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'avatar_key'
);
SET @sql := IF(
  @has_avatar_key = 0,
  'ALTER TABLE users ADD COLUMN avatar_key VARCHAR(32) NOT NULL DEFAULT ''avatar_1'' AFTER avatar_url',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE users
SET
  pi_username = CASE
    WHEN pi_username = '' OR pi_username IS NULL THEN nickname
    ELSE pi_username
  END,
  avatar_key = CASE
    WHEN avatar_key = '' OR avatar_key IS NULL THEN 'avatar_1'
    ELSE avatar_key
  END;

SET @has_pi_username_index := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'idx_users_pi_username'
);
SET @sql := IF(
  @has_pi_username_index = 0,
  'CREATE INDEX idx_users_pi_username ON users (pi_username)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
