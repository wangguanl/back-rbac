# RBAC 权限管理系统方案

## 一、项目概述

本项目是一个基于 Vue 3 + TypeScript + Vite 的后台权限管理系统，采用 RBAC（Role-Based Access Control）模型实现细粒度的权限控制。

### 1.1 核心功能模块

| 模块 | 描述 |
|------|------|
| 用户管理 | 用户的增删改查、状态启用/禁用 |
| 角色管理 | 角色的增删改查、权限分配 |
| 菜单管理 | 菜单树的增删改查、页面权限配置 |
| 权限管理 | 按钮级别、操作级别的权限控制 |

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
                                  │  n:m 关系
                                  ▼
                              菜单/按钮 (Menu)
```

### 3.2 权限粒度

| 级别 | 说明 | 示例 |
|------|------|------|
| 页面级 | 能否访问某个页面 | /user、/role |
| 按钮级 | 页面内的操作权限 | 新增、编辑、删除 |
| 接口级 | API 调用权限 | GET、POST、PUT、DELETE |

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

-- 菜单表
CREATE TABLE sys_menu (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    parent_id   BIGINT DEFAULT 0,
    name        VARCHAR(50) NOT NULL,
    path        VARCHAR(200),
    component   VARCHAR(200),
    icon        VARCHAR(50),
    sort        INT DEFAULT 0,
    type        TINYINT COMMENT '1:目录 2:菜单 3:按钮',
    permission  VARCHAR(100) COMMENT '权限标识',
    status      TINYINT DEFAULT 1,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户-角色关联表
CREATE TABLE sys_user_role (
    user_id BIGINT,
    role_id BIGINT,
    PRIMARY KEY (user_id, role_id)
);

-- 角色-菜单关联表
CREATE TABLE sys_role_menu (
    role_id BIGINT,
    menu_id BIGINT,
    PRIMARY KEY (role_id, menu_id)
);
```

## 五、前端目录结构

```
src/
├── api/                    # API 接口
│   ├── user.ts
│   ├── role.ts
│   └── menu.ts
├── components/             # 公共组件
│   ├── common/
│   │   └── Pagination.vue
│   └── layout/
│       ├── Sidebar.vue
│       ├── Header.vue
│       └── Main.vue
├── composables/            # 组合式函数
│   ├── usePermissions.ts
│   └── useAuth.ts
├── directives/             # 指令
│   ├── auth.ts            # 权限指令 v-auth
│   └── role.ts            # 角色指令 v-role
├── router/                 # 路由
│   ├── index.ts
│   └── routes/
│       ├── static.ts
│       └── dynamic.ts
├── stores/                 # 状态管理
│   ├── user.ts
│   ├── permission.ts
│   └── app.ts
├── types/                  # 类型定义
│   ├── user.ts
│   ├── role.ts
│   ├── menu.ts
│   └── index.ts
├── utils/                  # 工具函数
│   ├── auth.ts
│   ├── storage.ts
│   └── request.ts
├── views/                  # 页面
│   ├── login/
│   ├── dashboard/
│   ├── system/
│   │   ├── user/
│   │   ├── role/
│   │   └── menu/
│   └── error/
│       ├── 403.vue
│       └── 404.vue
├── App.vue
└── main.ts
```

## 六、核心实现

### 6.1 权限指令

```typescript
// src/directives/auth.ts
import type { Directive } from 'vue'

export const auth: Directive = {
  mounted(el, binding) {
    const { value } = binding
    const permissions = JSON.parse(sessionStorage.getItem('permissions') || '[]')

    if (value && !permissions.includes(value)) {
      el.parentNode?.removeChild(el)
    }
  }
}
```

### 6.2 权限判断 Hook

