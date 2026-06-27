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
import { createMenuApi, updateMenuApi, getMenuByIdApi } from '@/api/menu'

const props = defineProps<{ visible: boolean; mode: 'add' | 'edit'; menuId: number; parentId: number }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; success: [] }>()

const formRef = ref()
const submitting = ref(false)

const form = reactive({
  type: 'menu' as 'directory' | 'menu' | 'button',
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

watch(() => props.visible, async (val) => {
  if (val) {
    if (props.mode === 'edit' && props.menuId) {
      try {
        const res = await getMenuByIdApi(props.menuId)
        const m = res.data
        form.type = m.type
        form.name = m.name
        form.icon = m.icon || ''
        form.path = m.path || ''
        form.permission = m.permission || ''
        form.sort = m.sort || 0
        form.status = m.status
      } catch {
        ElMessage.error('获取菜单信息失败')
      }
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
  try {
    const data = {
      type: form.type,
      name: form.name,
      icon: form.icon,
      path: form.path,
      permission: form.permission,
      sort: form.sort,
      status: form.status,
      parentId: props.parentId || undefined
    }
    if (props.mode === 'add') {
      await createMenuApi(data)
    } else {
      const { parentId: _, ...upd } = data
      await updateMenuApi(props.menuId, upd)
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