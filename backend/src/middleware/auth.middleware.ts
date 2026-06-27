import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '@/utils/jwt'
import { prisma } from '@/prisma/prisma.service'
import { UnauthorizedException } from '@/common/exception'

declare global {
  namespace Express {
    interface Request {
      user?: any
      permissions?: string[]
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new UnauthorizedException('未登录')

    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: BigInt(payload.userId) },
      include: {
        roles: {
          include: {
            role: {
              include: {
                menus: { include: { menu: true } }
              }
            }
          }
        }
      }
    })

    if (!user || user.status !== 1) throw new UnauthorizedException('用户不存在或已禁用')

    const permissions = new Set<string>()
    user.roles.forEach(ur => {
      ur.role.menus.forEach(rm => {
        if (rm.menu.permission) permissions.add(rm.menu.permission)
      })
    })

    req.user = user
    req.permissions = Array.from(permissions)
    next()
  } catch (error) {
    next(error)
  }
}