const { StrKey } = require("@stellar/stellar-sdk");

function normalizeWithdrawWalletAddress(value) {
  return String(value || "").trim().replace(/\s+/g, "");
}

function inspectWithdrawWalletAddress(value) {
  const address = normalizeWithdrawWalletAddress(value);
  const warnings = [];

  if (!address) {
    return {
      address,
      valid: false,
      status: "invalid",
      message: "请填写 Pi 主网钱包地址",
      warnings
    };
  }

  if (!/^G[A-Z2-7]{55}$/.test(address)) {
    return {
      address,
      valid: false,
      status: "invalid_format",
      message: "钱包地址格式不正确，请填写 G 开头的 56 位主网地址",
      warnings
    };
  }

  if (!StrKey.isValidEd25519PublicKey(address)) {
    return {
      address,
      valid: false,
      status: "invalid_checksum",
      message: "钱包地址校验失败，请从 Pi Wallet 复制完整主网地址",
      warnings
    };
  }

  return {
    address,
    valid: true,
    status: "valid",
    message: "钱包地址格式正常",
    warnings
  };
}

module.exports = {
  normalizeWithdrawWalletAddress,
  inspectWithdrawWalletAddress
};
