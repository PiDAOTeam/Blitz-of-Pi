# 部署说明

这个目录只保存可公开提交的部署资料，真实密码、Pi 密钥、HashPi 网关密钥和数据库备份不要放进 Git。

## 生产目录

```text
/www/wwwroot/blitz.hashpi.app        用户端 H5 静态站点
/www/wwwroot/blitzadmin.hashpi.app   后台管理静态站点
/www/wwwroot/blitzapi.hashpi.app     API / realtime / monorepo 源码
```

重要保护文件：

- `/www/wwwroot/blitz.hashpi.app/validation-key.txt`

部署用户端前台时不能删除这个文件。`scripts/deploy-frontend.sh` 已经做了保护，但手工清理目录时也要注意。

## 服务端口

```text
API 服务：       127.0.0.1:3000
Realtime 服务：  127.0.0.1:3001、3002、3003、3004
用户端域名：     https://blitz.hashpi.app
后台域名：       https://blitzadmin.hashpi.app
API/WS 域名：    https://blitzapi.hashpi.app
```

## Nginx

- 用户端：`nginx/blitz.hashpi.app.conf.production`
- 后台管理：`nginx/blitzadmin.hashpi.app.conf.production`
- API / WebSocket：`nginx/blitzapi.hashpi.app.conf.production`
- 本地参考示例：`nginx/blitz.hashpi.app.conf.example`

宝塔面板里通常由站点配置管理 Nginx。这里的文件用于留档、迁移和问题排查。

## PM2

- 生产进程配置：`pm2/ecosystem.config.cjs`
- 根目录也保留了一个 `ecosystem.config.cjs`，方便在仓库根目录直接启动。

推荐在生产源码目录执行：

```bash
cd /www/wwwroot/blitzapi.hashpi.app
pm2 startOrReload deploy/pm2/ecosystem.config.cjs
pm2 save
```

## 环境变量

生产环境使用：

```text
/www/wwwroot/blitzapi.hashpi.app/.env.production
```

模板文件：

- `../.env.production.example`
- `../.env.example`

必须在生产 `.env.production` 填真实值：

- MySQL / Redis
- `SESSION_SECRET`
- `REALTIME_SETTLEMENT_SECRET`
- Pi Platform `PI_API_KEY`
- HashPi 资产网关 `ASSET_GATEWAY_APP_KEY` / `ASSET_GATEWAY_APP_SECRET`
- 自动出款相关配置（如果启用）

不要把 `.env.production` 提交到 Git。

## 前台和后台发布

生产源码目录是 `/www/wwwroot/blitzapi.hashpi.app`。前台和后台都从这里构建。

```bash
cd /www/wwwroot/blitzapi.hashpi.app
bash deploy/scripts/deploy-frontend.sh
```

脚本会：

- 安装依赖
- 构建 `apps/game-web/dist`
- 构建 `apps/admin-web/dist`
- 发布用户端到 `/www/wwwroot/blitz.hashpi.app`
- 发布后台到 `/www/wwwroot/blitzadmin.hashpi.app`
- 保留用户端目录里的 `validation-key.txt`

## 后端发布

```bash
cd /www/wwwroot/blitzapi.hashpi.app
bash deploy/scripts/deploy-backend.sh
```

脚本会检查 `.env.production`、创建日志目录、安装依赖，并用 PM2 启动或重载 API / realtime。

## 数据库

数据库说明见：

- `../database/README.md`
- `scripts/import-db.md`

生产数据库恢复或迁移前，必须先备份。数据库快照不要提交到 Git。

## HashPi 资产场

当前模式约定：

- 快速开战：免费练手
- 小富豪：积分 POINTS，门票只能填整数
- 大富豪：POC，后端保留 6 位精度，前端展示最多 2 位小数
- 超级富豪：Pi，沿用项目内 Pi 钱包和支付逻辑

HashPi 网关总开关、积分开关、POC 开关和指定开放 UID / username 在后台管理里配置；真实网关密钥在 `.env.production` 里配置。
