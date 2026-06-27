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

  console.log('Seed data initialized')
  console.log('Account: admin / 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())