import { prisma } from '@/prisma/prisma.service'
import { NotFoundException } from '@/common/exception'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/common/constants'

export class LogService {
  async findLoginLogs(params: { page?: number; size?: number; username?: string; status?: number }) {
    const page = params.page || DEFAULT_PAGE
    const size = Math.min(params.size || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
    const where: any = {}

    if (params.username) where.username = { contains: params.username }
    if (params.status !== undefined) where.status = params.status

    const [list, total] = await Promise.all([
      prisma.sysLoginLog.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createTime: 'desc' }
      }),
      prisma.sysLoginLog.count({ where })
    ])

    return {
      list: list.map(l => ({ ...l, id: Number(l.id), userId: l.userId ? Number(l.userId) : null })),
      pagination: { page, size, total, totalPages: Math.ceil(total / size) }
    }
  }

  async findOperationLogs(params: { page?: number; size?: number; username?: string; module?: string; status?: number }) {
    const page = params.page || DEFAULT_PAGE
    const size = Math.min(params.size || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
    const where: any = {}

    if (params.username) where.username = { contains: params.username }
    if (params.module) where.module = { contains: params.module }
    if (params.status !== undefined) where.status = params.status

    const [list, total] = await Promise.all([
      prisma.sysLog.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createTime: 'desc' }
      }),
      prisma.sysLog.count({ where })
    ])

    return {
      list: list.map(l => ({ ...l, id: Number(l.id), userId: l.userId ? Number(l.userId) : null })),
      pagination: { page, size, total, totalPages: Math.ceil(total / size) }
    }
  }

  async findOperationLogById(id: number) {
    const log = await prisma.sysLog.findUnique({ where: { id: BigInt(id) } })
    if (!log) throw new NotFoundException('操作日志不存在')
    return { ...log, id: Number(log.id), userId: log.userId ? Number(log.userId) : null }
  }

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