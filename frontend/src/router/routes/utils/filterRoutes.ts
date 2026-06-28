import type { RouteRecordRaw } from 'vue-router'
import { getRoutePermissionKey } from './permissionGroups'

export function hasPermission(permissions: string[], perm?: string): boolean {
  if (!perm) return true
  return permissions.includes('*') || permissions.includes(perm)
}

/** 过滤可访问路由；目录无 permission 时，按子路由过滤结果决定是否保留 */
export function filterRoutes(routes: RouteRecordRaw[], permissions: string[]): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = []

  for (const route of routes) {
    const permKey = getRoutePermissionKey(route)

    if (permKey && !hasPermission(permissions, permKey)) {
      continue
    }

    if (route.children?.length) {
      const filteredChildren = filterRoutes(route.children, permissions)
      if (filteredChildren.length === 0 && !permKey) {
        continue
      }
      result.push({ ...route, children: filteredChildren })
    } else {
      result.push({ ...route })
    }
  }

  return result
}
