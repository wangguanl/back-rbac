import { BadRequestException } from '@/common/exception'

export interface RoutePermissionGroup {
  name: string
  permissions: string[]
}

export const ROUTE_ACTION_REGISTRY = {
  User: ['list', 'query', 'add', 'edit', 'delete', 'assign', 'resetPwd'],
  Role: ['list', 'query', 'add', 'edit', 'delete', 'assign']
} as const

export type RouteName = keyof typeof ROUTE_ACTION_REGISTRY

/** PascalCase 路由名 → 小写模块名：User → user */
export function routeNameToModule(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1)
}

export function toPermissionKey(name: string, action: string): string {
  return `${routeNameToModule(name)}:${action}`
}

/** flatten 后供 requirePermission / DB 使用 */
export const ALL_PERMISSIONS = Object.entries(ROUTE_ACTION_REGISTRY).flatMap(
  ([name, actions]) => actions.map(a => toPermissionKey(name, a))
)

const MODULE_TO_ROUTE_NAME = Object.fromEntries(
  Object.keys(ROUTE_ACTION_REGISTRY).map(name => [routeNameToModule(name), name])
)

export function isValidPermission(p: string): boolean {
  return ALL_PERMISSIONS.includes(p)
}

/** RoutePermissionGroup[] → 扁平 permission[] */
export function flattenPermissionGroups(groups: RoutePermissionGroup[]): string[] {
  const flat = groups.flatMap(g => g.permissions.map(a => toPermissionKey(g.name, a)))
  return [...new Set(flat)]
}

/** 扁平 permission[] → RoutePermissionGroup[] */
export function groupPermissions(flat: string[]): RoutePermissionGroup[] {
  const map = new Map<string, Set<string>>()

  for (const key of flat) {
    const colonIndex = key.indexOf(':')
    if (colonIndex === -1) continue
    const module = key.slice(0, colonIndex)
    const action = key.slice(colonIndex + 1)
    const name = MODULE_TO_ROUTE_NAME[module]
    if (!name) continue
    if (!map.has(name)) map.set(name, new Set())
    map.get(name)!.add(action)
  }

  return Array.from(map.entries()).map(([name, perms]) => ({
    name,
    permissions: Array.from(perms)
  }))
}

/** 校验并 normalize 分组数据，非法抛 BadRequestException */
export function validatePermissionGroups(groups: RoutePermissionGroup[]): RoutePermissionGroup[] {
  if (!Array.isArray(groups)) {
    throw new BadRequestException('请求体必须为 RoutePermissionGroup[]')
  }

  const result: RoutePermissionGroup[] = []

  for (const group of groups) {
    if (!group || typeof group.name !== 'string' || !Array.isArray(group.permissions)) {
      throw new BadRequestException('每项须含 name: string 和 permissions: string[]')
    }

    const allowed = ROUTE_ACTION_REGISTRY[group.name as RouteName]
    if (!allowed) {
      throw new BadRequestException(`未知页面: ${group.name}`)
    }

    const validPerms = new Set<string>()
    for (const action of group.permissions) {
      if (typeof action !== 'string' || !(allowed as readonly string[]).includes(action)) {
        throw new BadRequestException(`无效权限: ${group.name}:${action}`)
      }
      validPerms.add(action)
    }

    if (validPerms.size > 0) {
      result.push({ name: group.name, permissions: Array.from(validPerms) })
    }
  }

  return result
}
