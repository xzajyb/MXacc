import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContextType, User } from '../types'
import { authApi } from '../utils/api'
import { setToken } from '../utils/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const navigate = useNavigate()

  // 初始化时检查用户状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token')
    console.log('🔍 检查认证状态，token存在:', !!token) // 调试日志
    
    setTokenState(token)
    if (!token) {
      console.log('❌ 没有找到token，设置为未登录状态')
      setLoading(false)
      return
    }

    try {
      console.log('🚀 开始验证token...')
      // 调用API验证token并获取用户信息
      const response = await fetch('/api/user/user-profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      console.log('📡 API响应状态:', response.status)

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsAuthenticated(true)
        console.log('✅ 用户状态恢复成功:', data.user.username, data.user.email)
      } else {
        const errorData = await response.json().catch(() => ({ message: '未知错误' }))
        console.log('❌ Token验证失败，状态码:', response.status, '错误信息:', errorData.message)
        
        // 只有在401 (Unauthorized) 时才清除token，其他错误保留token
        if (response.status === 401) {
          console.log('🗑️ Token无效，清除本地存储')
        localStorage.removeItem('token')
        setTokenState(null)
        setIsAuthenticated(false)
        setUser(null)
        } else {
          console.log('⚠️ 服务器错误，保留token以便稍后重试')
          // 服务器错误或网络问题，不清除token
        }
      }
    } catch (error) {
      console.error('🚨 网络错误或API调用失败:', error)
      // 网络错误不清除token，保留登录状态
      console.log('⚠️ 网络错误，保留token以便稍后重试')
    } finally {
      setLoading(false)
      console.log('🏁 认证状态检查完成')
    }
  }

  const login = async (emailOrUsername: string, password: string, rememberMe: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔐 开始登录流程，记住我:', rememberMe)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrUsername, password, rememberMe }),
      })

      const data = await response.json()
      console.log('📡 登录API响应:', { status: response.status, success: data.success, expiresIn: data.expiresIn })

      if (response.ok) {
        console.log('✅ 登录成功，保存token到localStorage')
        localStorage.setItem('token', data.token)
        setTokenState(data.token)
        setUser(data.user)
        setIsAuthenticated(true)
        
        console.log('🏠 跳转到Dashboard')
        // 登录成功直接跳转到Dashboard，不管邮箱是否验证
        navigate('/dashboard')
      } else {
        console.log('❌ 登录失败:', data.message)
        setError(data.message || '登录失败')
      }
    } catch (error) {
      console.error('🚨 登录过程中发生网络错误:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        setTokenState(data.token)
        setUser(data.user)
        setIsAuthenticated(true)
        
        // 注册成功直接跳转到Dashboard
        navigate('/dashboard')
      } else {
        setError(data.message || '注册失败')
      }
    } catch (error) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    console.log('🚪 用户登出')
    localStorage.removeItem('token')
    setTokenState(null)
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
    navigate('/login')
  }

  const refreshToken = async () => {
    try {
      const response = await authApi.refreshToken()
      if (response.data?.tokens) {
        setToken(response.data.tokens.accessToken, response.data.tokens.refreshToken)
      }
    } catch (error) {
      console.error('刷新令牌失败:', error)
      logout()
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  const sendEmailVerification = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'send' })
      })

      const data = await response.json()
      
      if (response.ok) {
        return { 
          success: true, 
          message: data.message, 
          expiresAt: data.expiresAt,
          sendInfo: data.sendInfo
        }
      } else {
        return { 
          success: false, 
          message: data.message,
          code: data.code,
          canSendAgainAt: data.canSendAgainAt,
          remainingTime: data.remainingTime
        }
      }
    } catch (error) {
      return { success: false, message: '发送验证邮件失败' }
    }
  }

  const verifyEmail = async (verificationCode: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          action: 'verify',
          verificationCode: verificationCode
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      return { success: false, message: '验证失败' }
    }
  }

  const changeEmail = async (newEmail: string, confirmPassword: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          action: 'change-email',
          newEmail: newEmail,
          confirmPassword: confirmPassword
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      return { success: false, message: '更改邮箱失败' }
    }
  }

  const deleteAccount = async (confirmPassword: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          action: 'delete-account',
          confirmPassword: confirmPassword
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        // 删除成功后自动登出
        logout()
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      return { success: false, message: '删除账号失败' }
    }
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      console.log('🔄 刷新用户信息...')
      const response = await fetch('/api/user/user-profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        console.log('✅ 用户信息刷新成功')
      } else if (response.status === 401) {
        console.log('❌ Token已失效，自动登出')
        logout()
      }
    } catch (error) {
      console.error('🚨 刷新用户信息失败:', error)
    }
  }

  // 检查token是否即将过期的工具函数
  const checkTokenExpiry = () => {
    const token = localStorage.getItem('token')
    if (!token) return false

    try {
      // 简单的JWT解析（仅用于检查过期时间）
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      const timeUntilExpiry = payload.exp - currentTime
      
      console.log('⏰ Token还有', Math.round(timeUntilExpiry / 3600), '小时过期')
      
      // 如果少于1小时就过期，返回true
      return timeUntilExpiry < 3600
    } catch (error) {
      console.error('解析token失败:', error)
      return true
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    token,
    login,
    register,
    logout,
    refreshUser,
    sendEmailVerification,
    verifyEmail,
    changeEmail,
    deleteAccount,
    checkTokenExpiry,
  }

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 