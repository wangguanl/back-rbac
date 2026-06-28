# 后端-Phase 1：基础搭建（1天）

> 所属项目：RBAC 权限管理系统
> 执行顺序：后端第1阶段
> 预计耗时：1天
> 前置依赖：Phase 0 - 环境准备
> 下一阶段：后端-Phase 2 - 认证模块

---

## 目标

初始化 Express + Prisma 项目，创建数据库模型，封装基础工具函数和中间件。

---

## 技术选型确认

| 项目 | 选型 |
|------|------|
| 运行时 | Node.js v24.x |
| 包管理器 | pnpm 10.x |
| 框架 | Express 4.x |
| ORM | Prisma (latest) |
| 数据库 | PostgreSQL 16.x |
| 缓存 | Redis 8.x |
| 认证 | JWT (jsonwebtoken) |
| 加密 | bcryptjs |

---

## 任务清单

| 序号 | 任务 | 验收标准 |
|------|------|----------|
| 1.1 | 初始化npm项目 | package.json 创建 |
| 1.2 | 安装核心依赖 | express, prisma, typescript 等 |
| 1.3 | TypeScript配置 | tsconfig.json 编译成功 |
| 1.4 | Prisma初始化 | schema.prisma 创建 |
| 1.5 | 创建7张数据表 | prisma migrate dev 成功 |
| 1.6 | 配置文件 | 数据库、JWT、Redis配置完成 |
| 1.7 | 工具函数 | JWT、密码、统一响应封装 |
| 1.8 | 异常处理 | 自定义异常类 + 错误中间件 |
| 1.9 | Express应用 | 服务可启动 |
| 1.10 | 健康检查接口 | GET /api/health 返回正常 |

---

## 目录结构

```
backend/
├── prisma/
│   ├── schema.prisma          # Prisma 数据模型
│   └── migrations/            # 数据库迁移
├── src/
│   ├── config/
│   │   ├── index.ts           # 配置入口
│   │   ├── database.ts        # 数据库配置
│   │   └── jwt.ts             # JWT配置
│   │   └── redis.ts           # Redis配置
│   ├── common/
│   │   ├── exception.ts       # 自定义异常
│   │   ├── constants.ts       # 常量定义
│   │   └── response.ts        # 统一响应格式
│   ├── middleware/
│   │   └── error.middleware.ts # 错误处理
│   ├── utils/
│   │   ├── jwt.ts             # JWT工具
│   │   ├── password.ts        # 密码加密
│   │   └── redis.ts           # Redis工具
│   ├── prisma/
│   │   └── prisma.service.ts  # Prisma服务
│   ├── app.ts                 # Express应用
│   └── server.ts              # 服务启动
├── .env                       # 环境变量
├── tsconfig.json
├── package.json
└── .eslintrc.js
```

---

## 执行步骤

### 步骤1：项目初始化

```bash
cd /Applications/My/Demo/Vue/后台RBAC

# 创建后端目录
mkdir -p backend
cd backend

# 初始化npm项目
npm init -y

# 安装核心依赖
npm install express cors jsonwebtoken bcryptjs ioredis dotenv

# 安装开发依赖
npm install -D typescript ts-node-dev @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs prisma eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### 步骤2：TypeScript配置

```bash
# 初始化TypeScript
npx tsc --init
```

修改 tsconfig.json：
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 步骤3：Prisma初始化

```bash
# 初始化Prisma
npx prisma init --datasource-provider postgresql

