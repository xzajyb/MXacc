import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  User, 
  Settings, 
  Shield, 
  Mail, 
  Users, 
  Menu, 
  X, 
  Bell,
  LogOut,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'

// 导入各功能组件
import ProfilePage from './ProfilePage'
import SettingsPage from './SettingsPage'
import SecurityPage from './SecurityPage'
import AdminPage from './AdminPage'
import VerifyEmailPage from './VerifyEmailPage'

type ActiveView = 'home' | 'profile' | 'settings' | 'security' | 'admin' | 'verify-email'

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth()
  const { theme, setTheme, isDark } = useTheme()
  const [activeView, setActiveView] = useState<ActiveView>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 根据用户状态自动显示邮箱验证
  useEffect(() => {
    if (user && !user.isEmailVerified) {
      setActiveView('verify-email')
    }
  }, [user])

  const navigationItems = [
    {
      id: 'home',
      label: '首页',
      icon: Home,
      description: '系统概览'
    },
    {
      id: 'profile',
      label: '个人资料',
      icon: User,
      description: '管理个人信息'
    },
    {
      id: 'settings',
      label: '系统设置',
      icon: Settings,
      description: '个性化配置'
    },
    {
      id: 'security',
      label: '安全中心',
      icon: Shield,
      description: '账户安全管理'
    },
    ...(user?.role === 'admin' ? [{
      id: 'admin',
      label: '管理控制台',
      icon: Users,
      description: '系统管理'
    }] : []),
    ...(!user?.isEmailVerified ? [{
      id: 'verify-email',
      label: '邮箱验证',
      icon: Mail,
      description: '验证邮箱地址'
    }] : [])
  ]

  const handleLogout = () => {
    logout()
  }

  const handleNavClick = (viewId: ActiveView) => {
    setActiveView(viewId)
    setSidebarOpen(false) // 移动端点击后关闭侧边栏
  }

  const getPageTitle = () => {
    const item = navigationItems.find(item => item.id === activeView)
    return item?.label || '首页'
  }

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3
  }

  const renderContent = () => {
    const content = (() => {
      switch (activeView) {
        case 'profile':
          return <ProfilePage embedded={true} />
        case 'settings':
          return <SettingsPage embedded={true} />
        case 'security':
          return <SecurityPage embedded={true} />
        case 'admin':
          return user?.role === 'admin' ? <AdminPage embedded={true} /> : <div>权限不足</div>
        case 'verify-email':
          return <VerifyEmailPage />
        case 'home':
        default:
          return (
            <>
              {/* 欢迎区域 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm border border-blue-200/50 dark:border-blue-800/50 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      欢迎回来，{user?.username}！
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      今天是 {new Date().toLocaleDateString('zh-CN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 邮箱验证提醒 */}
              {!user?.isEmailVerified && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        邮箱未验证
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        请验证您的邮箱地址以确保账户安全
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveView('verify-email')}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      立即验证
                    </button>
                  </div>
                </div>
              )}

              {/* 功能卡片网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {navigationItems.filter(item => item.id !== 'home').map((item) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => handleNavClick(item.id as ActiveView)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{item.label}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* 快速统计 */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">账户状态</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">正常</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">安全等级</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {user?.isEmailVerified ? '高' : '中'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">最后登录</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '今天'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )
      }
    })()

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="w-full"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* 侧边栏遮罩层 (移动端) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo区域 */}
          <div className="flex items-center space-x-3 p-6 border-b border-gray-200 dark:border-gray-700">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
            <div>
              <h1 className="font-bold text-xl text-gray-900 dark:text-white">梦锡账号</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">统一管理</p>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as ActiveView)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeView === item.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* 主题切换和用户菜单 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {/* 主题切换 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">主题</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-2 rounded-md ${theme === 'light' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Sun size={16} />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-2 rounded-md ${theme === 'dark' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <Moon size={16} />
                </button>
                <button
                  onClick={() => setTheme('auto')}
                  className={`p-2 rounded-md ${theme === 'auto' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <Monitor size={16} />
                </button>
              </div>
            </div>

            {/* 用户信息 */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="退出登录"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 (移动端) */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-semibold text-gray-900 dark:text-white">{getPageTitle()}</h1>
            <div className="w-8" /> {/* 占位符，保持标题居中 */}
          </div>
        </div>

        {/* 内容区域 */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage 