import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from './auth'
import router from '@/router'
import type { ApiResponse } from '@/types/api'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000
})

// 请求拦截
service.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截 - 直接返回 response.data，即 ApiResponse
service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message)
      if (res.code === 401) {
        removeToken()
        router.push('/login')
      }
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  error => {
    // HTTP 错误（如 500）时，尝试从 response 中提取错误信息
    const msg = error.response?.data?.message || error.message
    ElMessage.error(msg)
    // 如果后端返回 401，清除 token 并跳转登录
    if (error.response?.status === 401 || error.response?.data?.code === 401) {
      removeToken()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

// 类型安全的请求封装 - 响应拦截已去掉 AxiosResponse 包装，直接返回 ApiResponse<T>
const request = {
  get<T = unknown>(url: string, config?: Record<string, unknown>) {
    return service.get<unknown, ApiResponse<T>>(url, config)
  },
  post<T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>) {
    return service.post<unknown, ApiResponse<T>>(url, data, config)
  },
  put<T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>) {
    return service.put<unknown, ApiResponse<T>>(url, data, config)
  },
  delete<T = unknown>(url: string, config?: Record<string, unknown>) {
    return service.delete<unknown, ApiResponse<T>>(url, config)
  }
}

export default request