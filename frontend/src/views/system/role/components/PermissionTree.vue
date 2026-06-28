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
import { assignRoleMenusApi, getRoleMenusApi } from '@/api/role'
import { getMenuTreeApi } from '@/api/menu'

const props = defineProps<{ visible: boolean; roleId: number }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; success: [] }>()

const treeRef = ref()
const submitting = ref(false)
const menuTree = ref<any[]>([])
const checkedKeys = ref<number[]>([])

watch(() => props.visible, async (val) => {
  if (val) {
    try {
      const [treeRes, menuRes] = await Promise.all([
        getMenuTreeApi(),
        getRoleMenusApi(props.roleId)
      ])
      menuTree.value = treeRes.data || []
      checkedKeys.value = menuRes.data || []
    } catch {
      ElMessage.error('获取权限数据失败')
    }
  }
})

async function handleSubmit() {
  const checkedIds = treeRef.value.getCheckedKeys()
  const halfCheckedIds = treeRef.value.getHalfCheckedKeys()
  const allIds = [...checkedIds, ...halfCheckedIds]
  submitting.value = true
  try {
    await assignRoleMenusApi(props.roleId, allIds)
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