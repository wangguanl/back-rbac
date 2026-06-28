# 改造落地方案 · 前端（asyncRoutes 显式配置）

> **目标**：以前端 `asyncRoutes.ts` 作为菜单/页面/按钮权限的唯一真相源，移除「菜单管理」模块及对 `/menus/routes` 的依赖。  
> **并行文档**：`docs/改造方案-后端-RolePermission落地方案.md`  
> **执行前提**：方案经确认后再动手；与后端智能体按本文「接口契约」对齐。

---

## 一、改造范围

### 要做


| 项                     | 说明                                                    |
| --------------------- | ----------------------------------------------------- |
| 新增 `asyncRoutes.ts`   | 显式声明页面路由 + `meta.permission` + `meta.buttons`         |
| 新增路由工具函数              | `filterRoutes`、`routesToMenuList`、`toPermissionTree`  |
| 改造 `permission` store | 本地过滤路由，不再请求 `/menus/routes`                           |
| 改造 Sidebar            | 适配新的 `menuList` 结构（或继续用兼容结构）                          |
| 改造角色分配                | `PermissionTree` 读本地树，调新 API `/roles/:id/permissions` |
| 删除菜单管理                | 页面、API、类型中 menu 管理相关代码                                |


### 不做（本阶段）

- 不改 `v-auth` / `directives/auth.ts` 核心逻辑（仍读 `userStore.permissions`）
- 不改 `utils/request.ts` 401 处理
- 不实现 Token 刷新
- 不新增 `shared/` 跨端包（可选优化，见文末）

---

## 二、与后端的接口契约（必须一致）

前端智能体与后端智能体**以本节为准**，如有变更需双方文档同步更新。

### 2.0 统一数据结构：`RoutePermissionGroup`

权限不再使用扁平 `string[]` 作为接口传输格式，而是**按页面路由 `name` 分组**，与 `asyncRoutes` 中带 `meta.permission` 的页面节点一一对应。

```typescript
/** types/permission.ts */
export interface RoutePermissionGroup {
  /** 对应 RouteRecordRaw.name，如 'User' | 'Role'（PascalCase，路由内唯一） */
  name: string
  /** 该页面下的权限动作（短标识，不含模块前缀） */
  permissions: string[]
}
```

示例：

```json
[
  {
    "name": "User",
    "permissions": ["list", "query", "add", "edit"]
  },
  {
    "name": "Role",
    "permissions": ["list", "query", "assign"]
  }
]
```

**约定**：


| 规则 | 说明 |
|------|------|
| `name` 来源 | `asyncRoutes` 页面路由的 `RouteRecordRaw.name`（如 `User`） |
| 组内 `permissions` | 只存动作短名：`list`、`add`…，**不写** `user:` 前缀 |
| 模块前缀 | 由 `name` 承担；flatten → `user:list`（见 **2.4**） |
| 目录节点 | 如 `System` 仅作 Layout，**不单独占一条** |
| Dashboard | 前端硬编码，**可不进 permissionGroups** |
| 空分组 | 无权限的页面**不出现在数组中** |
| 内部使用 | `v-auth` / `requirePermission` 仍用扁平 `user:list`，工具函数转换 |

**命名为何不重复模块？** `name: "User"` 已标识页面，组内再写 `user:list` 冗余；也不采用 `User:list`，因后端已固定小写模块名 `user:list`。

---

### 2.1 获取当前用户权限（userinfo，与 2.2 同结构）

```
GET /api/auth/userinfo
Authorization: Bearer <token>
```

**Response.data 中与权限相关字段**（替换原扁平 `permissions: string[]`）：

```typescript
{
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  roles: string[]
  permissionGroups: RoutePermissionGroup[]   // ← 统一结构
}
```

示例：

```json
{
  "id": 1,
  "username": "admin",
  "roles": ["admin"],
  "permissionGroups": [
    { "name": "User", "permissions": ["list", "query", "add", "edit", "delete", "assign", "resetPwd"] },
    { "name": "Role", "permissions": ["list", "query", "add", "edit", "delete", "assign"] }
  ]
}
```

---

### 2.2 获取 / 分配角色权限（与 userinfo 同结构）

**获取**（替代 `GET /roles/:id/menus`）：

