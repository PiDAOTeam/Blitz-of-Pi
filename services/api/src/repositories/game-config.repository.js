const { query } = require("../db/mysql");
const { redisSet } = require("../db/redis");

const REALTIME_CONFIG_REDIS_KEY = "blitz:realtime:config";
const SUPPORTED_BATTLE_MODES = [
  "quick_battle",
  "points_battle",
  "poc_battle",
  "pi_battle",
  "ticket_battle",
  "rich_battle"
];
const DEFAULT_RANKED_MODES = ["points_battle", "poc_battle", "pi_battle"];
const DEFAULT_ENGAGEMENT_TASK_MODES = ["points_battle", "poc_battle", "pi_battle"];
const DEFAULT_POINTS_BOT_NAME_POOL = [
  "星河玩家", "闪电高手", "三消达人", "幸运玩家", "连击王者",
  "风暴选手", "金芒玩家", "极速挑战者", "甜心玩家", "不服再战",
  "追光少年", "彩虹棋手", "闪耀小星", "爆消大师", "雷霆玩家",
  "清风过关", "星火连击", "快乐消消", "金色闪电", "稳稳上分",
  "满分冲刺", "小宇宙", "彩糖高手", "电光一闪", "胜利微笑",
  "蓝海玩家", "紫晶骑士", "红心挑战", "绿野高手", "橙光勇者",
  "晨光选手", "夜空旅人", "晴天玩家", "好运连连", "小小冠军",
  "闪电先锋", "宝石猎人", "飞速消除", "甜蜜连线", "星愿玩家",
  "黄金手速", "稳健棋手", "开心赢家", "能量满格", "一路高分",
  "圆梦玩家", "微风选手", "光速滑动", "连胜小将", "高分伙伴",
  "星辰大海", "快乐高手", "幸运之星", "闪闪发光", "破局达人",
  "紫电玩家", "糖果猎手", "王牌选手", "稳如磐石", "冲榜达人",
  "闪耀达人", "轻松过关", "火花玩家", "节奏大师", "超能棋手",
  "梦想玩家", "明亮星光", "连击小能手", "宝藏玩家", "勇敢挑战",
  "金牌选手", "闪电伙伴", "彩石玩家", "蓝焰高手", "星月同辉",
  "快乐冲锋", "灵巧手指", "幸运挑战", "满能玩家", "胜利之光",
  "甜橙玩家", "绿光旅人", "蓝莓高手", "紫霞玩家", "红宝挑战",
  "开心连消", "星光猎手", "神速玩家", "热血棋手", "高能时刻",
  "轻快选手", "稳准高手", "闪击玩家", "奇迹连击", "闪耀冠军",
  "顺风玩家", "彩云选手", "金风玩家", "银月高手", "火焰挑战",
  "绿洲玩家", "蓝星旅人", "紫藤高手", "红枫玩家", "橙子选手",
  "星际玩家", "流光高手", "飞扬棋手", "高分冲击", "幸运一击",
  "快乐出发", "轻盈滑动", "闪亮登场", "稳步前进", "连消高手",
  "彩虹冲刺", "金光玩家", "能量选手", "活力玩家", "胜利冲锋",
  "星河闪耀", "雷光棋手", "闪电冲刺", "糖心玩家", "宝石之光",
  "小小闪电", "高能玩家", "欢乐棋手", "幸运高手", "满屏连击",
  "星光冲榜", "黄金挑战", "快乐上分", "神奇手速", "闪耀对手",
  "风驰玩家", "电掣高手", "彩石达人", "金牌伙伴", "开心挑战",
  "晴空玩家", "月光棋手", "晨星高手", "火力全开", "连胜伙伴",
  "高分之路", "甜蜜高手", "能量冲刺", "星火达人", "闪电连线",
  "轻松赢家", "好运选手", "快乐闪击", "宝石玩家", "彩光挑战",
  "星云高手", "雷霆冲榜", "金色伙伴", "紫光玩家", "蓝钻高手",
  "红钻玩家", "绿宝选手", "橙星挑战", "飞星玩家", "闪亮棋手",
  "快乐冠军", "小胜一局", "连击风暴", "高分雷达", "星光小将",
  "黄金指尖", "彩虹小队", "闪电小队", "幸运连线", "甜心高手",
  "追风玩家", "破风选手", "光芒棋手", "暖阳玩家", "星辉挑战",
  "闪耀出击", "连消小王", "能量小站", "胜利节奏", "彩糖冲刺",
  "极速高手", "稳赢玩家", "快乐对局", "星河冲锋", "金芒高手",
  "流星玩家", "星愿高手", "飞光挑战", "小小赢家", "闪电时刻",
  "宝石冲锋", "彩色心情", "热力玩家", "高能连消", "胜利玩家"
];

