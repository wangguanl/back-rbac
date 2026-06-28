import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/components/layout/Layout.vue'
import { getMenuRoutesApi } from '@/api/menu'
import type { MenuTreeNode } from '@/types/menu'

// 用 import.meta.glob 预注册所有页面组件，避免动态拼接路径导致 Vite 构建失败
const systemModules = import.meta.glob('@/views/system/*/index.vue')
const pageModules = import.meta.glob('@/views/*/index.vue')
console.log('[permission] systemModules keys:', Object.keys(systemModules))
console.log('[permission] pageModules keys:', Object.keys(pageModules))

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>([])
  const menuList = ref<MenuTreeNode[]>([])

  async function loadRoutes() {
    // 获取路由菜单（用于侧边栏渲染和动态路由注册，已按用户角色过滤）
    const routeRes = await getMenuRoutesApi()
    const routeMenus = routeRes.data

    menuList.value = [
      {
        id: 0,
        parentId: 0,
        path: '/dashboard',
        name: 'Dashboard',
        type: 1,
        title: '首页',
        icon: 'HomeFilled',
        sort: 0,
        children: []
      },
      ...routeMenus
    ]

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

  function resolveComponent(menuName: string): (() => Promise<unknown>) | null {
    const dirName = menuName.toLowerCase()
    // 先在 system 模块中查找
    let key = Object.keys(systemModules).find(k => k.includes(`/system/${dirName}/index.vue`))
    if (key) return systemModules[key]
    // 再在顶层 page 模块中查找
    key = Object.keys(pageModules).find(k => k.includes(`/views/${dirName}/index.vue`))
    if (key) return pageModules[key]
    return null
  }

  function generateRoutes(menus: MenuTreeNode[]): RouteRecordRaw[] {
    const result: RouteRecordRaw[] = []
    // 后端 type 字段为 Int: 0=目录, 1=菜单, 2=按钮

    for (const menu of menus) {
      if (!menu.path) continue

      if (menu.type === 0) {
        // 目录：Layout + 子路由
        const menuPath = menu.path
        const route: RouteRecordRaw = {
          path: menuPath,
          component: Layout,
          redirect: menu.children?.find(c => c.type === 1)?.path || menuPath,
          meta: { title: menu.title || menu.name },
          children: []
        }
        if (menu.children) {
          for (const child of menu.children) {
            if (child.type !== 1 || !child.path) continue
            const childPath = child.path.startsWith('/')
              ? child.path.substring(menuPath.length + 1)
              : child.path
            const component = resolveComponent(child.name)
            if (!component) {
              console.warn(`Component not found for: ${child.name}, skipping route: ${childPath}`)
              continue
            }
            route.children!.push({
              path: childPath,
              component: component,
              meta: { title: child.title || child.name, permission: child.permission }
            })
          }
        }
        if (route.children && route.children.length === 0) {
          console.warn(`No valid children for directory: ${menuPath}, skipping`)
          continue
        }
        result.push(route)
      } else if (menu.type === 1) {
        // 顶层菜单项：直接作为独立页面挂在 Layout 下
        const component = resolveComponent(menu.name)
        if (!component) {
          console.warn(`Component not found for top-level menu: ${menu.name}, skipping`)
          continue
        }
        result.push({
          path: menu.path,
          component: Layout,
          redirect: menu.path,
          meta: { title: menu.title || menu.name },
          children: [
            {
              path: '',
              component: component,
              meta: { title: menu.title || menu.name, permission: menu.permission }
            }
          ]
        })
      }
    }
    return result
  }

  return { routes, menuList, loadRoutes }
})