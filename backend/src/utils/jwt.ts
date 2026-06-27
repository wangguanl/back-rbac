import jwt from 'jsonwebtoken'
import { config } from '@/config'

export interface TokenPayload {
  userId: number
  username: string
  roles: string[]
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.refreshExpiresIn })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload
}