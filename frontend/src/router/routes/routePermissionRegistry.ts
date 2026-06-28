import type { PermissionKind } from '@/types/permission'

/** 单条权限：action 为后端短名，PascalCase 键（如 Edit）仅用于前端引用 */
export interface PermissionItem {
  action: string
  title: string
  kind: PermissionKind
}

export interface PageRouteConfig {
  path: string
  title: string
  icon: string
  load: () => Promise<unknown>
  permissions: Record<string, PermissionItem>
}

export interface LayoutRouteConfig {
  path: string
  name: string
  title: string
  icon: string
  redirect: string
  pages: Record<string, PageRouteConfig>
}

/**
 * 路由 + 权限唯一配置源。
 * 由此生成 asyncRoutes 与 P（v-auth 用扁平 key，如 P.System.Role.Edit → 'role:edit'）。
 */
export const routePermissionRegistry = {
  System: {
    path: '/system',
    name: 'System',
    title: '系统管理',
    icon: 'Setting',
    redirect: '/system/user',
    pages: {
      User: {
        path: 'user',
        title: '用户管理',
        icon: 'User',
        load: () => import('@/views/system/user/index.vue'),
        permissions: {
          List: { action: 'list', title: '访问页面', kind: 'page' },
          Query: { action: 'query', title: '查询详情', kind: 'api' },
          Add: { action: 'add', title: '新增', kind: 'both' },
          Edit: { action: 'edit', title: '编辑', kind: 'both' },
          Delete: { action: 'delete', title: '删除', kind: 'both' },
          Assign: { action: 'assign', title: '分配角色', kind: 'both' },
          ResetPwd: { action: 'resetPwd', title: '重置密码', kind: 'both' }
        }
      },
      Role: {
        path: 'role',
        title: '角色管理',
        icon: 'UserFilled',
        load: () => import('@/views/system/role/index.vue'),
        permissions: {
          List: { action: 'list', title: '访问页面', kind: 'page' },
          Query: { action: 'query', title: '查询详情', kind: 'api' },
          Add: { action: 'add', title: '新增', kind: 'both' },
          Edit: { action: 'edit', title: '编辑', kind: 'both' },
          Delete: { action: 'delete', title: '删除', kind: 'both' },
          Assign: { action: 'assign', title: '分配权限', kind: 'both' }
        }
      }
    }
  }
} as const satisfies Record<string, LayoutRouteConfig>
