import { Router } from 'express'
import { MenuController } from './menu.controller'
import { authMiddleware } from '@/middleware/auth.middleware'
import { requirePermission } from '@/middleware/permission.middleware'

const router = Router()
const controller = new MenuController()

router.use(authMiddleware)

router.get('/tree', requirePermission('menu:list'), controller.getTree)
router.get('/routes', controller.getRoutes)
router.get('/', requirePermission('menu:list'), controller.list)
router.get('/:id', requirePermission('menu:query'), controller.findById)
router.post('/', requirePermission('menu:add'), controller.create)
router.put('/:id', requirePermission('menu:edit'), controller.update)
router.delete('/:id', requirePermission('menu:delete'), controller.delete)

export default router