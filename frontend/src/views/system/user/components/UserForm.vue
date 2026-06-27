<template>
  <el-dialog
    :model-value="visible"
    :title="mode === 'add' ? '新增用户' : '编辑用户'"
    width="500px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" :disabled="mode === 'edit'" />
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="form.nickname" placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="角色" prop="roles">
        <el-select v-model="form.roles" multiple placeholder="请选择角色" style="width: 100%">
          <el-option label="编辑" value="编辑" />
          <el-option label="访客" value="访客" />
          <el-option label="审核员" value="审核员" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="mode === 'add'" label="密码" prop="password">
        <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
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

const props = defineProps<{ visible: boolean; mode: 'add' | 'edit'; userId: number }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; success: [] }>()

const formRef = ref()
const submitting = ref(false)

const form = reactive({
  username: '',
  nickname: '',
  email: '',
  roles: [] as string[],
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

watch(() => props.visible, (val) => {
  if (val) {
    if (props.mode === 'edit' && props.userId) {
      // TODO: 替换为真实 API 调用获取用户详情
      form.username = 'admin'
      form.nickname = '管理员'
      form.email = 'admin@example.com'
      form.roles = ['超级管理员']
    } else {
      form.username = ''
      form.nickname = ''
      form.email = ''
      form.roles = []
      form.password = ''
    }
  }
})

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  await new Promise(r => setTimeout(r, 500))
  ElMessage.success(props.mode === 'add' ? '新增成功' : '编辑成功')
  submitting.value = false
  emit('update:visible', false)
  emit('success')
}

function handleClose() {
  formRef.value?.resetFields()
}
</script>