const DEFAULT_GAME_CONFIG = {
  "quickBattle": {
    "key": "quick_battle",
    "name": "快速开战",
    "assetType": "FREE",
    "enabled": true,
    "entryFee": 0,
    "platformFeeRate": 0,
    "rewardRate": 0,
    "botMatchEnabled": true,
    "botRewardsEnabled": false
  },
  "ticketBattle": {
    "key": "ticket_battle",
    "name": "超级富豪（Pi）",
    "assetType": "PI",
    "enabled": true,
    "entryFee": 0.3,
    "platformFeeRate": 0.3,
    "rewardRate": 0.7,
    "botMatchEnabled": false,
    "botRewardsEnabled": false
  },
  "richBattle": {
    "key": "rich_battle",
    "name": "超级富豪（Pi）",
    "assetType": "PI",
    "enabled": true,
    "entryFee": 1,
    "platformFeeRate": 0.3,
    "rewardRate": 0.7,
    "botMatchEnabled": false,
    "botRewardsEnabled": false
  },
  "pointsBattle": {
    "key": "points_battle",
    "name": "小富豪",
    "assetType": "POINTS",
    "enabled": true,
    "entryFee": 10,
    "platformFeeRate": 0.3,
    "rewardRate": 0.7,
    "botMatchEnabled": true,
    "botRewardsEnabled": true,
    "botFallbackSeconds": 15,
    "botDifficulty": "normal",
    "botDifficultyRanges": {
      "easy": {
        "minScore": 1800,
        "maxScore": 2600,
        "moveIntervalSeconds": 1.5
      },
      "normal": {
        "minScore": 2600,
        "maxScore": 3600,
        "moveIntervalSeconds": 1.2
      },
      "hard": {
        "minScore": 3600,
        "maxScore": 4600,
        "moveIntervalSeconds": 1
      },
      "expert": {
        "minScore": 4600,
        "maxScore": 5600,
        "moveIntervalSeconds": 0.85
      }
    },
    "botNamePool": [
      "星河玩家",
      "闪电高手",
      "三消达人",
      "幸运玩家",
      "连击王者",
      "风暴选手",
      "金芒玩家",
      "极速挑战者",
      "甜心玩家",
      "不服再战",
      "追光少年",
      "彩虹棋手",
      "闪耀小星",
      "爆消大师",
      "雷霆玩家",
      "清风过关",
      "星火连击",
      "快乐消消",
      "金色闪电",
      "稳稳上分",
      "满分冲刺",
      "小宇宙",
      "彩糖高手",
      "电光一闪",
      "胜利微笑",
      "蓝海玩家",
      "紫晶骑士",
      "红心挑战",
      "绿野高手",
      "橙光勇者",
      "晨光选手",
      "夜空旅人",
      "晴天玩家",
      "好运连连",
      "小小冠军",
      "闪电先锋",
      "宝石猎人",
      "飞速消除",
      "甜蜜连线",
      "星愿玩家",
      "黄金手速",
      "稳健棋手",
      "开心赢家",
      "能量满格",
      "一路高分",
      "圆梦玩家",
      "微风选手",
      "光速滑动",
      "连胜小将",
      "高分伙伴",
      "星辰大海",
      "快乐高手",
      "幸运之星",
      "闪闪发光",
      "破局达人",
      "紫电玩家",
      "糖果猎手",
      "王牌选手",
      "稳如磐石",
      "冲榜达人",
      "闪耀达人",
      "轻松过关",
      "火花玩家",
      "节奏大师",
      "超能棋手",
      "梦想玩家",
      "明亮星光",
      "连击小能手",
      "宝藏玩家",
      "勇敢挑战",
      "金牌选手",
      "闪电伙伴",
      "彩石玩家",
      "蓝焰高手",
      "星月同辉",
      "快乐冲锋",
      "灵巧手指",
      "幸运挑战",
      "满能玩家",
      "胜利之光",
      "甜橙玩家",
      "绿光旅人",
      "蓝莓高手",
      "紫霞玩家",
      "红宝挑战",
      "开心连消",
      "星光猎手",
      "神速玩家",
      "热血棋手",
      "高能时刻",
      "轻快选手",
      "稳准高手",
      "闪击玩家",
      "奇迹连击",
      "闪耀冠军",
      "顺风玩家",
      "彩云选手",
      "金风玩家",
      "银月高手",
      "火焰挑战",
      "绿洲玩家",
      "蓝星旅人",
      "紫藤高手",
      "红枫玩家",
      "橙子选手",
      "星际玩家",
      "流光高手",
      "飞扬棋手",
      "高分冲击",
      "幸运一击",
      "快乐出发",
      "轻盈滑动",
      "闪亮登场",
      "稳步前进",
      "连消高手",
      "彩虹冲刺",
      "金光玩家",
      "能量选手",
      "活力玩家",
      "胜利冲锋",
      "星河闪耀",
      "雷光棋手",
      "闪电冲刺",
      "糖心玩家",
      "宝石之光",
      "小小闪电",
      "高能玩家",
      "欢乐棋手",
      "幸运高手",
      "满屏连击",
      "星光冲榜",
      "黄金挑战",
      "快乐上分",
      "神奇手速",
      "闪耀对手",
      "风驰玩家",
      "电掣高手",
      "彩石达人",
      "金牌伙伴",
      "开心挑战",
      "晴空玩家",
      "月光棋手",
      "晨星高手",
      "火力全开",
      "连胜伙伴",
      "高分之路",
      "甜蜜高手",
      "能量冲刺",
      "星火达人",
      "闪电连线",
      "轻松赢家",
      "好运选手",
      "快乐闪击",
      "宝石玩家",
      "彩光挑战",
      "星云高手",
      "雷霆冲榜",
      "金色伙伴",
      "紫光玩家",
      "蓝钻高手",
      "红钻玩家",
      "绿宝选手",
      "橙星挑战",
      "飞星玩家",
      "闪亮棋手",
      "快乐冠军",
      "小胜一局",
      "连击风暴",
      "高分雷达",
      "星光小将",
      "黄金指尖",
      "彩虹小队",
      "闪电小队",
      "幸运连线",
      "甜心高手",
      "追风玩家",
      "破风选手",
      "光芒棋手",
      "暖阳玩家",
      "星辉挑战",
      "闪耀出击",
      "连消小王",
      "能量小站",
      "胜利节奏",
      "彩糖冲刺",
      "极速高手",
      "稳赢玩家",
      "快乐对局",
      "星河冲锋",
      "金芒高手",
      "流星玩家",
      "星愿高手",
      "飞光挑战",
      "小小赢家",
      "闪电时刻",
      "宝石冲锋",
      "彩色心情",
      "热力玩家",
      "高能连消",
      "胜利玩家"
    ],
    "botCountInRank": true,
    "botCountInWeekly": true,
    "botCountInWatchShareholder": true
  },
  "pocBattle": {
    "key": "poc_battle",
    "name": "大富豪",
    "assetType": "POC",
    "enabled": true,
    "entryFee": 1,
    "platformFeeRate": 0.3,
    "rewardRate": 0.7,
    "botMatchEnabled": false,
    "botRewardsEnabled": false
  },
  "piBattle": {
    "key": "pi_battle",
    "name": "超级富豪",
    "assetType": "PI",
    "enabled": true,
    "entryFee": 1,
    "platformFeeRate": 0.3,
    "rewardRate": 0.7,
    "botMatchEnabled": false,
    "botRewardsEnabled": false
  },
  "assetGateway": {
    "enabled": true,
    "summaryEnabled": true,
    "pointsEnabled": true,
    "pocEnabled": true,
    "grayUserPiUids": [],
    "grayUserPiUsernames": [],
    "opsNote": "小富豪使用积分，大富豪使用POC；积分门票只能填写整数。"
  },
  "timing": {
    "quickBotFallbackSeconds": 25,
    "matchCancelWaitSeconds": 20,
    "matchCancelCooldownSeconds": 2,
    "waitingReadyTimeoutSeconds": 30,
    "vsIntroSeconds": 3,
    "readyCountdownSeconds": 5,
    "quickRoundSeconds": 90,
    "paidRoundSeconds": 120,
    "botMoveIntervalSeconds": 2.6
  },
  "capacity": {
    "maxActiveRooms": 500,
    "maxQueueLengthPerMode": 2000,
    "realtimeMaxConnectionsPerInstance": 1200,
    "realtimeMaxConnectionsPerUser": 2,
    "realtimeHeartbeatSeconds": 25,
    "realtimeIdleTimeoutSeconds": 90,
    "realtimeMaxPayloadBytes": 2048
  },
  "extremeRealtime": {
    "enabled": true,
    "rollbackToLegacy": false,
    "enabledModes": [
      "quick_battle",
      "points_battle",
      "poc_battle",
      "pi_battle"
    ],
    "grayPercent": 100,
    "grayUserPiUids": [],
    "grayUserPiUsernames": [],
    "maxPendingSwaps": 3,
    "snapshotIntervalMs": 2000,
    "swapMinIntervalMs": 120,
    "metricsSampleRate": 0.05
  },
  "withdrawRisk": {
    "minAmount": 0.1,
    "dailyLimitAmount": 200,
    "feeRate": 0.05,
    "manualReviewAmount": 50,
    "autoPayoutEnabled": false,
    "autoApproveEnabled": false,
    "autoPayoutMaxAmount": 0,
    "autoPayoutDailyLimitAmount": 0,
    "maxRetryCount": 0,
    "walletValidationRequired": true,
    "payoutChannel": "stellar_direct"
  },
  "rechargeBonus": {
    "enabled": true,
    "bonusRate": 0,
    "maxBonusAmount": 0,
    "presets": [
      {
        "amount": 50,
        "bonusAmount": 0.5,
        "label": "送0.5",
        "enabled": true
      },
      {
        "amount": 100,
        "bonusAmount": 1,
        "label": "送1",
        "enabled": true
      },
      {
        "amount": 200,
        "bonusAmount": 2,
        "label": "送2",
        "enabled": true
      },
      {
        "amount": 500,
        "bonusAmount": 10,
        "label": "送10",
        "enabled": true
      }
    ]
  },
  "transfer": {
    "enabled": true,
    "minAmount": 0.01,
    "maxAmount": 20,
    "dailyLimitAmount": 50,
    "feeRate": 0,
    "feeMinAmount": 0,
    "cooldownSeconds": 10
  },
  "inviteRewards": {
    "enabled": true,
    "bindEnabled": true,
    "bindRequiredEnabled": true,
    "bindRequiredAfterBattles": 5,
    "bindRequiredModes": [
      "quick_battle",
      "points_battle",
      "poc_battle",
      "pi_battle"
    ],
    "officialInviterPiUsername": "",
    "bindRequiredMessage": "请先绑定邀请人，再继续对战。",
    "qualificationEnabled": true,
    "qualificationRequiredBattles": 2,
    "qualificationRewardAmount": 0.02,
    "battleCommissionEnabled": true,
    "piCommissionEnabled": true,
    "pointsCommissionEnabled": true,
    "pocCommissionEnabled": true,
    "botCommissionEnabled": false,
    "commissionModes": [
      "points_battle",
      "poc_battle",
      "pi_battle"
    ],
    "pointsRoundMode": "floor",
    "commissionBase": "entry_fee",
    "maxCommissionRate": 0.2,
    "levels": [
      {
        "key": "starter",
        "name": "闪电伙伴",
        "commissionRate": 0.03,
        "minBalance": 0,
        "minDirectInvites": 0,
        "enabled": true
      },
      {
        "key": "silver",
        "name": "银牌队长",
        "commissionRate": 0.05,
        "minBalance": 5,
        "minDirectInvites": 5,
        "enabled": true
      },
      {
        "key": "gold",
        "name": "金牌队长",
        "commissionRate": 0.08,
        "minBalance": 20,
        "minDirectInvites": 20,
        "enabled": true
      }
    ]
  },
  "engagement": {
    "enabled": true,
    "dailySignIn": {
      "enabled": true,
      "title": "每日签到",
      "piRewardEnabled": true,
      "rewardAmount": 0.01,
      "pointsRewardEnabled": true,
      "pointsRewardAmount": 2,
      "pocRewardEnabled": false,
      "pocRewardAmount": 0
    },
    "tasks": [
      {
        "key": "play_1",
        "title": "完成1局",
        "condition": "battle_count",
        "requiredCount": 1,
        "rewardAmount": 0.01,
        "enabled": true,
        "modes": [
          "points_battle",
          "poc_battle",
          "pi_battle"
        ]
      },
      {
        "key": "play_3",
        "title": "完成3局",
        "condition": "battle_count",
        "requiredCount": 3,
        "rewardAmount": 0.02,
        "enabled": true,
        "modes": [
          "points_battle",
          "poc_battle",
          "pi_battle"
        ]
      },
      {
        "key": "win_1",
        "title": "赢1局",
        "condition": "win_count",
        "requiredCount": 1,
        "rewardAmount": 0.02,
        "enabled": true,
        "modes": [
          "points_battle",
          "poc_battle",
          "pi_battle"
        ]
      }
    ]
  },
  "watchShareholder": {
    "enabled": true,
    "frontendEntryEnabled": true,
    "autoSettleEnabled": true,
    "shareRate": 0.5,
    "minRewardPoints": 1,
    "subsidyEnabled": true,
    "subsidyPointsPerUser": 10,
    "sourceMode": "points_battle",
    "settlementText": "周一结算",
    "title": "腕表节点股东分红",
    "subtitle": "每周可领分红"
  },
  "visualEffects": {
    "defaultMode": "balanced",
    "piBrowserDefaultMode": "balanced",
    "allowUserChoice": true,
    "allowHighMode": true,
    "autoDowngradeEnabled": true,
    "dragTrailEnabled": true,
    "hapticEnabled": true,
    "soundEnabled": true,
    "soundVolume": 1.5,
    "bgmEnabled": true,
    "bgmVolume": 1,
    "attackWarningEnabled": true,
    "attackWarningText": "被攻击 压力+{attack}",
    "animationDurations": {
      "localBurstSeconds": 1.08,
      "localBurstHighSeconds": 1.26,
      "serverBurstSeconds": 1.18,
      "serverBurstHighSeconds": 1.28,
      "lowPerformanceBurstSeconds": 0.9,
      "boardEffectSeconds": 0.24,
      "boardEffectHighSeconds": 0.34,
      "tileBurstSeconds": 0.28,
      "tileBurstHighSeconds": 0.38,
      "tileFallSeconds": 0.22,
      "tileFallHighSeconds": 0.28,
      "localSwapSeconds": 0.15,
      "invalidSwapSeconds": 0.2,
      "serverSettleSeconds": 0.16,
      "impactSeconds": 0.72,
      "impactHighSeconds": 0.92,
      "pressureHitSeconds": 0.72,
      "boardUnderAttackSeconds": 0.58,
      "attackLineSeconds": 0.78,
      "hitWarningSeconds": 0.92
    }
  },
  "operation": {
    "maintenanceEnabled": false,
    "maintenanceNotice": "",
    "nicknameMinLength": 2,
    "nicknameMaxLength": 12,
    "nicknamePattern": "中文、英文、数字均可，禁止特殊符号和敏感词",
    "localizedContent": {
      "zh-CN": {
        "maintenanceNotice": "",
        "rechargeNotice": "请输入充值 Pi 数量，支付完成后会写入平台钱包流水。",
        "withdrawNotice": "提交后余额会先冻结，等待平台后台审核与打款。",
        "ruleSummary": "小富豪、大富豪、超级富豪计入段位和周榜。"
      },
      "en": {
        "maintenanceNotice": "",
        "rechargeNotice": "Enter the Pi amount. The platform wallet ledger updates after payment.",
        "withdrawNotice": "After submission, the balance is locked until admin review and payout.",
        "ruleSummary": "Quick Battle is for practice. Paid real-player rooms are better for ranking."
      },
      "vi": {
        "maintenanceNotice": "",
        "rechargeNotice": "Nhập số Pi cần nạp. Ví sẽ cập nhật sau khi thanh toán.",
        "withdrawNotice": "Sau khi gửi, số dư sẽ bị khóa để chờ xét duyệt và thanh toán.",
        "ruleSummary": "Đấu nhanh dùng để luyện tập. Phòng trả phí phù hợp hơn để leo hạng."
      },
      "ko": {
        "maintenanceNotice": "",
        "rechargeNotice": "충전할 Pi 수량을 입력하세요. 결제 후 지갑 내역이 업데이트됩니다.",
        "withdrawNotice": "제출 후 잔액은 관리자 검토와 지급 전까지 잠깁니다.",
        "ruleSummary": "빠른 대전은 연습용입니다. 유료 실시간 방이 랭크 상승에 더 적합합니다."
      },
      "ja": {
        "maintenanceNotice": "",
        "rechargeNotice": "チャージする Pi 数量を入力してください。支払い後にウォレット履歴へ反映されます。",
        "withdrawNotice": "申請後、残高は審査と支払い完了までロックされます。",
        "ruleSummary": "クイック対戦は練習用です。ランク上げには有料の対人ルームが適しています。"
      }
    },
    "bannedWords": [],
    "banReasons": [
      "异常刷分",
      "恶意退款",
      "多账号套利",
      "昵称违规",
      "疑似作弊"
    ],
    "avatars": [
      {
        "key": "avatar_1",
        "name": "闪电红",
        "enabled": true
      },
      {
        "key": "avatar_2",
        "name": "金币橙",
        "enabled": true
      },
      {
        "key": "avatar_3",
        "name": "翡翠绿",
        "enabled": true
      },
      {
        "key": "avatar_4",
        "name": "海浪蓝",
        "enabled": true
      },
      {
        "key": "avatar_5",
        "name": "星夜灰",
        "enabled": true
      },
      {
        "key": "avatar_6",
        "name": "冠军金",
        "enabled": true
      }
    ],
    "tileTheme": {
      "enabled": false,
      "normalTiles": [
        {
          "key": "ruby",
          "name": "红宝石",
          "label": "",
          "color": "#d6262f",
          "textColor": "#fff6bd",
          "imageUrl": ""
        },
        {
          "key": "amber",
          "name": "金币",
          "label": "",
          "color": "#f08a12",
          "textColor": "#fff6bd",
          "imageUrl": ""
        },
        {
          "key": "jade",
          "name": "翡翠",
          "label": "",
          "color": "#169950",
          "textColor": "#fff6bd",
          "imageUrl": ""
        },
        {
          "key": "aqua",
          "name": "海浪",
          "label": "",
          "color": "#0098e8",
          "textColor": "#fff6bd",
          "imageUrl": ""
        },
        {
          "key": "slate",
          "name": "紫晶",
          "label": "",
          "color": "#6f2cff",
          "textColor": "#fff6bd",
          "imageUrl": ""
        },
        {
          "key": "gold",
          "name": "冠军金",
          "label": "",
          "color": "#d2a51a",
          "textColor": "#fff6bd",
          "imageUrl": ""
        }
      ],
      "specialTiles": {
        "horizontal": {
          "name": "横向闪电",
          "label": "横",
          "color": "#ffe56d",
          "textColor": "#ffe56d",
          "imageUrl": ""
        },
        "vertical": {
          "name": "纵向闪电",
          "label": "纵",
          "color": "#ffe56d",
          "textColor": "#ffe56d",
          "imageUrl": ""
        },
        "bomb": {
          "name": "爆炸方块",
          "label": "爆",
          "color": "#ffe56d",
          "textColor": "#ffe56d",
          "imageUrl": ""
        }
      }
    },
    "ranks": [
      {
        "key": "bronze",
        "name": "青铜",
        "icon": "◆",
        "color": "#b87a45",
        "enabled": true
      },
      {
        "key": "silver",
        "name": "白银",
        "icon": "◇",
        "color": "#c7d2e2",
        "enabled": true
      },
      {
        "key": "gold",
        "name": "黄金",
        "icon": "✦",
        "color": "#f2c84b",
        "enabled": true
      },
      {
        "key": "platinum",
        "name": "铂金",
        "icon": "✧",
        "color": "#7fe6ff",
        "enabled": true
      },
      {
        "key": "diamond",
        "name": "钻石",
        "icon": "✹",
        "color": "#b58cff",
        "enabled": true
      },
      {
        "key": "starlight",
        "name": "星耀",
        "icon": "✷",
        "color": "#e7a6ff",
        "enabled": true
      },
      {
        "key": "king",
        "name": "王者",
        "icon": "♛",
        "color": "#ffdc73",
        "enabled": true
      }
    ],
    "rankRules": {
      "starsPerRank": 5,
      "winStars": 1,
      "loseStars": 1,
      "winStreakBonusEnabled": true,
      "winStreakRequired": 5,
      "winStreakBonusStars": 1,
      "bronzeProtection": true,
      "rankedModes": [
        "points_battle",
        "poc_battle",
        "pi_battle"
      ],
      "weeklyLeaderboardModes": [
        "points_battle",
        "poc_battle",
        "pi_battle"
      ],
      "quickBattleMaxRankKey": "silver",
      "ticketBattleMaxRankKey": "platinum",
      "richBattleMinRankKey": "bronze",
      "dailyChestRequiredBattles": 3,
      "weeklyAutoSettleEnabled": true,
      "chestRewards": {
        "bronze": 0.02,
        "silver": 0.05,
        "gold": 0.1,
        "platinum": 0.2,
        "diamond": 0.4,
        "starlight": 0.8,
        "king": 1.6
      },
      "weeklyRewards": {
        "top1": 0.05,
        "top2": 0.03,
        "top3": 0.02,
        "top10": 0.005
      },
      "weeklyRewardTiers": [
        {
          "fromRank": 1,
          "toRank": 1,
          "amount": 0.05
        },
        {
          "fromRank": 2,
          "toRank": 2,
          "amount": 0.03
        },
        {
          "fromRank": 3,
          "toRank": 3,
          "amount": 0.02
        },
        {
          "fromRank": 4,
          "toRank": 10,
          "amount": 0.005
        }
      ],
      "ruleSummary": "小富豪、大富豪、超级富豪计入段位和周榜。"
    }
  }
}

