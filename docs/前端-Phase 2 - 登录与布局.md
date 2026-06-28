# 前端-Phase 2：登录与布局（1天）

> 所属项目：RBAC 权限管理系统
> 执行顺序：前端第2阶段
> 预计耗时：1天
> 前置依赖：前端-Phase 1 - 基础搭建
> 下一阶段：前端-Phase 3 - 权限核心

---

## 目标

实现登录页面、主布局（侧边栏+头部+主内容区）、路由守卫、仪表盘首页。

---

## 任务清单

| 序号 | 任务 | 验收标准 |
|------|------|----------|
| 2.1 | 登录页面 | 用户名密码表单、登录成功跳转 |
| 2.2 | 主布局Layout | 侧边栏+头部+主内容区 |
| 2.3 | 侧边栏Sidebar | 动态菜单、折叠展开 |
| 2.4 | 头部Header | 面包屑、用户信息、退出登录 |
| 2.5 | 主内容区Main | 路由视图、keep-alive |
| 2.6 | 路由守卫 | 登录验证、动态路由加载 |
| 2.7 | 仪表盘Dashboard | 首页展示 |
| 2.8 | 动态路由 | 根据用户权限加载路由 |

---

## 目录结构

```
frontend/src/
├── components/layout/
│   ├── Layout.vue
│   ├── Sidebar.vue
│   ├── Header.vue
│   └── Main.vue
├── views/
│   ├── login/
│   │   └── index.vue
│   └── dashboard/
│   │   └── index.vue
└── router/
    └── permission.ts
```

---

## 核心代码要点

### 登录页面

```vue
<!-- views/login/index.vue -->
<template>
  <div class="login-container">
    <el-form ref="formRef" :model="form" :rules="rules">
      <el-form-item prop="username">
        <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" />
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
      </el-form-item>
      <el-button type="primary" @click="handleLogin" :loading="loading">登录</el-button>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuth } from '@/composables/useAuth'

const { login } = useAuth()
const loading = ref(false)

const form = reactive({ username: 'admin', password: '123456' })
const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }]
}

async function handleLogin() {
  loading.value = true
  try {
    await login(form)  // useAuth().login() 内聚了 store 操作 + 动态路由加载
  } finally {
    loading.value = false
  }
}
</script>
```

### 路由守卫

```typescript
// router/permission.ts
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
        // 获用户信息失败 → 清除状态，跳转登录
        permissionStore.resetRoutes()
        userStore.resetState()
        next(`/login?redirect=${to.path}`)
      }
    } else {
      // 路由级权限校验
      next()
    }
  } else {
    whiteList.includes(to.path) ? next() : next(`/login?redirect=${to.path}`)
  }
})
```

### 动态路由（前端驱动）

```typescript
// stores/permission.ts
import { defineStore } from 'pinia'
import { markRaw, ref, shallowRef } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/components/layout/Layout.vue'
import router from '@/router'
import { asyncRoutes } from '@/router/routes/asyncRoutes'
import { filterRoutes } from '@/router/routes/utils/filterRoutes'
import { flattenPermissionGroups } from '@/router/routes/utils/permissionGroups'
import { routesToMenuList } from '@/router/routes/utils/routesToMenuList'

const dashboardRoute: RouteRecordRaw = {
  path: '/dashboard',
  name: 'Dashboard',
  component: markRaw(Layout),
  redirect: '/dashboard/index',
  children: [{
    path: 'index',
    component: markRaw(() => import('@/views/dashboard/index.vue')),
    meta: { title: '仪表盘' }
  }]
}

export const usePermissionStore = defineStore('permission', () => {
  const routes = shallowRef<RouteRecordRaw[]>([])
  const menuList = ref<SidebarMenuItem[]>([])
  const addedRouteNames = ref<string[]>([])

  async function loadRoutes(permissionGroups: RoutePermissionGroup[]) {
    const flatPermissions = flattenPermissionGroups(permissionGroups)
    const accessed = filterRoutes(asyncRoutes, flatPermissions)
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

---

## 验证方法

```bash
# 1. 启动服务
pnpm dev

# 2. 测试登录流程
# - 访问 /login
# - 输入 admin/123456
# - 登录成功跳转首页

# 3. 测试路由守卫
# - 未登录访问其他页面 → 跳转登录页
# - 登录后刷新页面 → 保持登录状态
# - 点击退出 → 清除状态跳转登录页

# 4. 测试侧边栏
# - 菜单根据权限显示
# - 可折叠展开
# - 当前菜单高亮
```

---

## 本阶段交付物

- [x] 登录页面
- [x] 主布局组件
- [x] 侧边栏组件
- [x] 头部组件
- [x] 仪表盘页面
- [x] 路由守卫
- [x] 动态路由加载

---

## 下一阶段

完成后进入 **前端-Phase 3 - 权限核心**。

---

## 参考文档

- [RBAC前端方案.md](RBAC前端方案.md)
- [前端-Phase 1 - 基础搭建.md](前端-Phase%201%20-%20基础搭建.md)