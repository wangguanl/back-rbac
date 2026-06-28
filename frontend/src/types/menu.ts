/** 菜单信息 */
export interface MenuInfo {
  id: number
  parentId: number
  name: string
  /** 0=目录, 1=菜单, 2=按钮 */
  type: number
  title?: string
  path?: string
  component?: string
  icon?: string
  permission?: string
  sort: number
  status?: number
  hidden?: number
  children?: MenuInfo[]
}

/** 菜单树节点 */
export interface MenuTreeNode extends MenuInfo {
  children: MenuTreeNode[]
}