import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { RegisterRequest } from '../types'
import { cn } from '../utils/cn'
import LoadingSpinner from '../components/LoadingSpinner'

const registerSchema = z.object({
  username: z.string()
    .min(3, '用户名至少需要3个字符')
    .max(20, '用户名不能超过20个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  email: z.string()
    .email('请输入有效的邮箱地址'),
  password: z.string()
    .min(6, '密码至少需要6个字符')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '密码必须包含至少一个字母和一个数字'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不匹配',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

const RegisterPage = () => {
  const { register: registerUser, isAuthenticated } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  })

  const password = watch('password')

  // 如果已经登录，重定向到仪表板
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true)
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password
      } as RegisterRequest)
    } catch (error) {
      // 错误已在AuthContext中处理
    } finally {
      setIsSubmitting(false)
    }
  }

  // 密码强度检查
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: '', color: '' }
    
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z\d]/.test(password)) score++

    if (score < 3) return { score, text: '弱', color: 'text-red-500' }
    if (score < 5) return { score, text: '中', color: 'text-yellow-500' }
    return { score, text: '强', color: 'text-green-500' }
  }

  const passwordStrength = getPasswordStrength(password)

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
              {/* MX Logo */}
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
                创建您的账号
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                加入梦锡工作室，开启您的数字之旅
              </p>
            </motion.div>
          </div>

          {/* 注册卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 用户名输入 */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  用户名
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    {...register('username')}
                    type="text"
                    id="username"
                    autoComplete="username"
                    className={cn(
                      'w-full pl-12 pr-4 py-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400',
                      'focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20',
                      'transition-all duration-200',
                      errors.username && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    )}
                    placeholder="输入您的用户名"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-red-500 mt-2">{errors.username.message}</p>
                )}
              </div>

              {/* 邮箱输入 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  邮箱地址
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    autoComplete="email"
                    className={cn(
                      'w-full pl-12 pr-4 py-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400',
                      'focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20',
                      'transition-all duration-200',
                      errors.email && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    )}
                    placeholder="输入您的邮箱地址"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 mt-2">{errors.email.message}</p>
                )}
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
                    autoComplete="new-password"
                    className={cn(
                      'w-full pl-12 pr-12 py-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400',
                      'focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20',
                      'transition-all duration-200',
                      errors.password && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    )}
                    placeholder="创建您的密码"
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
                
                {/* 密码强度指示器 */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">密码强度</span>
                      <span className={cn("text-xs font-medium", passwordStrength.color)}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          passwordStrength.score < 3 ? "bg-red-500" :
                          passwordStrength.score < 5 ? "bg-yellow-500" : "bg-green-500"
                        )}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-sm text-red-500 mt-2">{errors.password.message}</p>
                )}
              </div>

              {/* 确认密码输入 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    autoComplete="new-password"
                    className={cn(
                      'w-full pl-12 pr-12 py-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400',
                      'focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20',
                      'transition-all duration-200',
                      errors.confirmPassword && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    )}
                    placeholder="再次输入您的密码"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-2">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* 注册按钮 */}
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
                    <span>创建账号</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* 登录链接 */}
            <div className="text-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400">
                已有账号？{' '}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  立即登录
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

export default RegisterPage 