function splitLines(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 50);
  }

  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 50)
    .concat([])
    .slice(0, 50) || fallback;
}

function normalizeBotNamePool(value, fallback = DEFAULT_POINTS_BOT_NAME_POOL) {
  const names = (Array.isArray(value) ? value : String(value || "").split(/\r?\n|,/))
    .map((item) => String(item || "").trim().replace(/\s+/g, " ").slice(0, 12))
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, 200);

  return names.length ? names : fallback;
}

function normalizeTextValue(value, fallback = "") {
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text === "[object Object]" ? fallback : text;
  }

  if (value && typeof value === "object") {
    const candidates = [
      value["zh-CN"],
      value.zh,
      value.cn,
      value.default,
      value.text,
      value.value,
      value.en
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" || typeof candidate === "number") {
        const text = String(candidate).trim();
        if (text) return text;
      }
    }
  }

  return fallback;
}

function normalizeRate(value, fallback, max = 1) {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 && next <= max ? next : fallback;
}

function normalizeNumberInRange(value, fallback, min, max, precision = 0) {
  const next = Number(value);
  if (!Number.isFinite(next) || next < min || next > max) return fallback;
  return precision > 0 ? Number(next.toFixed(precision)) : Math.round(next);
}

function normalizeAssetType(value, fallback = "PI") {
  const next = String(value || fallback).trim().toUpperCase();
  return ["FREE", "PI", "POINTS", "POC"].includes(next) ? next : fallback;
}

