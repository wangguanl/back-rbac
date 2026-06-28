import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from '../swagger.config.cjs'
import { errorHandler } from '@/middleware/error.middleware'
import authRoutes from '@/modules/auth/auth.route'
import userRoutes from '@/modules/user/user.route'
import roleRoutes from '@/modules/role/role.route'

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'ok', data: { status: 'running', timestamp: new Date().toISOString() } })
})

app.use(errorHandler)

export default app
