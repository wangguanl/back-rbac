import { Request, Response, NextFunction } from 'express'
import { BusinessException } from '@/common/exception'
import { Result } from '@/common/response'

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err)

  if (err instanceof BusinessException) {
    res.json(Result.error(err.code, err.message))
  } else if (err.name === 'UnauthorizedError') {
    res.json(Result.error(401, 'Token无效'))
  } else {
    res.status(500).json(Result.error(500, process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'))
  }
}