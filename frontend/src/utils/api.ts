import axios, { AxiosResponse } from 'axios'
import toast from 'react-hot-toast'
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  ProfileUpdateRequest,
  SettingsUpdateRequest,
  PasswordChangeRequest,
  SecuritySettings,
  LoginHistory,
  TwoFactorSetup
} from '@/types'
import { getToken, getRefreshToken, setToken, removeToken, shouldRefreshToken } from './auth'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  async (config) => {
    const token = getToken()
    
    if (token) {
      // 检查是否需要刷新令牌
      if (shouldRefreshToken(token)) {
        try {
          const refreshResponse = await authApi.refreshToken()
          if (refreshResponse.data?.tokens) {
            setToken(refreshResponse.data.tokens.accessToken, refreshResponse.data.tokens.refreshToken)
            config.headers.Authorization = `Bearer ${refreshResponse.data.tokens.accessToken}`
          }
        } catch (error) {
          console.error('刷新令牌失败:', error)
          removeToken()
          window.location.href = '/login'
          return Promise.reject(error)
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // 如果是401错误且不是刷新令牌请求，尝试刷新令牌
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/refresh-token')) {
      originalRequest._retry = true
      
      try {
        const refreshResponse = await authApi.refreshToken()
        if (refreshResponse.data?.tokens) {
          setToken(refreshResponse.data.tokens.accessToken, refreshResponse.data.tokens.refreshToken)
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.tokens.accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        removeToken()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    // 处理网络错误
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      toast.error('网络连接失败，请检查网络设置')
    } else if (error.response?.status >= 500) {
      toast.error('服务器错误，请稍后再试')
    }
    
    return Promise.reject(error)
  }
)

// 认证相关API
export const authApi = {
  // 用户登录
  login: (credentials: LoginRequest): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', credentials),

  // 用户注册
  register: (data: RegisterRequest): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/register', data),

  // 刷新令牌
  refreshToken: (): Promise<AxiosResponse<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>> => {
    const refreshToken = getRefreshToken()
    return api.post('/auth/refresh-token', { refreshToken })
  },

  // 邮箱验证
  verifyEmail: (token: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/verify-email', { token }),

  // 重发验证邮件
  resendVerification: (email: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/resend-verification', { email }),

  // 忘记密码
  forgotPassword: (email: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/forgot-password', { email }),

  // 重置密码
  resetPassword: (token: string, password: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/reset-password', { token, password }),

  // 登出
  logout: (): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/logout'),

  // 获取当前用户信息
  getCurrentUser: (): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.get('/user/me'),
}

// 用户管理API
export const userApi = {
  // 更新用户资料
  updateProfile: (data: ProfileUpdateRequest): Promise<AxiosResponse<ApiResponse<{ profile: User['profile'] }>>> =>
    api.put('/user/user-profile', data),

  // 上传头像
  uploadAvatar: (file: File): Promise<AxiosResponse<ApiResponse<{ avatar: string }>>> => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // 更新用户设置
  updateSettings: (data: SettingsUpdateRequest): Promise<AxiosResponse<ApiResponse<{ settings: User['settings'] }>>> =>
    api.put('/user/settings', data),

  // 修改密码
  changePassword: (data: PasswordChangeRequest): Promise<AxiosResponse<ApiResponse>> =>
    api.put('/user/password', data),

  // 获取登录历史
  getLoginHistory: (page: number = 1, limit: number = 10): Promise<AxiosResponse<ApiResponse<{ loginHistory: LoginHistory[]; pagination: any }>>> =>
    api.get(`/user/login-history?page=${page}&limit=${limit}`),

  // 删除账户
  deleteAccount: (password: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete('/user/account', { data: { password } }),
}

// 安全管理API
export const securityApi = {
  // 获取安全设置
  getSecuritySettings: (): Promise<AxiosResponse<ApiResponse<SecuritySettings>>> =>
    api.get('/security/settings'),

  // 生成两步验证密钥
  generateTwoFactorSecret: (): Promise<AxiosResponse<ApiResponse<TwoFactorSetup>>> =>
    api.post('/security/2fa/generate'),

  // 启用两步验证
  enableTwoFactor: (token: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/security/2fa/enable', { token }),

  // 禁用两步验证
  disableTwoFactor: (password: string, token?: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/security/2fa/disable', { password, token }),

  // 验证两步验证码
  verifyTwoFactor: (token: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/security/2fa/verify', { token }),
}

export default api 