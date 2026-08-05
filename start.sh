#!/bin/bash

# 启动后端和前端服务
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "正在停止服务..."
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" 2>/dev/null
  wait "$FRONTEND_PID" 2>/dev/null
  echo "服务已停止"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "=========================================="
echo "  RBAC 权限管理系统 - 启动中..."
echo "=========================================="

# 启动后端 (PostgreSQL 由后端自动检测并启动)
echo "[1/2] 启动后端服务 (端口 3000)..."
cd "$PROJECT_DIR/backend"
pnpm dev &
BACKEND_PID=$!
cd "$PROJECT_DIR"

# 启动前端
echo "[2/2] 启动前端服务 (端口 5173)..."
cd "$PROJECT_DIR/frontend"
pnpm dev &
FRONTEND_PID=$!
cd "$PROJECT_DIR"

echo ""
echo "=========================================="
echo "  后端 API: http://localhost:3000"
echo "  前端页面: http://localhost:5173"
echo "  按 Ctrl+C 停止所有服务"
echo "=========================================="

wait