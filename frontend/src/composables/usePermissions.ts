import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

export function usePermissions() {
  const userStore = useUserStore()
  const permissions = computed(() => userStore.permissions)

  /** 是否拥有超级管理员权限 */
  const isAdmin = computed(() => permissions.value.includes('*'))

  /** 检查是否拥有某个权限（支持单个或数组） */
  function hasPermission(p: string | string[]): boolean {
    if (isAdmin.value) return true
    if (Array.isArray(p)) return p.some(x => permissions.value.includes(x))
    return permissions.value.includes(p)
  }

  /** 是否拥有任一权限 */
  function hasAnyPermission(list: string[]): boolean {
    if (isAdmin.value) return true
    return list.some(p => permissions.value.includes(p))
  }

  /** 是否拥有所有权限 */
  function hasAllPermissions(list: string[]): boolean {
    if (isAdmin.value) return true
    return list.every(p => permissions.value.includes(p))
  }

  return { permissions, isAdmin, hasPermission, hasAnyPermission, hasAllPermissions }
}