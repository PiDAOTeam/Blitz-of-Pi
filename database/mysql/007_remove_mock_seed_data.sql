USE blitzhashpi;

DELETE FROM wallet_ledgers WHERE uid = 'user_10001' OR uid = 'pi_mock-pi-user';
DELETE FROM wallets WHERE uid = 'user_10001' OR uid = 'pi_mock-pi-user';
DELETE FROM user_ranks WHERE uid = 'user_10001' OR uid = 'pi_mock-pi-user';
DELETE FROM users WHERE uid = 'user_10001' OR pi_user_id = 'mock-pi-user';
