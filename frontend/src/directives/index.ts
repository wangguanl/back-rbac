import type { App } from 'vue'
import { auth } from './auth'
import { role } from './role'

export function setupDirectives(app: App) {
  app.directive('auth', auth)
  app.directive('role', role)
}