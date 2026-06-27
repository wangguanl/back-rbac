import { Router } from 'express'
import { AuthController } from './auth.controller'
import { authMiddleware } from '@/middleware/auth.middleware'
import { loginLimiter } from '@/middleware/rate-limit.middleware'

const router = Router()
const controller = new AuthController()

router.post('/login', loginLimiter, controller.login)
router.post('/logout', authMiddleware, controller.logout)
router.get('/userinfo', authMiddleware, controller.getUserInfo)
router.post('/refresh', controller.refreshToken)

export default router