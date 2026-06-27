export class Result<T = any> {
  code: number
  message: string
  data?: T
  pagination?: {
    page: number
    size: number
    total: number
    totalPages: number
  }

  static success<T>(data?: T, message = 'success'): Result<T> {
    const result = new Result<T>()
    result.code = 200
    result.message = message
    result.data = data
    return result
  }

  static page<T>(list: T[], pagination: { page: number; size: number; total: number; totalPages: number }, message = 'success'): Result<T[]> {
    const result = new Result<T[]>()
    result.code = 200
    result.message = message
    result.data = list
    result.pagination = pagination
    return result
  }

  static error(code: number, message: string): Result {
    const result = new Result()
    result.code = code
    result.message = message
    return result
  }
}