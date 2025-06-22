import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthContextType, User, LoginRequest, RegisterRequest } from '../types'
import { authApi } from '../utils/api'
import { getToken, setToken, removeToken } from '../utils/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const isAuthenticated = !!user

  // 初始化时检查用户状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const response = await authApi.getCurrentUser()
      const user = response.data?.data?.user || response.data?.user
      if (user) {
        setUser(user)
      } else {
        removeToken()
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
      removeToken()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true)
      const response = await authApi.login(credentials)
      
      if (response.data?.user && response.data?.token) {
        setUser(response.data.user)
        // 暂时使用同一个token作为访问令牌和刷新令牌
        setToken(response.data.token, response.data.token)
        
        toast.success(response.data.message || '登录成功！')
        navigate('/dashboard')
      } else {
        throw new Error(response.data?.message || '登录失败')
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      
      // 处理不同类型的错误
      let message = '登录失败，请稍后再试'
      
      if (error.response?.data) {
        const errorData = error.response.data
        message = errorData.message || errorData.error || message
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterRequest) => {
    try {
      setIsLoading(true)
      const response = await authApi.register(data)
      
      toast.success(response.data?.message || '注册成功！请检查邮箱验证账号')
      navigate('/login')
    } catch (error: any) {
      console.error('注册失败:', error)
      
      let message = '注册失败，请稍后再试'
      
      if (error.response?.data) {
        const errorData = error.response.data
        message = errorData.message || errorData.error || message
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    removeToken()
    toast.success('已退出登录')
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
        updateUser,
      }}
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