import { defineStore } from 'pinia'
import { ref } from 'vue'
import { setToken, removeToken } from '@/utils/auth'
import type { UserInfo } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref<UserInfo | null>(null)
  const permissions = ref<string[]>([])

  async function login(params: { username: string; password: string }) {
    // TODO: 替换为真实 API 调用
    const mockToken = 'mock_token_' + Date.now()
    token.value = mockToken
    setToken(mockToken)
    return { token: mockToken }
  }

  async function getUserInfo() {
    // TODO: 替换为真实 API 调用
    const mockUserInfo: UserInfo = {
      id: 1,
      username: 'admin',
      nickname: '管理员',
      email: 'admin@example.com',
      avatar: '',
      status: 1,
      roles: ['超级管理员'],
      permissions: ['*'],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    }
    userInfo.value = mockUserInfo
    permissions.value = mockUserInfo.permissions
    return mockUserInfo
  }

  function resetState() {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    removeToken()
  }

  return { token, userInfo, permissions, login, getUserInfo, resetState }
}, { persist: { key: 'user', pick: ['token'] } })