export class BusinessException extends Error {
  code: number
  message: string

  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.message = message
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(message = '未授权') {
    super(401, message)
  }
}

export class ForbiddenException extends BusinessException {
  constructor(message = '无权限') {
    super(403, message)
  }
}

export class NotFoundException extends BusinessException {
  constructor(message = '资源不存在') {
    super(404, message)
  }
}

export class BadRequestException extends BusinessException {
  constructor(message = '请求参数错误') {
    super(400, message)
  }
}