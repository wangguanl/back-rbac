/** 菜单信息 */
export interface MenuInfo {
  id: number
  parentId: number
  name: string
  type: 'directory' | 'menu' | 'button'
  path: string
  component: string
  icon: string
  permission: string
  sort: number
  status: number
  children?: MenuInfo[]
  createdAt: string
  updatedAt: string
}

/** 菜单树节点 */
export interface MenuTreeNode extends MenuInfo {
  children: MenuTreeNode[]
}