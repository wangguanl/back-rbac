import { Request, Response } from 'express'
import { userService } from './user.service'
import { Result } from '@/common/response'

export class UserController {
  async list(req: Request, res: Response) {
    const { page, size, username, status } = req.query
    const data = await userService.list({
      page: page ? Number(page) : undefined,
      size: size ? Number(size) : undefined,
      username: username as string,
      status: status ? Number(status) : undefined
    })
    res.json(Result.page(data.list, data.pagination))
  }

  async findById(req: Request, res: Response) {
    const data = await userService.findById(Number(req.params.id))
    res.json(Result.success(data))
  }

  async create(req: Request, res: Response) {
    const data = await userService.create(req.body)
    res.json(Result.success(data, '创建成功'))
  }

  async update(req: Request, res: Response) {
    const data = await userService.update(Number(req.params.id), req.body)
    res.json(Result.success(data, '更新成功'))
  }

  async delete(req: Request, res: Response) {
    const data = await userService.delete(Number(req.params.id))
    res.json(Result.success(data, '删除成功'))
  }

  async assignRoles(req: Request, res: Response) {
    const { roleIds } = req.body
    const data = await userService.assignRoles(Number(req.params.id), roleIds)
    res.json(Result.success(data, '分配成功'))
  }

  async listRoleOptions(req: Request, res: Response) {
    const data = await userService.listRoleOptions()
    res.json(Result.success(data))
  }

  async resetPassword(req: Request, res: Response) {
    const { password } = req.body
    const data = await userService.resetPassword(Number(req.params.id), password)
    res.json(Result.success(data, '密码重置成功'))
  }
}