function normalizeEntryFeeByAsset(assetType, value, fallback) {
  const next = Number(value);
  const fallbackValue = assetType === "POINTS" ? Math.max(0, Math.round(Number(fallback || 0))) : Number(fallback || 0);

  if (!Number.isFinite(next) || next < 0) {
    return fallbackValue;
  }
  if (assetType === "POINTS") {
    if (!Number.isInteger(next)) {
      throw new Error("积分场门票必须是整数，不能填写小数");
    }
    return next;
  }
  if (assetType === "POC") {
    return Number(next.toFixed(6));
  }
  return Number(next.toFixed(8));
}

function normalizeBattleModeConfig(modeKey, incoming = {}, defaults = {}) {
  const assetType = normalizeAssetType(incoming.assetType || defaults.assetType, defaults.assetType || "PI");
  const platformFeeRate = normalizeRate(Number(incoming.platformFeeRate), defaults.platformFeeRate || 0, 0.8);
  const rewardRate = Math.min(
    normalizeRate(Number(incoming.rewardRate), defaults.rewardRate ?? Math.max(0, 1 - platformFeeRate), 1),
    1 - platformFeeRate
  );

  const normalized = {
    ...defaults,
    ...incoming,
    key: modeKey,
    name: String(incoming.name || defaults.name || modeKey).trim().slice(0, 20),
    assetType,
    enabled: incoming.enabled !== false,
    entryFee: normalizeEntryFeeByAsset(assetType, incoming.entryFee, defaults.entryFee),
    platformFeeRate,
    rewardRate,
    botMatchEnabled: modeKey === "quick_battle" ? incoming.botMatchEnabled !== false : incoming.botMatchEnabled === true,
    botRewardsEnabled: Boolean(incoming.botRewardsEnabled)
  };

  if (modeKey === "points_battle") {
    const fallbackDefaults = defaults.botDifficultyRanges || DEFAULT_GAME_CONFIG.pointsBattle.botDifficultyRanges;
    const incomingRanges = incoming.botDifficultyRanges || {};
    const rangeKeys = ["easy", "normal", "hard", "expert"];

    normalized.botFallbackSeconds = normalizeNumberInRange(
      incoming.botFallbackSeconds,
      defaults.botFallbackSeconds || DEFAULT_GAME_CONFIG.pointsBattle.botFallbackSeconds,
      5,
      120
    );
    normalized.botDifficulty = ["easy", "normal", "hard", "expert"].includes(String(incoming.botDifficulty || defaults.botDifficulty))
      ? String(incoming.botDifficulty || defaults.botDifficulty)
      : DEFAULT_GAME_CONFIG.pointsBattle.botDifficulty;
    normalized.botDifficultyRanges = Object.fromEntries(
      rangeKeys.map((key) => {
        const fallback = fallbackDefaults[key] || DEFAULT_GAME_CONFIG.pointsBattle.botDifficultyRanges[key];
        const range = incomingRanges[key] || {};
        const minScore = normalizeNumberInRange(range.minScore, fallback.minScore, 0, 20000);
        const maxScore = Math.max(
          minScore,
          normalizeNumberInRange(range.maxScore, fallback.maxScore, 0, 20000)
        );
        return [
          key,
          {
            minScore,
            maxScore,
            moveIntervalSeconds: normalizeNumberInRange(
              range.moveIntervalSeconds,
              fallback.moveIntervalSeconds,
              0.5,
              10,
              2
            )
          }
        ];
      })
    );
    normalized.botCountInRank = incoming.botCountInRank !== false;
    normalized.botCountInWeekly = incoming.botCountInWeekly !== false;
    normalized.botCountInWatchShareholder = incoming.botCountInWatchShareholder !== false;
    normalized.botNamePool = normalizeBotNamePool(
      incoming.botNamePool || incoming.botNames,
      defaults.botNamePool || DEFAULT_POINTS_BOT_NAME_POOL
    );
  }

  return normalized;
}

function normalizeAssetGatewayConfig(assetGateway = {}) {
  return {
    enabled: Boolean(assetGateway.enabled),
    summaryEnabled: assetGateway.summaryEnabled !== false,
    pointsEnabled: Boolean(assetGateway.pointsEnabled),
    pocEnabled: Boolean(assetGateway.pocEnabled),
    grayUserPiUids: splitLines(assetGateway.grayUserPiUids || assetGateway.gray_user_pi_uids || []),
    grayUserPiUsernames: splitLines(assetGateway.grayUserPiUsernames || assetGateway.gray_user_pi_usernames || []),
    opsNote: String(assetGateway.opsNote || DEFAULT_GAME_CONFIG.assetGateway.opsNote).trim().slice(0, 240)
  };
}

function normalizeTimingConfig(timing = {}) {
  const defaults = DEFAULT_GAME_CONFIG.timing;

  return {
    quickBotFallbackSeconds: normalizeNumberInRange(timing.quickBotFallbackSeconds, defaults.quickBotFallbackSeconds, 5, 120),
    matchCancelWaitSeconds: normalizeNumberInRange(timing.matchCancelWaitSeconds, defaults.matchCancelWaitSeconds, 0, 60),
    matchCancelCooldownSeconds: normalizeNumberInRange(
      timing.matchCancelCooldownSeconds,
      defaults.matchCancelCooldownSeconds,
      0,
      60
    ),
    waitingReadyTimeoutSeconds: normalizeNumberInRange(
      timing.waitingReadyTimeoutSeconds,
      defaults.waitingReadyTimeoutSeconds,
      10,
      120
    ),
    vsIntroSeconds: normalizeNumberInRange(timing.vsIntroSeconds, defaults.vsIntroSeconds, 0, 10),
    readyCountdownSeconds: normalizeNumberInRange(timing.readyCountdownSeconds, defaults.readyCountdownSeconds, 0, 15),
    quickRoundSeconds: normalizeNumberInRange(timing.quickRoundSeconds, defaults.quickRoundSeconds, 30, 180),
    paidRoundSeconds: normalizeNumberInRange(timing.paidRoundSeconds, defaults.paidRoundSeconds, 30, 300),
    botMoveIntervalSeconds: normalizeNumberInRange(timing.botMoveIntervalSeconds, defaults.botMoveIntervalSeconds, 1, 10, 1)
  };
}

function normalizeCapacityConfig(capacity = {}) {
  const defaults = DEFAULT_GAME_CONFIG.capacity;

  return {
    maxActiveRooms: normalizeNumberInRange(capacity.maxActiveRooms, defaults.maxActiveRooms, 0, 5000),
    maxQueueLengthPerMode: normalizeNumberInRange(
      capacity.maxQueueLengthPerMode,
      defaults.maxQueueLengthPerMode,
      100,
      20000
    ),
    realtimeMaxConnectionsPerInstance: normalizeNumberInRange(
      capacity.realtimeMaxConnectionsPerInstance,
      defaults.realtimeMaxConnectionsPerInstance,
      100,
      20000
    ),
    realtimeMaxConnectionsPerUser: normalizeNumberInRange(
      capacity.realtimeMaxConnectionsPerUser,
      defaults.realtimeMaxConnectionsPerUser,
      1,
      10
    ),
    realtimeHeartbeatSeconds: normalizeNumberInRange(
      capacity.realtimeHeartbeatSeconds,
      defaults.realtimeHeartbeatSeconds,
      10,
      60
    ),
    realtimeIdleTimeoutSeconds: normalizeNumberInRange(
      capacity.realtimeIdleTimeoutSeconds,
      defaults.realtimeIdleTimeoutSeconds,
      30,
      300
    ),
    realtimeMaxPayloadBytes: normalizeNumberInRange(
      capacity.realtimeMaxPayloadBytes,
      defaults.realtimeMaxPayloadBytes,
      512,
      16384
    )
  };
}

function normalizeExtremeRealtimeConfig(extremeRealtime = {}) {
  const defaults = DEFAULT_GAME_CONFIG.extremeRealtime;

  return {
    enabled: true,
    rollbackToLegacy: false,
    enabledModes: [...defaults.enabledModes],
    grayPercent: 100,
    grayUserPiUids: [],
    grayUserPiUsernames: [],
    maxPendingSwaps: normalizeNumberInRange(
      extremeRealtime.maxPendingSwaps,
      defaults.maxPendingSwaps,
      1,
      6
    ),
    snapshotIntervalMs: normalizeNumberInRange(
      extremeRealtime.snapshotIntervalMs,
      defaults.snapshotIntervalMs,
      500,
      10000
    ),
    swapMinIntervalMs: normalizeNumberInRange(
      extremeRealtime.swapMinIntervalMs,
      defaults.swapMinIntervalMs,
      60,
      500
    ),
    metricsSampleRate: normalizeRate(
      Number(extremeRealtime.metricsSampleRate),
      defaults.metricsSampleRate,
      1
    )
  };
}

