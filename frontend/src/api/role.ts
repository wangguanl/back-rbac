import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/api'
import type { RoleInfo, RoleQueryParams } from '@/types/role'

/** 获取角色列表 */
export function getRoleListApi(params: RoleQueryParams) {
  return request.get<PageResult<RoleInfo>>('/roles', { params })
}

/** 获取角色详情 */
export function getRoleByIdApi(id: number) {
  return request.get<RoleInfo>(`/roles/${id}`)
}

/** 获取角色已有菜单 */
export function getRoleMenusApi(id: number) {
  return request.get<number[]>(`/roles/${id}/menus`)
}

/** 创建角色 */
export function createRoleApi(data: Partial<RoleInfo>) {
  return request.post<RoleInfo>('/roles', data)
}

/** 更新角色 */
export function updateRoleApi(id: number, data: Partial<RoleInfo>) {
  return request.put<RoleInfo>(`/roles/${id}`, data)
}

/** 删除角色 */
export function deleteRoleApi(id: number) {
  return request.delete<null>(`/roles/${id}`)
}

/** 分配菜单权限 */
export function assignRoleMenusApi(id: number, menuIds: number[]) {
  return request.post<null>(`/roles/${id}/menus`, { menuIds })
}