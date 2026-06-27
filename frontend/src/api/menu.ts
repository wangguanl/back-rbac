import request from '@/utils/request'
import type { MenuInfo, MenuTreeNode } from '@/types/menu'

/** 获取菜单树 */
export function getMenuTreeApi() {
  return request.get<MenuTreeNode[]>('/menus/tree')
}

/** 获取菜单路由 */
export function getMenuRoutesApi() {
  return request.get<MenuTreeNode[]>('/menus/routes')
}

/** 获取所有菜单 */
export function getAllMenusApi() {
  return request.get<MenuInfo[]>('/menus')
}

/** 获取菜单详情 */
export function getMenuByIdApi(id: number) {
  return request.get<MenuInfo>(`/menus/${id}`)
}

/** 创建菜单 */
export function createMenuApi(data: Partial<MenuInfo>) {
  return request.post<MenuInfo>('/menus', data)
}

/** 更新菜单 */
export function updateMenuApi(id: number, data: Partial<MenuInfo>) {
  return request.put<MenuInfo>(`/menus/${id}`, data)
}

/** 删除菜单 */
export function deleteMenuApi(id: number) {
  return request.delete<null>(`/menus/${id}`)
}