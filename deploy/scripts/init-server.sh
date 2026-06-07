#!/bin/bash

set -e

PROJECT_ROOT="/www/wwwroot/blitzapi.hashpi.app"
GAME_FRONTEND_ROOT="/www/wwwroot/blitz.hashpi.app"
ADMIN_FRONTEND_ROOT="/www/wwwroot/blitzadmin.hashpi.app"

echo "[1/5] 创建基础目录..."
mkdir -p "$PROJECT_ROOT"
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$PROJECT_ROOT/data"
mkdir -p "$GAME_FRONTEND_ROOT"
mkdir -p "$ADMIN_FRONTEND_ROOT"
chmod 700 "$PROJECT_ROOT/logs" "$PROJECT_ROOT/data"

echo "[2/5] 确认 Node 版本..."
node -v
npm -v

echo "[3/5] 创建前端与后端目录完成"
echo "后端目录: $PROJECT_ROOT"
echo "用户端目录: $GAME_FRONTEND_ROOT"
echo "后台目录: $ADMIN_FRONTEND_ROOT"

echo "[4/5] 请确认已经上传项目文件到后端目录"
echo "[5/5] 初始化脚本执行完成"
