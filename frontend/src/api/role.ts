import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/api'
import type { RoleInfo, RoleQueryParams } from '@/types/role'

/** 获取角色列表 */
export function getRoleListApi(params: RoleQueryParams) {
  return request.get<ApiResponse<PageResult<RoleInfo>>>('/roles', { params })
}

/** 获取所有角色 */
export function getAllRolesApi() {
  return request.get<ApiResponse<RoleInfo[]>>('/roles/all')
}

/** 创建角色 */
export function createRoleApi(data: Partial<RoleInfo>) {
  return request.post<ApiResponse<RoleInfo>>('/roles', data)
}

/** 更新角色 */
export function updateRoleApi(id: number, data: Partial<RoleInfo>) {
  return request.put<ApiResponse<RoleInfo>>(`/roles/${id}`, data)
}

/** 删除角色 */
export function deleteRoleApi(id: number) {
  return request.delete<ApiResponse<null>>(`/roles/${id}`)
}