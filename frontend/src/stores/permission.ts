import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/components/layout/Layout.vue'
import router from '@/router'
import { asyncRoutes } from '@/router/routes/asyncRoutes'
import { filterRoutes } from '@/router/routes/utils/filterRoutes'
import { flattenPermissionGroups } from '@/router/routes/utils/permissionGroups'
import { routesToMenuList } from '@/router/routes/utils/routesToMenuList'
import type { RoutePermissionGroup, SidebarMenuItem } from '@/types/permission'

function collectTopLevelRouteNames(routeList: RouteRecordRaw[]): string[] {
  return routeList
    .map(route => route.name)
    .filter((name): name is string | symbol => !!name)
    .map(name => String(name))
}

const dashboardRoute: RouteRecordRaw = {
  path: '/dashboard',
  name: 'Dashboard',
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

const dashboardMenuItem: SidebarMenuItem = {
  path: '/dashboard',
  title: '首页',
  icon: 'HomeFilled',
  name: 'Dashboard'
}

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>([])
  const menuList = ref<SidebarMenuItem[]>([])
  const addedRouteNames = ref<string[]>([])

  async function loadRoutes(permissionGroups: RoutePermissionGroup[]) {
    const flatPermissions = flattenPermissionGroups(permissionGroups)
    const accessed = filterRoutes(asyncRoutes, flatPermissions)

    routes.value = [dashboardRoute, ...accessed]
    menuList.value = [dashboardMenuItem, ...routesToMenuList(accessed)]
    addedRouteNames.value = collectTopLevelRouteNames(routes.value)
    return routes.value
  }

  function resetRoutes() {
    addedRouteNames.value.forEach(name => {
      if (router.hasRoute(name)) router.removeRoute(name)
    })
    addedRouteNames.value = []
    routes.value = []
    menuList.value = []
  }

  return { routes, menuList, addedRouteNames, loadRoutes, resetRoutes }
})
