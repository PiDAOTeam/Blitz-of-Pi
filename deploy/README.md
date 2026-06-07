# 部署目录说明

## Nginx

- 示例配置：`nginx/blitz.hashpi.app.conf.example`

## PM2

- 进程配置：`pm2/ecosystem.config.cjs`

## 当前生产前端目录

- `/www/wwwroot/blitz.hashpi.app`

## 当前生产后端目录

- `/www/wwwroot/blitzapi.hashpi.app`

## 建议后续部署结构

- 前端静态文件发布到：`/www/wwwroot/blitz.hashpi.app`
- API 服务运行在：`127.0.0.1:3000`
- 实时服务运行在：`127.0.0.1:3001`

## 生产配置文件

- 前端 Nginx：`nginx/blitz.hashpi.app.conf.production`
- 后端 Nginx：`nginx/blitzapi.hashpi.app.conf.production`
- PM2：`pm2/ecosystem.config.cjs`
- 环境变量模板：`../.env.production.example`

## 脚本

- 初始化服务器：`scripts/init-server.sh`
- 部署后端：`scripts/deploy-backend.sh`
- 部署前端：`scripts/deploy-frontend.sh`
- 数据库导入说明：`scripts/import-db.md`