async function syncRealtimeConfigToRedis(config) {
  const capacity = normalizeCapacityConfig(config?.capacity || {});
  const extremeRealtime = normalizeExtremeRealtimeConfig(config?.extremeRealtime || {});
  await redisSet(
    REALTIME_CONFIG_REDIS_KEY,
    JSON.stringify({
      maxConnectionsPerInstance: capacity.realtimeMaxConnectionsPerInstance,
      maxConnectionsPerUser: capacity.realtimeMaxConnectionsPerUser,
      heartbeatSeconds: capacity.realtimeHeartbeatSeconds,
      idleTimeoutSeconds: capacity.realtimeIdleTimeoutSeconds,
      maxPayloadBytes: capacity.realtimeMaxPayloadBytes,
      extremeRealtime
    }),
    86400
  );
}

function normalizeWithdrawRiskConfig(withdrawRisk = {}) {
  const defaults = DEFAULT_GAME_CONFIG.withdrawRisk;
  const minAmount = Number(withdrawRisk.minAmount);
  const dailyLimitAmount = Number(withdrawRisk.dailyLimitAmount);
  const feeRate = Number(withdrawRisk.feeRate);
  const manualReviewAmount = Number(withdrawRisk.manualReviewAmount);
  const autoPayoutMaxAmount = Number(withdrawRisk.autoPayoutMaxAmount);
  const autoPayoutDailyLimitAmount = Number(withdrawRisk.autoPayoutDailyLimitAmount);
  const maxRetryCount = Number(withdrawRisk.maxRetryCount);
  const payoutChannel = String(withdrawRisk.payoutChannel || defaults.payoutChannel).trim();

  return {
    minAmount:
      Number.isFinite(minAmount) && minAmount >= 0
        ? Number(minAmount.toFixed(8))
        : defaults.minAmount,
    dailyLimitAmount:
      Number.isFinite(dailyLimitAmount) && dailyLimitAmount >= 0
        ? Number(dailyLimitAmount.toFixed(8))
        : defaults.dailyLimitAmount,
    feeRate:
      Number.isFinite(feeRate) && feeRate >= 0 && feeRate <= 0.2
        ? Number(feeRate.toFixed(4))
        : defaults.feeRate,
    manualReviewAmount:
      Number.isFinite(manualReviewAmount) && manualReviewAmount >= 0
        ? Number(manualReviewAmount.toFixed(8))
        : defaults.manualReviewAmount,
    autoPayoutEnabled: Boolean(withdrawRisk.autoPayoutEnabled),
    autoApproveEnabled: Boolean(withdrawRisk.autoApproveEnabled),
    autoPayoutMaxAmount:
      Number.isFinite(autoPayoutMaxAmount) && autoPayoutMaxAmount >= 0
        ? Number(autoPayoutMaxAmount.toFixed(8))
        : defaults.autoPayoutMaxAmount,
    autoPayoutDailyLimitAmount:
      Number.isFinite(autoPayoutDailyLimitAmount) && autoPayoutDailyLimitAmount >= 0
        ? Number(autoPayoutDailyLimitAmount.toFixed(8))
        : defaults.autoPayoutDailyLimitAmount,
    maxRetryCount:
      Number.isFinite(maxRetryCount) && maxRetryCount >= 0 && maxRetryCount <= 10
        ? Math.round(maxRetryCount)
        : defaults.maxRetryCount,
    walletValidationRequired: withdrawRisk.walletValidationRequired !== false,
    payoutChannel: ["stellar_direct", "pi_a2u"].includes(payoutChannel) ? payoutChannel : defaults.payoutChannel
  };
}

function normalizeRechargeBonusPreset(preset = {}, index = 0) {
  const amount = Number(preset.amount);
  const bonusAmount = Number(preset.bonusAmount);

  return {
    amount: Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(8)) : index + 1,
    bonusAmount:
      Number.isFinite(bonusAmount) && bonusAmount >= 0 && bonusAmount <= 100
        ? Number(bonusAmount.toFixed(8))
        : 0,
    label: String(preset.label || "").trim().slice(0, 20),
    enabled: preset.enabled !== false
  };
}

function normalizeRechargeBonusConfig(rechargeBonus = {}) {
  const defaults = DEFAULT_GAME_CONFIG.rechargeBonus;
  const bonusRate = Number(rechargeBonus.bonusRate);
  const maxBonusAmount = Number(rechargeBonus.maxBonusAmount);
  const sourcePresets = Array.isArray(rechargeBonus.presets) ? rechargeBonus.presets : defaults.presets;

  return {
    enabled: Boolean(rechargeBonus.enabled),
    bonusRate:
      Number.isFinite(bonusRate) && bonusRate >= 0 && bonusRate <= 0.2
        ? Number(bonusRate.toFixed(4))
        : defaults.bonusRate,
    maxBonusAmount:
      Number.isFinite(maxBonusAmount) && maxBonusAmount >= 0
        ? Number(maxBonusAmount.toFixed(8))
        : defaults.maxBonusAmount,
    presets: sourcePresets
      .slice(0, 8)
      .map(normalizeRechargeBonusPreset)
      .filter((preset) => preset.amount > 0)
  };
}

function normalizeTransferConfig(transfer = {}) {
  const defaults = DEFAULT_GAME_CONFIG.transfer;
  const minAmount = Number(transfer.minAmount);
  const maxAmount = Number(transfer.maxAmount);
  const dailyLimitAmount = Number(transfer.dailyLimitAmount);
  const feeRate = Number(transfer.feeRate);
  const feeMinAmount = Number(transfer.feeMinAmount);
  const cooldownSeconds = Number(transfer.cooldownSeconds);

  return {
    enabled: transfer.enabled !== false,
    minAmount: Number.isFinite(minAmount) && minAmount >= 0 ? Number(minAmount.toFixed(8)) : defaults.minAmount,
    maxAmount: Number.isFinite(maxAmount) && maxAmount >= 0 ? Number(maxAmount.toFixed(8)) : defaults.maxAmount,
    dailyLimitAmount:
      Number.isFinite(dailyLimitAmount) && dailyLimitAmount >= 0
        ? Number(dailyLimitAmount.toFixed(8))
        : defaults.dailyLimitAmount,
    feeRate:
      Number.isFinite(feeRate) && feeRate >= 0 && feeRate <= 0.2
        ? Number(feeRate.toFixed(4))
        : defaults.feeRate,
    feeMinAmount:
      Number.isFinite(feeMinAmount) && feeMinAmount >= 0
        ? Number(feeMinAmount.toFixed(8))
        : defaults.feeMinAmount,
    cooldownSeconds:
      Number.isFinite(cooldownSeconds) && cooldownSeconds >= 0 && cooldownSeconds <= 3600
        ? Math.round(cooldownSeconds)
        : defaults.cooldownSeconds
  };
}

function normalizeInviteLevel(level = {}, index = 0) {
  const defaults = DEFAULT_GAME_CONFIG.inviteRewards.levels[index] || DEFAULT_GAME_CONFIG.inviteRewards.levels[0];
  const commissionRate = Number(level.commissionRate);
  const minBalance = Number(level.minBalance);
  const minDirectInvites = Number(level.minDirectInvites);

  return {
    key: String(level.key || defaults.key || `level_${index + 1}`).trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32),
    name: String(level.name || defaults.name || `邀请等级${index + 1}`).trim().slice(0, 20),
    commissionRate:
      Number.isFinite(commissionRate) && commissionRate >= 0 && commissionRate <= 0.5
        ? Number(commissionRate.toFixed(6))
        : defaults.commissionRate,
    minBalance:
      Number.isFinite(minBalance) && minBalance >= 0 ? Number(minBalance.toFixed(8)) : defaults.minBalance,
    minDirectInvites:
      Number.isFinite(minDirectInvites) && minDirectInvites >= 0
        ? Math.round(minDirectInvites)
        : defaults.minDirectInvites,
    enabled: level.enabled !== false
  };
}

