import { prisma } from '@/prisma/prisma.service'
import { hashPassword } from '@/utils/password'
import { ALL_PERMISSIONS } from '@/common/permissions'

const READONLY_PERMISSIONS = ['user:list', 'user:query', 'role:list', 'role:query']

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: {},
    create: { code: 'admin', name: '超级管理员', description: '拥有所有权限', sort: 1 }
  })

  const userRole = await prisma.role.upsert({
    where: { code: 'user' },
    update: {},
    create: { code: 'user', name: '普通用户', description: '基础只读权限', sort: 2 }
  })

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

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id }
  })

  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } })
  await prisma.rolePermission.createMany({
    data: ALL_PERMISSIONS.map(permission => ({
      roleId: adminRole.id,
      permission
    }))
  })

  await prisma.rolePermission.deleteMany({ where: { roleId: userRole.id } })
  await prisma.rolePermission.createMany({
    data: READONLY_PERMISSIONS.map(permission => ({
      roleId: userRole.id,
      permission
    }))
  })

  console.log('Seed data initialized')
  console.log('Account: admin / 123456')
  console.log(`Admin permissions: ${ALL_PERMISSIONS.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