```typescript
// src/composables/usePermissions.ts
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

export function usePermissions() {
  const userStore = useUserStore()

  const permissions = computed(() => userStore.permissions)

  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission)
  }

  function hasAnyPermission(permList: string[]): boolean {
    return permList.some(p => permissions.value.includes(p))
  }

  function hasAllPermissions(permList: string[]): boolean {
    return permList.every(p => permissions.value.includes(p))
  }

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  }
}
```

### 6.3 路由守卫

```typescript
// src/router/permission.ts
import router from './index'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const token = sessionStorage.getItem('token')

  if (token) {
    if (to.path === '/login') {
      next('/dashboard')
    } else if (!userStore.permissions.length) {
      try {
        await userStore.getUserInfo()
        next({ ...to, replace: true })
      } catch {
        userStore.logout()
        next('/login')
      }
    } else {
      next()
    }
  } else if (to.path !== '/login') {
    next('/login')
  } else {
    next()
  }
})
```

### 6.4 动态路由生成

```typescript
// src/store/permission.ts
import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: [] as RouteRecordRaw[],
    dynamicRoutes: [] as RouteRecordRaw[]
  }),

  actions: {
    async generateRoutes(permissions: string[]) {
      // 根据权限过滤路由
      const accessedRoutes = filterRoutes(asyncRoutes, permissions)
      this.dynamicRoutes = accessedRoutes
      return accessedRoutes
    }
  }
})
```

## 七、页面级权限控制

### 7.1 路由 meta 配置

```typescript
{
  path: '/system/user',
  component: Layout,
  children: [{
    path: '',
    component: () => import('@/views/system/user/index.vue'),
    meta: {
      title: '用户管理',
      icon: 'user',
      permission: 'user:list'
    }
  }]
}
```

### 7.2 权限判断

```typescript
// 方式一：指令
<el-button v-auth="'user:add'">新增用户</el-button>

// 方式二：函数
import { usePermissions } from '@/composables/usePermissions'

const { hasPermission } = usePermissions()

// 模板中
<el-button v-if="hasPermission('user:delete')">删除</el-button>
```

## 八、API 接口设计（参考）

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 登录 | POST | /api/login | 用户登录 |
| 获取用户信息 | GET | /api/user/info | 获取当前用户信息及权限 |
| 用户列表 | GET | /api/users | 获取用户列表 |
| 新增用户 | POST | /api/user | 新增用户 |
| 修改用户 | PUT | /api/user/:id | 修改用户 |
| 删除用户 | DELETE | /api/user/:id | 删除用户 |
| 角色列表 | GET | /api/roles | 获取角色列表 |
| 新增角色 | POST | /api/role | 新增角色 |
| 修改角色 | PUT | /api/role/:id | 修改角色 |
| 删除角色 | DELETE | /api/role/:id | 删除角色 |
| 菜单树 | GET | /api/menus/tree | 获取菜单树 |
| 分配权限 | POST | /api/role/assign-permissions | 分配权限 |

## 九、实施步骤

### 第一阶段：基础搭建
1. 安装依赖 (vue-router, pinia, element-plus, axios)
2. 配置路由
3. 配置 Pinia store
4. 配置 Axios 封装

### 第二阶段：登录模块
1. 登录页面开发
2. Token 存储与刷新
3. 用户信息获取
4. 退出登录

### 第三阶段：权限核心
1. 权限指令开发
2. 权限判断 Hook
3. 路由守卫
4. 动态路由生成

### 第四阶段：功能模块
1. 布局组件（侧边栏、头部）
2. 用户管理 CRUD
3. 角色管理 CRUD
4. 菜单管理

### 第五阶段：优化完善
1. 按钮级权限控制
2. 页面缓存
3. 错误处理
4. 权限穿透测试

## 十、安全建议

1. **后端验证**：所有权限验证必须在后端完成，前端仅作展示控制
2. **Token 安全**：使用 httpOnly Cookie 或加密存储
3. **最小权限**：默认赋予用户最小必要权限
4. **审计日志**：记录关键操作的审计日志
5. **定期审查**：定期审查角色和权限配置
