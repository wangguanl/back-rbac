import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/components/layout/Layout.vue'
import { getMenuTreeApi, getMenuRoutesApi } from '@/api/menu'
import type { MenuTreeNode } from '@/types/menu'

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>([])
  const menuList = ref<MenuTreeNode[]>([])

  async function loadRoutes() {
    // 获取菜单树（用于侧边栏渲染）
    const menuRes = await getMenuTreeApi()
    menuList.value = menuRes.data

    // 获取路由（用于动态路由注册）
    const routeRes = await getMenuRoutesApi()
    const routeMenus = routeRes.data

    const dynamicRoutes = generateRoutes(routeMenus)

    // 仪表盘 base route
    const dashboardRoute: RouteRecordRaw = {
      path: '/dashboard',
      component: Layout,
      redirect: '/dashboard/index',
      children: [
        {
          path: 'index',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '仪表盘' }
        }
      ]
    }

    routes.value = [dashboardRoute, ...dynamicRoutes]
    return routes.value
  }

  function generateRoutes(menus: MenuTreeNode[]): RouteRecordRaw[] {
    const result: RouteRecordRaw[] = []
    const componentMap: Record<string, string> = {
      'user': '@/views/system/user/index.vue',
      'role': '@/views/system/role/index.vue',
      'menu': '@/views/system/menu/index.vue'
    }

    for (const menu of menus) {
      if (menu.type === 'directory') {
        const route: RouteRecordRaw = {
          path: menu.path,
          component: Layout,
          redirect: menu.children?.[0]?.path || menu.path,
          meta: { title: menu.name },
          children: []
        }
        if (menu.children) {
          for (const child of menu.children) {
            route.children!.push({
              path: child.path.startsWith('/') ? child.path.substring(menu.path.length + 1) : child.path,
              component: () => import('@/views/system/' + (componentMap[child.name] || 'user') + '/index.vue'),
              meta: { title: child.name, permission: child.permission }
            })
          }
        }
        result.push(route)
      }
    }
    return result
  }

  return { routes, menuList, loadRoutes }
})