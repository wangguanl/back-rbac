import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type { LoginParams, LoginResult, UserInfo } from '@/types/user'

/** 登录 */
export function loginApi(params: LoginParams) {
  return request.post<ApiResponse<LoginResult>>('/auth/login', params)
}

/** 获取当前用户信息 */
export function getUserInfoApi() {
  return request.get<ApiResponse<UserInfo>>('/auth/userinfo')
}

/** 退出登录 */
export function logoutApi() {
  return request.post<ApiResponse<null>>('/auth/logout')
}