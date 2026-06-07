USE blitzhashpi;

SET @has_profile_completed := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'profile_completed'
);
SET @sql := IF(
  @has_profile_completed = 0,
  'ALTER TABLE users ADD COLUMN profile_completed TINYINT NOT NULL DEFAULT 1 AFTER avatar_key',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE users
SET profile_completed = 1
WHERE profile_completed IS NULL;
