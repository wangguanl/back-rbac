import request from '@/utils/request'
import type { ApiResponse, PageResult, PageParams } from '@/types/api'
import type { UserInfo } from '@/types/user'

/** 获取用户列表 */
export function getUserListApi(params: PageParams & { username?: string; status?: number }) {
  return request.get<ApiResponse<PageResult<UserInfo>>>('/users', { params })
}

/** 创建用户 */
export function createUserApi(data: Partial<UserInfo>) {
  return request.post<ApiResponse<UserInfo>>('/users', data)
}

/** 更新用户 */
export function updateUserApi(id: number, data: Partial<UserInfo>) {
  return request.put<ApiResponse<UserInfo>>(`/users/${id}`, data)
}

/** 删除用户 */
export function deleteUserApi(id: number) {
  return request.delete<ApiResponse<null>>(`/users/${id}`)
}