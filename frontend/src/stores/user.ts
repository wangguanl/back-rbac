import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, getUserInfoApi } from '@/api/auth'
import { setToken, removeToken } from '@/utils/auth'
import { flattenPermissionGroups } from '@/router/routes/utils/permissionGroups'
import type { UserInfo } from '@/types/user'
import type { RoutePermissionGroup } from '@/types/permission'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref<UserInfo | null>(null)
  const permissionGroups = ref<RoutePermissionGroup[]>([])

  /** 供 v-auth / composables 使用的扁平权限 */
  const permissions = computed(() => flattenPermissionGroups(permissionGroups.value))

  async function login(params: { username: string; password: string }) {
    const res = await loginApi(params)
    token.value = res.data.token
    setToken(res.data.token)
    return res.data
  }

  async function getUserInfo() {
    const res = await getUserInfoApi()
    userInfo.value = res.data
    permissionGroups.value = res.data.permissionGroups || []
    return res.data
  }

  function resetState() {
    token.value = ''
    userInfo.value = null
    permissionGroups.value = []
    removeToken()
  }

  return { token, userInfo, permissionGroups, permissions, login, getUserInfo, resetState }
}, { persist: { key: 'user', pick: ['token'] } })
