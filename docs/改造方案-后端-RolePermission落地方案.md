# 改造落地方案 · 后端（RolePermission 权限字符串）

> **目标**：角色直接绑定 permission 字符串，不再依赖 `sys_menu` / `sys_role_menu` 驱动权限；`requirePermission` 接口拦截逻辑不变。  
> **并行文档**：`docs/改造方案-前端-asyncRoutes落地方案.md`  
> **执行前提**：方案经确认后再动手；与前端智能体按本文「接口契约」对齐。

---

## 一、改造范围

### 要做

| 项 | 说明 |
|----|------|
| 新增 `RolePermission` 模型 | 角色 ↔ permission 字符串 |
| 改造权限聚合 | `authMiddleware`、`getUserInfo` 从新表读取 |
| 新增角色权限 API | `GET/POST /roles/:id/permissions` |
| 改造 seed | admin 角色直接绑 permission 列表 |
| 权限白名单 | 分配时校验 permission 合法性 |
| 移除 Menu 模块 | 路由、service、controller、旧 RoleMenu API |

### 不做（本阶段）

- 不改各业务路由上的 `requirePermission('xxx')` 声明
- 不改 `permission.middleware.ts` 的校验逻辑（仍为 `some` 匹配）
- 不实现操作日志 HTTP 接口
- 不实现 Redis token 校验增强（质量缺口另案处理）

---

## 二、与前端的接口契约（必须一致）

### 2.0 统一数据结构：`RoutePermissionGroup`

```typescript
export interface RoutePermissionGroup {
  /** 对应前端 asyncRoutes 页面路由 name，如 'User' | 'Role' */
  name: string
  permissions: string[]
}
```

**传输层**（userinfo、角色 GET/POST permissions）统一使用该结构，**不再使用扁平 `string[]`**。

**存储层**：`sys_role_permission` 仍按 permission 字符串扁平存储；API 层负责 `分组 ↔ 扁平` 转换。

---

### 2.1 获取当前用户权限（userinfo）

```
GET /api/auth/userinfo
```

**Response.data**（权限字段改造）：

```typescript
{
  // ...用户信息
  roles: string[]
  permissionGroups: RoutePermissionGroup[]   // 替换原 permissions: string[]
}
```

示例：

```json
{
  "id": 1,
  "username": "admin",
  "roles": ["admin"],
  "permissionGroups": [
    { "name": "User", "permissions": ["list", "query", "add"] },
    { "name": "Role", "permissions": ["list", "query"] }
  ]
}
```

---

### 2.2 获取 / 分配角色权限（与 userinfo 同结构）

**获取**：

```
GET /api/roles/:id/permissions
权限：role:query

Response.data: RoutePermissionGroup[]
```

**分配**：

```
POST /api/roles/:id/permissions
权限：role:assign

Request Body: RoutePermissionGroup[]

Response: { "code": 200, "message": "权限分配成功", "data": null }
```

请求示例：

```json
[
  { "name": "User", "permissions": ["list", "add"] },
  { "name": "Role", "permissions": ["list"] }
]
```

**校验规则**：

1. Body 必须为数组，每项含 `name: string` 和 `permissions: string[]`
2. `name` 必须在 `ROUTE_ACTION_REGISTRY` 内
3. 每组 `permissions` 必须是该 `name` 允许的 **action 短名** 子集
4. flatten 为 `module:action`（如 `user:list`）去重后写入 `sys_role_permission`

---

### 2.3 废弃接口（改造完成后删除）

| 接口 | 说明 |
|------|------|
| `GET /api/menus/routes` | 前端不再使用 |
| `GET/POST/PUT/DELETE /api/menus*` | 菜单 CRUD 整体移除 |
| `GET /api/roles/:id/menus` | 由 permissions 替代 |
| `POST /api/roles/:id/menus` | 由 permissions 替代 |

### 2.4 路由 action 注册表 `ROUTE_ACTION_REGISTRY`

与前端 `asyncRoutes` 页面 `name` 对齐；**值为 action 短名**，非 `user:list` 全量 key。

```typescript
// backend/src/common/permissions.ts
export const ROUTE_ACTION_REGISTRY = {
  User: ['list', 'query', 'add', 'edit', 'delete', 'assign', 'resetPwd'],
  Role: ['list', 'query', 'add', 'edit', 'delete', 'assign'],
} as const

/** PascalCase 路由名 → 小写模块名：User → user */
export function routeNameToModule(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1)
}

export function toPermissionKey(name: string, action: string): string {
  return `${routeNameToModule(name)}:${action}`
}

/** flatten 后供 requirePermission / DB 使用 */
export const ALL_PERMISSIONS = Object.entries(ROUTE_ACTION_REGISTRY).flatMap(
  ([name, actions]) => actions.map(a => toPermissionKey(name, a))
)
```

