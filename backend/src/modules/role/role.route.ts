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
router.get('/', requirePermission('role:list'), controller.list.bind(controller))

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
router.get('/:id', requirePermission('role:query'), controller.findById.bind(controller))

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
router.post('/', requirePermission('role:add'), controller.create.bind(controller))

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
router.put('/:id', requirePermission('role:edit'), controller.update.bind(controller))

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
router.delete('/:id', requirePermission('role:delete'), controller.delete.bind(controller))

/**
 * @openapi
 * /roles/{id}/permissions:
 *   get:
 *     summary: 获取角色权限
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
 *         description: 成功获取角色权限分组
 */
router.get('/:id/permissions', requirePermission('role:query'), controller.getPermissions.bind(controller))

/**
 * @openapi
 * /roles/{id}/permissions:
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
 *             type: array
 *             items:
 *               type: object
 *               required: [name, permissions]
 *               properties:
 *                 name:
 *                   type: string
 *                   description: 页面路由 name，如 User
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 动作短名列表，如 list、add
 *     responses:
 *       200:
 *         description: 权限分配成功
 */
router.post('/:id/permissions', requirePermission('role:assign'), controller.assignPermissions.bind(controller))

export default router
