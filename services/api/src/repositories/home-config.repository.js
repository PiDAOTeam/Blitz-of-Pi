const fs = require("node:fs");
const path = require("node:path");
const { query } = require("../db/mysql");

const HOME_CONFIG_FILE = path.resolve(
  __dirname,
  "../../../..",
  "data",
  "home-config.json"
);

const SUPPORTED_LOCALES = ["zh-CN", "en", "vi", "ko", "ja"];

const DEFAULT_HOME_CONFIG = {
  projectName: "Pi闪电战",
  englishName: "Blitz of Pi",
  localizedContent: {
    "zh-CN": {
      projectName: "Pi闪电战",
      englishName: "BLITZ OF PI",
      bannerDescription: "Pi Network首款PVP打金链游"
    },
    en: {
      projectName: "Blitz of Pi",
      englishName: "BLITZ OF PI",
      bannerDescription: "Real-time mobile match-3 battle game"
    },
    vi: {
      projectName: "Blitz of Pi",
      englishName: "BLITZ OF PI",
      bannerDescription: "Game ghép 3 PVP thời gian thực trên di động"
    },
    ko: {
      projectName: "Blitz of Pi",
      englishName: "BLITZ OF PI",
      bannerDescription: "실시간 모바일 매치3 PVP 게임"
    },
    ja: {
      projectName: "Blitz of Pi",
      englishName: "BLITZ OF PI",
      bannerDescription: "リアルタイム・モバイル3マッチPVPゲーム"
    }
  },
  heroButtons: [
    { code: "quick_battle", label: "快速开战" },
    { code: "points_battle", label: "小富豪" },
    { code: "poc_battle", label: "大富豪" },
    { code: "pi_battle", label: "超级富豪" }
  ],
  announcements: [],
  banners: []
};

function normalizeLocalizedContent(value = {}) {
  return SUPPORTED_LOCALES.reduce((acc, locale) => {
    const source = value?.[locale] || {};
    acc[locale] = {
      projectName: String(source.projectName || DEFAULT_HOME_CONFIG.localizedContent[locale]?.projectName || ""),
      englishName: String(source.englishName || DEFAULT_HOME_CONFIG.localizedContent[locale]?.englishName || ""),
      bannerDescription: String(source.bannerDescription || DEFAULT_HOME_CONFIG.localizedContent[locale]?.bannerDescription || "")
    };
    return acc;
  }, {});
}

function normalizeHomeConfig(value = {}) {
  return {
    ...DEFAULT_HOME_CONFIG,
    ...value,
    localizedContent: normalizeLocalizedContent(value.localizedContent),
    heroButtons: DEFAULT_HOME_CONFIG.heroButtons,
    announcements: [],
    banners: Array.isArray(value.banners) ? value.banners : []
  };
}

function readHomeConfigFromFile() {
  if (!fs.existsSync(HOME_CONFIG_FILE)) {
    return normalizeHomeConfig();
  }

  const raw = fs.readFileSync(HOME_CONFIG_FILE, "utf8");
  return normalizeHomeConfig(JSON.parse(raw));
}

function writeHomeConfigToFile(payload) {
  fs.mkdirSync(path.dirname(HOME_CONFIG_FILE), { recursive: true });
  fs.writeFileSync(HOME_CONFIG_FILE, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

async function readHomeConfig() {
  try {
    const rows = await query(
      "SELECT config_value FROM system_configs WHERE config_group = ? AND config_key = ? AND status = 1 LIMIT 1",
      ["home", "home_page_config"]
    );

    if (rows[0]?.config_value) {
      const value = typeof rows[0].config_value === "string"
        ? JSON.parse(rows[0].config_value)
        : rows[0].config_value;
      return normalizeHomeConfig(value);
    }
  } catch (error) {
    console.error("[home-config] MySQL read failed, fallback to file:", error.message);
  }

  return readHomeConfigFromFile();
}

async function writeHomeConfig(payload) {
  const normalizedPayload = normalizeHomeConfig(payload);

  try {
    writeHomeConfigToFile(normalizedPayload);
  } catch (error) {
    console.error("[home-config] file backup failed, continue with MySQL:", error.message);
  }

  try {
    await query(
      `INSERT INTO system_configs (
        config_group,
        config_key,
        config_name,
        config_value,
        value_type,
        description,
        is_public,
        status
      ) VALUES (?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        config_value = VALUES(config_value),
        updated_at = CURRENT_TIMESTAMP`,
      [
        "home",
        "home_page_config",
        "首页配置",
        JSON.stringify(normalizedPayload),
        "json",
        "用户端首页配置",
        1,
        1
      ]
    );
  } catch (error) {
    console.error("[home-config] MySQL write failed:", error.message);
    throw error;
  }

  return normalizedPayload;
}

module.exports = {
  readHomeConfig,
  writeHomeConfig
};
