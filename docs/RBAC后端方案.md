# RBAC 后端权限管理系统方案（Node.js）

## 一、技术栈

### 1.1 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 24.x | 运行时 |
| Express | 4.x | Web框架 |
| Prisma | latest | ORM |
| PostgreSQL | 16.x | 数据库 |
| Redis | 8.x | 缓存 |
| JWT | jsonwebtoken | 认证 |
| bcrypt | 5.x | 密码加密 |

### 1.2 API 设计风格

**RESTful API** - 标准资源型接口

| HTTP方法 | 用途 | 示例 |
|----------|------|------|
| GET | 查询资源 | GET /api/users |
| POST | 创建资源 | POST /api/users |
| PUT | 更新资源 | PUT /api/users/:id |
| DELETE | 删除资源 | DELETE /api/users/:id |

### 1.3 项目组合

已选定组合：**Express + Prisma**（轻量、灵活、低门槛）

## 二、数据库设计

### 2.1 ER 图

```
┌─────────┐       ┌──────────────┐       ┌─────────┐
│  User   │──────<│  UserRole    │>──────│  Role   │
└─────────┘       └──────────────┘       └────┬────┘
                                              │
                                              │ 1:n
                                              │
                                       ┌──────┴──────┐
                                       │RolePermission│
                                       └──────────────┘
```

> ⚠️ 2026-06-28 重构：菜单表 `sys_menu` 和角色菜单关联表 `sys_role_menu` 已移除，改为 `sys_role_permission` 直接存储 permission 字符串。

### 2.2 表结构

