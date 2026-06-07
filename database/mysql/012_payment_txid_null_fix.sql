USE blitzhashpi;

UPDATE payment_orders SET pi_payment_id = NULL WHERE pi_payment_id = '';
UPDATE payment_orders SET txid = NULL WHERE txid = '';

ALTER TABLE payment_orders
  MODIFY pi_payment_id VARCHAR(128) DEFAULT NULL,
  MODIFY txid VARCHAR(128) DEFAULT NULL;
