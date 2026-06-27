import { Request, Response } from 'express'
import { menuService } from './menu.service'
import { Result } from '@/common/response'

export class MenuController {
  async getTree(req: Request, res: Response) {
    const data = await menuService.getTree()
    res.json(Result.success(data))
  }

  async list(req: Request, res: Response) {
    const data = await menuService.list()
    res.json(Result.success(data))
  }

  async findById(req: Request, res: Response) {
    const data = await menuService.findById(Number(req.params.id))
    res.json(Result.success(data))
  }

  async create(req: Request, res: Response) {
    const data = await menuService.create(req.body)
    res.json(Result.success(data, '创建成功'))
  }

  async update(req: Request, res: Response) {
    const data = await menuService.update(Number(req.params.id), req.body)
    res.json(Result.success(data, '更新成功'))
  }

  async delete(req: Request, res: Response) {
    const data = await menuService.delete(Number(req.params.id))
    res.json(Result.success(data, '删除成功'))
  }

  async getRoutes(req: Request, res: Response) {
    const data = await menuService.getRoutes(req.user.id)
    res.json(Result.success(data))
  }
}