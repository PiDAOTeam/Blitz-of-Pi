const crypto = require("node:crypto");

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(String(password), salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(`scrypt$${salt}$${derivedKey.toString("hex")}`);
    });
  });
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.startsWith("scrypt$")) {
    return false;
  }

  const [, salt, hash] = storedHash.split("$");
  const nextHash = await hashPassword(password, salt);
  const next = Buffer.from(nextHash.split("$")[2], "hex");
  const current = Buffer.from(hash, "hex");

  if (next.length !== current.length) {
    return false;
  }

  return crypto.timingSafeEqual(next, current);
}

module.exports = {
  hashPassword,
  verifyPassword
};