```sql
-- 用户表
CREATE TABLE sys_user (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    username    VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password    VARCHAR(255) NOT NULL COMMENT '密码（加密）',
    nickname    VARCHAR(50) COMMENT '昵称',
    avatar      VARCHAR(255) COMMENT '头像',
    email       VARCHAR(100) COMMENT '邮箱',
    phone       VARCHAR(20) COMMENT '手机号',
    status      TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    dept_id     BIGINT COMMENT '部门ID',
    create_by   BIGINT COMMENT '创建者ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by   BIGINT COMMENT '更新者ID',
    update_time DATETIME ON UPDATE CURRENT_TIMESTAMP,
    deleted     TINYINT DEFAULT 0 COMMENT '删除标志',
    INDEX idx_username (username),
    INDEX idx_dept (dept_id),
    INDEX idx_status (status)
) COMMENT '用户表';

-- 角色表
CREATE TABLE sys_role (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    code        VARCHAR(50) NOT NULL UNIQUE COMMENT '角色代码',
    name        VARCHAR(50) NOT NULL COMMENT '角色名称',
    sort        INT DEFAULT 0 COMMENT '排序',
    description VARCHAR(255) COMMENT '描述',
    status      TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    create_by   BIGINT COMMENT '创建者ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by   BIGINT COMMENT '更新者ID',
    update_time DATETIME ON UPDATE CURRENT_TIMESTAMP,
    deleted     TINYINT DEFAULT 0 COMMENT '删除标志',
    INDEX idx_code (code),
    INDEX idx_status (status)
) COMMENT '角色表';

-- 菜单表（一棵树）
CREATE TABLE sys_menu (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    parent_id   BIGINT DEFAULT 0 COMMENT '父菜单ID',
    path        VARCHAR(200) COMMENT '路由路径',
    name        VARCHAR(50) NOT NULL COMMENT '菜单名称',
    icon        VARCHAR(50) COMMENT '图标',
    component   VARCHAR(200) COMMENT '组件路径',
    component_name VARCHAR(100) COMMENT '组件名称',
    redirect    VARCHAR(200) COMMENT '重定向地址',
    sort        INT DEFAULT 0 COMMENT '排序',
    type        TINYINT NOT NULL COMMENT '类型：0目录 1菜单 2按钮',
    title       VARCHAR(50) COMMENT '菜单标题',
    breadcrumb  TINYINT DEFAULT 1 COMMENT '是否显示面包屑',
    hidden       TINYINT DEFAULT 0 COMMENT '是否隐藏',
    keep_alive  TINYINT DEFAULT 1 COMMENT '是否缓存',
    affix       TINYINT DEFAULT 0 COMMENT '是否固定',
    permission  VARCHAR(100) COMMENT '权限标识',
    status      TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    create_by   BIGINT COMMENT '创建者ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by   BIGINT COMMENT '更新者ID',
    update_time DATETIME ON UPDATE CURRENT_TIMESTAMP,
    deleted     TINYINT DEFAULT 0 COMMENT '删除标志',
    INDEX idx_parent (parent_id),
    INDEX idx_type (type),
    INDEX idx_status (status)
) COMMENT '菜单表';

-- 用户-角色关联表
CREATE TABLE sys_user_role (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT NOT NULL COMMENT '用户ID',
    role_id     BIGINT NOT NULL COMMENT '角色ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_role (user_id, role_id),
    INDEX idx_user (user_id),
    INDEX idx_role (role_id)
) COMMENT '用户角色关联表';

-- 角色-菜单关联表
CREATE TABLE sys_role_menu (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id     BIGINT NOT NULL COMMENT '角色ID',
    menu_id     BIGINT NOT NULL COMMENT '菜单ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_menu (role_id, menu_id),
    INDEX idx_role (role_id),
    INDEX idx_menu (menu_id)
) COMMENT '角色菜单关联表';

> ⚠️ 2026-06-28 重构：`sys_menu` 和 `sys_role_menu` 表已移除，由上方的 `sys_role_permission` 替代。以下保留原始表结构作为历史参考。

-- 角色-权限关联表（2026-06-28 新增，替代 sys_role_menu）
CREATE TABLE sys_role_permission (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id     BIGINT NOT NULL COMMENT '角色ID',
    permission  VARCHAR(100) NOT NULL COMMENT '权限标识，如 user:list',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_permission (role_id, permission),
    INDEX idx_role (role_id)
) COMMENT '角色权限关联表';

-- 操作日志表
CREATE TABLE sys_log (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT COMMENT '用户ID',
    username    VARCHAR(50) COMMENT '用户名',
    module      VARCHAR(100) COMMENT '模块',
    action      VARCHAR(50) COMMENT '操作类型',
    method      VARCHAR(10) COMMENT '请求方法',
    url         VARCHAR(500) COMMENT '请求地址',
    ip          VARCHAR(50) COMMENT 'IP地址',
    location    VARCHAR(255) COMMENT '地理位置',
    params      TEXT COMMENT '请求参数',
    result      TEXT COMMENT '返回结果',
    status      TINYINT COMMENT '状态：0失败 1成功',
    error_msg   TEXT COMMENT '错误信息',
    duration    INT COMMENT '耗时(ms)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_module (module),
    INDEX idx_create_time (create_time)
) COMMENT '操作日志表';

-- 登录日志表
CREATE TABLE sys_login_log (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT COMMENT '用户ID',
    username    VARCHAR(50) COMMENT '用户名',
    ip          VARCHAR(50) COMMENT 'IP地址',
    location    VARCHAR(255) COMMENT '登录地点',
    device      VARCHAR(100) COMMENT '设备',
    browser     VARCHAR(100) COMMENT '浏览器',
    os          VARCHAR(100) COMMENT '操作系统',
    status      TINYINT COMMENT '状态：0失败 1成功',
    msg         VARCHAR(255) COMMENT '提示消息',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_username (username),
    INDEX idx_create_time (create_time)
) COMMENT '登录日志表';
```

## 三、项目目录结构

### 3.1 项目结构（Express + Prisma）

```
prisma/
└── schema.prisma            # 数据库模型定义
src/
├── config/
│   └── index.ts            # 配置文件
├── common/
│   ├── constants.ts        # 常量定义
│   ├── exception.ts        # 异常处理
│   ├── permissions.ts      # RoutePermissionGroup + ROUTE_ACTION_REGISTRY
│   └── response.ts         # 统一响应
├── middleware/
│   ├── auth.middleware.ts  # 认证中间件（JWT 验证 + 权限提取）
│   ├── permission.middleware.ts  # 权限中间件（requirePermission）
│   ├── error.middleware.ts # 全局错误处理
│   └── rate-limit.middleware.ts  # 登录限流
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.route.ts
│   ├── user/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── user.route.ts
│   ├── role/
│   │   ├── role.controller.ts
│   │   ├── role.service.ts
│   │   └── role.route.ts
│   └── log/
│       └── log.service.ts
├── prisma/
│   └── prisma.service.ts   # Prisma 客户端单例
├── seed/
│   └── seed.ts             # 数据库初始化种子
├── utils/
│   ├── jwt.ts              # JWT 工具
│   ├── password.ts         # 密码工具
│   └── redis.ts            # Redis 客户端
├── app.ts                  # 应用入口
└── server.ts               # 服务启动
```

