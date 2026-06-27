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
          <el-checkbox v-for="role in roleList" :key="role" :label="role" :value="role">
            {{ role }}
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

const props = defineProps<{ visible: boolean; userId: number }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; success: [] }>()

const submitting = ref(false)
const selectedRoles = ref<string[]>([])
const roleList = ['编辑', '访客', '审核员', '超级管理员']

watch(() => props.visible, (val) => {
  if (val) {
    selectedRoles.value = []
  }
})

async function handleSubmit() {
  submitting.value = true
  await new Promise(r => setTimeout(r, 300))
  ElMessage.success('角色分配成功')
  submitting.value = false
  emit('update:visible', false)
  emit('success')
}
</script>