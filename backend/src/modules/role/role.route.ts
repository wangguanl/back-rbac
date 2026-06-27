import { Router } from 'express'
import { RoleController } from './role.controller'
import { authMiddleware } from '@/middleware/auth.middleware'
import { requirePermission } from '@/middleware/permission.middleware'

const router = Router()
const controller = new RoleController()

router.use(authMiddleware)

/**
 * @openapi
 * /roles:
 *   get:
 *     summary: 获取角色列表
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取角色列表
 */
router.get('/', requirePermission('role:list'), controller.list)

/**
 * @openapi
 * /roles/{id}:
 *   get:
 *     summary: 获取角色详情
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 成功获取角色详情
 */
router.get('/:id', requirePermission('role:query'), controller.findById)

/**
 * @openapi
 * /roles:
 *   post:
 *     summary: 新增角色
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code:
 *                 type: string
 *                 description: 角色编码
 *               name:
 *                 type: string
 *                 description: 角色名称
 *               description:
 *                 type: string
 *               sort:
 *                 type: number
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/', requirePermission('role:add'), controller.create)

/**
 * @openapi
 * /roles/{id}:
 *   put:
 *     summary: 编辑角色
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 角色ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sort:
 *                 type: number
 *               status:
 *                 type: number
 *     responses:
 *       200:
 *         description: 编辑成功
 */
router.put('/:id', requirePermission('role:edit'), controller.update)

/**
 * @openapi
 * /roles/{id}:
 *   delete:
 *     summary: 删除角色
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:id', requirePermission('role:delete'), controller.delete)

/**
 * @openapi
 * /roles/{id}/menus:
 *   get:
 *     summary: 获取角色菜单
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 成功获取角色菜单ID列表
 */
router.get('/:id/menus', requirePermission('role:query'), controller.getMenus)

/**
 * @openapi
 * /roles/{id}/menus:
 *   post:
 *     summary: 分配角色权限
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 角色ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               menuIds:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: 菜单ID列表
 *     responses:
 *       200:
 *         description: 权限分配成功
 */
router.post('/:id/menus', requirePermission('role:assign'), controller.assignMenus)

export default router