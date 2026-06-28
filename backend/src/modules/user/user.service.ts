import { prisma } from '@/prisma/prisma.service'
import { hashPassword } from '@/utils/password'
import { BadRequestException, NotFoundException } from '@/common/exception'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/common/constants'

export class UserService {
  async list(params: { page?: number; size?: number; username?: string; status?: number }) {
    const page = params.page || DEFAULT_PAGE
    const size = Math.min(params.size || DEFAULT_PAGE_SIZE, 100)
    const where: any = { deleted: 0 }

    if (params.username) where.username = { contains: params.username }
    if (params.status !== undefined) where.status = params.status

    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        select: {
          id: true, username: true, nickname: true, avatar: true,
          email: true, phone: true, status: true, deptId: true,
          createTime: true, updateTime: true,
          roles: { include: { role: { select: { id: true, code: true, name: true } } } }
        },
        orderBy: { createTime: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    return {
      list: list.map(u => ({
        ...u,
        id: Number(u.id),
        deptId: u.deptId ? Number(u.deptId) : null,
        roles: u.roles.map(ur => ({ id: Number(ur.role.id), code: ur.role.code, name: ur.role.name }))
      })),
      pagination: { page, size, total, totalPages: Math.ceil(total / size) }
    }
  }

  async findById(id: number) {
    const user = await prisma.user.findFirst({
      where: { id: BigInt(id), deleted: 0 },
      select: {
        id: true, username: true, nickname: true, avatar: true,
        email: true, phone: true, status: true, deptId: true,
        createTime: true, updateTime: true,
        roles: { include: { role: { select: { id: true, code: true, name: true } } } }
      }
    })
    if (!user) throw new NotFoundException('用户不存在')
    return {
      ...user,
      id: Number(user.id),
      deptId: user.deptId ? Number(user.deptId) : null,
      roles: user.roles.map(ur => ({ id: Number(ur.role.id), code: ur.role.code, name: ur.role.name }))
    }
  }

  async create(data: { username: string; password: string; nickname?: string; email?: string; phone?: string; status?: number }) {
    const exist = await prisma.user.findUnique({ where: { username: data.username } })
    if (exist) throw new BadRequestException('用户名已存在')

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashPassword(data.password),
        nickname: data.nickname,
        email: data.email,
        phone: data.phone,
        status: data.status ?? 1
      }
    })
    return { id: Number(user.id), username: user.username }
  }

  async update(id: number, data: { nickname?: string; email?: string; phone?: string; status?: number }) {
    const user = await prisma.user.findFirst({ where: { id: BigInt(id), deleted: 0 } })
    if (!user) throw new NotFoundException('用户不存在')

    await prisma.user.update({
      where: { id: BigInt(id) },
      data: { nickname: data.nickname, email: data.email, phone: data.phone, status: data.status }
    })
    return { message: '更新成功' }
  }

  async delete(id: number) {
    const user = await prisma.user.findFirst({ where: { id: BigInt(id), deleted: 0 } })
    if (!user) throw new NotFoundException('用户不存在')

    await prisma.user.update({ where: { id: BigInt(id) }, data: { deleted: 1 } })
    return { message: '删除成功' }
  }

  async assignRoles(userId: number, roleIds: number[]) {
    const user = await prisma.user.findFirst({ where: { id: BigInt(userId), deleted: 0 } })
    if (!user) throw new NotFoundException('用户不存在')

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: BigInt(userId) } }),
      prisma.userRole.createMany({ data: roleIds.map(roleId => ({ userId: BigInt(userId), roleId: BigInt(roleId) })) })
    ])
    return { message: '分配成功' }
  }

  /** 分配用户角色时的可选角色列表（仅需 user:assign，不要求 role:list） */
  async listRoleOptions() {
    const roles = await prisma.role.findMany({
      where: { deleted: 0, status: 1 },
      select: { id: true, name: true },
      orderBy: { sort: 'asc' }
    })
    return roles.map(r => ({ id: Number(r.id), name: r.name }))
  }

  async resetPassword(id: number, password: string) {
    const user = await prisma.user.findFirst({ where: { id: BigInt(id), deleted: 0 } })
    if (!user) throw new NotFoundException('用户不存在')

    await prisma.user.update({ where: { id: BigInt(id) }, data: { password: hashPassword(password) } })
    return { message: '密码重置成功' }
  }
}

export const userService = new UserService()