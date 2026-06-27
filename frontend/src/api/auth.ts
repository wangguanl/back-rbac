import request from '@/utils/request'

/** 登录 */
export function loginApi(data: { username: string; password: string }) {
  return request.post<{ token: string }>('/auth/login', data)
}

/** 获取用户信息 */
export function getUserInfoApi() {
  return request.get<{ id: number; username: string; nickname: string; email: string; avatar: string; status: number; roles: string[]; permissions: string[] }>('/auth/userinfo')
}

/** 退出登录 */
export function logoutApi() {
  return request.post('/auth/logout')
}