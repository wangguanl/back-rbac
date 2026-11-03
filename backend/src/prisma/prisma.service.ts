import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

export class PrismaService extends PrismaClient {
  constructor() {
    // 统一从 DATABASE_URL 读取连接信息（含密码），避免与 Prisma CLI 配置不一致
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaPg(pool)
    super({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    })
  }
}

export const prisma = new PrismaService()