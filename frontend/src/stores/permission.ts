import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/components/layout/Layout.vue'
import type { MenuTreeNode } from '@/types/menu'

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>([])
  const menuList = ref<MenuTreeNode[]>([])

  async function loadRoutes() {
    // TODO: 替换为真实 API 调用 getMenuTreeApi()
    const mockMenus: MenuTreeNode[] = [
      {
        id: 1, parentId: 0, name: '系统管理', type: 'directory',
        path: '/system', component: '', icon: 'Setting', permission: '',
        sort: 1, status: 1, createdAt: '', updatedAt: '',
        children: [
          {
            id: 2, parentId: 1, name: '用户管理', type: 'menu',
            path: '/system/user', component: '', icon: 'User', permission: 'user:list',
            sort: 1, status: 1, createdAt: '', updatedAt: '',
            children: []
          },
          {
            id: 3, parentId: 1, name: '角色管理', type: 'menu',
            path: '/system/role', component: '', icon: 'Avatar', permission: 'role:list',
            sort: 2, status: 1, createdAt: '', updatedAt: '',
            children: []
          },
          {
            id: 4, parentId: 1, name: '菜单管理', type: 'menu',
            path: '/system/menu', component: '', icon: 'Menu', permission: 'menu:list',
            sort: 3, status: 1, createdAt: '', updatedAt: '',
            children: []
          }
        ]
      }
    ]

    menuList.value = mockMenus

    // 动态路由：系统管理子页面
    const systemRoutes: RouteRecordRaw[] = [
      {
        path: '/system/user',
        component: () => import('@/views/system/user/index.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: '/system/role',
        component: () => import('@/views/system/role/index.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: '/system/menu',
        component: () => import('@/views/system/menu/index.vue'),
        meta: { title: '菜单管理' }
      }
    ]

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

    // 系统管理 layout route
    const systemRoute: RouteRecordRaw = {
      path: '/system',
      component: Layout,
      children: systemRoutes
    }

    routes.value = [dashboardRoute, systemRoute]
    return routes.value
  }

  return { routes, menuList, loadRoutes }
})