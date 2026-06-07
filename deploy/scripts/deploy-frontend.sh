#!/bin/bash

set -e

PROJECT_ROOT="/www/wwwroot/blitzapi.hashpi.app"
FRONTEND_ROOT="/www/wwwroot/blitz.hashpi.app"

cd "$PROJECT_ROOT"

echo "[1/5] 安装依赖..."
npm install

echo "[2/5] 构建前端..."
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://blitzapi.hashpi.app}"
export VITE_REALTIME_BASE_URL="${VITE_REALTIME_BASE_URL:-wss://blitzapi.hashpi.app/ws/}"
npm run build:game

echo "[3/5] 清理旧前端文件..."
rm -rf "$FRONTEND_ROOT"/*

echo "[4/5] 发布新前端文件..."
cp -r apps/game-web/dist/* "$FRONTEND_ROOT"/

echo "[5/5] 前端部署完成"
