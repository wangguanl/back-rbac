<template>
  <div class="user-page">
    <el-card>
      <el-form :inline="true" :model="search" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="search.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="search.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" v-auth="'user:add'" @click="handleAdd">新增用户</el-button>
        <el-button type="danger" v-auth="'user:delete'" :disabled="!selectedIds.length" @click="handleBatchDelete">
          批量删除
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="160" />
        <el-table-column label="角色" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="r in row.roles" :key="r" size="small" style="margin-right: 4px">{{ r }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              @change="(val: boolean) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" v-auth="'user:edit'" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" v-auth="'user:assign'" @click="handleAssignRole(row)">分配角色</el-button>
            <el-button link type="warning" @click="handleResetPassword(row)">重置密码</el-button>
            <el-button link type="danger" v-auth="'user:delete'" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchData"
          @size-change="fetchData"
        />
      </div>
    </el-card>

    <UserForm v-model:visible="formVisible" :mode="formMode" :user-id="currentId" @success="fetchData" />
    <AssignRoleDialog v-model:visible="assignVisible" :user-id="currentId" @success="fetchData" />
    <ResetPasswordDialog v-model:visible="passwordVisible" :user-id="currentId" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserForm from './components/UserForm.vue'
import AssignRoleDialog from './components/AssignRoleDialog.vue'
import ResetPasswordDialog from './components/ResetPasswordDialog.vue'

const loading = ref(false)
const tableData = ref<any[]>([])
const selectedIds = ref<number[]>([])
const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const assignVisible = ref(false)
const passwordVisible = ref(false)
const currentId = ref(0)

const search = reactive({ username: '', status: undefined as number | undefined })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// TODO: 替换为真实 API 调用
const mockUsers = [
  { id: 1, username: 'admin', nickname: '管理员', email: 'admin@example.com', roles: ['超级管理员'], status: 1 },
  { id: 2, username: 'zhangsan', nickname: '张三', email: 'zhangsan@example.com', roles: ['编辑'], status: 1 },
  { id: 3, username: 'lisi', nickname: '李四', email: 'lisi@example.com', roles: ['访客'], status: 0 },
  { id: 4, username: 'wangwu', nickname: '王五', email: 'wangwu@example.com', roles: ['编辑', '审核员'], status: 1 },
]

async function fetchData() {
  loading.value = true
  await new Promise(r => setTimeout(r, 300))
  let data = [...mockUsers]
  if (search.username) data = data.filter(u => u.username.includes(search.username))
  if (search.status !== undefined) data = data.filter(u => u.status === search.status)
  pagination.total = data.length
  const start = (pagination.page - 1) * pagination.pageSize
  tableData.value = data.slice(start, start + pagination.pageSize)
  loading.value = false
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  search.username = ''
  search.status = undefined
  handleSearch()
}

function handleSelectionChange(rows: any[]) {
  selectedIds.value = rows.map(r => r.id)
}

function handleAdd() {
  formMode.value = 'add'
  currentId.value = 0
  formVisible.value = true
}

function handleEdit(row: any) {
  formMode.value = 'edit'
  currentId.value = row.id
  formVisible.value = true
}

function handleAssignRole(row: any) {
  currentId.value = row.id
  assignVisible.value = true
}

function handleResetPassword(row: any) {
  currentId.value = row.id
  passwordVisible.value = true
}

async function handleStatusChange(row: any, val: boolean) {
  ElMessage.success(`${val ? '启用' : '禁用'}成功`)
  row.status = val ? 1 : 0
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定删除用户 "${row.username}" 吗？`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  fetchData()
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 个用户吗？`, '提示', { type: 'warning' })
  ElMessage.success('批量删除成功')
  selectedIds.value = []
  fetchData()
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
.user-page {
  .search-form {
    margin-bottom: 16px;
  }
  .toolbar {
    margin-bottom: 16px;
  }
  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>