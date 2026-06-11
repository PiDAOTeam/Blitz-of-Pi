# Pi闪电战（Blitz of Pi）

Pi闪电战是一个面向 Pi Browser 用户的移动端 H5 实时对战游戏。核心玩法是 6x8 棋盘三消 PVP：玩家交换相邻方块形成消除得分，连击和大消除会给对手增加压力；每局有倒计时，压力条满会提前失败，时间结束按分数判胜负。

项目面向正式运营，重点是操作简单、移动端流畅、Pi Browser 兼容、支付和钱包安全、真人匹配体验、后台可配置运营。

## 当前模式

- 快速开战：免费练手，可匹配机器人。
- 小富豪：积分对战，使用 HashPi POINTS，积分门票必须是整数。
- 大富豪：POC 对战，使用 HashPi POC，前端展示最多 2 位小数，后端结算保留 6 位精度。
- 超级富豪：Pi 对战，沿用项目内 Pi 钱包和 Pi 支付链路。

## 核心能力

- Pi SDK 登录和 Pi Browser 用户识别。
- Pi 支付、充值、提现、钱包余额、冻结余额和资产流水。
- HashPi 资产网关对接，支持积分和 POC 的余额查询、冻结、结算、释放。
- WebSocket 实时对战服务，支持房间、匹配、准备确认、棋盘操作、比分同步和结算。
- 后台运营配置，支持门票、抽成、奖励比例、资产同步开关、机器人策略、提现额度、公告、头像、段位规则、周榜奖励等。
- 风控和运营辅助，包括对战记录、资金流水、提现管理、对账中心、风控巡检、操作日志。

## 目录结构

```text
apps/
  game-web/       用户端 H5 游戏前端
  admin-web/      后台管理前端
services/
  api/            业务 API 服务：用户、钱包、支付、配置、结算
  realtime/       WebSocket 实时对战服务
packages/
  shared-config/  共享配置与常量
database/
  mysql/          MySQL 初始化和迁移脚本
deploy/
  nginx/          Nginx 配置模板
  pm2/            PM2 进程配置
  scripts/        部署和运维脚本
tools/            压测、模拟和巡检工具
```

## 技术栈

- 前端：Vite、移动端 H5、原生 JavaScript/CSS。
- 后端：Node.js、MySQL、Redis。
- 实时服务：Node.js、WebSocket、Redis。
- 进程管理：PM2。
- 生产环境：宝塔面板、Nginx、Node.js 20。

## 本地开发

要求：

- Node.js >= 20
- npm >= 10
- MySQL 和 Redis 用于完整后端联调

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev:game
npm run dev:admin
npm run dev:api
npm run dev:realtime
```

构建：

```bash
npm run build:game
npm run build:admin
npm run build
```

## 环境变量

不要提交真实密钥。真实生产配置应写入服务器上的 `.env.production`。

仓库中只保留模板：

- `.env.example`
- `.env.production.example`

重点配置包括：

- MySQL 连接信息
- Redis 连接信息
- Pi SDK / Pi Platform 配置
- HashPi 资产网关地址、App Key、App Secret
- 提现和自动打款相关配置

## 生产部署

当前生产代码以服务器源码和 GitHub 仓库共同维护。

生产目录约定：

```text
/www/wwwroot/blitz.hashpi.app        用户端静态站点
/www/wwwroot/blitzadmin.hashpi.app   后台管理静态站点
/www/wwwroot/blitzapi.hashpi.app     API / realtime / monorepo 源码
```

注意：

- `blitz.hashpi.app` 目录下的 `validation-key.txt` 是受保护文件，部署前台时不能删除。
- 不要把 `.env.production`、数据库快照、日志、`node_modules`、`dist`、部署压缩包提交到 Git。
- 生产前端和后台静态包由 `apps/game-web/dist`、`apps/admin-web/dist` 构建后同步到对应站点目录。

## Git 维护

远程仓库：

```text
https://github.com/PiDAOTeam/Blitz-of-Pi
```

常用流程：

```bash
git status
git add .
git commit -m "描述本次修改"
git push
```

提交前检查：

- 不包含真实密码、SSH 密码、云厂商密钥、HashPi 网关密钥。
- 不包含生产数据库快照。
- 前台和后台能正常构建。

## 运营配置说明

后台管理主要给运营人员使用，不需要改代码即可调整：

- 快速开战是否允许机器人匹配。
- 小富豪积分门票、抽成、胜者奖励比例。
- 大富豪 POC 门票、抽成、胜者奖励比例。
- 超级富豪 Pi 门票、抽成、胜者奖励比例。
- HashPi 资产网关总开关、积分权限、POC 权限、指定开放 UID / username。
- 段位规则、每日宝箱、周榜奖励。
- 充值赠送、提现额度、转账、邀请奖励。
- 维护公告、活动文案、昵称规则、头像开关。

## 资产精度规则

- POINTS：全链路按整数处理，门票不能填写小数。
- POC：后端冻结和结算保留 6 位精度，前端展示最多 2 位小数。
- Pi：沿用项目内钱包精度和 Pi 支付逻辑。

## 当前状态

项目已经进入生产运营增强阶段，重点不是 MVP 骨架，而是：

- 生产稳定性
- 真人匹配体验
- Pi Browser 性能兼容
- 钱包和支付安全
- HashPi 积分/POC 资产联动
- 后台配置易用性
- 防作弊、风控和结算可靠性
