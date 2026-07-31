const mysql = require("mysql2/promise");
const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_CONNECTION_LIMIT
} = require("../config");

let pool;
const RETRYABLE_TRANSACTION_CODES = new Set(["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"]);
const RETRYABLE_TRANSACTION_ERRNOS = new Set([1205, 1213]);
const DEFAULT_TRANSACTION_RETRIES = 6;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableTransactionError(error) {
  return (
    RETRYABLE_TRANSACTION_CODES.has(error?.code) ||
    RETRYABLE_TRANSACTION_ERRNOS.has(Number(error?.errno)) ||
    error?.sqlState === "40001"
  );
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: Math.max(10, Math.min(60, Number(MYSQL_CONNECTION_LIMIT || 20))),
      queueLimit: 0,
      charset: "utf8mb4"
    });
  }

  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function withNamedLock(name, callback, busyResult = null) {
  const connection = await getPool().getConnection();
  let locked = false;

  try {
    const [rows] = await connection.execute("SELECT GET_LOCK(?, 0) AS locked", [name]);
    locked = Number(rows[0]?.locked || 0) === 1;
    if (!locked) return busyResult;

    return await callback(connection);
  } finally {
    if (locked) {
      try {
        await connection.execute("SELECT RELEASE_LOCK(?) AS released", [name]);
      } catch (error) {
        console.error(`[mysql] failed to release named lock ${name}:`, error.message);
      }
    }
    connection.release();
  }
}

async function transaction(callback, options = {}) {
  const retries = Math.max(0, Number(options.retries ?? DEFAULT_TRANSACTION_RETRIES));
  const label = options.label || callback.name || "anonymous";
  let attempt = 0;

  while (true) {
    attempt += 1;
    try {
      return await runTransaction(callback);
    } catch (error) {
      if (attempt > retries || !isRetryableTransactionError(error)) {
        throw error;
      }

      const delayMs = Math.min(1200, 120 * attempt + Math.floor(Math.random() * 180));
      console.warn(
        `[mysql] retrying transaction ${label} after ${error.code || error.errno || "lock"} (${attempt}/${retries})`
      );
      await sleep(delayMs);
    }
  }
}

async function runTransaction(callback) {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  query,
  transaction,
  withNamedLock,
  isRetryableTransactionError
};