```
GET /api/roles/:id/permissions
Authorization: Bearer <token>
权限：role:query

Response.data: RoutePermissionGroup[]
```

**分配**（替代 `POST /roles/:id/menus`）：

```
POST /api/roles/:id/permissions
Authorization: Bearer <token>
权限：role:assign

Request Body: RoutePermissionGroup[]

Response: 标准 Result
```

请求示例（与 userinfo 中 `permissionGroups` 格式完全一致）：

```json
[
  { "name": "User", "permissions": ["list", "query", "add"] },
  { "name": "Role", "permissions": ["list", "query"] }
]
```

**后端校验**（存储层仍扁平化写入 `sys_role_permission`，见后端方案）：

1. `name` 必须在 `ROUTE_ACTION_REGISTRY` 内
2. 每组 `permissions` 必须是该 `name` 允许 action 的子集
3. 全局去重后写入数据库

---

### 2.3 废弃接口（前端改造完成后不再调用）


| 接口                            | 原用途          |
| ----------------------------- | ------------ |
| `GET /menus/routes`           | 动态路由         |
| `GET /menus/tree`             | 菜单管理 / 角色分配树 |
| `GET/POST/PUT/DELETE /menus*` | 菜单 CRUD      |


### 2.4 命名与 flatten 规则（前后端对齐）

**两层标识**：

| 层级 | 字段 | 示例 | 用途 |
|------|------|------|------|
| 页面 | `RouteRecordRaw.name` | `User` | 分组 key、路由唯一名 |
| 动作 | 组内 `permissions[]` | `list`、`add` | 页面/按钮/API 共用能力点 |
| 扁平 key（内部） | `module:action` | `user:list` | `v-auth`、`requirePermission`、DB 存储 |

**转换函数**（前后端同算法）：

```typescript
/** User → user，Role → role（PascalCase 路由名 → 小写模块名） */
export function routeNameToModule(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1)
}

export function toPermissionKey(name: string, action: string): string {
  return `${routeNameToModule(name)}:${action}`
}

export function flattenPermissionGroups(groups: RoutePermissionGroup[]): string[] {
  return groups.flatMap(g => g.permissions.map(a => toPermissionKey(g.name, a)))
}

export function groupPermissions(flatKeys: string[]): RoutePermissionGroup[] {
  // user:list → { name: 'User', permissions: ['list'] }
  // 依赖 ROUTE_ACTION_REGISTRY 反查 name
}
```

**路由注册表**（从 `asyncRoutes` 提取，后端 `common/permissions.ts` 同步）：

```typescript
/** 页面 name → 该页允许的全部 action */
export const ROUTE_ACTION_REGISTRY: Record<string, readonly string[]> = {
  User: ['list', 'query', 'add', 'edit', 'delete', 'assign', 'resetPwd'],
  Role: ['list', 'query', 'add', 'edit', 'delete', 'assign'],
}
```

---

### 2.5 动作（action）与页面/按钮/API 的关系

**结论：本方案不拆分「按钮权限」和「接口权限」两个存储字段。**

同一个 action 表示一种**业务能力**，同时约束 UI 与 API：

| action | 典型 UI | 典型 API | 说明 |
|--------|---------|----------|------|
| `list` | 侧边栏可见、进入页面 | `GET /users` | 页面级 + 列表接口 |
| `query` | 打开编辑弹窗拉详情 | `GET /users/:id` | 常无独立按钮，编辑依赖它 |
| `add` | 「新增」按钮 | `POST /users` | 按钮 + 写接口 |
| `edit` | 「编辑」按钮 | `PUT /users/:id` | 同上 |
| `delete` | 「删除」按钮 | `DELETE /users/:id` | 同上 |
| `assign` | 「分配角色」按钮 | `PUT /users/:id/roles` | 同上 |
| `resetPwd` | 「重置密码」按钮 | `PUT /users/:id/password` | 同上 |

**在 `asyncRoutes` 配置层**用 `kind` 标注用途（仅文档/生成权限树，**不参与存储**）：

```typescript
export type PermissionKind = 'page' | 'button' | 'api' | 'both'

export interface PermissionAction {
  action: string
  title: string
  /** 默认 both；query 等可标 api；list 标 page */
  kind?: PermissionKind
}
```

```typescript
meta: {
  title: '用户管理',
  permission: { action: 'list', title: '访问页面', kind: 'page' },
  buttons: [
    { action: 'add', title: '新增', kind: 'both' },
    { action: 'query', title: '查询详情', kind: 'api' },  // 无独立按钮
    { action: 'resetPwd', title: '重置密码', kind: 'both' },
  ],
}
```

**角色分配树**：仍展示为「页面 → 子动作」两级；`query` 等 `kind: 'api'` 的节点也要可勾选（否则无法编辑）。

**为何不拆成 `buttons[]` + `apis[]` 两组存储？**

- 后端 `requirePermission('user:add')` 已是「一个 action 一把锁」
- 拆两组会导致：勾了按钮没勾 API → 按钮可见但提交 403，体验更差
- 若未来真要拆分，可用命名约定 `add` vs `api:add`，但当前项目**不建议**

---

### 2.6 扁平 permission 清单（flatten 后与后端 requirePermission 对齐）

**User**（`name: User` → module `user`）：

- `list` `query` `add` `edit` `delete` `assign` `resetPwd`

**Role**（`name: Role` → module `role`）：

- `list` `query` `add` `edit` `delete` `assign`

flatten 示例：`User` + `add` → `user:add`，与现有 `requirePermission('user:add')` **完全兼容**。

**说明**：各 API 的 `requirePermission` 不改；仅接口传输格式从扁平数组改为分组 + 短 action。

---

## 三、目标目录结构

```
frontend/src/
├── router/
│   ├── index.ts
│   ├── permission.ts                 # 微调：loadRoutes 传入 permissions
│   └── routes/
│       ├── static.ts                 # 保留
│       ├── asyncRoutes.ts            # 【新增】完整路由 + 权限配置
│       └── utils/
│           ├── filterRoutes.ts              # 【新增】按 permissions 过滤
│           ├── routesToMenuList.ts          # 【新增】Sidebar 菜单数据
│           ├── toPermissionTree.ts          # 【新增】角色分配 el-tree 数据
│           ├── extractRoutePermissionRegistry.ts  # 【新增】从 asyncRoutes 提取 name→permissions
│           └── permissionGroups.ts          # 【新增】flatten / 校验工具
├── stores/
│   └── permission.ts                 # 【改造】
├── api/
│   ├── role.ts                       # 【改造】permissions API
│   └── menu.ts                       # 【删除】
├── types/
│   ├── menu.ts                       # 【删除或改为 SidebarMenuItem】
│   └── permission.ts                 # 【新增】RouteMeta / PermissionTreeNode
├── views/system/
│   ├── menu/                         # 【整个目录删除】
│   └── role/components/
│       └── PermissionTree.vue        # 【改造】
└── components/layout/
    └── Sidebar.vue                   # 【改造】
```

---

## 四、核心文件规格

### 4.1 `router/routes/asyncRoutes.ts`

**职责**：唯一真相源。每个页面显式 `import()` 组件，按钮权限写在 `meta.buttons`。

```typescript
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/components/layout/Layout.vue'

export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/system',
    name: 'System',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/system/user/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'User',
          permission: { action: 'list', title: '访问页面', kind: 'page' },
          buttons: [
            { action: 'query', title: '查询详情', kind: 'api' },
            { action: 'add', title: '新增', kind: 'both' },
            { action: 'edit', title: '编辑', kind: 'both' },
            { action: 'delete', title: '删除', kind: 'both' },
            { action: 'assign', title: '分配角色', kind: 'both' },
            { action: 'resetPwd', title: '重置密码', kind: 'both' },
          ],
        },
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('@/views/system/role/index.vue'),
        meta: {
          title: '角色管理',
          icon: 'UserFilled',
          permission: { action: 'list', title: '访问页面', kind: 'page' },
          buttons: [
            { action: 'query', title: '查询详情', kind: 'api' },
            { action: 'add', title: '新增', kind: 'both' },
            { action: 'edit', title: '编辑', kind: 'both' },
            { action: 'delete', title: '删除', kind: 'both' },
            { action: 'assign', title: '分配权限', kind: 'both' },
          ],
        },
      },
    ],
  },
]
```

**约定**：

- 页面节点：`meta.permission.action` 为页面级 action（通常 `list`）
- 按钮/接口：`meta.buttons[].action` + 可选 `kind` 标注用途
- `filterRoutes` / 路由守卫：用 flatten 后的 `user:list` 判断
- **`v-auth` 可继续写 `'user:add'`**（全量 key，与现网一致），或逐步改用常量 `P.USER.ADD`

### 4.2 `router/routes/utils/filterRoutes.ts`

```typescript
import type { RouteRecordRaw } from 'vue-router'

export function hasPermission(permissions: string[], perm?: string): boolean {
  if (!perm) return true
  return permissions.includes('*') || permissions.includes(perm)
}

/** 过滤可访问路由；目录无 permission 时，按子路由过滤结果决定是否保留 */
export function filterRoutes(routes: RouteRecordRaw[], permissions: string[]): RouteRecordRaw[]
```

**规则**：

1. 节点有 `meta.permission` 且用户无权限 → 丢弃
2. 有 `children` → 递归过滤；过滤后 children 为空且自身无 permission → 丢弃
3. 目录节点（无 permission）→ 保留过滤后的 children

### 4.3 `router/routes/utils/routesToMenuList.ts`

**职责**：把过滤后的 `RouteRecordRaw[]` 转为 Sidebar 所需结构。

建议类型（新建 `types/permission.ts`）：

```typescript
/** 与后端接口统一 */
export interface RoutePermissionGroup {
  name: string
  permissions: string[]
}

export interface SidebarMenuItem {
  path: string
  title: string
  icon?: string
  name?: string
  children?: SidebarMenuItem[]
}
```

**规则**：

- Dashboard 在 store 里硬编码插入（与现逻辑一致）
- 目录：`/system` → sub-menu
- 叶子：`/system/user` → menu-item
- 不再使用 `type: 0/1/2` 和数字 `id`（可用 `path` 作 `:key`）

### 4.4 `router/routes/utils/toPermissionTree.ts`

**职责**：供角色分配 `el-tree` 使用。

```typescript
export interface PermissionTreeNode {
  permission: string      // node-key
  title: string
  children?: PermissionTreeNode[]
}
```

**树结构**：

```
系统管理（虚拟根）
├── 用户管理 (action: list, kind: page)
│   ├── 查询详情 (query, api)
│   ├── 新增 (add, both)
│   └── ...
└── 角色管理 (action: list)
    └── ...
```

**勾选逻辑**：

- `node-key` 建议用 `${name}:${action}`（如 `User:list`）便于反查分组
- 提交时：解析 keys → 组装 `RoutePermissionGroup[]`（组内只存 action 短名）
- flatten 后：`user:list` 供路由守卫；`v-auth` 仍可用完整 key

### 4.6 `permissionGroups.ts` 工具函数

```typescript
/** 分组 → 扁平 module:action，如 user:list */
export function flattenPermissionGroups(groups: RoutePermissionGroup[]): string[]

export function routeNameToModule(name: string): string
export function toPermissionKey(name: string, action: string): string

/** asyncRoutes → ROUTE_ACTION_REGISTRY */
export function extractRouteActionRegistry(routes: RouteRecordRaw[]): Record<string, string[]>

/** el-tree keys (User:list) → RoutePermissionGroup[] */
export function keysToPermissionGroups(keys: string[]): RoutePermissionGroup[]

/** RoutePermissionGroup[] → el-tree 默认勾选 keys */
export function permissionGroupsToKeys(groups: RoutePermissionGroup[]): string[]
```

### 4.7 改造 `stores/permission.ts`

**删除**：

- `import.meta.glob` / `systemModules` / `pageModules`
- `getMenuRoutesApi`
- `resolveComponent`
- `generateRoutes(menus: MenuTreeNode[])`
- 所有 `console.log` 调试输出

**改造 `loadRoutes`**：

```typescript
async function loadRoutes(permissionGroups: RoutePermissionGroup[]) {
  const flatPermissions = flattenPermissionGroups(permissionGroups)
  const accessed = filterRoutes(asyncRoutes, flatPermissions)

  const dashboardRoute: RouteRecordRaw = { /* 保持现有 dashboard 配置 */ }

  routes.value = [dashboardRoute, ...accessed]
  menuList.value = [
    dashboardMenuItem,
    ...routesToMenuList(accessed),
  ]
  addedRouteNames.value = collectTopLevelRouteNames(routes.value)
  return routes.value
}
```

