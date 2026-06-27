import { prisma } from '@/prisma/prisma.service'

export class LogService {
  async record(operation: {
    userId?: number
    username?: string
    module: string
    action: string
    method: string
    url: string
    ip?: string
    params?: string
    result?: string
    status: number
    errorMsg?: string
    duration?: number
  }) {
    await prisma.sysLog.create({
      data: {
        userId: operation.userId ? BigInt(operation.userId) : null,
        username: operation.username,
        module: operation.module,
        action: operation.action,
        method: operation.method,
        url: operation.url,
        ip: operation.ip,
        params: operation.params,
        result: operation.result,
        status: operation.status,
        errorMsg: operation.errorMsg,
        duration: operation.duration
      }
    })
  }
}

export const logService = new LogService()