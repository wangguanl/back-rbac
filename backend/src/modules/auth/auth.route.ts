import { Router } from 'express'
import { AuthController } from './auth.controller'
import { authMiddleware } from '@/middleware/auth.middleware'
import { loginLimiter } from '@/middleware/rate-limit.middleware'

const router = Router()
const controller = new AuthController()

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [认证模块]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *                 example: admin
 *               password:
 *                 type: string
 *                 description: 密码
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     userInfo:
 *                       type: object
 */
router.post('/login', loginLimiter, controller.login)

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: 用户登出
 *     tags: [认证模块]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 */
router.post('/logout', authMiddleware, controller.logout)

/**
 * @openapi
 * /auth/userinfo:
 *   get:
 *     summary: 获取用户信息
 *     tags: [认证模块]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     username:
 *                       type: string
 *                     nickname:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: 未授权
 */
router.get('/userinfo', authMiddleware, controller.getUserInfo)

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: 刷新Token
 *     tags: [认证模块]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 刷新令牌
 *     responses:
 *       200:
 *         description: Token刷新成功
 */
router.post('/refresh', controller.refreshToken)

export default router