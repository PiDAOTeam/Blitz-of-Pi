# Pi闪电战（Blitz of Pi）

`Pi闪电战（Blitz of Pi）` 是一个运行在 `Pi Browser` 中、面向移动端的 1v1 实时消除对战游戏项目。

## 目录结构

```text
apps/
  game-web/       用户端游戏前端
  admin-web/      后台管理前端
services/
  api/            业务 API 服务
  realtime/       实时对战服务
packages/
  shared-config/  共享配置与常量
deploy/
  nginx/          Nginx 配置模板
  pm2/            PM2 进程配置
docs/             产品、运营、技术文档
```

## 当前目标

- 先搭基础工程骨架
- 再逐步实现登录、对战、排位、活动、支付、奖励、提现
- 保持性能和体验优先

## 生产前端目录

- 宝塔前端部署路径：`/www/wwwroot/blitz.hashpi.app`

## 推荐开发顺序

1. 安装依赖
2. 完善环境变量
3. 实现 API 基础模块
4. 实现实时房间服务
5. 实现游戏大厅与对战页
6. 实现后台配置与运营模块

## 当前已完成

- monorepo 基础结构
- 游戏前端 MVP 单页流程
- 后台前端 MVP 管理页
- API 模块化骨架
- 实时服务模块化骨架
- 宝塔 Nginx / PM2 模板
- 产品与运营文档全集

## 当前服务说明

### 游戏前端 `apps/game-web`

- 当前已实现：
  - 模拟登录
  - 首页大厅
  - 快速匹配
  - 简化对战页
  - 对战结算页

### 后台前端 `apps/admin-web`

- 当前已实现：
  - 模拟后台登录
  - 数据总览卡片
  - 首页配置编辑
  - 房间快照查看

### API 服务 `services/api`

- 当前已实现：
  - `GET /health`
  - `GET /api/home/index`
  - `POST /api/auth/pi-login`
  - `GET /api/auth/profile`
  - `POST /admin-api/auth/login`
  - `GET /admin-api/auth/me`
  - `GET /admin-api/home-config`
  - `POST /admin-api/home-config`
  - `POST /api/match/join-queue`
  - `GET /api/match/status`
  - `GET /api/battle/room/:roomNo`
  - `POST /api/battle/action/:roomNo`
  - `GET /api/battle/result/:roomNo`
  - `GET /admin-api/dashboard/overview`
  - `GET /admin-api/matches/rooms`
- 当前首页配置已支持文件持久化存储
- 当前登录仍为模拟会话结构，已具备后续替换真实鉴权的接口形状

### 实时服务 `services/realtime`

- 当前已实现：
  - `GET /health`

## 下一步建议

最建议优先继续的主链路：

1. 把当前模拟登录替换成真实 Pi 登录
2. 将首页配置从文件存储替换为 MySQL 存储
3. 将匹配与房间逻辑从内存结构升级为 Redis / 正式实时服务
4. 实现真正的棋盘消除规则和对战同步
5. 实现后台权限和菜单控制
