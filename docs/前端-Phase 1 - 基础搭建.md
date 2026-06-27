# 前端-Phase 1：基础搭建（1天）

> 所属项目：RBAC 权限管理系统
> 执行顺序：前端第1阶段
> 预计耗时：1天
> 前置依赖：后端-Phase 4 - 测试验收（后端完成）
> 下一阶段：前端-Phase 2 - 登录与布局

---

## 目标

初始化 Vue 3 + TypeScript + Vite 项目，配置路由、Pinia、Element Plus、Axios，完成API对接准备。

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5.x | 核心框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 8.x | 构建工具 |
| Vue Router | 4.x | 路由管理 |
| Pinia | 2.x | 状态管理 |
| Element Plus | 2.x | UI组件库 |
| Axios | 1.x | HTTP请求 |
| pnpm | 10.x | 包管理器 |

---

## 任务清单

| 序号 | 任务 | 验收标准 |
|------|------|----------|
| 1.1 | ~~初始化Vite项目~~ | ~~pnpm dev 可运行~~ ✅ 已完成 |
| 1.2 | 安装依赖 | vue-router, pinia, element-plus, axios |
| 1.3 | 路径别名 | @ 别名指向 src |
| 1.4 | 静态路由配置 | /login, /403, /404 可访问 |
| 1.5 | Pinia配置 | user/permission/app store 创建 |
| 1.6 | Element Plus | 组件正常显示 |
| 1.7 | Axios封装 | 请求拦截、响应拦截完成 |
| 1.8 | API封装 | auth/user/role/menu API模块 |
| 1.9 | 工具函数 | storage/auth 工具完成 |
| 1.10 | 类型定义 | TypeScript类型定义完成 |
| 1.11 | 错误页面 | 403/404 页面可访问 |

---

## 目录结构

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── role.ts
│   │   └── menu.ts
│   ├── assets/styles/
│   ├── components/
│   ├── composables/
│   ├── directives/
│   ├── router/
│   │   ├── index.ts
│   │   └── routes/static.ts
│   ├── stores/
│   │   ├── user.ts
│   │   ├── permission.ts
│   │   └── app.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── role.ts
│   │   ├── menu.ts
│   │   └── api.ts
│   ├── utils/
│   │   ├── request.ts
│   │   ├── storage.ts
│   │   └── auth.ts
│   ├── views/
│   │   ├── login/
│   │   └── error/
│   ├── App.vue
│   ├── env.d.ts
│   └── main.ts
├── .env.development
├── .env.production
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 执行步骤

### 步骤1：项目初始化

> Vite 项目已初始化，跳过 `pnpm create vite` 步骤。

```bash
cd /Applications/My/Demo/Vue/后台RBAC/frontend

# 安装核心依赖
pnpm add vue-router@4 pinia pinia-plugin-persistedstate element-plus @element-plus/icons-vue axios

# 安装开发依赖
pnpm add -D sass
```

### 步骤2：Vite配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

### 步骤3：环境变量

```bash
# .env.development
VITE_APP_TITLE = 'RBAC 权限管理系统'
VITE_API_BASE_URL = '/api'
```

### 步骤4：核心文件创建顺序

1. types/api.ts - API响应类型
2. types/user.ts - 用户类型
3. types/role.ts - 角色类型
4. types/menu.ts - 菜单类型
5. utils/storage.ts - 存储工具
6. utils/auth.ts - 认证工具
7. utils/request.ts - Axios封装
8. api/auth.ts - 认证API
9. api/user.ts - 用户API
10. api/role.ts - 角色API
11. api/menu.ts - 菜单API
12. stores/user.ts - 用户Store
13. stores/permission.ts - 权限Store
14. stores/app.ts - 应用Store
15. router/routes/static.ts - 静态路由
16. router/index.ts - 路由配置
17. views/error/403.vue - 403页面
18. views/error/404.vue - 404页面
19. main.ts - 入口文件

---

## 核心代码要点

### Axios封装

```typescript
// utils/request.ts
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken, removeToken } from './auth'
import router from '@/router'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000
})

// 请求拦截
service.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截
service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message)
      if (res.code === 401) {
        ElMessageBox.confirm('登录已过期', '提示', {
          confirmButtonText: '重新登录'
        }).then(() => {
          removeToken()
          router.push('/login')
        })
      }
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  error => {
    ElMessage.error(error.message)
    return Promise.reject(error)
  }
)

export default service
```

### 用户Store

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { loginApi, getUserInfoApi } from '@/api/auth'
import { setToken, removeToken } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref(null)
  const permissions = ref<string[]>([])

  async function login(params) {
    const res = await loginApi(params)
    token.value = res.data.token
    setToken(res.data.token)
    return res.data
  }

  async function getUserInfo() {
    const res = await getUserInfoApi()
    userInfo.value = res.data
    permissions.value = res.data.permissions
    return res.data
  }

  function resetState() {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    removeToken()
  }

  return { token, userInfo, permissions, login, getUserInfo, resetState }
}, { persist: { key: 'user', pick: ['token'] } })
```

---

## 验证方法

```bash
# 1. 启动前端服务
pnpm dev

# 2. 访问页面
http://localhost:5173/login
http://localhost:5173/403
http://localhost:5173/404

# 3. 检查ESLint
pnpm lint
```

---

## 本阶段交付物

- [x] Vue3 + Vite项目框架
- [x] 路由配置
- [x] Pinia Store
- [x] Axios请求封装
- [x] API接口封装
- [x] 工具函数
- [x] TypeScript类型
- [x] 错误页面

---

## 下一阶段

完成后进入 **前端-Phase 2 - 登录与布局**。

---

## 参考文档

- [RBAC前端方案.md](RBAC前端方案.md)
- [后端-Phase 4 - 测试验收.md](后端-Phase%204%20-%20测试验收.md)