# 生成Prisma Client
npx prisma generate
```

### 步骤4：创建数据库模型

编辑 prisma/schema.prisma：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户表
model User {
  id         BigInt   @id @default(autoincrement())
  username   String   @unique @db.VarChar(50)
  password   String   @db.VarChar(255)
  nickname   String?  @db.VarChar(50)
  avatar     String?  @db.VarChar(255)
  email      String?  @db.VarChar(100)
  phone      String?  @db.VarChar(20)
  status     Int      @default(1)
  deptId     BigInt?  @map("dept_id")
  createBy   BigInt?  @map("create_by")
  createTime DateTime @default(now()) @map("create_time")
  updateBy   BigInt?  @map("update_by")
  updateTime DateTime? @updatedAt @map("update_time")
  deleted    Int      @default(0)

  roles      UserRole[]
  @@map("sys_user")
}

// 角色表
model Role {
  id          BigInt   @id @default(autoincrement())
  code        String   @unique @db.VarChar(50)
  name        String   @db.VarChar(50)
  sort        Int      @default(0)
  description String?  @db.VarChar(255)
  status      Int      @default(1)
  createBy    BigInt?  @map("create_by")
  createTime  DateTime @default(now()) @map("create_time")
  updateBy    BigInt?  @map("update_by")
  updateTime  DateTime? @updatedAt @map("update_time")
  deleted     Int      @default(0)

  users       UserRole[]
  menus       RoleMenu[]

  @@map("sys_role")
}

// 菜单表
model Menu {
  id             BigInt   @id @default(autoincrement())
  parentId       BigInt   @default(0) @map("parent_id")
  path           String?  @db.VarChar(200)
  name           String   @db.VarChar(50)
  icon           String?  @db.VarChar(50)
  component      String?  @db.VarChar(200)
  componentName  String?  @db.VarChar(100) @map("component_name")
  redirect       String?  @db.VarChar(200)
  sort           Int      @default(0)
  type           Int     @default(0) // 0:目录 1:菜单 2:按钮
  title          String?  @db.VarChar(50)
  breadcrumb     Int      @default(1)
  hidden         Int      @default(0)
  keepAlive      Int      @default(1) @map("keep_alive")
  affix          Int      @default(0)
  permission     String?  @db.VarChar(100)
  status         Int      @default(1)
  createBy       BigInt?  @map("create_by")
  createTime     DateTime @default(now()) @map("create_time")
  updateBy       BigInt?  @map("update_by")
  updateTime     DateTime? @updatedAt @map("update_time")
  deleted        Int      @default(0)

  roles          RoleMenu[]

  @@map("sys_menu")
}

// 用户-角色关联表
model UserRole {
  id         BigInt   @id @default(autoincrement())
  userId     BigInt   @map("user_id")
  roleId     BigInt   @map("role_id")
  createTime DateTime @default(now()) @map("create_time")

  user       User     @relation(fields: [userId], references: [id])
  role       Role     @relation(fields: [roleId], references: [id])

  @@unique([userId, roleId])
  @@map("sys_user_role")
}

// 角色-菜单关联表
model RoleMenu {
  id         BigInt   @id @default(autoincrement())
  roleId     BigInt   @map("role_id")
  menuId     BigInt   @map("menu_id")
  createTime DateTime @default(now()) @map("create_time")

  role       Role     @relation(fields: [roleId], references: [id])
  menu       Menu     @relation(fields: [menuId], references: [id])

  @@unique([roleId, menuId])
  @@map("sys_role_menu")
}

// 操作日志表
model SysLog {
  id         BigInt   @id @default(autoincrement())
  userId     BigInt?  @map("user_id")
  username   String?  @db.VarChar(50)
  module     String?  @db.VarChar(100)
  action     String?  @db.VarChar(50)
  method     String?  @db.VarChar(10)
  url        String?  @db.VarChar(500)
  ip         String?  @db.VarChar(50)
  location   String?  @db.VarChar(255)
  params     String?  @db.Text
  result     String?  @db.Text
  status     Int?
  errorMsg   String?  @db.Text @map("error_msg")
  duration   Int?
  createTime DateTime @default(now()) @map("create_time")

  @@map("sys_log")
}

// 登录日志表
model SysLoginLog {
  id         BigInt   @id @default(autoincrement())
  userId     BigInt?  @map("user_id")
  username   String?  @db.VarChar(50)
  ip         String?  @db.VarChar(50)
  location   String?  @db.VarChar(255)
  device     String?  @db.VarChar(100)
  browser    String?  @db.VarChar(100)
  os         String?  @db.VarChar(100)
  status     Int?
  msg        String?  @db.VarChar(255)
  createTime DateTime @default(now()) @map("create_time")

  @@map("sys_login_log")
}
```

### 步骤5：执行数据库迁移

```bash
# 创建迁移
npx prisma migrate dev --name init

# 这会：
# 1. 创建数据库表
# 2. 生成Prisma Client
# 3. 创建迁移记录
```

### 步骤6：环境变量配置

创建 .env 文件：
```bash
# 数据库
DATABASE_URL="postgresql://postgres:password@localhost:5432/rbac_db?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# 服务
PORT=3000
NODE_ENV=development
```

