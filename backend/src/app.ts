import express from 'express'
import cors from 'cors'
import { errorHandler } from '@/middleware/error.middleware'
import authRoutes from '@/modules/auth/auth.route'

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 路由
app.use('/api/auth', authRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'ok', data: { status: 'running', timestamp: new Date().toISOString() } })
})

// 错误处理
app.use(errorHandler)

export default app