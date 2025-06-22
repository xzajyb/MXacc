import React, { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { LoginRequest } from '../types'
import { cn } from '../utils/cn'
import LoadingSpinner from '../components/LoadingSpinner'

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, '请输入邮箱或用户名'),
  password: z.string().min(1, '请输入密码'),
  rememberMe: z.boolean().optional()
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  // 如果已经登录，重定向到目标页面或仪表板
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true)
      await login(data as LoginRequest)
    } catch (error) {
      // 错误已在AuthContext中处理
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/20 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-100/20 dark:bg-slate-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-blue-50/20 dark:bg-blue-400/5 rounded-full blur-2xl animate-float"></div>
      </div>

      {/* Left Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-md w-full"
        >
          {/* Glass card container */}
          <div className="glass-card rounded-2xl p-8 shadow-strong">
            {/* Logo and header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-logo-large mx-auto mb-4"
              >
                <img 
                  src="/logo.svg" 
                  alt="MX Logo" 
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                欢迎回来
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                登录到您的 MX 账号
              </p>
            </div>

            {/* Error message */}
            {/* {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )} */}

            {/* Login form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="emailOrUsername" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  邮箱或用户名
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    {...register('emailOrUsername')}
                    id="emailOrUsername"
                    name="emailOrUsername"
                    type="text"
                    required
                    className={cn(
                      'input-professional w-full pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400',
                      errors.emailOrUsername && 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    )}
                    placeholder="输入您的邮箱或用户名"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    {...register('password')}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={cn(
                      'input-professional w-full pl-10 pr-12 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400',
                      errors.password && 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    )}
                    placeholder="输入您的密码"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    <svg 
                      className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    {...register('rememberMe')}
                    type="checkbox"
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    disabled={isSubmitting}
                  />
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">
                    记住我
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  忘记密码？
                </Link>
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full btn-primary py-3 px-4 rounded-lg font-medium text-white shadow-medium hover:shadow-strong transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">登录中...</span>
                  </>
                ) : (
                  '登录'
                )}
              </motion.button>
            </form>

            {/* Register link */}
            <div className="mt-6 text-center">
              <p className="text-slate-600 dark:text-slate-300">
                还没有账号？{' '}
                <Link
                  to="/register"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Brand showcase */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          className="max-w-lg text-center"
        >
          <div className="mx-logo-large mx-auto mb-8" style={{ width: '120px', height: '120px' }}>
            <img 
              src="/logo.svg" 
              alt="MX Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <h2 className="text-4xl font-bold mx-text-gradient mb-6">
            MX 统一账号
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-12">
            梦锡工作室的专业账号管理系统
          </p>

          {/* Feature cards */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-effect p-6 rounded-xl"
            >
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 mx-primary rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">安全可靠</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                企业级安全防护，保障您的账号和数据安全
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-effect p-6 rounded-xl"
            >
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 mx-primary rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">现代设计</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                简洁现代的界面设计，支持深浅色主题切换
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-effect p-6 rounded-xl"
            >
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 mx-primary rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">高效便捷</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                快速响应，流畅体验，让账号管理变得简单
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage 