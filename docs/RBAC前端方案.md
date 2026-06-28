# RBAC 权限管理系统方案

## 一、项目概述

本项目是一个基于 Vue 3 + TypeScript + Vite 的后台权限管理系统，采用 RBAC（Role-Based Access Control）模型实现细粒度的权限控制。

### 1.1 核心功能模块

| 模块 | 描述 |
|------|------|
| 用户管理 | 用户的增删改查、状态启用/禁用、角色分配 |
| 角色管理 | 角色的增删改查、权限分配（基于前端 asyncRoutes 权限树） |
| 权限管理 | 页面级 + 按钮级 + API 级权限控制，前端 asyncRoutes 为唯一真相源 |

> **架构变更（2026-06-28）**：菜单管理模块已移除。权限配置改为前端驱动——`asyncRoutes.ts` 作为页面/按钮/API 权限的唯一真相源，角色分配直接绑定 permission 字符串，不再依赖数据库菜单表。

## 二、技术栈

### 2.1 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5.x | 核心框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 8.x | 构建工具 |
| Vue Router | 4.x | 路由管理 |
| Pinia | 2.x | 状态管理 |
| Element Plus | 2.x | UI 组件库 |
| Axios | 1.x | HTTP请求 |
| pnpm | 10.x | 包管理器 |

### 2.2 API 设计风格

**RESTful API** - 前端通过 Axios 与后端通信

| HTTP方法 | 用途 | 示例 |
|----------|------|------|
| GET | 查询数据 | GET /api/users |
| POST | 提交数据 | POST /api/users |
| PUT | 更新数据 | PUT /api/users/:id |
| DELETE | 删除数据 | DELETE /api/users/:id |

## 三、权限模型设计

### 3.1 RBAC 模型

```
用户 (User)
    │
    │  n:m 关系
    ▼
角色 (Role) ◄─────── 1:n ───────► 权限 (Permission)
                                    │
                                    │ 前端 asyncRoutes 定义
                                    ▼
                              页面/按钮/API (RoutePermissionRegistry)
```

### 3.2 权限粒度

| 级别 | 说明 | 示例 |
|------|------|------|
| 页面级 | 能否访问某个页面 | /system/user、/system/role |
| 按钮级 | 页面内的操作权限 | 新增、编辑、删除 |
| 接口级 | API 调用权限（后端 requirePermission 拦截） | POST /users、DELETE /users/:id |

### 3.3 权限数据结构

前端使用 `RoutePermissionGroup` 作为传输格式，与后端统一：

```typescript
interface RoutePermissionGroup {
  name: string        // 对应路由 name，如 'User', 'Role'
  permissions: string[] // 动作短名，如 ['list', 'add', 'edit']
}
```

扁平化后为 `module:action` 格式（如 `user:list`），供 `v-auth` 指令和后端 `requirePermission` 使用。

### 3.4 权限配置源：`routePermissionRegistry`

```typescript
// src/router/routes/routePermissionRegistry.ts
export const routePermissionRegistry = {
  System: {
    path: '/system',
    title: '系统管理',
    icon: 'Setting',
    pages: {
      User: {
        path: 'user',
        title: '用户管理',
        icon: 'User',
        load: () => import('@/views/system/user/index.vue'),
        permissions: {
          List: { action: 'list', title: '访问页面', kind: 'page' },
          Add:  { action: 'add', title: '新增', kind: 'both' },
          Edit: { action: 'edit', title: '编辑', kind: 'both' },
          // ...
        }
      },
      Role: { /* ... */ }
    }
  }
}
```

由此注册表自动生成 `asyncRoutes`（路由配置）、`P`（v-auth 权限常量）、`Bind`（按钮↔API 绑定）。

## 四、数据库设计（参考）

### 4.1 表结构

```sql
-- 用户表
CREATE TABLE sys_user (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    username    VARCHAR(50) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    nickname    VARCHAR(50),
    email       VARCHAR(100),
    status      TINYINT DEFAULT 1 COMMENT '0:禁用 1:启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME ON UPDATE CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE sys_role (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    code        VARCHAR(50) NOT NULL UNIQUE COMMENT '角色代码',
    name        VARCHAR(50) NOT NULL COMMENT '角色名称',
    description VARCHAR(255),
    status      TINYINT DEFAULT 1,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户-角色关联表
CREATE TABLE sys_user_role (
    user_id BIGINT,
    role_id BIGINT,
    PRIMARY KEY (user_id, role_id)
);

-- 角色-权限表（替代旧 sys_menu + sys_role_menu）
CREATE TABLE sys_role_permission (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id     BIGINT NOT NULL,
    permission  VARCHAR(100) NOT NULL COMMENT '权限标识，如 user:list',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_id, permission)
);
```

> **注意**：`sys_menu` 和 `sys_role_menu` 表已废弃，权限不再通过菜单表间接关联，而是直接以 `module:action` 字符串存储在 `sys_role_permission` 中。

## 五、前端目录结构

> **实现说明（2026-06）**  
> 动态路由采用前端驱动模式：`asyncRoutes.ts` 定义完整路由表，后端返回的 `permissionGroups` 通过 `filterRoutes` 过滤。  
> 以 `frontend/src/stores/permission.ts` 与 `frontend/src/router/permission.ts` 为准。

```
src/
├── api/                    # API 接口
│   ├── auth.ts
│   ├── user.ts
│   └── role.ts             # 包含 getRolePermissionsApi / assignRolePermissionsApi
├── components/             # 公共组件
│   ├── common/
│   │   └── Pagination.vue
│   └── layout/
│       ├── Layout.vue
│       ├── Sidebar.vue
│       ├── Header.vue
│       └── Main.vue
├── composables/            # 组合式函数
│   ├── usePermissions.ts
│   └── useAuth.ts
├── directives/             # 指令
│   ├── auth.ts            # 权限指令 v-auth
│   ├── role.ts            # 角色指令 v-role
│   └── index.ts
├── router/                 # 路由
│   ├── index.ts
│   ├── permission.ts       # 路由守卫
│   └── routes/
│       ├── static.ts       # 静态路由（/login, /403, /404）
│       ├── asyncRoutes.ts  # 从 registry 生成动态路由
│       ├── routePermissionRegistry.ts  # 【唯一真相源】路由+权限配置
│       └── utils/
│           ├── buildFromRegistry.ts    # registry → asyncRoutes/P/Bind
│           ├── filterRoutes.ts         # 按权限过滤路由
│           ├── permissionGroups.ts     # 扁平/分组/校验转换
│           ├── routesToMenuList.ts     # 路由转侧边栏菜单
│           └── toPermissionTree.ts     # 路由 → el-tree 权限树
├── stores/                 # 状态管理
│   ├── user.ts             # 用户信息 + permissionGroups + computed permissions
│   ├── permission.ts       # 动态路由加载 + menuList + resetRoutes
│   └── app.ts
├── types/                  # 类型定义
│   ├── user.ts
│   ├── role.ts
│   ├── permission.ts       # RoutePermissionGroup, SidebarMenuItem, PermissionTreeNode 等
│   └── api.ts
├── utils/                  # 工具函数
│   ├── auth.ts             # re-export storage
│   ├── storage.ts          # rbac_token 读写
│   ├── request.ts          # Axios 封装
│   └── clear-session.ts    # 统一登出清理
├── views/                  # 页面
│   ├── login/
│   ├── dashboard/
│   ├── system/
│   │   ├── user/
│   │   │   ├── index.vue
│   │   │   └── components/
│   │   │       ├── UserForm.vue
│   │   │       ├── AssignRoleDialog.vue
│   │   │       └── ResetPasswordDialog.vue
│   │   └── role/
│   │       ├── index.vue
│   │       └── components/
│   │           ├── RoleForm.vue
│   │           └── PermissionTree.vue
│   └── error/
│       ├── 403.vue
│       └── 404.vue
├── App.vue
└── main.ts
```

> **注意**：`views/system/menu/`、`api/menu.ts`、`types/menu.ts` 已删除。菜单管理功能不再需要。

## 六、核心实现

### 6.1 Store 层

**userStore** — `frontend/src/stores/user.ts`

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, getUserInfoApi } from '@/api/auth'
import { setToken, removeToken } from '@/utils/auth'
import { flattenPermissionGroups } from '@/router/routes/utils/permissionGroups'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref<UserInfo | null>(null)
  const permissionGroups = ref<RoutePermissionGroup[]>([])

  // 供 v-auth / composables 使用的扁平权限数组
  const permissions = computed(() => flattenPermissionGroups(permissionGroups.value))

  async function login(params: { username: string; password: string }) {
    const res = await loginApi(params)
    token.value = res.data.token
    setToken(res.data.token)          // 同步写入 rbac_token（双写兼容）
    return res.data
  }

  async function getUserInfo() {
    const res = await getUserInfoApi()
    userInfo.value = res.data
    permissionGroups.value = res.data.permissionGroups || []
    return res.data
  }

  function resetState() {
    token.value = ''
    userInfo.value = null
    permissionGroups.value = []
    removeToken()
  }

  return { token, userInfo, permissionGroups, permissions, login, getUserInfo, resetState }
}, { persist: { key: 'user', pick: ['token'] } })
```

**permissionStore** — `frontend/src/stores/permission.ts`

```typescript
import { defineStore } from 'pinia'
import { markRaw, ref, shallowRef } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/components/layout/Layout.vue'
import router from '@/router'
import { asyncRoutes } from '@/router/routes/asyncRoutes'
import { filterRoutes } from '@/router/routes/utils/filterRoutes'
import { flattenPermissionGroups } from '@/router/routes/utils/permissionGroups'
import { routesToMenuList } from '@/router/routes/utils/routesToMenuList'

export const usePermissionStore = defineStore('permission', () => {
  const routes = shallowRef<RouteRecordRaw[]>([])
  const menuList = ref<SidebarMenuItem[]>([])
  const addedRouteNames = ref<string[]>([])

  async function loadRoutes(permissionGroups: RoutePermissionGroup[]) {
    const flatPermissions = flattenPermissionGroups(permissionGroups)
    const accessed = filterRoutes(asyncRoutes, flatPermissions)

    // 固定首页路由
    routes.value = [dashboardRoute, ...accessed]
    menuList.value = [dashboardMenuItem, ...routesToMenuList(accessed)]
    addedRouteNames.value = collectTopLevelRouteNames(routes.value)
    return routes.value
  }

  function resetRoutes() {
    addedRouteNames.value.forEach(name => {
      if (router.hasRoute(name)) router.removeRoute(name)
    })
    addedRouteNames.value = []
    routes.value = []
    menuList.value = []
  }

  return { routes, menuList, addedRouteNames, loadRoutes, resetRoutes }
})
```

### 6.2 路由守卫

`frontend/src/router/permission.ts`

```typescript
import router from './index'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

const whiteList = ['/login', '/403', '/404']

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (userStore.token) {
    if (to.path === '/login') {
      next('/dashboard')
    } else if (!userStore.userInfo) {
      // 刷新页面后重新拉取用户信息 + 动态路由
      try {
        await userStore.getUserInfo()
        const routes = await permissionStore.loadRoutes(userStore.permissionGroups)
        routes.forEach(r => router.addRoute(r))
        next({ path: to.fullPath, replace: true })
      } catch {
        // 获取用户信息失败 → 清除状态，跳转登录
        permissionStore.resetRoutes()
        userStore.resetState()
        next(`/login?redirect=${to.path}`)
      }
    } else {
      // 路由级权限校验（meta.permission）
      const requiredPermission = resolveRequiredPermission(to.meta, to.name)
      if (requiredPermission) {
        const hasPermission = userStore.permissions.includes('*')
          || userStore.permissions.includes(requiredPermission)
        if (!hasPermission) { next('/403'); return }
      }
      next()
    }
  } else {
    whiteList.includes(to.path) ? next() : next(`/login?redirect=${to.path}`)
  }
})
```

### 6.3 动态路由（前端驱动）

动态路由由前端 `asyncRoutes.ts` 完整定义，后端返回 `permissionGroups`（权限标识数组），通过 `filterRoutes` 按权限过滤。

**路由表定义** — `frontend/src/router/routes/routePermissionRegistry.ts`（唯一真相源，自动生成 `asyncRoutes`）

```typescript
export const routePermissionRegistry = {
  System: {
    path: '/system',
    name: 'System',
    title: '系统管理',
    icon: 'Setting',
    redirect: '/system/user',
    pages: {
      User: {
        path: 'user',
        title: '用户管理',
        icon: 'User',
        load: () => import('@/views/system/user/index.vue'),
        permissions: {
          List: { action: 'list', title: '访问页面', kind: 'page' },
          Query: { action: 'query', title: '查询详情', kind: 'api' },
          Add: { action: 'add', title: '新增', kind: 'both' },
          Edit: { action: 'edit', title: '编辑', kind: 'both' },
          Delete: { action: 'delete', title: '删除', kind: 'both' },
          Assign: { action: 'assign', title: '分配角色', kind: 'both' },
          ResetPwd: { action: 'resetPwd', title: '重置密码', kind: 'both' }
        }
      },
      Role: {
        path: 'role',
        title: '角色管理',
        icon: 'UserFilled',
        load: () => import('@/views/system/role/index.vue'),
        permissions: {
          List: { action: 'list', title: '访问页面', kind: 'page' },
          Query: { action: 'query', title: '查询详情', kind: 'api' },
          Add: { action: 'add', title: '新增', kind: 'both' },
          Edit: { action: 'edit', title: '编辑', kind: 'both' },
          Delete: { action: 'delete', title: '删除', kind: 'both' },
          Assign: { action: 'assign', title: '分配权限', kind: 'both' }
        }
      }
    }
  }
} as const
```

**过滤逻辑** — `frontend/src/router/routes/utils/filterRoutes.ts`

```typescript
export function filterRoutes(
  routes: RouteRecordRaw[],
  permissions: string[]
): RouteRecordRaw[] {
  return routes
    .filter(route => {
      const perm = toPermissionKey(String(route.name), 'list')
      return permissions.includes('*') || permissions.includes(perm)
    })
    .map(route => ({
      ...route,
      children: route.children
        ? filterRoutes(route.children, permissions)
        : undefined
    }))
}
```

### 6.4 useAuth — 统一登录/登出

`frontend/src/composables/useAuth.ts`

```typescript
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { logoutApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { clearSession } from '@/utils/clear-session'

export function useAuth() {
  const router = useRouter()
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  async function login(params: { username: string; password: string }) {
    permissionStore.resetRoutes()
    await userStore.login(params)
    await userStore.getUserInfo()
    const routes = await permissionStore.loadRoutes(userStore.permissionGroups)
    routes.forEach(r => router.addRoute(r))
    return userStore.userInfo
  }

  async function logout(options?: { confirm?: boolean }) {
    if (options?.confirm !== false) {
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
        })
      } catch { return }
    }
    try { await logoutApi() } catch { /* 网络失败也继续本地清理 */ }
    clearSession()  // 重置路由 → 重置状态 → 跳转 /login
  }

  return { login, logout, isAuthenticated: computed(() => !!userStore.token) }
}
```

**clearSession** — `frontend/src/utils/clear-session.ts`

```typescript
export function clearSession(redirect = true) {
  usePermissionStore().resetRoutes()
  useUserStore().resetState()
  if (redirect) router.replace('/login')
}
```

### 6.5 权限指令与 Hook

**v-auth 指令** — `frontend/src/directives/auth.ts`

```typescript
import { useUserStore } from '@/stores/user'

export const auth = {
  mounted(el, binding) {
    const { value } = binding
    const userStore = useUserStore()
    const permissions = userStore.permissions

    if (value) {
      const has = Array.isArray(value)
        ? value.some(p => permissions.includes(p))
        : permissions.includes(value)
      if (!has) el.parentNode?.removeChild(el)
    }
  }
}
```

**usePermissions Hook** — `frontend/src/composables/usePermissions.ts`

```typescript
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

export function usePermissions() {
  const userStore = useUserStore()
  const permissions = computed(() => userStore.permissions)

  function hasPermission(p: string | string[]) {
    if (Array.isArray(p)) return p.some(x => permissions.value.includes(x))
    return permissions.value.includes(p)
  }

  function hasAnyPermission(list: string[]) {
    return list.some(p => permissions.value.includes(p))
  }

  function hasAllPermissions(list: string[]) {
    return list.every(p => permissions.value.includes(p))
  }

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions }
}
```

## 七、页面级权限控制

### 7.1 路由 meta 配置

路由权限通过 `meta.permission` 声明，支持 `PermissionAction` 对象或权限字符串：

```typescript
// asyncRoutes.ts 中的路由定义
{
  path: 'user',
  name: 'User',
  component: () => import('@/views/system/user/index.vue'),
  meta: {
    title: '用户管理',
    permission: { action: 'list' }  // 自动生成为 'user:list'
  }
}
```

### 7.2 使用方式

```vue
<template>
  <!-- 方式一：指令 -->
  <el-button v-auth="'user:add'">新增用户</el-button>
  <el-button v-auth="['user:edit', 'user:delete']">编辑或删除</el-button>

  <!-- 方式二：函数 -->
  <el-button v-if="hasPermission('user:delete')">删除</el-button>
</template>

<script setup>
import { usePermissions } from '@/composables/usePermissions'
const { hasPermission } = usePermissions()
</script>
```

## 八、API 接口设计（参考）

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 登录 | POST | /api/auth/login | 用户登录 |
| 登出 | POST | /api/auth/logout | 退出登录（清除 Redis token） |
| 获取用户信息 | GET | /api/auth/userinfo | 获取当前用户信息及 permissionGroups |
| 刷新 Token | POST | /api/auth/refresh | 刷新 access token |
| 用户列表 | GET | /api/users | 获取用户列表 |
| 新增用户 | POST | /api/users | 新增用户 |
| 修改用户 | PUT | /api/users/:id | 修改用户 |
| 删除用户 | DELETE | /api/users/:id | 删除用户 |
| 角色列表 | GET | /api/roles | 获取角色列表 |
| 新增角色 | POST | /api/roles | 新增角色 |
| 修改角色 | PUT | /api/roles/:id | 修改角色 |
| 删除角色 | DELETE | /api/roles/:id | 删除角色 |
| 获取角色权限 | GET | /api/roles/:id/permissions | 获取角色已分配权限（RoutePermissionGroup[]） |
| 分配角色权限 | POST | /api/roles/:id/permissions | 为角色分配权限（RoutePermissionGroup[]） |

> **注意**：`/api/auth/userinfo` 返回 `permissionGroups`（`RoutePermissionGroup[]`），非扁平 `permissions` 数组。前端通过 `flattenPermissionGroups()` 转换为扁平 `user:list` 格式供 v-auth 指令使用。
>
> **已废弃接口**：`GET /api/menus/tree`、`GET /api/menus/routes`、`GET/POST /api/roles/:id/menus` 及所有 `/api/menus/*` 接口已移除。

## 九、实施步骤

### 第一阶段：基础搭建
1. 安装依赖 (vue-router, pinia, element-plus, axios)
2. 配置路由
3. 配置 Pinia store
4. 配置 Axios 封装

### 第二阶段：登录模块
1. 登录页面开发
2. Token 存储与刷新
3. 用户信息获取（含 permissionGroups）
4. 退出登录

### 第三阶段：权限核心
1. 权限指令开发（v-auth, v-role）
2. 权限判断 Hook（usePermissions）
3. 路由守卫（permission.ts）
4. 动态路由生成（asyncRoutes + filterRoutes）

### 第四阶段：功能模块
1. 布局组件（侧边栏、头部）
2. 用户管理 CRUD（含角色分配）
3. 角色管理 CRUD（含权限分配，基于 asyncRoutes 权限树）

### 第五阶段：联调测试
1. 按钮级权限控制
2. 前后端联调（RoutePermissionGroup 格式对齐）
3. 错误处理
4. 权限穿透测试

### 第六阶段：asyncRoutes 改造（已完成）
1. 新增 `routePermissionRegistry.ts` 作为唯一真相源
2. 移除菜单管理模块（页面、API、类型）
3. 角色权限改用 `RoutePermissionGroup[]` 格式
4. Sidebar 适配新菜单结构
5. 清理 `import.meta.glob` 等旧代码

## 十、安全建议

1. **后端验证**：所有权限验证必须在后端完成，前端仅作展示控制
2. **Token 安全**：使用 httpOnly Cookie 或加密存储
3. **最小权限**：默认赋予用户最小必要权限
4. **审计日志**：记录关键操作的审计日志
5. **定期审查**：定期审查角色和权限配置
