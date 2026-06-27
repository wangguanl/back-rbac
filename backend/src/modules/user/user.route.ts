import { Router } from 'express'
import { UserController } from './user.controller'
import { authMiddleware } from '@/middleware/auth.middleware'
import { requirePermission } from '@/middleware/permission.middleware'

const router = Router()
const controller = new UserController()

router.use(authMiddleware)

/**
 * @openapi
 * /users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: size
 *         schema:
 *           type: number
 *           default: 10
 *         description: 每页条数
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: 用户名（模糊搜索）
 *       - in: query
 *         name: status
 *         schema:
 *           type: number
 *         description: 状态（0禁用 1启用）
 *     responses:
 *       200:
 *         description: 成功获取列表
 */
router.get('/', requirePermission('user:list'), controller.list)

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: 获取用户详情
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取用户详情
 */
router.get('/:id', requirePermission('user:query'), controller.findById)

/**
 * @openapi
 * /users:
 *   post:
 *     summary: 新增用户
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
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
 *               password:
 *                 type: string
 *               nickname:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: number
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/', requirePermission('user:add'), controller.create)

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: 编辑用户
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: number
 *     responses:
 *       200:
 *         description: 编辑成功
 */
router.put('/:id', requirePermission('user:edit'), controller.update)

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: 删除用户
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:id', requirePermission('user:delete'), controller.delete)

/**
 * @openapi
 * /users/{id}/roles:
 *   put:
 *     summary: 分配用户角色
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: 角色ID列表
 *     responses:
 *       200:
 *         description: 分配成功
 */
router.put('/:id/roles', requirePermission('user:assign'), controller.assignRoles)

/**
 * @openapi
 * /users/{id}/password:
 *   put:
 *     summary: 重置用户密码
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 description: 新密码
 *     responses:
 *       200:
 *         description: 重置成功
 */
router.put('/:id/password', requirePermission('user:resetPwd'), controller.resetPassword)

export default router