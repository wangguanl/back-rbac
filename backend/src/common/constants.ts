// 用户状态
export const USER_STATUS = {
  ENABLED: 1,
  DISABLED: 0
} as const

// 角色状态
export const ROLE_STATUS = {
  ENABLED: 1,
  DISABLED: 0
} as const

// 菜单类型
export const MENU_TYPE = {
  DIRECTORY: 0,
  MENU: 1,
  BUTTON: 2
} as const

// 删除标记
export const DELETED = {
  NO: 0,
  YES: 1
} as const

// 默认分页
export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100