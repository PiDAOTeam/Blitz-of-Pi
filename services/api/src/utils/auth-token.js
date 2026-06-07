const crypto = require("node:crypto");
const { SESSION_SECRET } = require("../config");

function signToken(scope, subject) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const issuedAt = Date.now();
  const safeSubject = Buffer.from(String(subject || ""), "utf8").toString("base64url");
  const body = `${scope}.${safeSubject}.${issuedAt}.${nonce}`;
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("hex");

  return `${body}.${signature}`;
}

function parseToken(token) {
  const parts = String(token || "").split(".");

  if (parts.length !== 5) {
    return null;
  }

  const [scope, subject, issuedAt, nonce, signature] = parts;
  const body = `${scope}.${subject}.${issuedAt}.${nonce}`;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("hex");

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  const valid =
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer);

  if (!valid) {
    return null;
  }

  return {
    scope,
    subject: Buffer.from(subject, "base64url").toString("utf8"),
    issuedAt: Number(issuedAt)
  };
}

function isValidToken(token) {
  return Boolean(parseToken(token));
}

module.exports = {
  signToken,
  isValidToken,
  parseToken
};
