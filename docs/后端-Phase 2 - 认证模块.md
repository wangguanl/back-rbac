# 后端-Phase 2：认证模块（1天）

> 所属项目：RBAC 权限管理系统
> 执行顺序：后端第2阶段
> 预计耗时：1天
> 前置依赖：后端-Phase 1 - 基础搭建
> 下一阶段：后端-Phase 3 - 权限核心

---

## 目标

实现用户登录、登出、JWT认证、用户信息获取、Token刷新、登录日志记录、接口限流。

---

## 任务清单

| 序号 | 任务 | 验收标准 |
|------|------|----------|
| 2.1 | Auth模块结构 | controller/service/route 创建 |
| 2.2 | 登录接口 | POST /api/auth/login 返回token |
| 2.3 | 登出接口 | POST /api/auth/logout 清除会话 |
| 2.4 | 用户信息接口 | GET /api/auth/userinfo 返回用户和权限 |
| 2.5 | Token刷新接口 | POST /api/auth/refresh 返回新token |
| 2.6 | 认证中间件 | auth.middleware.ts 验证JWT |
| 2.7 | 登录日志 | 记录登录成功/失败到sys_login_log |
| 2.8 | 接口限流 | 登录接口5次/15分钟 |
| 2.9 | 初始化数据 | 创建admin账号和角色 |
| 2.10 | 接口测试 | 全部认证接口通过 |

---

## API接口设计

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 登录 | POST | /api/auth/login | 用户登录，返回token |
| 登出 | POST | /api/auth/logout | 退出登录 |
| 用户信息 | GET | /api/auth/userinfo | 获取当前用户信息和权限 |
| 刷新Token | POST | /api/auth/refresh | 刷新access_token |

---

## 目录结构

```
backend/src/
├── modules/
│   └── auth/
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       └── auth.route.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── rate-limit.middleware.ts
├── modules/
│   └── log/
│       └── log.service.ts
└── seed/
    └── seed.ts
```

---

## 核心代码要点

### auth.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '@/utils/jwt'
import { prisma } from '@/prisma/prisma.service'
import { UnauthorizedException, BusinessException } from '@/common/exception'

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
      where: { id: payload.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                menus: { include: { menu: true } }
              }
            }
          }
        }
      }
    })

    if (!user || user.status !== 1) throw new UnauthorizedException('用户不存在或已禁用')

    const permissions = new Set<string>()
    user.roles.forEach(ur => {
      ur.role.menus.forEach(rm => {
        if (rm.menu.permission) permissions.add(rm.menu.permission)
      })
    })

    req.user = user
    req.permissions = Array.from(permissions)
    next()
  } catch (error) {
    // JWT 过期或无效时，统一返回 401
    if (error instanceof BusinessException) {
      next(error)
    } else {
      next(new UnauthorizedException('登录已过期，请重新登录'))
    }
  }
}
```

### auth.service.ts

```typescript
import { prisma } from '@/prisma/prisma.service'
import { generateToken, generateRefreshToken } from '@/utils/jwt'
import { comparePassword } from '@/utils/password'
import { UnauthorizedException } from '@/common/exception'

export class AuthService {
  async login(username: string, password: string, ip?: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { roles: { include: { role: true } } }
    })

    if (!user || !comparePassword(password, user.password)) {
      await this.recordLoginLog(null, username, ip, 0, '用户名或密码错误')
      throw new UnauthorizedException('用户名或密码错误')
    }

    if (user.status !== 1) {
      await this.recordLoginLog(user.id, username, ip, 0, '账号已被禁用')
      throw new UnauthorizedException('账号已被禁用')
    }

    const roles = user.roles.map(ur => ur.role.code)
    const token = generateToken({ userId: user.id, username: user.username, roles })
    const refreshToken = generateRefreshToken({ userId: user.id, username: user.username, roles })

    await this.recordLoginLog(user.id, username, ip, 1, '登录成功')

    return {
      token,
      refreshToken,
      userInfo: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, email: user.email, roles }
    }
  }

  async getUserInfo(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: { menus: { include: { menu: true } } }
            }
          }
        }
      }
    })

    if (!user) throw new UnauthorizedException('用户不存在')

    const roles = user.roles.map(ur => ur.role.code)
    const permissions = new Set<string>()
    user.roles.forEach(ur => {
      ur.role.menus.forEach(rm => {
        if (rm.menu.permission) permissions.add(rm.menu.permission)
      })
    })

    return {
      id: user.id, username: user.username, nickname: user.nickname,
      avatar: user.avatar, email: user.email, phone: user.phone,
      roles, permissions: Array.from(permissions)
    }
  }

  async recordLoginLog(userId: number | null, username: string, ip: string | undefined, status: number, msg: string) {
    await prisma.sysLoginLog.create({
      data: { userId, username, ip, status, msg }
    })
  }
}
```

### auth.route.ts

```typescript
import { Router } from 'express'
import { AuthController } from './auth.controller'
import { authMiddleware } from '@/middleware/auth.middleware'
import { loginLimiter } from '@/middleware/rate-limit.middleware'

const router = Router()
const controller = new AuthController()

router.post('/login', loginLimiter, controller.login)
router.post('/logout', authMiddleware, controller.logout)
router.get('/userinfo', authMiddleware, controller.getUserInfo)
router.post('/refresh', controller.refreshToken)

export default router
```

---

## 初始化数据脚本

```typescript
// src/seed/seed.ts
import { prisma } from '@/prisma/prisma.service'
import { hashPassword } from '@/utils/password'

async function main() {
  // 创建超级管理员角色
  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: {},
    create: { code: 'admin', name: '超级管理员', description: '拥有所有权限', sort: 1 }
  })

  // 创建超级管理员用户
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashPassword('123456'),
      nickname: '超级管理员',
      email: 'admin@example.com',
      status: 1
    }
  })

  // 分配角色
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id }
  })

  console.log('✅ 初始化数据完成')
  console.log('账号: admin, 密码: 123456')
}

main().finally(() => prisma.$disconnect())
```

添加脚本到package.json：
```json
{
  "scripts": {
    "seed": "ts-node src/seed/seed.ts"
  }
}
```

---

## 挂载路由

在 app.ts 中添加：
```typescript
import authRoutes from '@/modules/auth/auth.route'

app.use('/api/auth', authRoutes)
```

---

## 验证方法

```bash
# 1. 启动服务
pnpm dev

# 2. 执行初始化数据
pnpm seed

# 3. 测试登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# 4. 测试获取用户信息
curl http://localhost:3000/api/auth/userinfo \
  -H "Authorization: Bearer {token}"
```

---

## 本阶段交付物

- [x] Auth 模块完整
- [x] 4个认证接口
- [x] 认证中间件
- [x] 登录限流中间件
- [x] 登录日志记录
- [x] 初始化数据脚本

---

## 下一阶段

完成后进入 **后端-Phase 3 - 权限核心**。

---

## 参考文档

- [RBAC后端方案.md](RBAC后端方案.md)
- [后端-Phase 1 - 基础搭建.md](后端-Phase%201%20-%20基础搭建.md)