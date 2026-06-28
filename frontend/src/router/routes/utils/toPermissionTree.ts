import type { RouteRecordRaw } from 'vue-router'
import type { PermissionAction, PermissionTreeNode } from '@/types/permission'

function pageToTreeNode(route: RouteRecordRaw): PermissionTreeNode | null {
  const perm = route.meta?.permission as PermissionAction | undefined
  if (!route.name || !perm) return null

  const name = String(route.name)
  const title = (route.meta?.title as string) || name
  const buttons = (route.meta?.buttons as PermissionAction[]) || []

  // list 作为叶子节点，分组节点 group:${name} 负责级联全选/反选
  const children: PermissionTreeNode[] = [
    { permission: `${name}:${perm.action}`, title: perm.title },
    ...buttons.map(btn => ({
      permission: `${name}:${btn.action}`,
      title: btn.title
    }))
  ]

  return {
    permission: `group:${name}`,
    title,
    children
  }
}

function walkRoutes(routes: RouteRecordRaw[]): PermissionTreeNode[] {
  const nodes: PermissionTreeNode[] = []
  for (const route of routes) {
    if (route.meta?.permission) {
      const node = pageToTreeNode(route)
      if (node) nodes.push(node)
    } else if (route.children?.length) {
      nodes.push(...walkRoutes(route.children))
    }
  }
  return nodes
}

/** 从 asyncRoutes 生成角色分配 el-tree 数据 */
export function toPermissionTree(routes: RouteRecordRaw[]): PermissionTreeNode[] {
  const children = walkRoutes(routes)
  if (children.length === 0) return []

  return [
    {
      permission: 'root',
      title: '系统管理',
      children
    }
  ]
}
