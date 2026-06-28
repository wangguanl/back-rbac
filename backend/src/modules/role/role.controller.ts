import { Request, Response } from 'express'
import { roleService } from './role.service'
import { Result } from '@/common/response'
import { BadRequestException } from '@/common/exception'

export class RoleController {
  async list(req: Request, res: Response) {
    const data = await roleService.list()
    res.json(Result.success(data))
  }

  async findById(req: Request, res: Response) {
    const data = await roleService.findById(Number(req.params.id))
    res.json(Result.success(data))
  }

  async create(req: Request, res: Response) {
    const data = await roleService.create(req.body)
    res.json(Result.success(data, '创建成功'))
  }

  async update(req: Request, res: Response) {
    const data = await roleService.update(Number(req.params.id), req.body)
    res.json(Result.success(data, '更新成功'))
  }

  async delete(req: Request, res: Response) {
    const data = await roleService.delete(Number(req.params.id))
    res.json(Result.success(data, '删除成功'))
  }

  async getPermissions(req: Request, res: Response) {
    const data = await roleService.getPermissions(Number(req.params.id))
    res.json(Result.success(data))
  }

  async assignPermissions(req: Request, res: Response) {
    const groups = req.body
    if (!Array.isArray(groups)) {
      throw new BadRequestException('请求体必须为 RoutePermissionGroup[]')
    }
    const data = await roleService.assignPermissions(Number(req.params.id), groups)
    res.json(Result.success(data, '权限分配成功'))
  }
}
