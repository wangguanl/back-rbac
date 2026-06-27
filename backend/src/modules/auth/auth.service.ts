import { prisma } from '@/prisma/prisma.service'
import { generateToken, generateRefreshToken } from '@/utils/jwt'
import { comparePassword } from '@/utils/password'
import { UnauthorizedException } from '@/common/exception'
import redis from '@/utils/redis'

export class AuthService {
  async login(username: string, password: string, ip?: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { roles: { include: { role: true } } }
    })

    if (!user || !comparePassword(password, user.password)) {
      await this.recordLoginLog(null, username, ip, 0, '用户名或密码错误')
      throw new UnauthorizedException('用户名或密码错误')
    }

    if (user.status !== 1) {
      await this.recordLoginLog(user.id, username, ip, 0, '账号已被禁用')
      throw new UnauthorizedException('账号已被禁用')
    }

    const roles = user.roles.map(ur => ur.role.code)
    const token = generateToken({ userId: Number(user.id), username: user.username, roles })
    const refreshToken = generateRefreshToken({ userId: Number(user.id), username: user.username, roles })

    // 缓存 token 到 Redis (用于登出)
    await redis.set(`token:${user.id}`, token, 'EX', 7200)

    await this.recordLoginLog(user.id, username, ip, 1, '登录成功')

    return {
      token,
      refreshToken,
      userInfo: {
        id: Number(user.id),
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        email: user.email,
        roles
      }
    }
  }

  async logout(userId: number) {
    await redis.del(`token:${userId}`)
  }

  async getUserInfo(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: {
        roles: {
          include: {
            role: {
              include: { menus: { include: { menu: true } } }
            }
          }
        }
      }
    })

    if (!user) throw new UnauthorizedException('用户不存在')

    const roles = user.roles.map(ur => ur.role.code)
    const permissions = new Set<string>()
    user.roles.forEach(ur => {
      ur.role.menus.forEach(rm => {
        if (rm.menu.permission) permissions.add(rm.menu.permission)
      })
    })

    return {
      id: Number(user.id),
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      roles,
      permissions: Array.from(permissions)
    }
  }

  async refreshToken(userId: number, username: string, roles: string[]) {
    const token = generateToken({ userId, username, roles })
    const refreshToken = generateRefreshToken({ userId, username, roles })
    await redis.set(`token:${userId}`, token, 'EX', 7200)
    return { token, refreshToken }
  }

  async recordLoginLog(userId: number | null, username: string, ip: string | undefined, status: number, msg: string) {
    await prisma.sysLoginLog.create({
      data: { userId: userId ? BigInt(userId) : null, username, ip, status, msg }
    })
  }
}

export const authService = new AuthService()