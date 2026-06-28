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
      <el-form-item label="权限">
        <el-tree
          ref="treeRef"
          :data="permissionTree"
          show-checkbox
          node-key="permission"
          :props="{ label: 'title', children: 'children' }"
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
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { assignRolePermissionsApi, getRolePermissionsApi } from '@/api/role'
import { asyncRoutes } from '@/router/routes/asyncRoutes'
import { keysToPermissionGroups, permissionGroupsToKeys } from '@/router/routes/utils/permissionGroups'
import { toPermissionTree } from '@/router/routes/utils/toPermissionTree'
import type { PermissionTreeNode } from '@/types/permission'

const props = defineProps<{ visible: boolean; roleId: number }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; success: [] }>()

const treeRef = ref()
const submitting = ref(false)
const permissionTree = ref<PermissionTreeNode[]>(toPermissionTree(asyncRoutes))
const checkedKeys = ref<string[]>([])

watch(() => props.visible, async (val) => {
  if (val) {
    try {
      const res = await getRolePermissionsApi(props.roleId)
      checkedKeys.value = permissionGroupsToKeys(res.data || [])
    } catch {
      ElMessage.error('获取权限数据失败')
    }
  }
})

async function handleSubmit() {
  const checked = treeRef.value.getCheckedKeys() as string[]
  const halfChecked = treeRef.value.getHalfCheckedKeys() as string[]
  const allKeys = [...checked, ...halfChecked].filter(k => k !== 'root')
  const groups = keysToPermissionGroups(allKeys)

  submitting.value = true
  try {
    await assignRolePermissionsApi(props.roleId, groups)
    ElMessage.success('权限分配成功')
    emit('update:visible', false)
    emit('success')
  } catch {
    ElMessage.error('分配失败')
  } finally {
    submitting.value = false
  }
}
</script>
