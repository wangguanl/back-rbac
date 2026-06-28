import type { RouteRecordRaw } from 'vue-router'
import type { PermissionAction, RoutePermissionGroup } from '@/types/permission'

/** User → user，Role → role（PascalCase 路由名 → 小写模块名） */
export function routeNameToModule(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1)
}

export function toPermissionKey(name: string, action: string): string {
  return `${routeNameToModule(name)}:${action}`
}

/** 分组 → 扁平 module:action，如 user:list */
export function flattenPermissionGroups(groups: RoutePermissionGroup[]): string[] {
  return groups.flatMap(g => g.permissions.map(a => toPermissionKey(g.name, a)))
}

/** asyncRoutes → 页面 name → 该页允许的全部 action */
export function extractRouteActionRegistry(
  routes: RouteRecordRaw[]
): Record<string, readonly string[]> {
  const registry: Record<string, string[]> = {}

  function walk(routeList: RouteRecordRaw[]) {
    for (const route of routeList) {
      if (route.name && route.meta?.permission) {
        const name = String(route.name)
        const perm = route.meta.permission as PermissionAction
        const buttons = (route.meta.buttons as PermissionAction[]) || []
        const actions = new Set<string>()
        if (perm?.action) actions.add(perm.action)
        buttons.forEach(b => actions.add(b.action))
        registry[name] = Array.from(actions)
      }
      if (route.children) walk(route.children)
    }
  }

  walk(routes)
  return registry
}

/** el-tree keys (User:list) → RoutePermissionGroup[] */
export function keysToPermissionGroups(keys: string[]): RoutePermissionGroup[] {
  const map = new Map<string, Set<string>>()
  for (const key of keys) {
    const colonIndex = key.indexOf(':')
    if (colonIndex === -1) continue
    const name = key.slice(0, colonIndex)
    const action = key.slice(colonIndex + 1)
    if (!name || !action) continue
    if (!map.has(name)) map.set(name, new Set())
    map.get(name)!.add(action)
  }
  return Array.from(map.entries()).map(([name, perms]) => ({
    name,
    permissions: Array.from(perms)
  }))
}

/** RoutePermissionGroup[] → el-tree 默认勾选 keys */
export function permissionGroupsToKeys(groups: RoutePermissionGroup[]): string[] {
  return groups.flatMap(g => g.permissions.map(a => `${g.name}:${a}`))
}

export function getRoutePermissionKey(route: RouteRecordRaw): string | undefined {
  const perm = route.meta?.permission as PermissionAction | string | undefined
  if (!perm) return undefined
  if (typeof perm === 'string') return perm
  if (route.name) return toPermissionKey(String(route.name), perm.action)
  return undefined
}
