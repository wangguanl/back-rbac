import { Request, Response } from 'express'
import { authService } from './auth.service'
import { Result } from '@/common/response'
import { verifyToken } from '@/utils/jwt'

export class AuthController {
  async login(req: Request, res: Response) {
    const { username, password } = req.body
    const ip = req.ip || req.socket.remoteAddress
    const data = await authService.login(username, password, ip)
    res.json(Result.success(data, '登录成功'))
  }

  async logout(req: Request, res: Response) {
    await authService.logout(req.user.id)
    res.json(Result.success(null, '退出成功'))
  }

  async getUserInfo(req: Request, res: Response) {
    const data = await authService.getUserInfo(req.user.id)
    res.json(Result.success(data))
  }

  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body
    if (!refreshToken) {
      res.json(Result.error(400, 'refreshToken不能为空'))
      return
    }

    const payload = verifyToken(refreshToken)
    const data = await authService.refreshToken(payload.userId, payload.username, payload.roles)
    res.json(Result.success(data, 'Token刷新成功'))
  }
}