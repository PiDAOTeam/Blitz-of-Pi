const StellarSdk = require("@stellar/stellar-sdk");
const {
  PI_PAYOUT_HORIZON_URL,
  PI_PAYOUT_NETWORK_PASSPHRASE,
  PI_PAYOUT_SOURCE_SECRET,
  PI_PAYOUT_SOURCE_PUBLIC
} = require("../config");

function getSourceKeypair() {
  if (!PI_PAYOUT_SOURCE_SECRET) return null;
  return StellarSdk.Keypair.fromSecret(PI_PAYOUT_SOURCE_SECRET);
}

function getPayoutRuntimeStatus() {
  let derivedPublic = "";
  let sourceSecretValid = false;

  try {
    const keypair = getSourceKeypair();
    if (keypair) {
      derivedPublic = keypair.publicKey();
      sourceSecretValid = true;
    }
  } catch {
    derivedPublic = "";
    sourceSecretValid = false;
  }

  const configuredPublic = String(PI_PAYOUT_SOURCE_PUBLIC || "").trim();
  const effectivePublic = configuredPublic || derivedPublic;
  const sourcePublicValid = effectivePublic
    ? StellarSdk.StrKey.isValidEd25519PublicKey(effectivePublic)
    : false;
  const sourcePublicMatches = configuredPublic && derivedPublic ? configuredPublic === derivedPublic : true;

  return {
    horizonConfigured: Boolean(PI_PAYOUT_HORIZON_URL),
    sourceSecretConfigured: Boolean(PI_PAYOUT_SOURCE_SECRET),
    sourceSecretValid,
    sourcePublicConfigured: Boolean(effectivePublic),
    sourcePublicValid,
    sourcePublicMatches,
    sourcePublic: effectivePublic,
    networkPassphraseConfigured: Boolean(PI_PAYOUT_NETWORK_PASSPHRASE)
  };
}

function assertPayoutRuntimeReady() {
  const status = getPayoutRuntimeStatus();

  if (!status.horizonConfigured) {
    throw new Error("缺少 PI_PAYOUT_HORIZON_URL，自动出款未就绪");
  }

  if (!status.sourceSecretConfigured) {
    throw new Error("缺少 PI_PAYOUT_SOURCE_SECRET，自动出款未就绪");
  }

  if (!status.sourceSecretValid) {
    throw new Error("PI_PAYOUT_SOURCE_SECRET 格式不正确，自动出款未就绪");
  }

  if (!status.sourcePublicValid) {
    throw new Error("出款钱包公钥无效，自动出款未就绪");
  }

  if (!status.sourcePublicMatches) {
    throw new Error("PI_PAYOUT_SOURCE_PUBLIC 与私钥不匹配，自动出款未就绪");
  }

  if (!status.networkPassphraseConfigured) {
    throw new Error("缺少 PI_PAYOUT_NETWORK_PASSPHRASE，自动出款未就绪");
  }

  return status;
}

module.exports = {
  getSourceKeypair,
  getPayoutRuntimeStatus,
  assertPayoutRuntimeReady
};
