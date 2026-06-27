import { prisma } from '@/prisma/prisma.service'
import { BadRequestException, NotFoundException } from '@/common/exception'

export class RoleService {
  async list() {
    const roles = await prisma.role.findMany({
      where: { deleted: 0 },
      orderBy: { sort: 'asc' }
    })
    return roles.map(r => ({ ...r, id: Number(r.id), createBy: r.createBy ? Number(r.createBy) : null, updateBy: r.updateBy ? Number(r.updateBy) : null }))
  }

  async findById(id: number) {
    const role = await prisma.role.findFirst({ where: { id: BigInt(id), deleted: 0 } })
    if (!role) throw new NotFoundException('角色不存在')
    return { ...role, id: Number(role.id), createBy: role.createBy ? Number(role.createBy) : null, updateBy: role.updateBy ? Number(role.updateBy) : null }
  }

  async create(data: { code: string; name: string; description?: string; sort?: number }) {
    const exist = await prisma.role.findUnique({ where: { code: data.code } })
    if (exist) throw new BadRequestException('角色编码已存在')

    const role = await prisma.role.create({ data })
    return { id: Number(role.id), code: role.code, name: role.name }
  }

  async update(id: number, data: { name?: string; description?: string; sort?: number; status?: number }) {
    const role = await prisma.role.findFirst({ where: { id: BigInt(id), deleted: 0 } })
    if (!role) throw new NotFoundException('角色不存在')

    await prisma.role.update({ where: { id: BigInt(id) }, data })
    return { message: '更新成功' }
  }

  async delete(id: number) {
    const role = await prisma.role.findFirst({ where: { id: BigInt(id), deleted: 0 } })
    if (!role) throw new NotFoundException('角色不存在')

    await prisma.role.update({ where: { id: BigInt(id) }, data: { deleted: 1 } })
    return { message: '删除成功' }
  }

  async getMenus(roleId: number) {
    const role = await prisma.role.findFirst({ where: { id: BigInt(roleId), deleted: 0 } })
    if (!role) throw new NotFoundException('角色不存在')

    const roleMenus = await prisma.roleMenu.findMany({
      where: { roleId: BigInt(roleId) },
      include: { menu: true }
    })
    return roleMenus.map(rm => Number(rm.menuId))
  }

  async assignMenus(roleId: number, menuIds: number[]) {
    const role = await prisma.role.findFirst({ where: { id: BigInt(roleId), deleted: 0 } })
    if (!role) throw new NotFoundException('角色不存在')

    await prisma.$transaction(async (tx) => {
      await tx.roleMenu.deleteMany({ where: { roleId: BigInt(roleId) } })
      if (menuIds.length > 0) {
        await tx.roleMenu.createMany({
          data: menuIds.map(menuId => ({ roleId: BigInt(roleId), menuId: BigInt(menuId) }))
        })
      }
    })
    return { message: '权限分配成功' }
  }
}

export const roleService = new RoleService()