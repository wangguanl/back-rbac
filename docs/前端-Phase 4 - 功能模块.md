# 前端-Phase 4：功能模块（2天）

> 所属项目：RBAC 权限管理系统
> 执行顺序：前端第4阶段
> 预计耗时：2天
> 前置依赖：前端-Phase 3 - 权限核心
> 下一阶段：前端-Phase 5 - 联调测试
>
> **⚠️ 2026-06-28 架构变更**：菜单管理模块已移除（asyncRoutes 重构），详见 [改造方案-前端-asyncRoutes落地方案.md](改造方案-前端-asyncRoutes落地方案.md)。本文档保留历史记录，实际实现以改造方案为准。

---

## 目标

实现用户管理、角色管理的完整前端页面，对接后端API。

> **架构变更（2026-06-28）**：菜单管理模块已移除。权限分配改为基于前端 asyncRoutes 权限树，角色权限使用 `RoutePermissionGroup[]` 格式传输。

---

## 任务清单

| 序号 | 任务 | 验收标准 |
|------|------|----------|
| 4.1 | 用户列表页面 | 表格展示、分页、搜索 |
| 4.2 | 用户表单弹窗 | 新增/编辑用户 |
| 4.3 | 分配角色弹窗 | 多选角色分配 |
| 4.4 | 重置密码弹窗 | 密码重置 |
| 4.5 | 用户删除 | 单删/批量删除 |
| 4.6 | 角色列表页面 | 表格展示、搜索 |
| 4.7 | 角色表单弹窗 | 新增/编辑角色 |
| 4.8 | 权限分配弹窗 | 基于 asyncRoutes 权限树选择 |
| 4.9 | 按钮权限控制 | v-auth指令应用 |

---

## 目录结构

```
frontend/src/views/system/
├── user/
│   ├── index.vue
│   └── components/
│       ├── UserForm.vue
│       ├── AssignRoleDialog.vue
│       └── ResetPasswordDialog.vue
└── role/
    ├── index.vue
    └── components/
        ├── RoleForm.vue
        └── PermissionTree.vue
```

> **注意**：`views/system/menu/` 目录已删除，菜单管理功能不再需要。

---

## 页面功能说明

### 用户管理页面

- 用户列表（表格、分页、搜索、状态筛选）
- 新增用户（表单弹窗、角色多选）
- 编辑用户（表单回显）
- 删除用户（单删、批量删除）
- 分配角色（角色选择弹窗）
- 重置密码（密码输入弹窗）
- 状态切换（启用/禁用）

### 角色管理页面

- 角色列表（表格、搜索）
- 新增角色（表单弹窗）
- 编辑角色（表单回显）
- 删除角色（确认删除）
- 分配权限（基于 asyncRoutes 的权限树弹窗，使用 `RoutePermissionGroup[]` 提交）

---

## 核心代码示例

### 用户列表页面

```vue
<!-- views/system/user/index.vue -->
<template>
  <el-card>
    <!-- 搜索表单 -->
    <el-form :inline="true">
      <el-form-item label="用户名">
        <el-input v-model="search.username" clearable />
      </el-form-item>
      <el-button type="primary" @click="fetchData">搜索</el-button>
    </el-form>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" v-auth="'user:add'" @click="handleAdd">新增</el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" v-loading="loading">
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column label="角色">
        <template #default="{ row }">
          <el-tag v-for="r in row.roles" :key="r.id">{{ r.name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button link v-auth="'user:edit'" @click="handleEdit(row)">编辑</el-button>
          <el-button link v-auth="'user:assign'" @click="handleAssign(row)">分配角色</el-button>
          <el-button link v-auth="'user:delete'" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination v-model:current-page="page" :total="total" @current-change="fetchData" />
  </el-card>

  <!-- 弹窗组件 -->
  <UserForm v-model:visible="formVisible" :mode="formMode" :userId="currentId" @success="fetchData" />
  <AssignRoleDialog v-model:visible="assignVisible" :userId="currentId" @success="fetchData" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserListApi, deleteUserApi } from '@/api/user'
import { ElMessageBox } from 'element-plus'

const tableData = ref([])
const loading = ref(false)

async function fetchData() {
  loading.value = true
  const res = await getUserListApi({ page: 1, pageSize: 10 })
  tableData.value = res.data || []
  pagination.total = res.pagination?.total || 0
  loading.value = false
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除${row.username}？`)
  await deleteUserApi(row.id)
  fetchData()
}

onMounted(() => fetchData())
</script>
```

---

## 验证方法

```bash
# 1. 启动前后端服务

# 2. 测试用户管理
# - 用户列表展示
# - 搜索筛选
# - 新增用户
# - 编辑用户
# - 分配角色
# - 删除用户

# 3. 测试角色管理
# - 角色列表
# - 新增/编辑角色
# - 权限分配（asyncRoutes 权限树）

# 4. 测试权限控制
# - 无权限按钮不显示
# - 不同角色看到不同菜单
```

---

## 本阶段交付物

- [x] 用户管理页面完整
- [x] 角色管理页面完整
- [x] 所有API对接完成
- [x] 按钮权限控制正确
- [x] 权限分配基于 asyncRoutes 权限树

---

## 下一阶段

完成后进入 **前端-Phase 5 - 联调测试**。

---

## 参考文档

- [RBAC前端方案.md](RBAC前端方案.md)
- [前端-Phase 3 - 权限核心.md](前端-Phase%203%20-%20权限核心.md)