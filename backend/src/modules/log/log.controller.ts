import { Request, Response } from 'express'
import { logService } from './log.service'
import { Result } from '@/common/response'

export class LogController {
  async findLoginLogs(req: Request, res: Response) {
    const { list, pagination } = await logService.findLoginLogs({
      page: Number(req.query.page),
      size: Number(req.query.size),
      username: req.query.username as string | undefined,
      status: req.query.status !== undefined ? Number(req.query.status) : undefined
    })
    res.json(Result.page(list, pagination))
  }

  async findOperationLogs(req: Request, res: Response) {
    const { list, pagination } = await logService.findOperationLogs({
      page: Number(req.query.page),
      size: Number(req.query.size),
      username: req.query.username as string | undefined,
      module: req.query.module as string | undefined,
      status: req.query.status !== undefined ? Number(req.query.status) : undefined
    })
    res.json(Result.page(list, pagination))
  }

  async findOperationLogById(req: Request, res: Response) {
    const data = await logService.findOperationLogById(Number(req.params.id))
    res.json(Result.success(data))
  }
}