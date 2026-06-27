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
import MenuForm from './components/MenuForm.vue'

const loading = ref(false)
const tableData = ref<any[]>([])
const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const currentId = ref(0)
const parentId = ref(0)

// TODO: 替换为真实 API 调用
const mockMenus = [
  {
    id: 1, name: '系统管理', type: 'directory', icon: 'Setting', path: '/system',
    permission: '', sort: 1, status: 1,
    children: [
      { id: 2, name: '用户管理', type: 'menu', icon: 'User', path: '/system/user', permission: 'user:list', sort: 1, status: 1 },
      { id: 3, name: '角色管理', type: 'menu', icon: 'Avatar', path: '/system/role', permission: 'role:list', sort: 2, status: 1 },
      { id: 4, name: '菜单管理', type: 'menu', icon: 'Menu', path: '/system/menu', permission: 'menu:list', sort: 3, status: 1 },
      { id: 5, name: '新增用户', type: 'button', icon: '', path: '', permission: 'user:add', sort: 1, status: 1 }
    ]
  }
]

function typeLabel(type: string) {
  const map: Record<string, string> = { directory: '目录', menu: '菜单', button: '按钮' }
  return map[type] || type
}

function typeTag(type: string) {
  const map: Record<string, string> = { directory: '', menu: 'success', button: 'warning' }
  return map[type] || ''
}

async function fetchData() {
  loading.value = true
  await new Promise(r => setTimeout(r, 300))
  tableData.value = mockMenus
  loading.value = false
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
  await ElMessageBox.confirm(`确定删除菜单 "${row.name}" 吗？`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
.menu-page {
  .toolbar { margin-bottom: 16px; }
}
</style>