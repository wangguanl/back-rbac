import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from '../swagger.config.cjs'
import { errorHandler } from '@/middleware/error.middleware'
import authRoutes from '@/modules/auth/auth.route'
import userRoutes from '@/modules/user/user.route'
import roleRoutes from '@/modules/role/role.route'
import menuRoutes from '@/modules/menu/menu.route'

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Swagger 文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/menus', menuRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'ok', data: { status: 'running', timestamp: new Date().toISOString() } })
})

// 错误处理
app.use(errorHandler)

export default app