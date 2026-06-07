#!/bin/bash

set -e

PROJECT_ROOT="/www/wwwroot/blitzapi.hashpi.app"

cd "$PROJECT_ROOT"

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

echo "[4/6] 启动 PM2..."
pm2 start deploy/pm2/ecosystem.config.cjs
pm2 save

echo "[5/6] 查看 PM2 状态..."
pm2 list

echo "[6/6] 后端部署完成"

