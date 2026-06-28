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
        <el-button type="primary" v-auth="P.System.User.Add" @click="handleAdd">新增用户</el-button>
        <el-button type="danger" v-auth="P.System.User.Delete" :disabled="!selectedIds.length" @click="handleBatchDelete">
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
            <el-tag v-for="r in row.roles" :key="r" size="small" style="margin-right: 4px">{{ typeof r === 'object' ? r.name : r }}</el-tag>
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
            <el-button link type="primary" v-auth="P.System.User.Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" v-auth="P.System.User.Assign" @click="handleAssignRole(row)">分配角色</el-button>
            <el-button link type="warning" v-auth="P.System.User.ResetPwd" @click="handleResetPassword(row)">重置密码</el-button>
            <el-button link type="danger" v-auth="P.System.User.Delete" @click="handleDelete(row)">删除</el-button>
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
import { P } from '@/router/routes/asyncRoutes'
import { getUserListApi, deleteUserApi, updateUserApi } from '@/api/user'
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

async function fetchData() {
  loading.value = true
  try {
    const res = await getUserListApi({ page: pagination.page, pageSize: pagination.pageSize, username: search.username || undefined, status: search.status })
    console.log('[user] fetchData res:', res)
    console.log('[user] res.data:', res.data)
    console.log('[user] res.pagination:', res.pagination)
    tableData.value = res.data || []
    pagination.total = res.pagination?.total || 0
  } catch (e) {
    console.error('[user] fetchData error:', e)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
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
  try {
    await updateUserApi(row.id, { status: val ? 1 : 0 } as any)
    ElMessage.success(`${val ? '启用' : '禁用'}成功`)
    fetchData()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除用户 "${row.username}" 吗？`, '提示', { type: 'warning' })
    await deleteUserApi(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch { /* 取消 */ }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 个用户吗？`, '提示', { type: 'warning' })
    for (const id of selectedIds.value) {
      await deleteUserApi(id)
    }
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchData()
  } catch { /* 取消 */ }
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
.user-page {
  .search-form { margin-bottom: 16px; }
  .toolbar { margin-bottom: 16px; }
  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>