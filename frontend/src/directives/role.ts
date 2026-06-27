import type { Directive } from 'vue'
import { useUserStore } from '@/stores/user'

export const role: Directive = {
  mounted(el, binding) {
    const { value } = binding
    if (!value) return

    const userStore = useUserStore()
    const roles = userStore.userInfo?.roles || []

    const has = Array.isArray(value)
      ? value.some((r: string) => roles.includes(r))
      : roles.includes(value)

    if (!has) {
      el.parentNode?.removeChild(el)
    }
  }
}