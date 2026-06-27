import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi, getUserInfoApi } from '@/api/auth'
import { setToken, removeToken } from '@/utils/auth'
import type { UserInfo } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref<UserInfo | null>(null)
  const permissions = ref<string[]>([])

  async function login(params: { username: string; password: string }) {
    const res = await loginApi(params)
    token.value = res.data.token
    setToken(res.data.token)
    return res.data
  }

  async function getUserInfo() {
    const res = await getUserInfoApi()
    userInfo.value = res.data
    permissions.value = res.data.permissions || []
    return res.data
  }

  function resetState() {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    removeToken()
  }

  return { token, userInfo, permissions, login, getUserInfo, resetState }
}, { persist: { key: 'user', pick: ['token'] } })