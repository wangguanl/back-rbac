import { prisma } from '@/prisma/prisma.service'
import { hashPassword } from '@/utils/password'

async function main() {
  // 创建超级管理员角色
  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: {},
    create: { code: 'admin', name: '超级管理员', description: '拥有所有权限', sort: 1 }
  })

  // 创建普通用户角色
  await prisma.role.upsert({
    where: { code: 'user' },
    update: {},
    create: { code: 'user', name: '普通用户', description: '基础权限', sort: 2 }
  })

  // 创建超级管理员用户
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashPassword('123456'),
      nickname: '超级管理员',
      email: 'admin@example.com',
      status: 1
    }
  })

  // 分配角色
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id }
  })

  // ============ 菜单初始化 ============
  // 先清除旧菜单
  await prisma.roleMenu.deleteMany({})
  await prisma.menu.deleteMany({})

  // 系统管理目录
  const systemMenu = await prisma.menu.create({
    data: {
      parentId: BigInt(0), path: '/system', name: 'System',
      icon: 'Setting', component: 'Layout', sort: 1, type: 0,
      title: '系统管理', hidden: 0
    }
  })

  // 用户管理
  const userMenu = await prisma.menu.create({
    data: {
      parentId: systemMenu.id, path: 'user', name: 'User',
      icon: 'User', component: 'system/user/index', sort: 1, type: 1,
      title: '用户管理', permission: 'user:list'
    }
  })

  const userButtons = [
    { name: 'UserQuery', title: '用户查询', permission: 'user:query' },
    { name: 'UserAdd', title: '用户新增', permission: 'user:add' },
    { name: 'UserEdit', title: '用户编辑', permission: 'user:edit' },
    { name: 'UserDelete', title: '用户删除', permission: 'user:delete' },
    { name: 'UserAssign', title: '用户分配角色', permission: 'user:assign' },
    { name: 'UserResetPwd', title: '用户重置密码', permission: 'user:resetPwd' }
  ]
  for (let i = 0; i < userButtons.length; i++) {
    await prisma.menu.create({
      data: {
        parentId: userMenu.id, name: userButtons[i].name, type: 2,
        title: userButtons[i].title, permission: userButtons[i].permission, sort: i + 1
      }
    })
  }

  // 角色管理
  const roleMenu = await prisma.menu.create({
    data: {
      parentId: systemMenu.id, path: 'role', name: 'Role',
      icon: 'UserFilled', component: 'system/role/index', sort: 2, type: 1,
      title: '角色管理', permission: 'role:list'
    }
  })

  const roleButtons = [
    { name: 'RoleQuery', title: '角色查询', permission: 'role:query' },
    { name: 'RoleAdd', title: '角色新增', permission: 'role:add' },
    { name: 'RoleEdit', title: '角色编辑', permission: 'role:edit' },
    { name: 'RoleDelete', title: '角色删除', permission: 'role:delete' },
    { name: 'RoleAssign', title: '角色分配权限', permission: 'role:assign' }
  ]
  for (let i = 0; i < roleButtons.length; i++) {
    await prisma.menu.create({
      data: {
        parentId: roleMenu.id, name: roleButtons[i].name, type: 2,
        title: roleButtons[i].title, permission: roleButtons[i].permission, sort: i + 1
      }
    })
  }

  // 菜单管理
  const menuManage = await prisma.menu.create({
    data: {
      parentId: systemMenu.id, path: 'menu', name: 'Menu',
      icon: 'Menu', component: 'system/menu/index', sort: 3, type: 1,
      title: '菜单管理', permission: 'menu:list'
    }
  })

  const menuButtons = [
    { name: 'MenuQuery', title: '菜单查询', permission: 'menu:query' },
    { name: 'MenuAdd', title: '菜单新增', permission: 'menu:add' },
    { name: 'MenuEdit', title: '菜单编辑', permission: 'menu:edit' },
    { name: 'MenuDelete', title: '菜单删除', permission: 'menu:delete' }
  ]
  for (let i = 0; i < menuButtons.length; i++) {
    await prisma.menu.create({
      data: {
        parentId: menuManage.id, name: menuButtons[i].name, type: 2,
        title: menuButtons[i].title, permission: menuButtons[i].permission, sort: i + 1
      }
    })
  }

  // 给admin角色分配所有菜单
  const allMenus = await prisma.menu.findMany({ where: { deleted: 0 } })
  for (const menu of allMenus) {
    await prisma.roleMenu.create({
      data: { roleId: adminRole.id, menuId: menu.id }
    })
  }

  console.log('Seed data initialized')
  console.log('Account: admin / 123456')
  console.log(`Menus: ${allMenus.length} created`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())