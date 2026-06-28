/** 与后端接口统一 */
export interface RoutePermissionGroup {
  /** 对应 RouteRecordRaw.name，如 'User' | 'Role' */
  name: string
  /** 该页面下的权限动作（短标识，不含模块前缀） */
  permissions: string[]
}

export interface SidebarMenuItem {
  path: string
  title: string
  icon?: string
  name?: string
  children?: SidebarMenuItem[]
}

export type PermissionKind = 'page' | 'button' | 'api' | 'both'

export interface PermissionAction {
  action: string
  title: string
  kind?: PermissionKind
}

export interface PermissionTreeNode {
  /** node-key，格式 `${name}:${action}` */
  permission: string
  title: string
  children?: PermissionTreeNode[]
}
