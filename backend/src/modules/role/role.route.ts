import { Router } from 'express'
import { RoleController } from './role.controller'
import { authMiddleware } from '@/middleware/auth.middleware'
import { requirePermission } from '@/middleware/permission.middleware'

const router = Router()
const controller = new RoleController()

router.use(authMiddleware)

router.get('/', requirePermission('role:list'), controller.list)
router.get('/:id', requirePermission('role:query'), controller.findById)
router.post('/', requirePermission('role:add'), controller.create)
router.put('/:id', requirePermission('role:edit'), controller.update)
router.delete('/:id', requirePermission('role:delete'), controller.delete)
router.get('/:id/menus', requirePermission('role:query'), controller.getMenus)
router.post('/:id/menus', requirePermission('role:assign'), controller.assignMenus)

export default router