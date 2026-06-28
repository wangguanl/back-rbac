import type { RouteRecordRaw } from 'vue-router'
import type { SidebarMenuItem } from '@/types/permission'

function joinPath(parent: string, child: string): string {
  if (child.startsWith('/')) return child
  const base = parent.endsWith('/') ? parent.slice(0, -1) : parent
  return `${base}/${child}`.replace(/\/+/g, '/')
}

function routeToMenuItem(route: RouteRecordRaw, basePath: string): SidebarMenuItem | null {
  const fullPath = route.path.startsWith('/')
    ? route.path
    : joinPath(basePath, route.path)

  const title = (route.meta?.title as string) || String(route.name || fullPath)
  const icon = route.meta?.icon as string | undefined

  if (route.children?.length) {
    const children = route.children
      .map(child => routeToMenuItem(child, fullPath))
      .filter((item): item is SidebarMenuItem => item !== null)

    if (children.length === 0) return null

    return {
      path: fullPath,
      title,
      icon,
      name: route.name ? String(route.name) : undefined,
      children
    }
  }

  return {
    path: fullPath,
    title,
    icon,
    name: route.name ? String(route.name) : undefined
  }
}

/** 把过滤后的路由转为 Sidebar 菜单数据 */
export function routesToMenuList(routes: RouteRecordRaw[]): SidebarMenuItem[] {
  return routes
    .map(route => routeToMenuItem(route, ''))
    .filter((item): item is SidebarMenuItem => item !== null)
}
