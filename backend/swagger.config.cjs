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
      { url: 'http://localhost:3000/api', description: '开发环境' }
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
  ]
};

const spec = swaggerJsdoc(options);
module.exports = spec;