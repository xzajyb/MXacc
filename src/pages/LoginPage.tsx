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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative flex min-h-screen">
        {/* 左侧内容区域 */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            {/* Logo和欢迎信息 */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 200 }}
                className="relative inline-block mb-6"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl shadow-blue-500/25 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  <span className="text-3xl font-bold text-white relative z-10">MX</span>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-white/30 rounded-full"></div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-800 dark:from-white dark:via-blue-100 dark:to-slate-200 bg-clip-text text-transparent mb-3">
                  欢迎回来
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
                  登录您的
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold"> 梦锡账号</span>
                </p>
              </motion.div>
            </div>

            {/* 登录表单 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/5 dark:shadow-black/20"
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 邮箱/用户名输入 */}
                <div className="space-y-2">
                  <label htmlFor="emailOrUsername" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    邮箱或用户名
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-blue-500" />
                      <input
                        {...register('emailOrUsername')}
                        type="text"
                        id="emailOrUsername"
                        autoComplete="username"
                        className={cn(
                          'w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl',
                          'text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400',
                          'focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
                          'transition-all duration-300 backdrop-blur-sm',
                          errors.emailOrUsername && 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                        )}
                        placeholder="请输入您的邮箱或用户名"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  {errors.emailOrUsername && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-sm text-red-600 dark:text-red-400 font-medium"
                    >
                      {errors.emailOrUsername.message}
                    </motion.p>
                  )}
                </div>

                {/* 密码输入 */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    密码
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-purple-500" />
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        className={cn(
                          'w-full pl-12 pr-14 py-4 bg-white/50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl',
                          'text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400',
                          'focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10',
                          'transition-all duration-300 backdrop-blur-sm',
                          errors.password && 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                        )}
                        placeholder="请输入您的密码"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-sm text-red-600 dark:text-red-400 font-medium"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>

                {/* 选项 */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        {...register('rememberMe')}
                        type="checkbox"
                        className="sr-only"
                        disabled={isSubmitting}
                      />
                      <div className="w-5 h-5 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-md group-hover:border-blue-400 transition-colors">
                        <svg className="w-3 h-3 text-blue-600 m-0.5 hidden group-hover:block" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">记住我</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    忘记密码？
                  </Link>
                </div>

                {/* 登录按钮 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'relative w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700',
                    'hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800',
                    'text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-500/25',
                    'focus:outline-none focus:ring-4 focus:ring-blue-500/20',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                    'transition-all duration-300 overflow-hidden group'
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="relative flex items-center justify-center space-x-2">
                    {isSubmitting ? (
                      <LoadingSpinner size="sm" className="text-white" />
                    ) : (
                      <>
                        <span className="text-lg">登录</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </motion.button>
              </form>

              {/* 注册链接 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-center mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50"
              >
                <p className="text-slate-600 dark:text-slate-300">
                  还没有账号？{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    立即注册
                  </Link>
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* 右侧装饰区域 */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex lg:flex-1 items-center justify-center p-8"
        >
          <div className="max-w-lg text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-purple-800 dark:from-slate-200 dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                  梦锡工作室
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  统一账号管理系统
                  <br />
                  <span className="text-lg text-slate-500 dark:text-slate-400">安全 · 简洁 · 高效</span>
                </p>
              </div>

              {/* 特性展示 */}
              <div className="grid gap-6">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200/50 dark:border-blue-800/50"
                >
                  <Shield className="h-8 w-8 text-blue-600 mb-3 mx-auto" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">安全可靠</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">多重安全防护，保障账号安全</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-purple-200/50 dark:border-purple-800/50"
                >
                  <Sparkles className="h-8 w-8 text-purple-600 mb-3 mx-auto" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">现代设计</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">简洁美观的用户界面体验</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  className="bg-gradient-to-br from-indigo-50 to-cyan-100 dark:from-indigo-900/20 dark:to-cyan-900/20 p-6 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50"
                >
                  <Zap className="h-8 w-8 text-indigo-600 mb-3 mx-auto" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">高效便捷</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">一键登录，畅享所有服务</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage 