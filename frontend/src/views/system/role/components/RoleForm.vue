<template>
  <el-dialog
    :model-value="visible"
    :title="mode === 'add' ? '新增角色' : '编辑角色'"
    width="500px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="角色名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item label="角色编码" prop="code">
        <el-input v-model="form.code" placeholder="请输入角色编码" :disabled="mode === 'edit'" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
      </el-form-item>
      <el-form-item label="状态">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createRoleApi, updateRoleApi, getRoleByIdApi } from '@/api/role'

const props = defineProps<{ visible: boolean; mode: 'add' | 'edit'; roleId: number }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; success: [] }>()

const formRef = ref()
const submitting = ref(false)

const form = reactive({
  name: '',
  code: '',
  description: '',
  status: 1 as number
})

const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
}

watch(() => props.visible, async (val) => {
  if (val) {
    if (props.mode === 'edit' && props.roleId) {
      try {
        const res = await getRoleByIdApi(props.roleId)
        const r = res.data
        form.name = r.name
        form.code = r.code
        form.description = r.description || ''
        form.status = r.status
      } catch {
        ElMessage.error('获取角色信息失败')
      }
    } else {
      form.name = ''
      form.code = ''
      form.description = ''
      form.status = 1
    }
  }
})

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const data = { name: form.name, code: form.code, description: form.description, status: form.status }
    if (props.mode === 'add') {
      await createRoleApi(data)
    } else {
      await updateRoleApi(props.roleId, data)
    }
    ElMessage.success(props.mode === 'add' ? '新增成功' : '编辑成功')
    emit('update:visible', false)
    emit('success')
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  formRef.value?.resetFields()
}
</script>