USE blitzhashpi;

UPDATE admin_users
SET password_hash = 'scrypt$3096bb4fdd28ed250eee59ef23eca5a0$acc1dcb53023645038547f1914a50dd6d64d6dea2b39af6528c81fab5cda78a830c63f910f5416479e512c2a7dbfcde656c9b1014433c902a6f71f7d64656138',
    updated_at = NOW()
WHERE username = 'admin';
