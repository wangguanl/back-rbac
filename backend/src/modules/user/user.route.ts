import { Router } from 'express'
import { UserController } from './user.controller'
import { authMiddleware } from '@/middleware/auth.middleware'
import { requirePermission } from '@/middleware/permission.middleware'

const router = Router()
const controller = new UserController()

router.use(authMiddleware)

router.get('/', requirePermission('user:list'), controller.list)
router.get('/:id', requirePermission('user:query'), controller.findById)
router.post('/', requirePermission('user:add'), controller.create)
router.put('/:id', requirePermission('user:edit'), controller.update)
router.delete('/:id', requirePermission('user:delete'), controller.delete)
router.put('/:id/roles', requirePermission('user:assign'), controller.assignRoles)
router.put('/:id/password', requirePermission('user:resetPwd'), controller.resetPassword)

export default router