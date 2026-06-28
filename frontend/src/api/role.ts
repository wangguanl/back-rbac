import request from '@/utils/request'
import type { RoleInfo, RoleQueryParams } from '@/types/role'
import type { RoutePermissionGroup } from '@/types/permission'

/** 获取角色列表 */
export function getRoleListApi(params: RoleQueryParams) {
  return request.get<RoleInfo[]>('/roles', { params })
}

/** 获取角色详情 */
export function getRoleByIdApi(id: number) {
  return request.get<RoleInfo>(`/roles/${id}`)
}

/** 获取角色已分配权限（与 userinfo.permissionGroups 同结构） */
export function getRolePermissionsApi(id: number) {
  return request.get<RoutePermissionGroup[]>(`/roles/${id}/permissions`)
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

/** 分配角色权限 */
export function assignRolePermissionsApi(id: number, groups: RoutePermissionGroup[]) {
  return request.post<null>(`/roles/${id}/permissions`, groups)
}
