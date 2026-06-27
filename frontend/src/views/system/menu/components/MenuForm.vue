<template>
  <el-dialog
    :model-value="visible"
    :title="mode === 'add' ? '新增菜单' : '编辑菜单'"
    width="550px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="上级菜单">
        <el-input :model-value="parentId || '根目录'" disabled />
      </el-form-item>
      <el-form-item label="菜单类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio value="directory">目录</el-radio>
          <el-radio value="menu">菜单</el-radio>
          <el-radio value="button">按钮</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="菜单名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入菜单名称" />
      </el-form-item>
      <el-form-item label="图标" v-if="form.type !== 'button'">
        <el-input v-model="form.icon" placeholder="请输入图标名称" />
      </el-form-item>
      <el-form-item label="路由路径" v-if="form.type !== 'button'">
        <el-input v-model="form.path" placeholder="请输入路由路径" />
      </el-form-item>
      <el-form-item label="权限标识" prop="permission" v-if="form.type !== 'directory'">
        <el-input v-model="form.permission" placeholder="如: user:list" />
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="form.sort" :min="0" :max="999" />
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

const props = defineProps<{ visible: boolean; mode: 'add' | 'edit'; menuId: number; parentId: number }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; success: [] }>()

const formRef = ref()
const submitting = ref(false)

const form = reactive({
  type: 'menu' as string,
  name: '',
  icon: '',
  path: '',
  permission: '',
  sort: 0,
  status: 1 as number
})

const rules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }]
}

watch(() => props.visible, (val) => {
  if (val) {
    if (props.mode === 'edit' && props.menuId) {
      form.type = 'menu'
      form.name = '用户管理'
      form.icon = 'User'
      form.path = '/system/user'
      form.permission = 'user:list'
      form.sort = 1
      form.status = 1
    } else {
      form.type = 'menu'
      form.name = ''
      form.icon = ''
      form.path = ''
      form.permission = ''
      form.sort = 0
      form.status = 1
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