### 步骤7：创建核心文件

按照以下顺序创建文件（每个文件的具体代码见下方）：

1. src/config/index.ts - 配置入口
2. src/common/response.ts - 统一响应
3. src/common/exception.ts - 自定义异常
4. src/utils/jwt.ts - JWT工具
5. src/utils/password.ts - 密码工具
6. src/prisma/prisma.service.ts - Prisma服务
7. src/middleware/error.middleware.ts - 错误中间件
8. src/app.ts - Express应用
9. src/server.ts - 服务启动

---

## 核心代码文件

### config/index.ts

```typescript
import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL!
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined
  }
}
```

### common/response.ts

```typescript
export class Result<T = any> {
  code: number
  message: string
  data?: T
  pagination?: {
    page: number
    size: number
    total: number
    totalPages: number
  }

  static success<T>(data?: T, message = 'success'): Result<T> {
    const result = new Result<T>()
    result.code = 200
    result.message = message
    result.data = data
    return result
  }

  static page<T>(list: T[], pagination: { page: number; size: number; total: number; totalPages: number }, message = 'success'): Result<T[]> {
    const result = new Result<T[]>()
    result.code = 200
    result.message = message
    result.data = list
    result.pagination = pagination
    return result
  }

  static error(code: number, message: string): Result {
    const result = new Result()
    result.code = code
    result.message = message
    return result
  }
}
```

### common/exception.ts

```typescript
export class BusinessException extends Error {
  code: number
  message: string

  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.message = message
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(message = '未授权') {
    super(401, message)
  }
}

export class ForbiddenException extends BusinessException {
  constructor(message = '无权限') {
    super(403, message)
  }
}

export class NotFoundException extends BusinessException {
  constructor(message = '资源不存在') {
    super(404, message)
  }
}

export class BadRequestException extends BusinessException {
  constructor(message = '请求参数错误') {
    super(400, message)
  }
}
```

### utils/jwt.ts

```typescript
import jwt from 'jsonwebtoken'
import { config } from '@/config'

export interface TokenPayload {
  userId: number
  username: string
  roles: string[]
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.refreshExpiresIn })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload
}
```

### utils/password.ts

```typescript
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS)
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}
```

### prisma/prisma.service.ts

```typescript
import { PrismaClient } from '@prisma/client'

export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    })
  }
}

export const prisma = new PrismaService()
```

### middleware/error.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express'
import { BusinessException } from '@/common/exception'
import { Result } from '@/common/response'

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err)

  if (err instanceof BusinessException) {
    res.json(Result.error(err.code, err.message))
  } else if (err.name === 'UnauthorizedError') {
    res.json(Result.error(401, 'Token无效'))
  } else {
    res.status(500).json(Result.error(500, process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'))
  }
}
```

### app.ts

```typescript
import express from 'express'
import cors from 'cors'
import { errorHandler } from '@/middleware/error.middleware'

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'ok', data: { status: 'running', timestamp: new Date().toISOString() } })
})

// 错误处理
app.use(errorHandler)

export default app
```

### server.ts

```typescript
import app from './app'
import { config } from '@/config'

app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`)
  console.log(`📝 Environment: ${config.nodeEnv}`)
})
```

### package.json scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

---

## 验证方法

```bash
# 1. 启动开发服务
cd backend
pnpm dev

# 2. 测试健康检查接口
curl http://localhost:3000/api/health
# 预期: {"code":200,"message":"ok","data":{"status":"running","timestamp":"..."}}

# 3. 检查数据库连接
pnpm prisma:studio
# 打开浏览器查看数据库表

# 4. 检查Prisma Client
pnpm prisma:generate
# 无报错
```

---

## 本阶段交付物

- [x] Express + TypeScript 项目框架
- [x] Prisma 数据模型（7张表）
- [x] 配置文件（数据库、JWT、Redis）
- [x] 工具函数（JWT、密码）
- [x] 统一响应格式
- [x] 统一异常处理
- [x] 健康检查接口
- [x] 数据库迁移完成

---

## 下一阶段

完成后进入 **后端-Phase 2 - 认证模块**，实现登录、登出、JWT认证等功能。

---

## 参考文档

- [RBAC后端方案.md](RBAC后端方案.md)
- [Phase 0 - 环境准备.md](Phase%200%20-%20环境准备.md)