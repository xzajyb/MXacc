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
    setTokenState(token)
    if (!token) {
      setLoading(false)
      return
    }

    try {
      // 调用API验证token并获取用户信息
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsAuthenticated(true)
        console.log('用户状态恢复成功:', data.user) // 调试日志
      } else {
        // Token无效，清除本地存储
        console.log('Token验证失败，状态码:', response.status) // 调试日志
        localStorage.removeItem('token')
        setTokenState(null)
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
      localStorage.removeItem('token')
      setTokenState(null)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (emailOrUsername: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrUsername, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        setTokenState(data.token)
        setUser(data.user)
        setIsAuthenticated(true)
        
        // 登录成功直接跳转到Dashboard，不管邮箱是否验证
        navigate('/dashboard')
      } else {
        setError(data.message || '登录失败')
      }
    } catch (error) {
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
    localStorage.removeItem('token')
    setTokenState(null)
    setUser(null)
    setIsAuthenticated(false)
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
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        return { 
          success: true, 
          message: data.message, 
          verificationCode: data.verificationCode,
          expiresAt: data.expiresAt,
          sendInfo: data.sendInfo
        }
      } else {
        return { 
          success: false, 
          message: data.message,
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
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ verificationCode }),
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

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    token,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    sendEmailVerification,
    verifyEmail,
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