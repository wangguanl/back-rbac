import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!
    })
    super({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    })
  }
}

export const prisma = new PrismaService()