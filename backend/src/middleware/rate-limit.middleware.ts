import { Request, Response, NextFunction } from 'express'
import redis from '@/utils/redis'
import { Result } from '@/common/response'

const LIMIT_WINDOW = 15 * 60 // 15分钟
const MAX_ATTEMPTS = 5

export async function loginLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const key = `login:rate:${ip}`

  const attempts = await redis.incr(key)
  if (attempts === 1) {
    await redis.expire(key, LIMIT_WINDOW)
  }

  if (attempts > MAX_ATTEMPTS) {
    const ttl = await redis.ttl(key)
    res.json(Result.error(429, `登录尝试次数过多，请${ttl}秒后再试`))
    return
  }

  next()
}