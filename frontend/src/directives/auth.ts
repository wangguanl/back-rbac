import type { Directive } from 'vue'
import { useUserStore } from '@/stores/user'

export const auth: Directive = {
  mounted(el, binding) {
    const { value } = binding
    if (!value) return

    // 超级管理员拥有所有权限
    const userStore = useUserStore()
    const permissions = userStore.permissions

    if (permissions.includes('*')) return

    const has = Array.isArray(value)
      ? value.some((p: string) => permissions.includes(p))
      : permissions.includes(value)

    if (!has) {
      el.parentNode?.removeChild(el)
    }
  }
}