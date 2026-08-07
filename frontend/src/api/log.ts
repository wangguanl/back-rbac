import request from '@/utils/request'

export interface LoginLog {
  id: number
  userId: number | null
  username: string | null
  ip: string | null
  location: string | null
  device: string | null
  browser: string | null
  os: string | null
  status: number | null
  msg: string | null
  createTime: string
}

export interface OperationLog {
  id: number
  userId: number | null
  username: string | null
  module: string | null
  action: string | null
  method: string | null
  url: string | null
  ip: string | null
  params: string | null
  result: string | null
  status: number | null
  errorMsg: string | null
  duration: number | null
  createTime: string
}

export interface LogPageParams {
  page: number
  size: number
  username?: string
  module?: string
  status?: number
}

/** 登录日志分页列表 */
export function getLoginLogListApi(params: LogPageParams) {
  return request.get<LoginLog[]>('/logs/login', { params })
}

/** 操作日志分页列表 */
export function getOperationLogListApi(params: LogPageParams) {
  return request.get<OperationLog[]>('/logs/operation', { params })
}

/** 操作日志详情 */
export function getOperationLogByIdApi(id: number) {
  return request.get<OperationLog>(`/logs/operation/${id}`)
}