<template>
  <el-dialog
    :model-value="visible"
    title="分配角色"
    width="450px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form label-width="80px">
      <el-form-item label="当前用户">
        <span>用户 ID: {{ userId }}</span>
      </el-form-item>
      <el-form-item label="选择角色">
        <el-checkbox-group v-model="selectedRoles">
          <el-checkbox v-for="role in roleList" :key="role.id" :label="role.id" :value="role.id">
            {{ role.name }}
          </el-checkbox>
        </el-checkbox-group>
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
import { assignUserRolesApi } from '@/api/user'
import { getRoleListApi } from '@/api/role'

const props = defineProps<{ visible: boolean; userId: number }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; success: [] }>()

const submitting = ref(false)
const selectedRoles = ref<number[]>([])
const roleList = ref<{ id: number; name: string }[]>([])

watch(() => props.visible, async (val) => {
  if (val) {
    selectedRoles.value = []
    try {
      const res = await getRoleListApi({ page: 1, pageSize: 100 })
      roleList.value = (res.data.list || []).map((r: any) => ({ id: r.id, name: r.name }))
    } catch {
      ElMessage.error('获取角色列表失败')
    }
  }
})

async function handleSubmit() {
  submitting.value = true
  try {
    await assignUserRolesApi(props.userId, selectedRoles.value)
    ElMessage.success('角色分配成功')
    emit('update:visible', false)
    emit('success')
  } catch {
    ElMessage.error('分配失败')
  } finally {
    submitting.value = false
  }
}
</script>