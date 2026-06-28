/** 通用 API 响应结构 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  pagination?: {
    page: number
    size: number
    total: number
    totalPages: number
  }
}

/** 分页请求参数 */
export interface PageParams {
  page: number
  pageSize: number
}

/** 分页响应数据（data 为列表，pagination 在顶层） */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}