---

### 2.5 分组 ↔ 扁平 转换（后端内部）

```typescript
/** 扁平 permission[] → RoutePermissionGroup[]（用于 userinfo / GET permissions 响应） */
export function groupPermissions(flat: string[]): RoutePermissionGroup[]

/** RoutePermissionGroup[] → 扁平 permission[]（用于写入 DB、authMiddleware） */
export function flattenPermissionGroups(groups: RoutePermissionGroup[]): string[]

/** 校验并 normalize 分组数据，非法抛 BadRequestException */
export function validatePermissionGroups(groups: RoutePermissionGroup[]): RoutePermissionGroup[]
```

`authMiddleware` 仍使用扁平 `req.permissions: string[]`（内部 flatten 后注入），**`requirePermission` 无需感知分组结构**。

---

### 2.6 权限字符串清单

由 `ROUTE_ACTION_REGISTRY` flatten 派生（如 `user:list`），**不含 menu:***。

---

### 3.1 新增模型

**文件**：`backend/prisma/schema.prisma`

```prisma
model RolePermission {
  id         BigInt   @id @default(autoincrement())
  roleId     BigInt   @map("role_id")
  permission String   @db.VarChar(100)
  createTime DateTime @default(now()) @map("create_time")

  role       Role     @relation(fields: [roleId], references: [id])

  @@unique([roleId, permission])
  @@index([roleId])
  @@map("sys_role_permission")
}
```

**Role 模型增加关联**：

```prisma
model Role {
  // ...existing fields
  permissions RolePermission[]
}
```

### 3.2 废弃模型（迁移完成后删除）

| 模型 | 表名 | 处理 |
|------|------|------|
| Menu | sys_menu | 删除 model + 迁移 drop table |
| RoleMenu | sys_role_menu | 删除 model + 迁移 drop table |

**建议步骤**：

1. 先加 `RolePermission`，保留 Menu/RoleMenu
2. seed 改用 RolePermission
3. 确认 auth / 新 API 正常
4. 单独 migration 删除 Menu、RoleMenu 表及 Prisma model

### 3.3 迁移命令

```bash
cd backend
pnpm prisma migrate dev --name add_role_permission
# 清理阶段
pnpm prisma migrate dev --name drop_menu_tables
pnpm prisma generate
```

（执行时由智能体运行，缺依赖提示用户手动 install）

---

## 四、核心代码改造

### 4.1 新建 `common/permissions.ts`

```typescript
export interface RoutePermissionGroup {
  name: string
  permissions: string[]
}

export const ROUTE_ACTION_REGISTRY = { /* 见 2.4 */ } as const
export const ALL_PERMISSIONS = /* flatten ROUTE_ACTION_REGISTRY */

export function isValidPermission(p: string): boolean
export function validatePermissionGroups(groups: RoutePermissionGroup[]): RoutePermissionGroup[]
export function flattenPermissionGroups(groups: RoutePermissionGroup[]): string[]
export function groupPermissions(flat: string[]): RoutePermissionGroup[]
```

### 4.2 改造 `middleware/auth.middleware.ts`

**改造前**（节选）：

```typescript
include: {
  roles: {
    include: {
      role: {
        include: { menus: { include: { menu: true } } }
      }
    }
  }
}
// ...
user.roles.forEach(ur => {
  ur.role.menus.forEach(rm => {
    if (rm.menu.permission) permissions.add(rm.menu.permission)
  })
})
```

**改造后**：

```typescript
include: {
  roles: {
    include: {
      role: {
        include: { permissions: true }
      }
    }
  }
}
// ...
user.roles.forEach(ur => {
  ur.role.permissions.forEach(rp => {
    permissions.add(rp.permission)
  })
})
```

`requirePermission` **无需修改**。

### 4.3 改造 `modules/auth/auth.service.ts`

`getUserInfo()` 改造：

```typescript
// 1. 从 RolePermission 聚合扁平 permissions
const flat = new Set<string>()
user.roles.forEach(ur => {
  ur.role.permissions.forEach(rp => flat.add(rp.permission))
})

// 2. 转为分组结构返回
return {
  // ...用户信息
  roles,
  permissionGroups: groupPermissions(Array.from(flat)),  // 替换 permissions: string[]
}
```

`login()` 返回值不变（仍不返回权限，由 userinfo 获取）。

