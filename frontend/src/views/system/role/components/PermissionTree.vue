<template>
  <el-dialog
    :model-value="visible"
    title="分配权限"
    width="450px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form label-width="80px">
      <el-form-item label="角色 ID">
        <span>{{ roleId }}</span>
      </el-form-item>
      <el-form-item label="菜单权限">
        <el-tree
          ref="treeRef"
          :data="menuTree"
          show-checkbox
          node-key="id"
          :default-checked-keys="checkedKeys"
          default-expand-all
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{ visible: boolean; roleId: number }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; success: [] }>()

const treeRef = ref()
const submitting = ref(false)

// TODO: 替换为真实 API 调用
const menuTree = [
  {
    id: 1, label: '系统管理',
    children: [
      { id: 2, label: '用户管理' },
      { id: 3, label: '角色管理' },
      { id: 4, label: '菜单管理' }
    ]
  }
]
const checkedKeys = [1, 2]

async function handleSubmit() {
  const checkedIds = treeRef.value.getCheckedKeys()
  const halfCheckedIds = treeRef.value.getHalfCheckedKeys()
  const allIds = [...checkedIds, ...halfCheckedIds]
  submitting.value = true
  await new Promise(r => setTimeout(r, 300))
  ElMessage.success(`权限分配成功，选中 ${allIds.length} 个菜单`)
  submitting.value = false
  emit('update:visible', false)
  emit('success')
}
</script>