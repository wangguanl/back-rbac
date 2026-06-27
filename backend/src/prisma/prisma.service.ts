import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

export class PrismaService extends PrismaClient {
  constructor() {
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'wanggang',
      database: 'rbac_db'
    })
    const adapter = new PrismaPg(pool)
    super({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    })
  }
}

export const prisma = new PrismaService()