function normalizeInviteRewardsConfig(inviteRewards = {}) {
  const defaults = DEFAULT_GAME_CONFIG.inviteRewards;
  const bindRequiredAfterBattles = Number(inviteRewards.bindRequiredAfterBattles);
  const qualificationRequiredBattles = Number(inviteRewards.qualificationRequiredBattles);
  const qualificationRewardAmount = Number(inviteRewards.qualificationRewardAmount);
  const maxCommissionRate = Number(inviteRewards.maxCommissionRate);
  const bindRequiredModes = Array.isArray(inviteRewards.bindRequiredModes)
    ? inviteRewards.bindRequiredModes
        .map((mode) => String(mode || "").trim())
        .filter((mode, index, list) => SUPPORTED_BATTLE_MODES.includes(mode) && list.indexOf(mode) === index)
    : defaults.bindRequiredModes;
  const commissionModes = Array.isArray(inviteRewards.commissionModes)
    ? inviteRewards.commissionModes
        .map((mode) => String(mode || "").trim())
        .filter((mode, index, list) => ["points_battle", "poc_battle", "pi_battle"].includes(mode) && list.indexOf(mode) === index)
    : defaults.commissionModes;
  const sourceLevels = Array.isArray(inviteRewards.levels) && inviteRewards.levels.length
    ? inviteRewards.levels
    : defaults.levels;

  return {
    enabled: inviteRewards.enabled !== false,
    bindEnabled: inviteRewards.bindEnabled !== false,
    bindRequiredEnabled: inviteRewards.bindRequiredEnabled !== false,
    bindRequiredAfterBattles:
      Number.isFinite(bindRequiredAfterBattles) && bindRequiredAfterBattles >= 0 && bindRequiredAfterBattles <= 100
        ? Math.round(bindRequiredAfterBattles)
        : defaults.bindRequiredAfterBattles,
    bindRequiredModes: bindRequiredModes.length ? bindRequiredModes : defaults.bindRequiredModes,
    officialInviterPiUsername: String(inviteRewards.officialInviterPiUsername || "").trim().replace(/^@+/, "").slice(0, 64),
    bindRequiredMessage: String(inviteRewards.bindRequiredMessage || defaults.bindRequiredMessage).trim().slice(0, 80),
    qualificationEnabled: inviteRewards.qualificationEnabled !== false,
    qualificationRequiredBattles:
      Number.isFinite(qualificationRequiredBattles) && qualificationRequiredBattles >= 1 && qualificationRequiredBattles <= 100
        ? Math.round(qualificationRequiredBattles)
        : defaults.qualificationRequiredBattles,
    qualificationRewardAmount:
      Number.isFinite(qualificationRewardAmount) && qualificationRewardAmount >= 0 && qualificationRewardAmount <= 100
        ? Number(qualificationRewardAmount.toFixed(8))
        : defaults.qualificationRewardAmount,
    battleCommissionEnabled: inviteRewards.battleCommissionEnabled !== false,
    piCommissionEnabled: inviteRewards.piCommissionEnabled !== false,
    pointsCommissionEnabled: inviteRewards.pointsCommissionEnabled !== false,
    pocCommissionEnabled: inviteRewards.pocCommissionEnabled !== false,
    botCommissionEnabled: inviteRewards.botCommissionEnabled === true,
    commissionModes: commissionModes.length ? commissionModes : defaults.commissionModes,
    pointsRoundMode: "floor",
    commissionBase: ["entry_fee", "platform_fee"].includes(inviteRewards.commissionBase)
      ? inviteRewards.commissionBase
      : defaults.commissionBase,
    maxCommissionRate:
      Number.isFinite(maxCommissionRate) && maxCommissionRate >= 0 && maxCommissionRate <= 0.5
        ? Number(maxCommissionRate.toFixed(6))
        : defaults.maxCommissionRate,
    levels: sourceLevels
      .slice(0, 6)
      .map(normalizeInviteLevel)
      .filter((level) => level.key && level.enabled !== false)
  };
}

function normalizeEngagementTask(task = {}, index = 0) {
  const defaults = DEFAULT_GAME_CONFIG.engagement.tasks[index] || DEFAULT_GAME_CONFIG.engagement.tasks[0];
  const requiredCount = Number(task.requiredCount);
  const rewardAmount = Number(task.rewardAmount);
  const condition = String(task.condition || defaults.condition || "battle_count");
  const safeConditions = ["battle_count", "win_count", "paid_battle_count"];
  const sourceModes = Array.isArray(task.modes) ? task.modes : defaults.modes;
  const modes = sourceModes
    .map((mode) => String(mode || "").trim())
    .filter((mode, modeIndex, list) => SUPPORTED_BATTLE_MODES.includes(mode) && list.indexOf(mode) === modeIndex);

  return {
    key: String(task.key || defaults.key || `task_${index + 1}`)
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 32),
    title: String(task.title || defaults.title || `每日任务${index + 1}`).trim().slice(0, 16),
    condition: safeConditions.includes(condition) ? condition : defaults.condition,
    requiredCount:
      Number.isFinite(requiredCount) && requiredCount >= 1 && requiredCount <= 50
        ? Math.round(requiredCount)
        : defaults.requiredCount,
    rewardAmount:
      Number.isFinite(rewardAmount) && rewardAmount >= 0 && rewardAmount <= 10
        ? Number(rewardAmount.toFixed(8))
        : defaults.rewardAmount,
    enabled: task.enabled !== false,
    modes: modes.length ? modes : DEFAULT_ENGAGEMENT_TASK_MODES
  };
}

function normalizeEngagementConfig(engagement = {}) {
  const defaults = DEFAULT_GAME_CONFIG.engagement;
  const dailySignIn = engagement.dailySignIn || {};
  const dailyReward = Number(dailySignIn.rewardAmount);
  const pointsReward = Number(dailySignIn.pointsRewardAmount);
  const pocReward = Number(dailySignIn.pocRewardAmount);
  const sourceTasks = Array.isArray(engagement.tasks) && engagement.tasks.length ? engagement.tasks : defaults.tasks;

  return {
    enabled: engagement.enabled !== false,
    dailySignIn: {
      enabled: dailySignIn.enabled !== false,
      title: String(dailySignIn.title || defaults.dailySignIn.title).trim().slice(0, 16),
      piRewardEnabled: dailySignIn.piRewardEnabled !== false,
      rewardAmount:
        Number.isFinite(dailyReward) && dailyReward >= 0 && dailyReward <= 10
          ? Number(dailyReward.toFixed(8))
          : defaults.dailySignIn.rewardAmount,
      pointsRewardEnabled: Boolean(dailySignIn.pointsRewardEnabled),
      pointsRewardAmount:
        Number.isFinite(pointsReward) && pointsReward >= 0 && pointsReward <= 100000
          ? Math.floor(pointsReward)
          : defaults.dailySignIn.pointsRewardAmount,
      pocRewardEnabled: Boolean(dailySignIn.pocRewardEnabled),
      pocRewardAmount:
        Number.isFinite(pocReward) && pocReward >= 0 && pocReward <= 100000
          ? Number(pocReward.toFixed(6))
          : defaults.dailySignIn.pocRewardAmount
    },
    tasks: sourceTasks
      .slice(0, 20)
      .map(normalizeEngagementTask)
      .filter((task) => task.key && task.title)
  };
}

function normalizeWatchShareholderConfig(watchShareholder = {}) {
  const defaults = DEFAULT_GAME_CONFIG.watchShareholder;
  const shareRate = normalizeRate(Number(watchShareholder.shareRate), defaults.shareRate, 1);
  const minRewardPoints = normalizeNumberInRange(
    watchShareholder.minRewardPoints,
    defaults.minRewardPoints,
    1,
    1000000
  );
  const subsidyPointsPerUser = normalizeNumberInRange(
    watchShareholder.subsidyPointsPerUser,
    defaults.subsidyPointsPerUser,
    0,
    1000000
  );

  return {
    enabled: Boolean(watchShareholder.enabled),
    frontendEntryEnabled: watchShareholder.frontendEntryEnabled !== false,
    autoSettleEnabled: watchShareholder.autoSettleEnabled !== false,
    shareRate,
    minRewardPoints,
    subsidyEnabled: Boolean(watchShareholder.subsidyEnabled),
    subsidyPointsPerUser: Math.floor(subsidyPointsPerUser),
    sourceMode: "points_battle",
    settlementText: String(watchShareholder.settlementText || defaults.settlementText).trim().slice(0, 60),
    title: String(watchShareholder.title || defaults.title).trim().slice(0, 32),
    subtitle: String(watchShareholder.subtitle || defaults.subtitle).trim().slice(0, 80)
  };
}

function normalizeAnimationDurations(value = {}) {
  const defaults = DEFAULT_GAME_CONFIG.visualEffects.animationDurations;
  const normalizeSeconds = (key, precision = 2) =>
    normalizeNumberInRange(value[key], defaults[key], 0.05, 3, precision);

  return {
    localBurstSeconds: normalizeSeconds("localBurstSeconds"),
    localBurstHighSeconds: normalizeSeconds("localBurstHighSeconds"),
    serverBurstSeconds: normalizeSeconds("serverBurstSeconds"),
    serverBurstHighSeconds: normalizeSeconds("serverBurstHighSeconds"),
    lowPerformanceBurstSeconds: normalizeSeconds("lowPerformanceBurstSeconds"),
    boardEffectSeconds: normalizeSeconds("boardEffectSeconds"),
    boardEffectHighSeconds: normalizeSeconds("boardEffectHighSeconds"),
    tileBurstSeconds: normalizeSeconds("tileBurstSeconds"),
    tileBurstHighSeconds: normalizeSeconds("tileBurstHighSeconds"),
    tileFallSeconds: normalizeSeconds("tileFallSeconds"),
    tileFallHighSeconds: normalizeSeconds("tileFallHighSeconds"),
    localSwapSeconds: normalizeSeconds("localSwapSeconds"),
    invalidSwapSeconds: normalizeSeconds("invalidSwapSeconds"),
    serverSettleSeconds: normalizeSeconds("serverSettleSeconds"),
    impactSeconds: normalizeSeconds("impactSeconds"),
    impactHighSeconds: normalizeSeconds("impactHighSeconds"),
    pressureHitSeconds: normalizeSeconds("pressureHitSeconds"),
    boardUnderAttackSeconds: normalizeSeconds("boardUnderAttackSeconds"),
    attackLineSeconds: normalizeSeconds("attackLineSeconds"),
    hitWarningSeconds: normalizeSeconds("hitWarningSeconds")
  };
}

