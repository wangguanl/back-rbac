import { Router } from 'express'
import { MenuController } from './menu.controller'
import { authMiddleware } from '@/middleware/auth.middleware'
import { requirePermission } from '@/middleware/permission.middleware'

const router = Router()
const controller = new MenuController()

router.use(authMiddleware)

/**
 * @openapi
 * /menus/tree:
 *   get:
 *     summary: 获取菜单树
 *     tags: [菜单管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取菜单树
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       parentId:
 *                         type: number
 *                       name:
 *                         type: string
 *                       title:
 *                         type: string
 *                       path:
 *                         type: string
 *                       children:
 *                         type: array
 *                         items:
 *                           type: object
 */
router.get('/tree', controller.getTree)

/**
 * @openapi
 * /menus/routes:
 *   get:
 *     summary: 获取用户路由菜单
 *     tags: [菜单管理]
 *     security:
 *       - bearerAuth: []
 *     description: 获取当前登录用户可访问的路由菜单（用于前端动态路由）
 *     responses:
 *       200:
 *         description: 成功获取用户路由
 */
router.get('/routes', controller.getRoutes)

/**
 * @openapi
 * /menus:
 *   get:
 *     summary: 获取菜单列表
 *     tags: [菜单管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取菜单列表
 */
router.get('/', requirePermission('menu:list'), controller.list)

/**
 * @openapi
 * /menus/{id}:
 *   get:
 *     summary: 获取菜单详情
 *     tags: [菜单管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 菜单ID
 *     responses:
 *       200:
 *         description: 成功获取菜单详情
 */
router.get('/:id', requirePermission('menu:query'), controller.findById)

/**
 * @openapi
 * /menus:
 *   post:
 *     summary: 新增菜单
 *     tags: [菜单管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, title]
 *             properties:
 *               parentId:
 *                 type: number
 *                 description: 父菜单ID
 *               path:
 *                 type: string
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               component:
 *                 type: string
 *               sort:
 *                 type: number
 *               type:
 *                 type: number
 *                 description: 0目录 1菜单 2按钮
 *               title:
 *                 type: string
 *               permission:
 *                 type: string
 *               hidden:
 *                 type: number
 *               status:
 *                 type: number
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/', requirePermission('menu:add'), controller.create)

/**
 * @openapi
 * /menus/{id}:
 *   put:
 *     summary: 编辑菜单
 *     tags: [菜单管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 菜单ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parentId:
 *                 type: number
 *               path:
 *                 type: string
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               component:
 *                 type: string
 *               sort:
 *                 type: number
 *               title:
 *                 type: string
 *               permission:
 *                 type: string
 *               status:
 *                 type: number
 *     responses:
 *       200:
 *         description: 编辑成功
 */
router.put('/:id', requirePermission('menu:edit'), controller.update)

/**
 * @openapi
 * /menus/{id}:
 *   delete:
 *     summary: 删除菜单
 *     tags: [菜单管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: 菜单ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       400:
 *         description: 存在子菜单无法删除
 */
router.delete('/:id', requirePermission('menu:delete'), controller.delete)

export default router