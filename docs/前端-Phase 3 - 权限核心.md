# 前端-Phase 3：权限核心（1天）

> 所属项目：RBAC 权限管理系统
> 执行顺序：前端第3阶段
> 预计耗时：1天
> 前置依赖：前端-Phase 2 - 登录与布局
> 下一阶段：前端-Phase 4 - 功能模块

---

## 目标

实现权限指令、权限Hook、页面级和按钮级权限控制。

---

## 任务清单

| 序号 | 任务 | 验收标准 |
|------|------|----------|
| 3.1 | v-auth指令 | 无权限时元素不显示 |
| 3.2 | v-role指令 | 无角色时元素不显示 |
| 3.3 | usePermissions Hook | hasPermission等方法 |
| 3.4 | useAuth Hook | 登录登出方法封装 |
| 3.5 | 页面级权限 | 路由meta权限验证 |
| 3.6 | 按钮级权限 | 指令+函数两种方式 |

---

## 目录结构

```
frontend/src/
├── directives/
│   ├── auth.ts
│   ├── role.ts
│   └── index.ts
├── composables/
│   ├── usePermissions.ts
│   └── useAuth.ts
```

---

## 核心代码要点

### v-auth指令

```typescript
// directives/auth.ts
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

### usePermissions Hook

```typescript
// composables/usePermissions.ts
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

---

## 使用示例

### 模板中使用指令

```vue
<template>
  <el-button v-auth="'user:add'">新增用户</el-button>
  <el-button v-auth="['user:edit', 'user:delete']">编辑或删除</el-button>
  <el-button v-role="'admin'">管理员可见</el-button>
</template>
```

### 脚本中使用Hook

```vue
<script setup>
import { usePermissions } from '@/composables/usePermissions'

const { hasPermission } = usePermissions()
</script>

<template>
  <el-button v-if="hasPermission('user:delete')">删除</el-button>
</template>
```

---

## 验证方法

```bash
# 1. 测试指令
# - 无user:add权限 → "新增"按钮不显示
# - 无user:delete权限 → "删除"按钮不显示

# 2. 测试Hook
# - hasPermission('user:add') 返回正确的布尔值

# 3. 测试页面权限
# - 直接访问无权限页面 → 跳转403
```

---

## 本阶段交付物

- [ ] v-auth 权限指令
- [ ] v-role 角色指令
- [ ] usePermissions Hook
- [ ] useAuth Hook
- [ ] 页面级权限控制
- [ ] 按钮级权限控制

---

## 下一阶段

完成后进入 **前端-Phase 4 - 功能模块**。

---

## 参考文档

- [RBAC前端方案.md](RBAC前端方案.md)
- [前端-Phase 2 - 登录与布局.md](前端-Phase%202%20-%20登录与布局.md)