# API 文档生成方案（RBAC项目）

## 1. 依赖安装

```bash
cd backend
pnpm add swagger-jsdoc swagger-ui-express
pnpm add -D @redocly/cli
```

## 2. 配置文件 `swagger.config.cjs`

在 `backend/` 目录创建配置文件：

```javascript
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RBAC 权限管理系统 API',
      version: '1.0.0',
      description: 'RBAC权限管理系统后端接口文档',
      contact: {
        name: '技术支持',
        email: 'support@example.com'
      }
    },
    servers: [
      { url: 'http://localhost:3000/api', description: '开发环境' },
      { url: 'https://api.example.com/api', description: '生产环境' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    './src/modules/auth/*.ts',
    './src/modules/user/*.ts',
    './src/modules/role/*.ts'
  ],
  failOnErrors: true
};

const spec = swaggerJsdoc(options);
module.exports = spec;
```

**关键配置说明：**
- `openapi: '3.0.0'` - 使用 OpenAPI 3.0 规范
- `servers` - API基础路径为 `/api`
- `apis` - 扫描 `src/modules/` 下的路由文件
- `securitySchemes` - JWT Bearer认证配置

## 3. package.json 脚本配置

在 `backend/package.json` 中添加：

```json
{
  "scripts": {
    "docs:generate": "npx swagger-jsdoc -d swagger.config.cjs -o docs/swagger.json ./src/modules/auth/*.ts ./src/modules/user/*.ts ./src/modules/role/*.ts",
    "docs:build": "npx @redocly/cli build-docs docs/swagger.json --output docs/index.html",
    "docs:preview": "npx @redocly/cli preview --product redoc --project-dir docs --port 3001"
  }
}
```

## 4. 路由文件注释示例

### 认证模块 auth.route.ts

```typescript
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
router.post('/login', controller.login);

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
 *                     permissionGroups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: 页面路由 name，如 User
 *                           permissions:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: 动作短名列表，如 list、add
 *       401:
 *         description: 未授权
 */
router.get('/userinfo', authMiddleware, controller.getUserInfo);
```

### 用户模块 user.route.ts

```typescript
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
router.get('/', authMiddleware, requirePermission('user:list'), controller.list);

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
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: number
 *               status:
 *                 type: number
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/', authMiddleware, requirePermission('user:add'), controller.create);
```

### 角色模块 role.route.ts

```typescript
/**
 * @openapi
 * /roles/{id}/permissions:
 *   get:
 *     summary: 获取角色权限分组
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
 *                       name:
 *                         type: string
 *                         description: 页面路由 name，如 User
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 动作短名列表，如 list、add
 */
router.get('/:id/permissions', authMiddleware, requirePermission('role:query'), controller.getPermissions);

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
router.post('/:id/permissions', authMiddleware, requirePermission('role:assign'), controller.assignPermissions);
```

## 5. 使用流程

```bash
# 步骤1: 生成 swagger.json
npm run docs:generate

# 步骤2: 生成静态 HTML 文档
npm run docs:build

# 步骤3: 本地预览文档（可选）
npm run docs:preview
```

## 6. 项目目录结构

```
backend/
├── swagger.config.cjs          # Swagger 配置文件
├── docs/                       # 文档输出目录
│   ├── swagger.json           # OpenAPI 规范文件
│   └── index.html             # 静态文档页面
├── src/
│   └── modules/
│       ├── auth/
│       │   └── auth.route.ts  # 认证路由（包含API注释）
│       ├── user/
│       │   └ user.route.ts   # 用户路由
│       └── role/
│           └ role.route.ts   # 角色路由
└── package.json
```

## 7. API模块分组（tags）

| 模块 | tag名称 | 路径 |
|------|---------|------|
| 认证 | 认证模块 | /api/auth/* |
| 用户 | 用户管理 | /api/users/* |
| 角色 | 角色管理 | /api/roles/* |

## 8. 优势

- ✅ 文档与代码同步更新
- ✅ 维护成本低（注释驱动）
- ✅ 支持 JWT 认证标注
- ✅ 生成美观的交互式文档
- ✅ 前端可直接查看接口定义

## 9. 注意事项

- 路由文件注释必须使用 `@openapi` 标记
- TypeScript文件需正确配置扫描路径
- 需要认证的接口添加 `security: [bearerAuth: []]`
- 权限控制接口标注所需权限
- **权限传输格式**：统一使用 `RoutePermissionGroup[]`（`{ name, permissions[] }`），前端 `flattenPermissionGroups()` 转为扁平 `user:list` 供 v-auth 使用

## 10. 已废弃接口

> 以下接口已移除，不再可用：

| 接口 | 说明 |
|------|------|
| `GET /api/menus/tree` | 菜单树（已由前端 asyncRoutes 替代） |
| `GET /api/menus/routes` | 用户菜单路由（已由前端 filterRoutes 替代） |
| `GET/POST/PUT/DELETE /api/menus/*` | 菜单 CRUD（菜单管理模块已移除） |
| `GET /api/roles/:id/menus` | 角色菜单（由 permissions 替代） |
| `POST /api/roles/:id/menus` | 分配角色菜单（由 permissions 替代） |

## 11. 集成到Express应用

```typescript
// src/app.ts
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from '../swagger.config.cjs'

// API文档路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
```

访问 `http://localhost:3000/api-docs` 即可查看Swagger UI文档。