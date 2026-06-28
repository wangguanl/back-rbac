import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/components/layout/Layout.vue'
import { toPermissionKey } from '@/router/routes/utils/permissionGroups'
import type {
  LayoutRouteConfig,
  PageRouteConfig,
  PermissionItem
} from '@/router/routes/routePermissionRegistry'

type Registry = Record<string, LayoutRouteConfig>

type PermissionKeyMap<T extends Registry> = {
  [L in keyof T]: {
    [P in keyof T[L]['pages']]: {
      [K in keyof T[L]['pages'][P]['permissions']]: string
    }
  }
}

function pagePermissionItems(page: PageRouteConfig): PermissionItem[] {
  return Object.values(page.permissions)
}

function pageMetaPermissions(page: PageRouteConfig) {
  const list = page.permissions.List
  if (!list) {
    throw new Error(`页面 "${page.title}" 缺少 List（页面访问）权限配置`)
  }

  const buttons = pagePermissionItems(page)
    .filter(item => item.kind !== 'page')
    .map(({ action, title, kind }) => ({ action, title, kind }))

  return {
    permission: { action: list.action, title: list.title, kind: list.kind },
    buttons
  }
}

/** 注册表 → v-auth 可用的嵌套权限 key，叶子值为 module:action */
export function buildPermissionKeys<T extends Registry>(registry: T): PermissionKeyMap<T> {
  const result = {} as PermissionKeyMap<T>

  for (const layoutKey of Object.keys(registry) as (keyof T)[]) {
    const layout = registry[layoutKey]
    const pages = {} as PermissionKeyMap<T>[typeof layoutKey]

    for (const pageKey of Object.keys(layout.pages) as (keyof typeof layout.pages)[]) {
      const page = layout.pages[pageKey]
      const keys = {} as PermissionKeyMap<T>[typeof layoutKey][typeof pageKey]

      for (const permKey of Object.keys(page.permissions) as (keyof typeof page.permissions)[]) {
        const item = page.permissions[permKey]
        keys[permKey] = toPermissionKey(String(pageKey), item.action)
      }

      pages[pageKey] = keys
    }

    result[layoutKey] = pages
  }

  return result
}

/** 注册表 → Vue Router asyncRoutes */
export function buildAsyncRoutes(registry: Registry): RouteRecordRaw[] {
  return Object.values(registry).map(layout => ({
    path: layout.path,
    name: layout.name,
    component: Layout,
    redirect: layout.redirect,
    meta: { title: layout.title, icon: layout.icon },
    children: Object.entries(layout.pages).map(([pageName, page]) => ({
      path: page.path,
      name: pageName,
      component: page.load,
      meta: {
        title: page.title,
        icon: page.icon,
        ...pageMetaPermissions(page)
      }
    }))
  }))
}
