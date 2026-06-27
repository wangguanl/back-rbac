import { prisma } from '@/prisma/prisma.service'
import { NotFoundException, BadRequestException } from '@/common/exception'

export class MenuService {
  buildMenuTree(menus: any[]) {
    const map = new Map<number, any>()
    const result: any[] = []

    menus.forEach(menu => {
      map.set(menu.id, { ...menu, children: [] })
    })

    menus.forEach(menu => {
      const node = map.get(menu.id)!
      if (menu.parentId === 0) {
        result.push(node)
      } else {
        const parent = map.get(menu.parentId)
        if (parent) parent.children.push(node)
      }
    })

    const sortTree = (nodes: any[]) => {
      nodes.sort((a, b) => a.sort - b.sort)
      nodes.forEach(n => {
        if (n.children?.length) sortTree(n.children)
      })
    }
    sortTree(result)

    return result
  }

  async getTree() {
    const menus = await prisma.menu.findMany({
      where: { deleted: 0 },
      orderBy: { sort: 'asc' }
    })
    const list = menus.map(m => ({
      ...m, id: Number(m.id), parentId: Number(m.parentId),
      createBy: m.createBy ? Number(m.createBy) : null,
      updateBy: m.updateBy ? Number(m.updateBy) : null
    }))
    return this.buildMenuTree(list)
  }

  async list() {
    const menus = await prisma.menu.findMany({
      where: { deleted: 0 },
      orderBy: { sort: 'asc' }
    })
    return menus.map(m => ({
      ...m, id: Number(m.id), parentId: Number(m.parentId),
      createBy: m.createBy ? Number(m.createBy) : null,
      updateBy: m.updateBy ? Number(m.updateBy) : null
    }))
  }

  async findById(id: number) {
    const menu = await prisma.menu.findFirst({ where: { id: BigInt(id), deleted: 0 } })
    if (!menu) throw new NotFoundException('菜单不存在')
    return {
      ...menu, id: Number(menu.id), parentId: Number(menu.parentId),
      createBy: menu.createBy ? Number(menu.createBy) : null,
      updateBy: menu.updateBy ? Number(menu.updateBy) : null
    }
  }

  async create(data: any) {
    const menu = await prisma.menu.create({
      data: {
        parentId: BigInt(data.parentId || 0),
        path: data.path,
        name: data.name,
        icon: data.icon,
        component: data.component,
        componentName: data.componentName,
        redirect: data.redirect,
        sort: data.sort || 0,
        type: data.type,
        title: data.title,
        breadcrumb: data.breadcrumb ?? 1,
        hidden: data.hidden ?? 0,
        keepAlive: data.keepAlive ?? 1,
        affix: data.affix ?? 0,
        permission: data.permission,
        status: data.status ?? 1
      }
    })
    return { id: Number(menu.id), name: menu.name }
  }

  async update(id: number, data: any) {
    const menu = await prisma.menu.findFirst({ where: { id: BigInt(id), deleted: 0 } })
    if (!menu) throw new NotFoundException('菜单不存在')

    const updateData: any = {}
    if (data.parentId !== undefined) updateData.parentId = BigInt(data.parentId)
    if (data.path !== undefined) updateData.path = data.path
    if (data.name !== undefined) updateData.name = data.name
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.component !== undefined) updateData.component = data.component
    if (data.componentName !== undefined) updateData.componentName = data.componentName
    if (data.redirect !== undefined) updateData.redirect = data.redirect
    if (data.sort !== undefined) updateData.sort = data.sort
    if (data.type !== undefined) updateData.type = data.type
    if (data.title !== undefined) updateData.title = data.title
    if (data.breadcrumb !== undefined) updateData.breadcrumb = data.breadcrumb
    if (data.hidden !== undefined) updateData.hidden = data.hidden
    if (data.keepAlive !== undefined) updateData.keepAlive = data.keepAlive
    if (data.affix !== undefined) updateData.affix = data.affix
    if (data.permission !== undefined) updateData.permission = data.permission
    if (data.status !== undefined) updateData.status = data.status

    await prisma.menu.update({ where: { id: BigInt(id) }, data: updateData })
    return { message: '更新成功' }
  }

  async delete(id: number) {
    const menu = await prisma.menu.findFirst({ where: { id: BigInt(id), deleted: 0 } })
    if (!menu) throw new NotFoundException('菜单不存在')

    // 检查是否有子菜单
    const children = await prisma.menu.findFirst({ where: { parentId: BigInt(id), deleted: 0 } })
    if (children) throw new BadRequestException('存在子菜单，无法删除')

    await prisma.menu.update({ where: { id: BigInt(id) }, data: { deleted: 1 } })
    return { message: '删除成功' }
  }

  async getRoutes(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: {
        roles: {
          include: {
            role: {
              include: { menus: { include: { menu: true } } }
            }
          }
        }
      }
    })

    if (!user) throw new NotFoundException('用户不存在')

    const menuMap = new Map<number, any>()
    user.roles.forEach(ur => {
      ur.role.menus.forEach(rm => {
        const menu = rm.menu
        if (menu.status === 1 && menu.deleted === 0) {
          menuMap.set(Number(menu.id), {
            id: Number(menu.id),
            parentId: Number(menu.parentId),
            path: menu.path,
            name: menu.name,
            icon: menu.icon,
            component: menu.component,
            componentName: menu.componentName,
            redirect: menu.redirect,
            sort: menu.sort,
            type: menu.type,
            title: menu.title,
            breadcrumb: menu.breadcrumb,
            hidden: menu.hidden,
            keepAlive: menu.keepAlive,
            affix: menu.affix,
            permission: menu.permission
          })
        }
      })
    })

    return this.buildMenuTree(Array.from(menuMap.values()))
  }
}

export const menuService = new MenuService()