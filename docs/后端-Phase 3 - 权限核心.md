# 后端-Phase 3：权限核心（2天）

> 所属项目：RBAC 权限管理系统
> 执行顺序：后端第3阶段
> 预计耗时：2天
> 前置依赖：后端-Phase 2 - 认证模块
> 下一阶段：后端-Phase 4 - 测试验收
>
> **⚠️ 2026-06-28 架构变更**：权限模型已从 Menu 驱动改为 RolePermission 驱动，详见 [改造方案-后端-RolePermission落地方案.md](改造方案-后端-RolePermission落地方案.md)。本文档保留历史记录，实际实现以改造方案为准。

---

## 目标

实现用户管理、角色管理、菜单管理的完整CRUD，权限分配功能，权限中间件。

---

## 任务清单

| 序号 | 任务 | 验收标准 |
|------|------|----------|
| 3.1 | 用户CRUD | 列表/详情/新增/编辑/删除 |
| 3.2 | 用户角色分配 | PUT /api/users/:id/roles |
| 3.3 | 用户重置密码 | PUT /api/users/:id/password |
| 3.4 | 角色CRUD | 列表/详情/新增/编辑/删除 |
| 3.5 | 角色权限分配 | ~~POST /api/roles/:id/menus~~ → **POST /api/roles/:id/permissions** |
| 3.6 | 获取角色权限 | ~~GET /api/roles/:id/menus~~ → **GET /api/roles/:id/permissions** |
| 3.7 | ~~菜单CRUD~~ | ❌ 已移除（RolePermission 重构） |
| 3.8 | ~~用户路由接口~~ | ❌ 已移除（前端 asyncRoutes 驱动） |
| 3.9 | 权限中间件 | requirePermission中间件 |
| 3.10 | 操作日志 | 记录关键操作到sys_log |
| 3.11 | ~~菜单初始化数据~~ | ❌ 已移除（seed 改用 RolePermission） |

---

## API接口汇总

### 用户模块 /api/users

| 接口 | 方法 | 权限 |
|------|------|------|
| GET / | user:list |
| GET /:id | user:query |
| POST / | user:add |
| PUT /:id | user:edit |
| DELETE /:id | user:delete |
| PUT /:id/roles | user:assign |
| PUT /:id/password | user:resetPwd |

### 角色模块 /api/roles

| 接口 | 方法 | 权限 |
|------|------|------|
| GET / | role:list |
| GET /:id | role:query |
| POST / | role:add |
| PUT /:id | role:edit |
| DELETE /:id | role:delete |
| GET /:id/permissions | role:query |
| POST /:id/permissions | role:assign |

> ⚠️ 菜单模块 `/api/menus/*` 已移除（2026-06-28 RolePermission 重构），权限分配改为 `RoutePermissionGroup[]` 格式。

---

## 目录结构

```
backend/src/
├── common/
│   └── permissions.ts           # RoutePermissionGroup + ROUTE_ACTION_REGISTRY
├── modules/
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
├── middleware/
│   ├── auth.middleware.ts        # 从 RolePermission 聚合权限
│   └── permission.middleware.ts
└── seed/
    └── seed.ts                   # 从 ALL_PERMISSIONS 创建权限
```

---

## 核心代码要点

### permission.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express'
import { ForbiddenException } from '@/common/exception'

export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.permissions || []
    const hasPermission = permissions.every(p => userPermissions.includes(p))
    if (!hasPermission) throw new ForbiddenException('无权限访问')
    next()
  }
}
```

### 菜单树构建算法

```typescript
// menu.service.ts
buildMenuTree(menus: Menu[]) {
  const map = new Map<number, any>()
  const result: any[] = []

  menus.forEach(menu => {
    map.set(menu.id, { ...menu, children: [] })
  })

  menus.forEach(menu => {
    const node = map.get(menu.id)!
    if (menu.parentId === 0) {
      result.push(node)
    } else {
      const parent = map.get(menu.parentId)
      if (parent) parent.children.push(node)
    }
  })

  // 按sort排序
  const sortTree = (nodes: any[]) => {
    nodes.sort((a, b) => a.sort - b.sort)
    nodes.forEach(n => {
      if (n.children?.length) sortTree(n.children)
    })
  }
  sortTree(result)

  return result
}
```

### 角色权限分配（事务 + RoutePermissionGroup）

```typescript
// role.service.ts
async assignPermissions(roleId: number, groups: RoutePermissionGroup[]) {
  const normalized = validatePermissionGroups(groups)
  const flat = flattenPermissionGroups(normalized)

  return prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId: BigInt(roleId) } })
    if (flat.length > 0) {
      await tx.rolePermission.createMany({
        data: flat.map(permission => ({ roleId: BigInt(roleId), permission }))
      })
    }
    return { message: '权限分配成功' }
  })
}
```

> ⚠️ 旧版 `assignMenus`（基于 menuIds）已移除，权限现在以 `RoutePermissionGroup[]` 格式传入（如 `[{ name: 'User', permissions: ['list', 'add'] }]`），后端自动转为 `user:list`、`user:add` 存入 `sys_role_permission`。详见 [common/permissions.ts](../backend/src/common/permissions.ts)。

---

## 权限初始化数据（RolePermission 重构后）

seed.ts 使用 `ALL_PERMISSIONS` 为 admin 角色绑定全部权限：

```typescript
import { ALL_PERMISSIONS } from '@/common/permissions'

// admin 角色绑定全部权限
await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } })
await prisma.rolePermission.createMany({
  data: ALL_PERMISSIONS.map(permission => ({
    roleId: adminRole.id,
    permission
  }))
})

// user 角色绑定只读权限
const READONLY_PERMISSIONS = ['user:list', 'user:query', 'role:list', 'role:query']
await prisma.rolePermission.createMany({
  data: READONLY_PERMISSIONS.map(permission => ({
    roleId: userRole.id,
    permission
  }))
})
```

> ⚠️ 旧版菜单初始化（Menu 创建 + RoleMenu 分配）已移除。

---

## 挂载路由

```typescript
// app.ts
import userRoutes from '@/modules/user/user.route'
import roleRoutes from '@/modules/role/role.route'

app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
// ⚠️ menu 模块已移除（RolePermission 重构）
```

---

## 验证方法

```bash
# 1. 启动服务
pnpm dev

# 2. 初始化权限数据
pnpm seed

# 3. 测试各接口（使用admin token）

# 用户列表
curl http://localhost:3000/api/users?page=1&size=10 \
  -H "Authorization: Bearer {token}"

# 角色列表
curl http://localhost:3000/api/roles \
  -H "Authorization: Bearer {token}"

# 角色权限
curl http://localhost:3000/api/roles/1/permissions \
  -H "Authorization: Bearer {token}"
```

---

## 本阶段交付物

- [x] 用户模块（7个接口）
- [x] 角色模块（7个接口）
- [x] 菜单模块（7个接口）
- [x] 权限中间件
- [x] 菜单初始化数据
- [x] 操作日志记录

---

## 下一阶段

完成后进入 **后端-Phase 4 - 测试验收**。

---

## 参考文档

- [RBAC后端方案.md](RBAC后端方案.md)
- [后端-Phase 2 - 认证模块.md](后端-Phase%202%20-%20认证模块.md)