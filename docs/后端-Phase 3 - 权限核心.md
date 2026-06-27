# 后端-Phase 3：权限核心（2天）

> 所属项目：RBAC 权限管理系统
> 执行顺序：后端第3阶段
> 预计耗时：2天
> 前置依赖：后端-Phase 2 - 认证模块
> 下一阶段：后端-Phase 4 - 测试验收

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
| 3.5 | 角色权限分配 | POST /api/roles/:id/menus |
| 3.6 | 获取角色菜单 | GET /api/roles/:id/menus |
| 3.7 | 菜单CRUD | 树/列表/详情/新增/编辑/删除 |
| 3.8 | 用户路由接口 | GET /api/menus/routes |
| 3.9 | 权限中间件 | requirePermission中间件 |
| 3.10 | 操作日志 | 记录关键操作到sys_log |
| 3.11 | 菜单初始化数据 | 创建系统管理菜单 |

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
| GET /:id/menus | role:query |
| POST /:id/menus | role:assign |

### 菜单模块 /api/menus

| 接口 | 方法 | 权限 |
|------|------|------|
| GET /tree | menu:list |
| GET / | menu:list |
| GET /:id | menu:query |
| POST / | menu:add |
| PUT /:id | menu:edit |
| DELETE /:id | menu:delete |
| GET /routes | 无需权限 |

---

## 目录结构

```
backend/src/
├── modules/
│   ├── user/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── user.route.ts
│   ├── role/
│   │   ├── role.controller.ts
│   │   ├── role.service.ts
│   │   └── role.route.ts
│   ├── menu/
│   │   ├── menu.controller.ts
│   │   ├── menu.service.ts
│   │   └── menu.route.ts
│   └── log/
│       └── log.service.ts
├── middleware/
│   └── permission.middleware.ts
└── seed/
    └── seed.ts（补充菜单初始化）
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

### 角色权限分配（事务）

```typescript
// role.service.ts
async assignMenus(roleId: number, menuIds: number[]) {
  return prisma.$transaction(async (tx) => {
    await tx.roleMenu.deleteMany({ where: { roleId } })
    if (menuIds.length > 0) {
      await tx.roleMenu.createMany({
        data: menuIds.map(menuId => ({ roleId, menuId }))
      })
    }
    return { message: '权限分配成功' }
  })
}
```

---

## 菜单初始化数据

补充 seed.ts：

```typescript
// 系统管理目录
const systemMenu = await prisma.menu.create({
  data: {
    parentId: 0, path: '/system', name: 'System',
    icon: 'Setting', component: 'Layout',
    sort: 1, type: 1, title: '系统管理'
  }
})

// 用户管理菜单 + 6个按钮权限
// 角色管理菜单 + 5个按钮权限
// 菜单管理菜单 + 4个按钮权限

// 给admin角色分配所有菜单
```

---

## 挂载路由

```typescript
// app.ts
import userRoutes from '@/modules/user/user.route'
import roleRoutes from '@/modules/role/role.route'
import menuRoutes from '@/modules/menu/menu.route'

app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/menus', menuRoutes)
```

---

## 验证方法

```bash
# 1. 启动服务
pnpm dev

# 2. 初始化菜单数据
pnpm seed

# 3. 测试各接口（使用admin token）

# 用户列表
curl http://localhost:3000/api/users?page=1&size=10 \
  -H "Authorization: Bearer {token}"

# 角色列表
curl http://localhost:3000/api/roles \
  -H "Authorization: Bearer {token}"

# 菜单树
curl http://localhost:3000/api/menus/tree \
  -H "Authorization: Bearer {token}"

# 用户路由
curl http://localhost:3000/api/menus/routes \
  -H "Authorization: Bearer {token}"
```

---

## 本阶段交付物

- [ ] 用户模块（7个接口）
- [ ] 角色模块（7个接口）
- [ ] 菜单模块（7个接口）
- [ ] 权限中间件
- [ ] 菜单初始化数据
- [ ] 操作日志记录

---

## 下一阶段

完成后进入 **后端-Phase 4 - 测试验收**。

---

## 参考文档

- [RBAC后端方案.md](RBAC后端方案.md)
- [后端-Phase 2 - 认证模块.md](后端-Phase%202%20-%20认证模块.md)