**签名变更**：`loadRoutes()` → `loadRoutes(permissionGroups: RoutePermissionGroup[])`  
调用方传入 `userStore.permissionGroups`（须先 `getUserInfo()`）。

**保留**：`resetRoutes()`、`addedRouteNames`、`collectTopLevelRouteNames`

---

## 五、关联文件改造清单

### 5.1 `router/permission.ts`

```typescript
await userStore.getUserInfo()
const flatPermissions = flattenPermissionGroups(userStore.permissionGroups)
const routes = await permissionStore.loadRoutes(userStore.permissionGroups)

// 页面级 meta.permission 校验改用 flatPermissions
const hasPermission = flatPermissions.includes('*') || flatPermissions.includes(requiredPermission)
```

### 5.2 `views/login/index.vue`

与 `composables/useAuth.ts` 对齐：

```typescript
await userStore.login(form)
await userStore.getUserInfo()
const routes = await permissionStore.loadRoutes(userStore.permissionGroups)
routes.forEach(r => router.addRoute(r))
```

### 5.3 `composables/useAuth.ts`

`login()` 内 `loadRoutes(userStore.permissionGroups)` — 已在 getUserInfo 之后。

### 5.4 改造 `stores/user.ts`

```typescript
const permissionGroups = ref<RoutePermissionGroup[]>([])

async function getUserInfo() {
  const res = await getUserInfoApi()
  userInfo.value = res.data
  permissionGroups.value = res.data.permissionGroups || []
  return res.data
}

/** 供 v-auth / composables 使用的扁平权限 */
const permissions = computed(() => flattenPermissionGroups(permissionGroups.value))
```

对外可同时暴露 `permissionGroups`（分组）和 `permissions`（computed 扁平），减少各处改造量。

### 5.5 `api/role.ts`

```typescript
import type { RoutePermissionGroup } from '@/types/permission'

/** 获取角色已分配权限（与 userinfo.permissionGroups 同结构） */
export function getRolePermissionsApi(id: number) {
  return request.get<RoutePermissionGroup[]>(`/roles/${id}/permissions`)
}

/** 分配角色权限 */
export function assignRolePermissionsApi(id: number, groups: RoutePermissionGroup[]) {
  return request.post<null>(`/roles/${id}/permissions`, groups)
}
```

删除：`getRoleMenusApi`、`assignRoleMenusApi`

### 5.6 `views/system/role/components/PermissionTree.vue`


| 改造点         | 说明                                                                             |
| ----------- | ------------------------------------------------------------------------------ |
| 数据源         | `toPermissionTree(asyncRoutes)` 本地生成，不调 API                                    |
| 已选          | `getRolePermissionsApi(roleId)` → `RoutePermissionGroup[]` → `toCheckedKeys()` |
| 提交          | 勾选结果组装为 `RoutePermissionGroup[]` → `assignRolePermissionsApi(roleId, groups)`  |
| node-key    | `permission` 或 `${name}:${permission}`                                         |
| props.label | `title`                                                                        |


### 5.7 `components/layout/Sidebar.vue`

适配 `SidebarMenuItem`：

- `:key="menu.path"`
- 有 `children.length` → `el-sub-menu`
- 否则 → `el-menu-item`
- `:index="menu.path"`（完整路径，如 `/system/user`）
- 移除 `type === 1` 判断

**注意**：asyncRoutes 子 path 为相对路径 `user`，Sidebar index 需拼成 `/system/user`（在 `routesToMenuList` 中处理）。

### 5.8 删除菜单管理


| 文件                                          | 操作                       |
| ------------------------------------------- | ------------------------ |
| `views/system/menu/index.vue`               | 删除                       |
| `views/system/menu/components/MenuForm.vue` | 删除                       |
| `api/menu.ts`                               | 删除                       |
| `types/menu.ts`                             | 删除（或迁移为 Sidebar 类型后删旧文件） |


### 5.9 无需大改（确认即可）


| 文件                            | 原因                                              |
| ----------------------------- | ----------------------------------------------- |
| `directives/auth.ts`          | 仍读 `userStore.permissions`（computed 扁平化，内部实现不变） |
| `views/system/user/index.vue` | `v-auth` 字符串不变                                  |
| `views/system/role/index.vue` | 仅 PermissionTree 子组件变                           |
| `router/routes/static.ts`     | login/403/404 不变                                |


