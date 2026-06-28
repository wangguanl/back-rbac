import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { logoutApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { clearSession } from '@/utils/clear-session'

export function useAuth() {
  const router = useRouter()
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  const isAuthenticated = computed(() => !!userStore.token)
  const userInfo = computed(() => userStore.userInfo)

  /** 登录 */
  async function login(params: { username: string; password: string }) {
    permissionStore.resetRoutes()
    await userStore.login(params)
    await userStore.getUserInfo()
    const routes = await permissionStore.loadRoutes(userStore.permissionGroups)
    routes.forEach(r => router.addRoute(r))
    return userStore.userInfo
  }

  /** 退出登录 */
  async function logout(options?: { confirm?: boolean }) {
    if (options?.confirm !== false) {
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch {
        return
      }
    }

    try {
      await logoutApi()
    } catch {
      // 网络失败也继续本地清理，避免用户无法退出
    }

    clearSession()
  }

  return { isAuthenticated, userInfo, login, logout }
}