### 4.4 改造 `modules/role/role.service.ts`

**新增方法**：

```typescript
async getPermissions(roleId: number): Promise<RoutePermissionGroup[]> {
  const role = await prisma.role.findFirst({ where: { id: BigInt(roleId), deleted: 0 } })
  if (!role) throw new NotFoundException('角色不存在')

  const rows = await prisma.rolePermission.findMany({
    where: { roleId: BigInt(roleId) },
    select: { permission: true }
  })
  return groupPermissions(rows.map(r => r.permission))
}

async assignPermissions(roleId: number, groups: RoutePermissionGroup[]): Promise<{ message: string }> {
  const role = await prisma.role.findFirst({ where: { id: BigInt(roleId), deleted: 0 } })
  if (!role) throw new NotFoundException('角色不存在')

  const normalized = validatePermissionGroups(groups)
  const flat = flattenPermissionGroups(normalized)

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId: BigInt(roleId) } })
    if (flat.length) {
      await tx.rolePermission.createMany({
        data: flat.map(permission => ({ roleId: BigInt(roleId), permission }))
      })
    }
  })
  return { message: '权限分配成功' }
}
```

**删除方法**：`getMenus`、`assignMenus`

### 4.5 改造 `modules/role/role.controller.ts`

```typescript
async getPermissions(req: Request, res: Response) {
  const data = await roleService.getPermissions(Number(req.params.id))
  res.json(success(data))
}

async assignPermissions(req: Request, res: Response) {
  const groups = req.body
  if (!Array.isArray(groups)) throw new BadRequestException('请求体必须为 RoutePermissionGroup[]')
  const data = await roleService.assignPermissions(Number(req.params.id), groups)
  res.json(success(data))
}
```

### 4.6 改造 `modules/role/role.route.ts`

**删除**：

```typescript
router.get('/:id/menus', ...)
router.post('/:id/menus', ...)
```

**新增**（放在 `/:id` 相关路由中，注意路由顺序：`/permissions` 在通配前或与 `/:id` 同级定义）：

```typescript
router.get('/:id/permissions', requirePermission('role:query'), controller.getPermissions)
router.post('/:id/permissions', requirePermission('role:assign'), controller.assignPermissions)
```

**路由顺序建议**：

```
GET  /
GET  /:id
POST /
PUT  /:id
DELETE /:id
GET  /:id/permissions    ← 新增
POST /:id/permissions    ← 新增
```

### 4.7 删除 Menu 模块

| 文件 | 操作 |
|------|------|
| `modules/menu/menu.route.ts` | 删除 |
| `modules/menu/menu.controller.ts` | 删除 |
| `modules/menu/menu.service.ts` | 删除 |
| `app.ts` 中 `app.use('/api/menus', menuRoutes)` | 删除 |

### 4.8 改造 `seed/seed.ts`

**删除**：整段 Menu 创建 + RoleMenu 分配（约 39–135 行）

**替换为**：

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

