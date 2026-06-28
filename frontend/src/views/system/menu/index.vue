<template>
  <div class="menu-page">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" v-auth="'menu:add'" @click="handleAdd(0)">新增根菜单</el-button>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        row-key="id"
        border
        default-expand-all
      >
        <el-table-column prop="name" label="菜单名称" min-width="180" />
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" size="small">{{ typeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" min-width="140" />
        <el-table-column prop="permission" label="权限标识" min-width="140" />
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" v-auth="'menu:add'" @click="handleAdd(row.id)">添加子级</el-button>
            <el-button link type="primary" v-auth="'menu:edit'" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" v-auth="'menu:delete'" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <MenuForm v-model:visible="formVisible" :mode="formMode" :menu-id="currentId" :parent-id="parentId" @success="fetchData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMenuTreeApi, deleteMenuApi } from '@/api/menu'
import MenuForm from './components/MenuForm.vue'

const loading = ref(false)
const tableData = ref<any[]>([])
const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const currentId = ref(0)
const parentId = ref(0)

function typeLabel(type: number) {
  const map: Record<number, string> = { 0: '目录', 1: '菜单', 2: '按钮' }
  return map[type] || String(type)
}

function typeTag(type: number) {
  const map: Record<number, string> = { 0: 'info', 1: 'success', 2: 'warning' }
  return map[type] || 'info'
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getMenuTreeApi()
    tableData.value = res.data || []
  } catch {
    ElMessage.error('获取菜单列表失败')
  } finally {
    loading.value = false
  }
}

function handleAdd(pid: number) {
  formMode.value = 'add'
  currentId.value = 0
  parentId.value = pid
  formVisible.value = true
}

function handleEdit(row: any) {
  formMode.value = 'edit'
  currentId.value = row.id
  parentId.value = 0
  formVisible.value = true
}

async function handleDelete(row: any) {
  if (row.children && row.children.length > 0) {
    ElMessage.warning('包含子菜单，无法删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除菜单 "${row.name}" 吗？`, '提示', { type: 'warning' })
    await deleteMenuApi(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch { /* 取消 */ }
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
.menu-page {
  .toolbar { margin-bottom: 16px; }
}
</style>