const { query } = require("../db/mysql");

function executor(connection) {
  return connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows])
  };
}

async function ensureWallet(uid, connection = null) {
  await executor(connection).execute(
    `INSERT INTO wallets (uid, available_balance, locked_balance, total_recharge, total_withdraw, total_reward)
     VALUES (?, 0, 0, 0, 0, 0)
     ON DUPLICATE KEY UPDATE uid = VALUES(uid)`,
    [uid]
  );

  const [rows] = await executor(connection).execute("SELECT * FROM wallets WHERE uid = ? LIMIT 1", [uid]);
  return rows[0];
}

async function getWallet(uid) {
  return ensureWallet(uid);
}

async function getWalletForUpdate(uid, connection) {
  await ensureWallet(uid, connection);
  const [rows] = await executor(connection).execute(
    "SELECT * FROM wallets WHERE uid = ? LIMIT 1 FOR UPDATE",
    [uid]
  );
  return rows[0];
}

async function addLedger({
  uid,
  type,
  direction,
  amount,
  balanceAfter,
  relatedType = null,
  relatedId = null,
  remark = "",
  connection = null
}) {
  await executor(connection).execute(
    `INSERT INTO wallet_ledgers
       (uid, type, direction, amount, balance_after, related_type, related_id, remark)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [uid, type, direction, amount, balanceAfter, relatedType || null, relatedId || null, remark]
  );
}

async function ledgerExists(relatedType, relatedId, connection = null) {
  if (!relatedType || !relatedId) {
    return false;
  }

  const [rows] = await executor(connection).execute(
    "SELECT id FROM wallet_ledgers WHERE related_type = ? AND related_id = ? LIMIT 1",
    [relatedType, relatedId]
  );

  return Boolean(rows[0]);
}

function getTotalFieldForMeta(meta) {
  if (meta.type === "recharge") return "total_recharge";
  if (meta.type === "reward") return "total_reward";
  return null;
}

async function increaseBalance(uid, amount, meta, connection = null) {
  if (meta?.relatedType && meta?.relatedId && (await ledgerExists(meta.relatedType, meta.relatedId, connection))) {
    return ensureWallet(uid, connection);
  }

  const wallet = connection ? await getWalletForUpdate(uid, connection) : await ensureWallet(uid);
  const nextBalance = Number(wallet.available_balance) + Number(amount);

  const totalField = getTotalFieldForMeta(meta);

  if (totalField) {
    await executor(connection).execute(
      `UPDATE wallets
       SET available_balance = ?, ${totalField} = ${totalField} + ?
       WHERE uid = ?`,
      [nextBalance, amount, uid]
    );
  } else {
    await executor(connection).execute("UPDATE wallets SET available_balance = ? WHERE uid = ?", [
      nextBalance,
      uid
    ]);
  }

  await addLedger({
    uid,
    type: meta.type,
    direction: "in",
    amount,
    balanceAfter: nextBalance,
    relatedType: meta.relatedType,
    relatedId: meta.relatedId,
    remark: meta.remark,
    connection
  });

  return connection ? ensureWallet(uid, connection) : getWallet(uid);
}

async function decreaseBalance(uid, amount, meta, connection = null) {
  if (meta?.relatedType && meta?.relatedId && (await ledgerExists(meta.relatedType, meta.relatedId, connection))) {
    return ensureWallet(uid, connection);
  }

  const wallet = connection ? await getWalletForUpdate(uid, connection) : await ensureWallet(uid);
  const current = Number(wallet.available_balance);

  if (current < Number(amount)) {
    throw new Error("钱包余额不足");
  }

  const nextBalance = current - Number(amount);

  await executor(connection).execute("UPDATE wallets SET available_balance = ? WHERE uid = ?", [nextBalance, uid]);

  await addLedger({
    uid,
    type: meta.type,
    direction: "out",
    amount,
    balanceAfter: nextBalance,
    relatedType: meta.relatedType,
    relatedId: meta.relatedId,
    remark: meta.remark,
    connection
  });

  return connection ? ensureWallet(uid, connection) : getWallet(uid);
}

async function lockBalance(uid, amount, meta, connection = null) {
  if (meta?.relatedType && meta?.relatedId && (await ledgerExists(meta.relatedType, meta.relatedId, connection))) {
    return ensureWallet(uid, connection);
  }

  const wallet = connection ? await getWalletForUpdate(uid, connection) : await ensureWallet(uid);
  const current = Number(wallet.available_balance);

  if (current < Number(amount)) {
    throw new Error("钱包余额不足");
  }

  const nextAvailable = current - Number(amount);
  const nextLocked = Number(wallet.locked_balance) + Number(amount);

  await executor(connection).execute(
    "UPDATE wallets SET available_balance = ?, locked_balance = ? WHERE uid = ?",
    [nextAvailable, nextLocked, uid]
  );

  await addLedger({
    uid,
    type: meta.type,
    direction: "lock",
    amount,
    balanceAfter: nextAvailable,
    relatedType: meta.relatedType,
    relatedId: meta.relatedId,
    remark: meta.remark,
    connection
  });

  return connection ? ensureWallet(uid, connection) : getWallet(uid);
}

async function unlockBalance(uid, amount, meta, connection = null) {
  if (meta?.relatedType && meta?.relatedId && (await ledgerExists(meta.relatedType, meta.relatedId, connection))) {
    return ensureWallet(uid, connection);
  }

  const wallet = connection ? await getWalletForUpdate(uid, connection) : await ensureWallet(uid);
  const currentLocked = Number(wallet.locked_balance);

  if (currentLocked < Number(amount)) {
    throw new Error("冻结余额不足");
  }

  const nextAvailable = Number(wallet.available_balance) + Number(amount);
  const nextLocked = currentLocked - Number(amount);

  await executor(connection).execute(
    "UPDATE wallets SET available_balance = ?, locked_balance = ? WHERE uid = ?",
    [nextAvailable, nextLocked, uid]
  );

  await addLedger({
    uid,
    type: meta.type,
    direction: "unlock",
    amount,
    balanceAfter: nextAvailable,
    relatedType: meta.relatedType,
    relatedId: meta.relatedId,
    remark: meta.remark,
    connection
  });

  return connection ? ensureWallet(uid, connection) : getWallet(uid);
}

async function consumeLockedBalance(uid, amount, meta, connection = null) {
  if (meta?.relatedType && meta?.relatedId && (await ledgerExists(meta.relatedType, meta.relatedId, connection))) {
    return ensureWallet(uid, connection);
  }

  const wallet = connection ? await getWalletForUpdate(uid, connection) : await ensureWallet(uid);
  const currentLocked = Number(wallet.locked_balance);

  if (currentLocked < Number(amount)) {
    throw new Error("冻结余额不足");
  }

  const nextLocked = currentLocked - Number(amount);

  await executor(connection).execute(
    "UPDATE wallets SET locked_balance = ?, total_withdraw = total_withdraw + ? WHERE uid = ?",
    [nextLocked, amount, uid]
  );

  await addLedger({
    uid,
    type: meta.type,
    direction: "out",
    amount,
    balanceAfter: Number(wallet.available_balance),
    relatedType: meta.relatedType,
    relatedId: meta.relatedId,
    remark: meta.remark,
    connection
  });

  return connection ? ensureWallet(uid, connection) : getWallet(uid);
}

async function listLedgers(uid, limit = 30) {
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 30));

  return query(
    `SELECT id, uid, type, direction, amount, balance_after, related_type, related_id, remark, created_at
     FROM wallet_ledgers
     WHERE uid = ?
     ORDER BY id DESC
     LIMIT ${safeLimit}`,
    [uid]
  );
}

module.exports = {
  getWallet,
  getWalletForUpdate,
  increaseBalance,
  decreaseBalance,
  lockBalance,
  unlockBalance,
  consumeLockedBalance,
  listLedgers,
  addLedger
};