---

## 六、实施步骤（建议顺序）


| 步骤  | 任务                                                          | 产出                                |
| --- | ----------------------------------------------------------- | --------------------------------- |
| 1   | 新增 `types/permission.ts`                                    | 类型定义                              |
| 2   | 新增 `asyncRoutes.ts` + 三个 utils                              | 配置与工具                             |
| 3   | 改造 `permission.ts` store                                    | 本地过滤路由                            |
| 4   | 改造 `user.ts` store、`router/permission.ts`、`login`、`useAuth` | permissionGroups                  |
| 5   | 改造 `api/role.ts`、`PermissionTree.vue`                       | 分组 API                            |
| 6   | 改造 `Sidebar.vue`                                            | 新 menuList                        |
| 7   | 删除 menu 模块相关文件                                              | 清理                                |
| 8   | 全局搜索清理残留引用                                                  | `getMenuTreeApi`、`MenuTreeNode` 等 |


---

## 七、验收标准

### 功能

- [ ] admin 登录后侧边栏显示：首页、系统管理（用户/角色），**无菜单管理**
- [ ] 普通角色仅分配部分 permission 时，侧边栏与路由正确裁剪
- [ ] 直接访问无权限 URL → 跳转 `/403`
- [ ] `v-auth` 按钮随 permissions 正确显隐
- [ ] 角色管理「分配权限」提交/回显均为 `RoutePermissionGroup[]` 格式
- [ ] userinfo 与角色 GET permissions 返回结构一致
- [ ] 登出 / 401 后 `resetRoutes` 正常，再登录不重复注册路由

### 代码

- [ ] 无对 `/menus/*` 的请求（除后端尚未下线时的兼容层，本方案要求前端完全移除）
- [ ] 无 `import.meta.glob` 解析页面组件
- [ ] 无 `console.log` 调试残留（permission store、user/role 页）

### 构建

- [ ] `pnpm build` 通过（不自动 install，缺依赖提示用户手动 install）

---

## 八、与后端并行时的依赖说明


| 场景                       | 处理方式                                                   |
| ------------------------ | ------------------------------------------------------ |
| 后端新 API 已就绪              | 直接联调                                                   |
| 后端尚未就绪                   | 可临时 mock 返回 `RoutePermissionGroup[]`；**userinfo 必须真实** |
| 后端仍返回 menu 相关 permission | 不影响；前端 asyncRoutes 不含 menu:* 即可                        |


**联调顺序建议**：

1. 后端先完成 `RolePermission` + userinfo/role API 返回 `RoutePermissionGroup[]`
2. 前端完成 `extractRoutePermissionRegistry` + user store + 登录流
3. 双方一起验收：userinfo 与 POST/GET permissions 数据结构一致

---

## 九、可选后续优化（本方案不强制）

1. `**frontend/src/constants/permissions.ts**`：导出 permission 常量，`v-auth` 与 asyncRoutes 共用，减少拼写错误
2. **与后端共享 `shared/permissions.ts`**：monorepo 根目录，需改 tsconfig paths
3. `**usePermissions` composable**：替换部分 `v-auth` 为函数式判断

---

## 十、风险与注意

1. **Sidebar path 拼接**：`routesToMenuList` 必须输出完整 path（`/system/user`），避免 el-menu router 模式导航错误
2. **目录 redirect**：asyncRoutes 中 `/system` 的 `redirect` 应指向有权限的第一个子页面（可选增强：动态 redirect）
3. **半选节点**：PermissionTree 提交时需包含 `getHalfCheckedKeys()`，并正确归入对应 `name` 分组
4. **分组 ↔ 扁平转换**：`v-auth` 依赖 `userStore.permissions`（computed），勿在各页面手写 flatten
5. **后端权限拦截不受影响**：后端内部仍将分组 flatten 后做 `requirePermission` 校验

---

**文档版本**：v1.2  
**变更**：组内 permissions 改为短 action；补充 2.5 页面/按钮/API 关系说明；flatten 规则 `User`+`list`→`user:list`  
**状态**：✅ 已执行