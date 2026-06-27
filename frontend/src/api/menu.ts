import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type { MenuInfo, MenuTreeNode } from '@/types/menu'

/** 获取菜单树 */
export function getMenuTreeApi() {
  return request.get<ApiResponse<MenuTreeNode[]>>('/menus/tree')
}

/** 获取所有菜单 */
export function getAllMenusApi() {
  return request.get<ApiResponse<MenuInfo[]>>('/menus')
}

/** 创建菜单 */
export function createMenuApi(data: Partial<MenuInfo>) {
  return request.post<ApiResponse<MenuInfo>>('/menus', data)
}

/** 更新菜单 */
export function updateMenuApi(id: number, data: Partial<MenuInfo>) {
  return request.put<ApiResponse<MenuInfo>>(`/menus/${id}`, data)
}

/** 删除菜单 */
export function deleteMenuApi(id: number) {
  return request.delete<ApiResponse<null>>(`/menus/${id}`)
}