### 3.2 企业方案（NestJS）

```
src/
├── common/
│   ├── decorators/         # 装饰器
│   ├── filters/           # 异常过滤器
│   ├── guards/            # 守卫
│   ├── interceptors/      # 拦截器
│   ├── pipes/             # 管道
│   └── utils/
├── config/
│   └── configuration.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/    # 认证策略
│   │   └── guards/
│   ├── user/
│   │   ├── user.module.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── entities/
│   │   └── dto/
│   ├── role/
│   ├── menu/
│   ├── dept/
│   └── log/
├── database/
│   └── migrations/         # 数据库迁移
└── main.ts
```

## 四、核心实现

### 4.1 用户认证（JWT）

```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken'
import { SECRET, EXPIRES_IN } from '@/config'

interface TokenPayload {
  userId: number
  username: string
  roles: string[]
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload
}
```

```typescript
// src/modules/auth/auth.service.ts
import { prisma } from '@/prisma/prisma.service'
import { generateToken, generateRefreshToken } from '@/utils/jwt'
import { comparePassword } from '@/utils/password'
import { UnauthorizedException } from '@/common/exception'
import redis from '@/utils/redis'

export class AuthService {
  async login(username: string, password: string, ip?: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { roles: { include: { role: true } } }
    })

    if (!user || !comparePassword(password, user.password)) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    if (user.status !== 1) {
      throw new UnauthorizedException('账号已被禁用')
    }

    const roles = user.roles.map(ur => ur.role.code)
    const token = generateToken({ userId: Number(user.id), username: user.username, roles })
    const refreshToken = generateRefreshToken({ userId: Number(user.id), username: user.username, roles })

    // 将 token 存入 Redis
    await redis.set(`token:${user.id}`, token, 'EX', 7200)

    return {
      token,
      refreshToken,
      userInfo: {
        id: Number(user.id),
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        email: user.email,
        roles
      }
    }
  }
}

export const authService = new AuthService()
```

### 4.2 权限验证（RBAC 中间件）

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '@/utils/jwt'
import { prisma } from '@/prisma/prisma.service'
import { UnauthorizedException } from '@/common/exception'

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: any
      permissions?: string[]
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new UnauthorizedException('未登录')

    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: BigInt(payload.userId) },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: true }
            }
          }
        }
      }
    })

    if (!user || user.status !== 1) throw new UnauthorizedException('用户不存在或已禁用')

    // 提取权限列表（从 sys_role_permission 表）
    const permissions = new Set<string>()
    user.roles.forEach(ur => {
      ur.role.permissions.forEach(rp => {
        permissions.add(rp.permission)
      })
    })

    req.user = user
    req.permissions = Array.from(permissions)
    next()
  } catch (error) {
    next(new UnauthorizedException('登录已过期，请重新登录'))
  }
}
```

### 4.3 权限校验中间件

```typescript
// src/middleware/permission.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { ForbiddenException } from '@/common/exception'

// 工厂函数：返回一个中间件，校验指定权限
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.permissions || []
    const hasPermission = permissions.some(p => userPermissions.includes(p))
    if (!hasPermission) throw new ForbiddenException('无权限访问')
    next()
  }
}
```

```typescript
// 路由中使用 - 通过中间件链式调用
// src/modules/user/user.route.ts
import { Router } from 'express'
import { authMiddleware } from '@/middleware/auth.middleware'
import { requirePermission } from '@/middleware/permission.middleware'

const router = Router()

// 所有接口都需要认证
router.use(authMiddleware)

