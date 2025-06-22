import React, { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, ArrowRight, User } from 'lucide-react'
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
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [userEmail, setUserEmail] = useState('')
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const emailOrUsername = watch('emailOrUsername')

  // 如果已经登录，重定向到目标页面或仪表板
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  const handleNextStep = () => {
    if (emailOrUsername && emailOrUsername.trim()) {
      setUserEmail(emailOrUsername)
      setStep('password')
    }
  }

  const handleBackStep = () => {
    setStep('email')
    setValue('password', '')
  }

  const onSubmit = async (data: LoginFormData) => {
    if (step === 'email') {
      handleNextStep()
      return
    }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/20 blur-3xl"></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* MX Logo 和品牌 */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative mx-auto mb-6"
            >
              {/* MX Logo - 类似您网站的设计 */}
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 shadow-lg shadow-blue-500/25"></div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/90 to-cyan-400/90 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white tracking-wider">MX</span>
                </div>
                {/* 光晕效果 */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/40 to-cyan-400/40 blur-md -z-10"></div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                {step === 'email' ? '登录您的账号' : '输入密码'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {step === 'email' 
                  ? '访问梦锡工作室的所有服务' 
                  : `继续登录 ${userEmail}`
                }
              </p>
            </motion.div>
          </div>

          {/* 登录卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {step === 'email' ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* 邮箱/用户名输入 */}
                  <div>
                    <label htmlFor="emailOrUsername" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      邮箱或用户名
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        {...register('emailOrUsername')}
                        type="text"
                        id="emailOrUsername"
                        autoComplete="username"
                        className={cn(
                          'w-full pl-12 pr-4 py-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400',
                          'focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20',
                          'transition-all duration-200',
                          errors.emailOrUsername && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                        )}
                        placeholder="输入您的邮箱或用户名"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.emailOrUsername && (
                      <p className="text-sm text-red-500 mt-2">{errors.emailOrUsername.message}</p>
                    )}
                  </div>

                  {/* 下一步按钮 */}
                  <button
                    type="submit"
                    disabled={!emailOrUsername || isSubmitting}
                    className={cn(
                      'w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium py-4 rounded-xl',
                      'hover:from-blue-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200',
                      'focus:outline-none focus:ring-4 focus:ring-blue-500/20',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
                      'flex items-center justify-center space-x-2'
                    )}
                  >
                    <span>下一步</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* 返回按钮 */}
                  <button
                    type="button"
                    onClick={handleBackStep}
                    className="flex items-center text-blue-600 hover:text-blue-700 mb-4 text-sm font-medium transition-colors"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180 mr-1" />
                    返回
                  </button>

                  {/* 用户信息显示 */}
                  <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{userEmail}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">梦锡工作室账号</p>
                    </div>
                  </div>

                  {/* 密码输入 */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        autoFocus
                        className={cn(
                          'w-full pl-12 pr-12 py-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400',
                          'focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20',
                          'transition-all duration-200',
                          errors.password && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                        )}
                        placeholder="输入您的密码"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500 mt-2">{errors.password.message}</p>
                    )}
                  </div>

                  {/* 记住我和忘记密码 */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        {...register('rememberMe')}
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-white border-2 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">保持登录状态</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      忘记密码？
                    </Link>
                  </div>

                  {/* 登录按钮 */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      'w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium py-4 rounded-xl',
                      'hover:from-blue-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200',
                      'focus:outline-none focus:ring-4 focus:ring-blue-500/20',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
                      'flex items-center justify-center space-x-2'
                    )}
                  >
                    {isSubmitting ? (
                      <LoadingSpinner size="sm" className="text-white" />
                    ) : (
                      <>
                        <span>登录</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </form>

            {/* 注册链接 */}
            <div className="text-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400">
                还没有账号？{' '}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </motion.div>

          {/* 底部信息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center mt-8"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © 2024 梦锡工作室. 保留所有权利.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage