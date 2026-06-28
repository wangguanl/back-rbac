import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/components/layout/Layout.vue'

export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/system',
    name: 'System',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/system/user/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'User',
          permission: { action: 'list', title: '访问页面', kind: 'page' },
          buttons: [
            { action: 'query', title: '查询详情', kind: 'api' },
            { action: 'add', title: '新增', kind: 'both' },
            { action: 'edit', title: '编辑', kind: 'both' },
            { action: 'delete', title: '删除', kind: 'both' },
            { action: 'assign', title: '分配角色', kind: 'both' },
            { action: 'resetPwd', title: '重置密码', kind: 'both' }
          ]
        }
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('@/views/system/role/index.vue'),
        meta: {
          title: '角色管理',
          icon: 'UserFilled',
          permission: { action: 'list', title: '访问页面', kind: 'page' },
          buttons: [
            { action: 'query', title: '查询详情', kind: 'api' },
            { action: 'add', title: '新增', kind: 'both' },
            { action: 'edit', title: '编辑', kind: 'both' },
            { action: 'delete', title: '删除', kind: 'both' },
            { action: 'assign', title: '分配权限', kind: 'both' }
          ]
        }
      }
    ]
  }
]
