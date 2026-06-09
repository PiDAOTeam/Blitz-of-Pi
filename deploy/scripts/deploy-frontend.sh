#!/bin/bash

set -e

PROJECT_ROOT="/www/wwwroot/blitzapi.hashpi.app"
GAME_FRONTEND_ROOT="/www/wwwroot/blitz.hashpi.app"
ADMIN_FRONTEND_ROOT="/www/wwwroot/blitzadmin.hashpi.app"

cd "$PROJECT_ROOT"

echo "[1/7] 安装依赖..."
npm install

echo "[2/7] 构建用户端..."
rm -rf apps/game-web/dist
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://blitzapi.hashpi.app}"
export VITE_REALTIME_BASE_URL="${VITE_REALTIME_BASE_URL:-wss://blitzapi.hashpi.app/ws/}"
npm run build:game

echo "[3/7] 构建后台管理..."
rm -rf apps/admin-web/dist
npm run build:admin

echo "[4/7] 准备发布目录..."
mkdir -p "$GAME_FRONTEND_ROOT"
mkdir -p "$ADMIN_FRONTEND_ROOT"

echo "[5/7] 发布用户端，保留 validation-key.txt 和 .user.ini..."
find "$GAME_FRONTEND_ROOT" -mindepth 1 -maxdepth 1 ! -name "validation-key.txt" ! -name ".user.ini" -exec rm -rf {} +
cp -r apps/game-web/dist/* "$GAME_FRONTEND_ROOT"/

echo "[6/7] 发布后台管理，保留 .user.ini..."
find "$ADMIN_FRONTEND_ROOT" -mindepth 1 -maxdepth 1 ! -name ".user.ini" -exec rm -rf {} +
cp -r apps/admin-web/dist/* "$ADMIN_FRONTEND_ROOT"/

echo "[7/7] 前台和后台部署完成"
