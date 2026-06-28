import router from './index'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

const whiteList = ['/login', '/403', '/404']

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (userStore.token) {
    if (to.path === '/login') {
      next('/dashboard')
    } else if (!userStore.userInfo) {
      try {
        await userStore.getUserInfo()
        const routes = await permissionStore.loadRoutes()
        routes.forEach(r => router.addRoute(r))
        next({ path: to.fullPath, replace: true })
      } catch {
        userStore.resetState()
        next(`/login?redirect=${to.path}`)
      }
    } else {
      // 页面级权限校验
      const requiredPermission = to.meta.permission as string | undefined
      if (requiredPermission) {
        const permissions = userStore.permissions
        const hasPermission = permissions.includes('*') || permissions.includes(requiredPermission)
        if (!hasPermission) {
          next('/403')
          return
        }
      }
      next()
    }
  } else {
    whiteList.includes(to.path) ? next() : next(`/login?redirect=${to.path}`)
  }
})