function normalizeVisualEffectsConfig(visualEffects = {}) {
  const defaults = DEFAULT_GAME_CONFIG.visualEffects;
  const modes = ["balanced", "high"];
  const normalizeMode = (mode, fallback) => {
    const next = String(mode || fallback);
    return modes.includes(next) ? next : "balanced";
  };
  const defaultMode = String(visualEffects.defaultMode || defaults.defaultMode);
  const piBrowserDefaultMode = String(visualEffects.piBrowserDefaultMode || defaults.piBrowserDefaultMode);

  return {
    defaultMode: normalizeMode(defaultMode, defaults.defaultMode),
    piBrowserDefaultMode: normalizeMode(piBrowserDefaultMode, defaults.piBrowserDefaultMode),
    allowUserChoice: visualEffects.allowUserChoice !== false,
    allowHighMode: true,
    autoDowngradeEnabled: visualEffects.autoDowngradeEnabled !== false,
    dragTrailEnabled: visualEffects.dragTrailEnabled !== false,
    hapticEnabled: visualEffects.hapticEnabled !== false,
    soundEnabled: visualEffects.soundEnabled !== false,
    soundVolume: normalizeNumberInRange(visualEffects.soundVolume, defaults.soundVolume, 0, 1.5, 2),
    bgmEnabled: visualEffects.bgmEnabled !== false,
    bgmVolume: normalizeNumberInRange(visualEffects.bgmVolume, defaults.bgmVolume, 0, 1, 2),
    attackWarningEnabled: visualEffects.attackWarningEnabled !== false,
    attackWarningText:
      normalizeTextValue(visualEffects.attackWarningText, defaults.attackWarningText)
        .trim()
        .slice(0, 32) || defaults.attackWarningText,
    animationDurations: normalizeAnimationDurations(visualEffects.animationDurations)
  };
}

function normalizeAvatars(avatars) {
  const source = Array.isArray(avatars) ? avatars : DEFAULT_GAME_CONFIG.operation.avatars;

  return DEFAULT_GAME_CONFIG.operation.avatars.map((defaultAvatar, index) => {
    const incoming = source.find((avatar) => avatar?.key === defaultAvatar.key) || source[index] || {};
    return {
      key: defaultAvatar.key,
      name: String(incoming.name || defaultAvatar.name).trim().slice(0, 12) || defaultAvatar.name,
      enabled: incoming.enabled !== false
    };
  });
}

function normalizeColor(value, fallback) {
  const next = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(next) ? next : fallback;
}

