import router from './index'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { toPermissionKey } from '@/router/routes/utils/permissionGroups'
import type { PermissionAction } from '@/types/permission'

const whiteList = ['/login', '/403', '/404']

function resolveRequiredPermission(
  meta: Record<string, unknown>,
  routeName: string | symbol | null | undefined
): string | undefined {
  const perm = meta.permission as PermissionAction | string | undefined
  if (!perm) return undefined
  if (typeof perm === 'string') return perm
  if (routeName) return toPermissionKey(String(routeName), perm.action)
  return undefined
}

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (userStore.token) {
    if (to.path === '/login') {
      next('/dashboard')
    } else if (!userStore.userInfo) {
      try {
        await userStore.getUserInfo()
        const routes = await permissionStore.loadRoutes(userStore.permissionGroups)
        routes.forEach(r => router.addRoute(r))
        next({ path: to.fullPath, replace: true })
      } catch {
        permissionStore.resetRoutes()
        userStore.resetState()
        next(`/login?redirect=${to.path}`)
      }
    } else {
      const requiredPermission = resolveRequiredPermission(to.meta, to.name)
      if (requiredPermission) {
        const flatPermissions = userStore.permissions
        const hasPermission =
          flatPermissions.includes('*') || flatPermissions.includes(requiredPermission)
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
