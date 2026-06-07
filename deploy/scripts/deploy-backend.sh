#!/bin/bash

set -e

PROJECT_ROOT="/www/wwwroot/blitzapi.hashpi.app"

cd "$PROJECT_ROOT"

export PATH=/www/server/nodejs/v20.20.2/bin:$PATH

echo "[1/6] 安装依赖..."
npm install

echo "[2/6] 检查环境变量..."
if [ ! -f ".env.production" ]; then
  echo ".env.production 不存在，请先创建"
  exit 1
fi

echo "[3/6] 初始化数据目录..."
mkdir -p logs
mkdir -p data
chmod 700 logs data

ENV_MODE="$(stat -c '%a' .env.production)"
ENV_PERM=$((8#$ENV_MODE))
if (( ENV_PERM & 077 )); then
  echo ".env.production 权限过宽，请执行：chmod 600 $PROJECT_ROOT/.env.production"
  exit 1
fi

echo "[4/6] 启动或重载 PM2..."
pm2 startOrReload deploy/pm2/ecosystem.config.cjs
pm2 save

echo "[5/6] 查看 PM2 状态..."
pm2 list

echo "[6/6] 后端部署完成"
