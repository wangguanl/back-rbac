import { Router } from 'express'
import { LogController } from './log.controller'
import { authMiddleware } from '@/middleware/auth.middleware'
import { requirePermission } from '@/middleware/permission.middleware'

const router: Router = Router()
const controller = new LogController()

router.use(authMiddleware)

/**
 * @openapi
 * /logs/login:
 *   get:
 *     summary: 登录日志分页列表
 *     tags: [日志管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取登录日志
 */
router.get('/login', requirePermission('log:list'), controller.findLoginLogs.bind(controller))

router.get('/operation', requirePermission('log:list'), controller.findOperationLogs.bind(controller))

router.get('/operation/:id', requirePermission('log:query'), controller.findOperationLogById.bind(controller))

export default router