import { routePermissionRegistry } from '@/router/routes/routePermissionRegistry'
import {
  buildAsyncRoutes,
  buildPermissionBindings,
  buildPermissionKeys
} from '@/router/routes/utils/buildFromRegistry'

export const asyncRoutes = buildAsyncRoutes(routePermissionRegistry)

/** v-auth 权限 key：P.System.Role.Edit → 'role:edit' */
export const P = buildPermissionKeys(routePermissionRegistry)

/** 按钮 ↔ API 权限绑定：Bind.System.User.Assign.permission / .apis */
export const Bind = buildPermissionBindings(routePermissionRegistry, P)