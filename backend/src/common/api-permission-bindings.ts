import { toPermissionKey, type RouteName } from '@/common/permissions'

/** 生成与前端 routePermissionRegistry 一致的扁平权限 key */
export function perm(routeName: RouteName, action: string): string {
  return toPermissionKey(routeName, action)
}

/**
 * 按钮 ↔ API 权限绑定（与 frontend routePermissionRegistry 中 permission.apis 同步）
 *
 * @example User.Assign → GET /users/role-options、PUT /users/:id/roles
 */
export const ApiPermissionBind = {
  User: {
    assign: {
      permission: perm('User', 'assign'),
      apis: ['GET /users/role-options', 'PUT /users/:id/roles'] as const
    }
  }
} as const