// user 角色可选：绑定只读权限示例
// ['user:list', 'user:query', 'role:list', 'role:query']
```

**seed 执行前清理**（若仍保留旧表阶段）：

```typescript
await prisma.roleMenu.deleteMany({})
await prisma.menu.deleteMany({})
```

最终 drop 表后删除上述语句。

---

## 五、`requirePermission` 与改造的关系（重点）

### 不受影响的部分

各模块 route 文件中的声明**保持不动**，例如 `user.route.ts`：

```typescript
router.post('/', requirePermission('user:add'), controller.create)
router.get('/', requirePermission('user:list'), controller.list)
```

`permission.middleware.ts`：

```typescript
permissions.some(p => userPermissions.includes(p))
```

### 唯一变化

`req.permissions` 的来源从 Menu 表改为 RolePermission 表。只要角色绑定了 `user:add`，POST `/users` 仍可通过；未绑定则仍 403。

### 前后端分工（给验收用）

| 层 | 职责 |
|----|------|
| 前端 asyncRoutes + v-auth | 无 permission 则不可见/不可进 |
| 后端 requirePermission | 无 permission 则 API 403 |

**前端改造不会削弱后端安全**；即使 Postman 直接调 API，仍受 `requirePermission` 保护。

---

## 六、实施步骤（建议顺序）

| 步骤 | 任务 | 依赖 |
|------|------|------|
| 1 | 新建 `common/permissions.ts` | 无 |
| 2 | schema 增加 RolePermission + migrate | 无 |
| 3 | 改 auth.middleware + auth.service 聚合逻辑 | 步骤 2 |
| 4 | role.service/controller/route 新 API | 步骤 2 |
| 5 | 改 seed，执行 seed | 步骤 2–4 |
| 6 | 删除 menu 模块 + app 挂载 | 步骤 5 验证通过 |
| 7 | migration 删除 Menu/RoleMenu 表 | 步骤 6 |
| 8 | 更新 Swagger（如有 menu 相关文档） | 步骤 6 |

---

## 七、验收标准

### API

- [ ] `GET /api/auth/userinfo` 返回 `permissionGroups: RoutePermissionGroup[]`（admin 含 User/Role 全部分组）
- [ ] `GET /api/roles/:id/permissions` 返回结构**与 userinfo.permissionGroups 完全一致**
- [ ] `POST /api/roles/:id/permissions` 接收 `RoutePermissionGroup[]` 并正确写入；非法 name/permission 返回 400
- [ ] 分配后再次 userinfo，`permissionGroups` 更新正确
- [ ] 无 `/api/menus/*` 路由（404）
- [ ] 旧 `/api/roles/:id/menus` 已移除（404）

### 权限拦截

- [ ] 仅有 `user:list` 的角色：GET `/users` 200，POST `/users` 403
- [ ] 无 `role:assign` 的角色：POST `/roles/:id/permissions` 403
- [ ] 未登录：受保护接口 401

### 数据

- [ ] `sys_role_permission` 有 admin 全量数据
- [ ] `sys_menu`、`sys_role_menu` 已删除（最终阶段）

### 构建

- [ ] TypeScript 编译通过
- [ ] `pnpm prisma generate` 成功

---

## 八、与前端并行时的协作说明

| 前端依赖 | 后端必须先完成 |
|----------|----------------|
| 登录后路由过滤 | userinfo.permissionGroups 正确返回 |
| 角色分配页 | GET/POST `/roles/:id/permissions` 同结构 |
| 移除 menu 模块 | 无（前端不调用即可） |

**建议后端优先完成**：步骤 1–5（新表 + userinfo + 角色 permissions API + seed），即可与前端联调。

**临时兼容（可选，本方案不要求）**：若需平滑过渡，可短期保留 `/roles/:id/menus`，但会增加复杂度；推荐直接切换新 API。

---

## 九、Swagger / 类型清理

1. 删除 `menu.route.ts` 中所有 `@openapi` 注释
2. 在 `role.route.ts` 为新接口补充 `@openapi`
3. 检查 `swagger.config.cjs` 是否硬编码 menu paths

---

## 十、数据迁移脚本（可选）

若生产环境已有 RoleMenu 数据需保留，可在 drop 前执行一次性迁移：

```typescript
// 伪代码：scripts/migrate-menu-to-permission.ts
const roleMenus = await prisma.roleMenu.findMany({ include: { menu: true } })
for (const rm of roleMenus) {
  if (rm.menu.permission) {
    await prisma.rolePermission.upsert({
      where: { roleId_permission: { roleId: rm.roleId, permission: rm.menu.permission } },
      create: { roleId: rm.roleId, permission: rm.menu.permission },
      update: {}
    })
  }
}
```

**本项目为 Demo**：seed 重建即可，可不写迁移脚本。

---

## 十一、风险与注意

1. **auth 查询性能**：RolePermission 通常远小于 Menu 树，性能更好
2. **白名单维护**：新增页面/API 时需同步更新 `ALL_PERMISSIONS` 与前端 asyncRoutes
3. **admin 超级权限**：当前无 `*` 通配；admin 靠 seed 绑定全部 permission。若需 `*`，需在 `requirePermission` 和前端 `hasPermission` 同时支持（本方案不强制）
4. **Prisma 迁移顺序**：先 add 后 drop，避免 auth 中断
5. **role.route 顺序**：`/:id/permissions` 不要与 `/:id` 冲突（Express 按注册顺序匹配）

---

## 十二、改造前后对比

| 项目 | 改造前 | 改造后 |
|------|--------|--------|
| 权限存储 | Menu.permission + RoleMenu | RolePermission.permission |
| 角色分配 API | menuIds: number[] | RoutePermissionGroup[] |
| userinfo 权限字段 | permissions: string[] | permissionGroups: RoutePermissionGroup[] |
| 用户 permissions 来源 | 角色关联菜单聚合 | RolePermission 扁平存储 + API 分组返回 |
| 菜单 CRUD | 有 | 无 |
| API 拦截 | requirePermission | **不变** |

---

**文档版本**：v1.2  
**变更**：组内 permissions 改为 action 短名；flatten 为 `user:list` 写入 DB / 校验 API  
**状态**：待确认后执行
