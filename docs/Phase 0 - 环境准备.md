# Phase 0：环境准备（0.5天）

> 所属项目：RBAC 权限管理系统
> 预计耗时：0.5天
> 依赖：无
> 下一阶段：后端-Phase 1 - 基础搭建

---

## 目标

搭建开发环境，准备数据库，创建项目目录结构。

---

## 技术选型（已确认）

| 项目 | 选型 | 说明 |
|------|------|------|
| 后端框架 | Express + Prisma | 轻量、灵活、低门槛 |
| 数据库 | PostgreSQL | 功能强大的开源关系型数据库 |
| 缓存 | Redis | 用于缓存Session、用户权限等 |
| 前端框架 | Vue 3 + TypeScript + Vite | 核心前端技术栈 |
| UI组件库 | Element Plus | 企业级UI组件库 |

---

## 已完成环境

| 环境 | 版本 | 状态 | 验证命令 |
|------|------|------|----------|
| Node.js | v24.14.0 | ✅ 已安装 | `node -v` |
| pnpm | 10.32.1 | ✅ 已安装 | `pnpm -v` |
| Redis | 8.4.0 | ✅ 已安装 | `redis-server --version` |

---

## 待完成任务

| 序号 | 任务 | 详细说明 | 验收标准 |
|------|------|----------|----------|
| 0.1 | PostgreSQL安装 | 安装 PostgreSQL 16.x | `psql --version` 显示 16.x |
| 0.2 | 数据库初始化 | 创建数据库 `rbac_db` | `\l` 可见 rbac_db |
| 0.3 | 项目目录创建 | 创建 backend/ frontend/ 目录 | 目录结构存在 |
| 0.4 | 配置文件创建 | 创建 .env 模板文件 | 文件内容正确 |

---

## 项目目录结构

```
后台RBAC/
├── backend/              # 后端项目（Express + Prisma）
├── frontend/             # 前端项目（Vue 3 + Vite）
└── docs/                 # 文档目录
```

---

## 执行步骤

### 步骤1：PostgreSQL安装

```bash
# macOS 使用 Homebrew
brew install postgresql@16

# 启动服务
brew services start postgresql@16

# 验证安装
psql --version
```

### 步骤2：创建数据库

```bash
# 创建数据库
psql -U postgres -c "CREATE DATABASE rbac_db;"

# 验证数据库
psql -U postgres -c "\l" | grep rbac_db
```

### 步骤3：创建项目目录

```bash
cd /Applications/My/Demo/Vue/后台RBAC

# 创建前后端目录
mkdir -p backend frontend
```

### 步骤4：启动Redis（如未运行）

```bash
# 启动Redis服务
redis-server

# 或使用brew services
brew services start redis

# 验证连接
redis-cli ping
# 输出: PONG

# 或查看版本
redis-server --version
# 输出: Redis server v=8.4.0
```

---

## 关键配置

### 后端配置文件模板

```bash
# backend/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/rbac_db?schema=public"

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development
```

---

## 本阶段交付物

- [ ] PostgreSQL 16.x 安装并启动
- [ ] 数据库 `rbac_db` 创建完成
- [ ] backend/ 目录创建
- [ ] frontend/ 目录创建
- [ ] Redis 服务运行

---

## 下一阶段衔接

完成本阶段后，进入 **后端-Phase 1 - 基础搭建**，初始化 Express + Prisma 项目。

---

## 参考文档

- [RBAC后端方案.md](RBAC后端方案.md)
- [progress.md](progress.md)
