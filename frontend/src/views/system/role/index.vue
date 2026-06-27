<template>
  <div class="role-page">
    <el-card>
      <el-form :inline="true" :model="search" class="search-form">
        <el-form-item label="角色名称">
          <el-input v-model="search.name" placeholder="请输入角色名称" clearable />
        </el-form-item>
        <el-form-item label="角色编码">
          <el-input v-model="search.code" placeholder="请输入角色编码" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" v-auth="'role:add'" @click="handleAdd">新增角色</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="name" label="角色名称" min-width="140" />
        <el-table-column prop="code" label="角色编码" min-width="140" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" v-auth="'role:edit'" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" v-auth="'role:assign'" @click="handleAssignPermission(row)">分配权限</el-button>
            <el-button link type="danger" v-auth="'role:delete'" @click="handleDelete(row)">删除</el-button>
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

    <RoleForm v-model:visible="formVisible" :mode="formMode" :role-id="currentId" @success="fetchData" />
    <PermissionTree v-model:visible="permVisible" :role-id="currentId" @success="fetchData" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RoleForm from './components/RoleForm.vue'
import PermissionTree from './components/PermissionTree.vue'

const loading = ref(false)
const tableData = ref<any[]>([])
const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const permVisible = ref(false)
const currentId = ref(0)

const search = reactive({ name: '', code: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// TODO: 替换为真实 API 调用
const mockRoles = [
  { id: 1, name: '超级管理员', code: 'super_admin', description: '拥有系统所有权限', status: 1 },
  { id: 2, name: '编辑', code: 'editor', description: '可以编辑内容', status: 1 },
  { id: 3, name: '访客', code: 'visitor', description: '只能查看内容', status: 0 },
  { id: 4, name: '审核员', code: 'reviewer', description: '可以审核内容', status: 1 },
]

async function fetchData() {
  loading.value = true
  await new Promise(r => setTimeout(r, 300))
  let data = [...mockRoles]
  if (search.name) data = data.filter(r => r.name.includes(search.name))
  if (search.code) data = data.filter(r => r.code.includes(search.code))
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
  search.name = ''
  search.code = ''
  handleSearch()
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

function handleAssignPermission(row: any) {
  currentId.value = row.id
  permVisible.value = true
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定删除角色 "${row.name}" 吗？`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
.role-page {
  .search-form { margin-bottom: 16px; }
  .toolbar { margin-bottom: 16px; }
  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>