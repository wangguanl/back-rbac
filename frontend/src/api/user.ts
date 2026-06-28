import request from '@/utils/request'
import { Bind } from '@/router/routes/asyncRoutes'
import type { PageParams } from '@/types/api'
import type { UserInfo } from '@/types/user'

/** 分配角色：按钮 ↔ API 权限绑定（见 routePermissionRegistry User.Assign.apis） */
export const userAssignRoleBinding = Bind.System.User.Assign

/** 获取用户列表 */
export function getUserListApi(params: PageParams & { username?: string; status?: number }) {
  return request.get<UserInfo[]>('/users', { params })
}

/** 获取用户详情 */
export function getUserByIdApi(id: number) {
  return request.get<UserInfo>(`/users/${id}`)
}

/** 创建用户 */
export function createUserApi(data: Partial<UserInfo> & { password?: string }) {
  return request.post<UserInfo>('/users', data)
}

/** 更新用户 */
export function updateUserApi(id: number, data: Partial<UserInfo>) {
  return request.put<UserInfo>(`/users/${id}`, data)
}

/** 删除用户 */
export function deleteUserApi(id: number) {
  return request.delete<null>(`/users/${id}`)
}

/** 分配角色 · GET /users/role-options */
export function getUserRoleOptionsApi() {
  return request.get<{ id: number; name: string }[]>('/users/role-options')
}

/** 分配角色 · PUT /users/:id/roles */
export function assignUserRolesApi(id: number, roleIds: number[]) {
  return request.put<null>(`/users/${id}/roles`, { roleIds })
}

/** 重置密码 */
export function resetUserPasswordApi(id: number, password: string) {
  return request.put<null>(`/users/${id}/password`, { password })
}