// 各接口按需添加权限校验
router.get('/', requirePermission('user:list'), userController.list)
router.post('/', requirePermission('user:add'), userController.create)
router.put('/:id', requirePermission('user:edit'), userController.update)
router.delete('/:id', requirePermission('user:delete'), userController.remove)
```

### 4.4 角色分配权限

```typescript
// src/modules/role/role.service.ts
import { prisma } from '@/prisma/prisma.service'
import { NotFoundException } from '@/common/exception'
import {
  flattenPermissionGroups,
  groupPermissions,
  validatePermissionGroups,
  type RoutePermissionGroup
} from '@/common/permissions'

export class RoleService {
  // 获取角色权限（返回按路由分组的权限列表）
  async getPermissions(roleId: number): Promise<RoutePermissionGroup[]> {
    const rows = await prisma.rolePermission.findMany({
      where: { roleId: BigInt(roleId) },
      select: { permission: true }
    })
    return groupPermissions(rows.map(r => r.permission))
  }

  // 分配权限（前端传入路由权限分组，如 [{ name: 'User', permissions: ['list','add'] }]）
  async assignPermissions(roleId: number, groups: RoutePermissionGroup[]) {
    const normalized = validatePermissionGroups(groups)
    const flat = flattenPermissionGroups(normalized)

    // 事务：先删后增
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: BigInt(roleId) } })
      if (flat.length > 0) {
        await tx.rolePermission.createMany({
          data: flat.map(permission => ({ roleId: BigInt(roleId), permission }))
        })
      }
    })
    return { message: '权限分配成功' }
  }
}

export const roleService = new RoleService()
```

**权限分组规范**

```typescript
// src/common/permissions.ts
// 前端传入格式：以路由 name 分组，permissions 为动作短名
// 如 [{ name: 'User', permissions: ['list', 'add', 'edit', 'delete'] }]
// 后端自动拼接为 'user:list'、'user:add' 等完整权限标识
```

### 4.5 获取前端路由菜单

```typescript
// src/modules/menu/menu.service.ts
import { prisma } from '@/prisma/prisma.service'

export class MenuService {
  // 获取路由菜单（前端用于动态生成路由树）
  async getRoutes() {
    const menus = await prisma.menu.findMany({
      where: { status: 1, deleted: 0 },
      orderBy: { sort: 'asc' }
    })
    return this.buildTree(menus)
  }

  // 获取完整菜单树
  async getTree() {
    const menus = await prisma.menu.findMany({
      where: { deleted: 0 },
      orderBy: { sort: 'asc' }
    })
    return this.buildTree(menus)
  }

  private buildTree(menus: any[]) {
    const map = new Map<number, any>()
    const result: any[] = []

    menus.forEach(m => map.set(Number(m.id), { ...m, id: Number(m.id), children: [] }))
    menus.forEach(m => {
      const node = map.get(Number(m.id))!
      if (m.parentId === 0) {
        result.push(node)
      } else {
        map.get(Number(m.parentId))?.children.push(node)
      }
    })
    return result
  }
}

export const menuService = new MenuService()
```

## 五、API 接口设计

### 5.1 认证模块

| 接口 | 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|------|
| 登录 | POST | /api/auth/login | 用户登录 | 公开 |
| 登出 | POST | /api/auth/logout | 退出登录 | 需要认证 |
| 刷新Token | POST | /api/auth/refresh | 刷新Token | 需要认证 |
| 获取用户信息 | GET | /api/auth/userinfo | 获取当前用户信息 | 需要认证 |

**登录请求/响应**

```typescript
// POST /api/auth/login
// Request
{
  "username": "admin",
  "password": "123456"
}

// Response
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "avatar": "https://example.com/avatar.png",
      "roles": ["admin", "editor"]
    }
  }
}
```

### 5.2 用户模块

| 接口 | 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|------|
| 用户列表 | GET | /api/users | 分页查询用户 | user:list |
| 用户详情 | GET | /api/users/:id | 获取用户详情 | user:query |
| 新增用户 | POST | /api/users | 新增用户 | user:add |
| 修改用户 | PUT | /api/users/:id | 修改用户 | user:edit |
| 删除用户 | DELETE | /api/users/:id | 删除用户 | user:delete |
| 重置密码 | PUT | /api/users/:id/password | 重置密码 | user:resetPwd |
| 分配角色 | PUT | /api/users/:id/roles | 分配用户角色 | user:assign |

**用户列表请求/响应**

```typescript
// GET /api/users?page=1&size=10&username=admin&status=1
// Response
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "email": "admin@example.com",
      "status": 1,
      "roles": [{ "id": 1, "code": "admin", "name": "超级管理员" }],
      "createTime": "2024-01-01 10:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 5.3 角色模块

