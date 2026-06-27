import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

export function useAuth() {
  const router = useRouter()
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  const isAuthenticated = computed(() => !!userStore.token)
  const userInfo = computed(() => userStore.userInfo)

  /** 登录 */
  async function login(params: { username: string; password: string }) {
    await userStore.login(params)
    await userStore.getUserInfo()
    const routes = await permissionStore.loadRoutes()
    routes.forEach(r => router.addRoute(r))
    return userStore.userInfo
  }

  /** 退出登录 */
  async function logout() {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    userStore.resetState()
    router.push('/login')
  }

  return { isAuthenticated, userInfo, login, logout }
}