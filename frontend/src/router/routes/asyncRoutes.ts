import { routePermissionRegistry } from '@/router/routes/routePermissionRegistry'
import { buildAsyncRoutes, buildPermissionKeys } from '@/router/routes/utils/buildFromRegistry'

export const asyncRoutes = buildAsyncRoutes(routePermissionRegistry)

/** v-auth 权限 key：P.System.Role.Edit → 'role:edit' */
export const P = buildPermissionKeys(routePermissionRegistry)