| 接口 | 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|------|
| 角色列表 | GET | /api/roles | 查询所有角色 | role:list |
| 角色详情 | GET | /api/roles/:id | 获取角色详情 | role:query |
| 新增角色 | POST | /api/roles | 新增角色 | role:add |
| 修改角色 | PUT | /api/roles/:id | 修改角色 | role:edit |
| 删除角色 | DELETE | /api/roles/:id | 删除角色 | role:delete |
| 获取权限 | GET | /api/roles/:id/permissions | 获取角色权限分组 | role:query |
| 分配权限 | POST | /api/roles/:id/permissions | 分配角色权限 | role:assign |

**分配权限请求/响应**

```typescript
// POST /api/roles/:id/permissions
// Request - 前端传入路由权限分组
[
  { "name": "User", "permissions": ["list", "add", "edit", "delete"] },
  { "name": "Role", "permissions": ["list", "add", "edit", "delete"] },
  { "name": "Menu", "permissions": ["list"] }
]

// 后端自动拼接为完整权限标识存入 sys_role_permission 表：
// user:list, user:add, user:edit, user:delete, role:list, ...

// Response
{ "code": 200, "message": "success", "data": { "message": "权限分配成功" } }
```

### 5.4 菜单模块（已移除）

> ⚠️ 2026-06-28 RolePermission 重构：菜单模块 `/api/menus/*` 已全部移除。前端路由由 `asyncRoutes.ts` 本地配置驱动，不再依赖后端菜单 API。菜单 CRUD 管理页面一并移除。

### 5.5 日志模块

| 接口 | 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|------|
| 登录日志 | GET | /api/logs/login | 登录日志列表 | log:list |
| 操作日志 | GET | /api/logs/operation | 操作日志列表 | log:list |
| 操作日志详情 | GET | /api/logs/operation/:id | 操作日志详情 | log:query |

## 六、安全策略

### 6.1 密码安全

```typescript
// src/utils/password.ts
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS)
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}
```

### 6.2 JWT 安全

```typescript
// 配置项
{
  SECRET: process.env.JWT_SECRET,      // 秘钥（足够随机）
  EXPIRES_IN: '2h',                     // 短期失效
  REFRESH_EXPIRES_IN: '7d',            // refresh token 长期
}
```

### 6.3 接口限流

```typescript
// src/middleware/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit'

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次
  message: { code: 429, message: '登录尝试过于频繁，请15分钟后再试' }
})

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 最多100次
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
})
```

### 6.4 SQL 注入防护

- 使用 ORM 的参数化查询
- 避免拼接 SQL
- 统一过滤特殊字符

### 6.5 XSS 防护

```typescript
// src/middleware/xss.middleware.ts
import helmet from 'helmet'

app.use(helmet()) // 设置安全头
app.use(xss())    // 过滤 XSS
```

## 七、部署架构

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (反向代理)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
        │  Node.js  │ │  Node.js │ │  Node.js │
        │  Server 1  │ │  Server 2 │ │  Server 3 │
        └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    │   (Session) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │  (主从复制)  │
                    └─────────────┘
```

## 八、实施步骤

### 第一阶段：项目初始化
1. 初始化 Node.js 项目
2. 安装依赖
3. 配置 TypeScript
4. 配置 ESLint / Prettier

### 第二阶段：数据库
1. 设计并创建数据库
2. 配置 Prisma/TypeORM
3. 创建实体模型
4. 编写数据库迁移脚本

### 第三阶段：认证模块
1. 实现登录/登出
2. JWT 签发与验证
3. 登录日志记录
4. Token 刷新机制

### 第四阶段：权限核心
1. 用户管理 CRUD
2. 角色管理 CRUD
3. 权限分配功能（RolePermission 模型）
4. 权限中间件（requirePermission）

### 第五阶段：日志与安全
1. 操作日志记录
2. 异常处理封装
3. 接口限流
4. 安全中间件

### 第六阶段：测试与部署
1. 单元测试
2. 接口测试
3. 性能优化
4. Docker 部署
