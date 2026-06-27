/** 用户信息 */
export interface UserInfo {
  id: number
  username: string
  nickname: string
  email: string
  avatar: string
  status: number
  roles: string[]
  permissions: string[]
  createdAt: string
  updatedAt: string
}

/** 登录请求参数 */
export interface LoginParams {
  username: string
  password: string
}

/** 登录响应 */
export interface LoginResult {
  token: string
}