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
      <el-form-item label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
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
import { createUserApi, updateUserApi, getUserByIdApi } from '@/api/user'

const props = defineProps<{ visible: boolean; mode: 'add' | 'edit'; userId: number }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; success: [] }>()

const formRef = ref()
const submitting = ref(false)

const form = reactive({
  username: '',
  nickname: '',
  email: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

watch(() => props.visible, async (val) => {
  if (val) {
    if (props.mode === 'edit' && props.userId) {
      try {
        const res = await getUserByIdApi(props.userId)
        const u = res.data
        form.username = u.username
        form.nickname = u.nickname
        form.email = u.email || ''
        form.password = ''
      } catch {
        ElMessage.error('获取用户信息失败')
      }
    } else {
      form.username = ''
      form.nickname = ''
      form.email = ''
      form.password = ''
    }
  }
})

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const data = { username: form.username, nickname: form.nickname, email: form.email, password: form.password }
    if (props.mode === 'add') {
      await createUserApi(data)
    } else {
      await updateUserApi(props.userId, { nickname: form.nickname, email: form.email })
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