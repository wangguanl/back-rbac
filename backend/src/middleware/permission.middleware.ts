import { Request, Response, NextFunction } from 'express'
import { ForbiddenException } from '@/common/exception'

export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.permissions || []
    const hasPermission = permissions.some(p => userPermissions.includes(p))
    if (!hasPermission) throw new ForbiddenException('无权限访问')
    next()
  }
}