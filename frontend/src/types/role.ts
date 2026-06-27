/** 角色信息 */
export interface RoleInfo {
  id: number
  name: string
  code: string
  description: string
  status: number
  menuIds: number[]
  createdAt: string
  updatedAt: string
}

/** 角色查询参数 */
export interface RoleQueryParams {
  name?: string
  code?: string
  status?: number
  page: number
  pageSize: number
}