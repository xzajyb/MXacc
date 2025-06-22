import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Shield, 
  Settings, 
  Bell, 
  Search,
  Home
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'

const DashboardPage = () => {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentTheme, setCurrentTheme] = useState(theme)
  const [activeSection, setActiveSection] = useState('overview')
  const navigate = useNavigate()

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(currentTheme as 'light' | 'dark' | 'auto');
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    setCurrentTheme(newTheme);
    setTheme(newTheme);
  }



  const getDisplayName = () => {
    // 优先显示：昵称 > 用户名 > 邮箱前缀
    return (user as any)?.nickname || user?.username || user?.email?.split('@')[0] || 'User';
  }

  const getInitial = () => {
    const displayName = getDisplayName()
    return displayName.charAt(0).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed lg:relative z-50 lg:z-auto"
          >
            <div className="w-72 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-lg lg:shadow-none">
              {/* Logo and User Section */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="mx-logo">
                    <img 
                      src="/logo.svg" 
                      alt="MX Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">梦锡账号</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">统一管理</p>
                  </div>
                </div>

                {/* User Profile */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {getInitial()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="p-4 space-y-2">
                <a
                  href="#"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'overview' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onClick={() => setActiveSection('overview')}
                >
                  <Home className="w-5 h-5" />
                  <span>总览</span>
                </a>
                <a
                  href="#"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'profile' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onClick={() => navigate('/profile')}
                >
                  <User className="w-5 h-5" />
                  <span>个人资料</span>
                </a>
                <a
                  href="#"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'security' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onClick={() => navigate('/security')}
                >
                  <Shield className="w-5 h-5" />
                  <span>安全</span>
                </a>
                <a
                  href="#"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'settings' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-5 h-5" />
                  <span>设置</span>
                </a>

                {/* 管理员专用菜单 */}
                {user?.role === 'admin' && (
                  <>
                    <div className="my-4 border-t border-slate-200 dark:border-slate-700"></div>
                    <div className="px-3 py-2">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        管理员功能
                      </span>
                    </div>
                    <a
                      href="#"
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      onClick={() => navigate('/admin')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <span>用户管理</span>
                      <span className="ml-auto">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                          Admin
                        </span>
                      </span>
                    </a>
                  </>
                )}
              </nav>

              {/* Bottom Section */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-2">
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span className="font-medium">
                      {currentTheme === 'light' ? '浅色模式' : currentTheme === 'dark' ? '深色模式' : '自动模式'}
                    </span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">退出登录</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Navigation */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">控制台</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">管理您的账号和设置</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索..."
                  className="input-professional pl-10 pr-4 py-2 w-64"
                />
              </div>
              
              {/* Notifications */}
              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Email Verification Required Modal */}
        {user && !user.isEmailVerified && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  邮箱验证required
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  为了确保账号安全，您需要先验证邮箱才能使用系统功能
                </p>
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 mb-6">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    邮箱地址：{user.email}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/verify-email')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
                >
                  立即验证邮箱
                </button>
                <button
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium py-3 px-4 rounded-xl transition-colors"
                >
                  注销登录
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  没有收到验证邮件？检查垃圾邮件文件夹或重新发送
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-800 p-8 rounded-2xl border border-blue-100 dark:border-blue-800/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    欢迎回来，{getDisplayName()}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <div className="mx-logo-large">
                    <img 
                      src="/logo.svg" 
                      alt="MX Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card p-6 cursor-pointer transition-all duration-200 hover:shadow-lg"
                onClick={() => navigate('/profile')}
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">编辑资料</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">更新个人信息和头像</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card p-6 cursor-pointer transition-all duration-200 hover:shadow-lg"
                onClick={() => navigate('/security')}
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">安全检查</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">检查账号安全状态</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card p-6 cursor-pointer transition-all duration-200 hover:shadow-lg"
                onClick={() => navigate('/settings')}
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">隐私设置</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">管理隐私和偏好设置</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card p-6 cursor-pointer transition-all duration-200 hover:shadow-lg"
              >
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">通知管理</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">设置通知偏好</p>
              </motion.div>

              {/* 管理员专用功能 */}
              {user?.role === 'admin' && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-card p-6 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-red-200 dark:border-red-800"
                  onClick={() => navigate('/admin')}
                >
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">用户管理</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">管理所有用户账号</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                      管理员专用
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Account Status Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Security Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">安全状态</h3>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">密码强度</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">强</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">两步验证</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">已启用</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">登录设备</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">2 台</span>
                  </div>
                </div>
              </motion.div>

              {/* Usage Statistics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">使用统计</h3>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">本月登录</span>
                    <span className="text-slate-900 dark:text-white font-medium">24 次</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">活跃服务</span>
                    <span className="text-slate-900 dark:text-white font-medium">5 个</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">存储使用</span>
                    <span className="text-slate-900 dark:text-white font-medium">2.1 GB</span>
                  </div>
                </div>
              </motion.div>

              {/* Service Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">服务状态</h3>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">认证服务</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">正常</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">邮件服务</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">正常</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">存储服务</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">正常</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">最近活动</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { action: '登录账号', time: '2 小时前', device: 'Windows 设备' },
                    { action: '更新资料', time: '1 天前', device: 'Web 浏览器' },
                    { action: '修改密码', time: '3 天前', device: 'Mobile 设备' },
                    { action: '启用两步验证', time: '1 周前', device: 'Web 浏览器' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-slate-900 dark:text-white">{activity.action}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">在 {activity.device}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage 