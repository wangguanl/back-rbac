import router from '@/router'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

/** 清除登录态与动态路由，可选跳转登录页 */
export function clearSession(redirect = true) {
  usePermissionStore().resetRoutes()
  useUserStore().resetState()
  if (redirect) router.replace('/login')
}