function normalizeImageUrl(value) {
  const next = String(value || "").trim();
  if (!next) return "";
  if (next.length > 240) return "";
  if (/^https?:\/\/[^\s"'<>]+$/i.test(next)) return next;
  if (/^\/[a-zA-Z0-9/_\-%.]+\.(png|jpg|jpeg|webp|gif)$/i.test(next)) return next;
  return "";
}

function normalizeTileThemeTile(tile = {}, fallback = {}) {
  return {
    key: fallback.key,
    name: String(tile.name || fallback.name || "").trim().slice(0, 12),
    label: String(tile.label ?? fallback.label ?? "").trim().slice(0, 2),
    color: normalizeColor(tile.color, fallback.color || "#8a35ff"),
    textColor: normalizeColor(tile.textColor, fallback.textColor || "#fff6bd"),
    imageUrl: normalizeImageUrl(tile.imageUrl)
  };
}

function normalizeTileThemeConfig(tileTheme = {}) {
  const defaults = DEFAULT_GAME_CONFIG.operation.tileTheme;
  const sourceNormalTiles = Array.isArray(tileTheme.normalTiles) ? tileTheme.normalTiles : defaults.normalTiles;
  const sourceSpecialTiles = tileTheme.specialTiles || {};

  return {
    enabled: Boolean(tileTheme.enabled),
    normalTiles: defaults.normalTiles.map((defaultTile, index) => {
      const incoming = sourceNormalTiles.find((tile) => tile?.key === defaultTile.key) || sourceNormalTiles[index] || {};
      return normalizeTileThemeTile(incoming, defaultTile);
    }),
    specialTiles: {
      horizontal: normalizeTileThemeTile(sourceSpecialTiles.horizontal, defaults.specialTiles.horizontal),
      vertical: normalizeTileThemeTile(sourceSpecialTiles.vertical, defaults.specialTiles.vertical),
      bomb: normalizeTileThemeTile(sourceSpecialTiles.bomb, defaults.specialTiles.bomb)
    }
  };
}

function normalizeRanks(ranks) {
  const source = Array.isArray(ranks) ? ranks : DEFAULT_GAME_CONFIG.operation.ranks;

  return DEFAULT_GAME_CONFIG.operation.ranks.map((defaultRank) => {
    const incoming = source.find((rank) => rank?.key === defaultRank.key) || {};
    return {
      key: defaultRank.key,
      name: String(incoming.name || defaultRank.name).trim().slice(0, 12) || defaultRank.name,
      icon: String(incoming.icon || defaultRank.icon).trim().slice(0, 2) || defaultRank.icon,
      color: normalizeColor(incoming.color, defaultRank.color),
      enabled: incoming.enabled !== false
    };
  });
}

const SUPPORTED_LOCALES = ["zh-CN", "en", "vi", "ko", "ja"];

function normalizeLocalizedContent(value = {}) {
  const defaults = DEFAULT_GAME_CONFIG.operation.localizedContent;
  return SUPPORTED_LOCALES.reduce((acc, locale) => {
    const incoming = value?.[locale] || {};
    const fallback = defaults[locale] || defaults["zh-CN"];
    acc[locale] = {
      maintenanceNotice: String(incoming.maintenanceNotice ?? fallback.maintenanceNotice ?? "").trim().slice(0, 240),
      rechargeNotice: String(incoming.rechargeNotice || fallback.rechargeNotice || "").trim().slice(0, 200),
      withdrawNotice: String(incoming.withdrawNotice || fallback.withdrawNotice || "").trim().slice(0, 200),
      ruleSummary: String(incoming.ruleSummary || fallback.ruleSummary || "").trim().slice(0, 200)
    };
    return acc;
  }, {});
}

function normalizeRankRules(rankRules = {}) {
  const defaults = DEFAULT_GAME_CONFIG.operation.rankRules;
  const safeModes = Array.isArray(rankRules.rankedModes)
    ? rankRules.rankedModes.filter((mode) => SUPPORTED_BATTLE_MODES.includes(mode))
    : defaults.rankedModes;
  const weeklyLeaderboardModes = Array.isArray(rankRules.weeklyLeaderboardModes)
    ? rankRules.weeklyLeaderboardModes.filter((mode) => SUPPORTED_BATTLE_MODES.includes(mode))
    : defaults.weeklyLeaderboardModes;
  const enabledRankKeys = DEFAULT_GAME_CONFIG.operation.ranks.map((rank) => rank.key);
  const richBattleMinRankKey = enabledRankKeys.includes(rankRules.richBattleMinRankKey)
    ? rankRules.richBattleMinRankKey
    : defaults.richBattleMinRankKey;
  const quickBattleMaxRankKey = enabledRankKeys.includes(rankRules.quickBattleMaxRankKey)
    ? rankRules.quickBattleMaxRankKey
    : defaults.quickBattleMaxRankKey;
  const ticketBattleMaxRankKey = enabledRankKeys.includes(rankRules.ticketBattleMaxRankKey)
    ? rankRules.ticketBattleMaxRankKey
    : defaults.ticketBattleMaxRankKey;

  function safeInt(value, fallback, min, max) {
    const next = Number.parseInt(String(value), 10);
    return Number.isFinite(next) && next >= min && next <= max ? next : fallback;
  }
  function safeAmount(value, fallback, max = 100) {
    const next = Number(value);
    return Number.isFinite(next) && next >= 0 && next <= max ? Number(next.toFixed(8)) : fallback;
  }
  function normalizeWeeklyRewardTiers(value) {
    const source = Array.isArray(value) && value.length
      ? value
      : [
          { fromRank: 1, toRank: 1, amount: rankRules.weeklyRewards?.top1 ?? defaults.weeklyRewards.top1 },
          { fromRank: 2, toRank: 2, amount: rankRules.weeklyRewards?.top2 ?? defaults.weeklyRewards.top2 },
          { fromRank: 3, toRank: 3, amount: rankRules.weeklyRewards?.top3 ?? defaults.weeklyRewards.top3 },
          { fromRank: 4, toRank: 10, amount: rankRules.weeklyRewards?.top10 ?? defaults.weeklyRewards.top10 }
        ];

    return source
      .map((tier) => {
        const fromRank = safeInt(tier?.fromRank, 1, 1, 500);
        const toRank = safeInt(tier?.toRank, fromRank, 1, 500);
        return {
          fromRank: Math.min(fromRank, toRank),
          toRank: Math.max(fromRank, toRank),
          amount: safeAmount(tier?.amount, 0, 100)
        };
      })
      .filter((tier) => tier.amount > 0)
      .sort((a, b) => a.fromRank - b.fromRank || a.toRank - b.toRank)
      .slice(0, 30);
  }
  const chestRewards = DEFAULT_GAME_CONFIG.operation.ranks.reduce((acc, rank) => {
    acc[rank.key] = safeAmount(rankRules.chestRewards?.[rank.key], defaults.chestRewards[rank.key] || 0, 100);
    return acc;
  }, {});
  const weeklyRewards = {
    top1: safeAmount(rankRules.weeklyRewards?.top1, defaults.weeklyRewards.top1, 100),
    top2: safeAmount(rankRules.weeklyRewards?.top2, defaults.weeklyRewards.top2, 100),
    top3: safeAmount(rankRules.weeklyRewards?.top3, defaults.weeklyRewards.top3, 100),
    top10: safeAmount(rankRules.weeklyRewards?.top10, defaults.weeklyRewards.top10, 100)
  };
  const weeklyRewardTiers = normalizeWeeklyRewardTiers(rankRules.weeklyRewardTiers);

  return {
    starsPerRank: safeInt(rankRules.starsPerRank, defaults.starsPerRank, 1, 10),
    winStars: safeInt(rankRules.winStars, defaults.winStars, 1, 5),
    loseStars: safeInt(rankRules.loseStars, defaults.loseStars, 0, 5),
    winStreakBonusEnabled: rankRules.winStreakBonusEnabled !== false,
    winStreakRequired: safeInt(rankRules.winStreakRequired, defaults.winStreakRequired, 2, 10),
    winStreakBonusStars: safeInt(rankRules.winStreakBonusStars, defaults.winStreakBonusStars, 0, 5),
    bronzeProtection: rankRules.bronzeProtection !== false,
    rankedModes: safeModes.length ? safeModes : defaults.rankedModes,
    weeklyLeaderboardModes: weeklyLeaderboardModes.length ? weeklyLeaderboardModes : defaults.weeklyLeaderboardModes,
    quickBattleMaxRankKey,
    ticketBattleMaxRankKey,
    richBattleMinRankKey,
    dailyChestRequiredBattles: safeInt(
      rankRules.dailyChestRequiredBattles,
      defaults.dailyChestRequiredBattles,
      1,
      20
    ),
    weeklyAutoSettleEnabled: rankRules.weeklyAutoSettleEnabled !== false,
    chestRewards,
    weeklyRewards,
    weeklyRewardTiers,
    ruleSummary: String(rankRules.ruleSummary || defaults.ruleSummary).trim().slice(0, 160)
  };
}

async function readGameConfig() {
  try {
    const rows = await query(
      "SELECT config_value FROM system_configs WHERE config_group = ? AND config_key = ? AND status = 1 LIMIT 1",
      ["game", "operation_config"]
    );

    if (rows[0]?.config_value) {
      const value =
        typeof rows[0].config_value === "string"
          ? JSON.parse(rows[0].config_value)
          : rows[0].config_value;

      return {
        ...DEFAULT_GAME_CONFIG,
        ...value,
        quickBattle: {
          ...normalizeBattleModeConfig("quick_battle", value.quickBattle || {}, DEFAULT_GAME_CONFIG.quickBattle)
        },
        ticketBattle: {
          ...normalizeBattleModeConfig("ticket_battle", value.ticketBattle || {}, DEFAULT_GAME_CONFIG.ticketBattle)
        },
        richBattle: {
          ...normalizeBattleModeConfig("rich_battle", value.richBattle || {}, DEFAULT_GAME_CONFIG.richBattle)
        },
        pointsBattle: normalizeBattleModeConfig(
          "points_battle",
          value.pointsBattle || {},
          DEFAULT_GAME_CONFIG.pointsBattle
        ),
        pocBattle: normalizeBattleModeConfig("poc_battle", value.pocBattle || {}, DEFAULT_GAME_CONFIG.pocBattle),
        piBattle: normalizeBattleModeConfig("pi_battle", value.piBattle || {}, DEFAULT_GAME_CONFIG.piBattle),
        assetGateway: normalizeAssetGatewayConfig(value.assetGateway),
        withdrawRisk: normalizeWithdrawRiskConfig(value.withdrawRisk),
        rechargeBonus: normalizeRechargeBonusConfig(value.rechargeBonus),
        transfer: normalizeTransferConfig(value.transfer),
        inviteRewards: normalizeInviteRewardsConfig(value.inviteRewards),
        engagement: normalizeEngagementConfig(value.engagement),
        watchShareholder: normalizeWatchShareholderConfig(value.watchShareholder),
        visualEffects: normalizeVisualEffectsConfig(value.visualEffects),
        timing: normalizeTimingConfig(value.timing),
        capacity: normalizeCapacityConfig(value.capacity),
        extremeRealtime: normalizeExtremeRealtimeConfig(value.extremeRealtime),
        operation: normalizeConfig({ operation: value.operation }).operation
      };
    }
  } catch (error) {
    console.error("[game-config] MySQL read failed:", error.message);
  }

  return DEFAULT_GAME_CONFIG;
}

function normalizeConfig(payload) {
  const quickBattle = normalizeBattleModeConfig("quick_battle", payload.quickBattle || {}, DEFAULT_GAME_CONFIG.quickBattle);
  const ticketBattle = normalizeBattleModeConfig("ticket_battle", payload.ticketBattle || {}, DEFAULT_GAME_CONFIG.ticketBattle);
  const richBattle = normalizeBattleModeConfig("rich_battle", payload.richBattle || {}, DEFAULT_GAME_CONFIG.richBattle);
  const pointsBattle = normalizeBattleModeConfig(
    "points_battle",
    payload.pointsBattle || {},
    DEFAULT_GAME_CONFIG.pointsBattle
  );
  const pocBattle = normalizeBattleModeConfig("poc_battle", payload.pocBattle || {}, DEFAULT_GAME_CONFIG.pocBattle);
  const piBattle = normalizeBattleModeConfig("pi_battle", payload.piBattle || {}, DEFAULT_GAME_CONFIG.piBattle);
  const withdrawRisk = normalizeWithdrawRiskConfig(payload.withdrawRisk);
  const rechargeBonus = normalizeRechargeBonusConfig(payload.rechargeBonus);
  const transfer = normalizeTransferConfig(payload.transfer);
  const inviteRewards = normalizeInviteRewardsConfig(payload.inviteRewards);
  const engagement = normalizeEngagementConfig(payload.engagement);
  const watchShareholder = normalizeWatchShareholderConfig(payload.watchShareholder);
  const visualEffects = normalizeVisualEffectsConfig(payload.visualEffects);
  const assetGateway = normalizeAssetGatewayConfig(payload.assetGateway);
  const extremeRealtime = normalizeExtremeRealtimeConfig(payload.extremeRealtime);
  const operation = {
    ...DEFAULT_GAME_CONFIG.operation,
    ...(payload.operation || {})
  };
  const nicknameMinLength = Number(operation.nicknameMinLength);
  const nicknameMaxLength = Number(operation.nicknameMaxLength);

  return {
    quickBattle,
    ticketBattle,
    richBattle,
    pointsBattle,
    pocBattle,
    piBattle,
    assetGateway,
    timing: normalizeTimingConfig(payload.timing),
    capacity: normalizeCapacityConfig(payload.capacity),
    extremeRealtime,
    withdrawRisk,
    rechargeBonus,
    transfer,
    inviteRewards,
    engagement,
    watchShareholder,
    visualEffects,
    operation: {
      maintenanceEnabled: Boolean(operation.maintenanceEnabled),
      maintenanceNotice: String(operation.maintenanceNotice || "").trim().slice(0, 200),
      nicknameMinLength:
        Number.isFinite(nicknameMinLength) && nicknameMinLength >= 1 && nicknameMinLength <= 12
          ? nicknameMinLength
          : DEFAULT_GAME_CONFIG.operation.nicknameMinLength,
      nicknameMaxLength:
        Number.isFinite(nicknameMaxLength) && nicknameMaxLength >= 2 && nicknameMaxLength <= 20
          ? nicknameMaxLength
          : DEFAULT_GAME_CONFIG.operation.nicknameMaxLength,
      nicknamePattern: String(operation.nicknamePattern || DEFAULT_GAME_CONFIG.operation.nicknamePattern)
        .trim()
        .slice(0, 120),
      localizedContent: normalizeLocalizedContent(operation.localizedContent),
      bannedWords: splitLines(operation.bannedWords, DEFAULT_GAME_CONFIG.operation.bannedWords),
      banReasons: splitLines(operation.banReasons, DEFAULT_GAME_CONFIG.operation.banReasons),
      avatars: normalizeAvatars(operation.avatars),
      tileTheme: normalizeTileThemeConfig(operation.tileTheme),
      ranks: normalizeRanks(operation.ranks),
      rankRules: normalizeRankRules(operation.rankRules)
    }
  };
}

async function writeGameConfig(payload) {
  const next = normalizeConfig(payload || {});

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
      "game",
      "operation_config",
      "游戏运营配置",
      JSON.stringify(next),
      "json",
      "控制报名费、平台抽成、机器人局奖励等正式运营参数",
      0,
      1
    ]
  );

  await syncRealtimeConfigToRedis(next);

  return next;
}

module.exports = {
  DEFAULT_GAME_CONFIG,
  DEFAULT_RANKED_MODES,
  SUPPORTED_BATTLE_MODES,
  readGameConfig,
  writeGameConfig
};
