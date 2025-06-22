import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
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

  const renderContent = () => {
    switch (activeView) {
      case 'profile':
        return <ProfilePage />
      case 'settings':
        return <SettingsPage />
      case 'security':
        return <SecurityPage />
      case 'admin':
        return user?.role === 'admin' ? <AdminPage /> : <div>权限不足</div>
      case 'verify-email':
        return <VerifyEmailPage />
      case 'home':
      default:
        return (
          <div className="max-w-7xl mx-auto">
            {/* 欢迎区域 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    欢迎回来，{user?.username}！
                  </h1>
                  <p className="text-gray-600 dark:text-slate-400 mt-1">
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
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                      邮箱未验证
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      为了账户安全，请验证您的邮箱地址
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('verify-email')}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700"
                  >
                    立即验证
                  </button>
                </div>
              </div>
            )}

            {/* 快速操作卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {navigationItems.slice(1).map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveView(item.id as ActiveView)}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 账户状态 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                账户状态
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  {user?.isEmailVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-slate-300">
                    邮箱状态: {user?.isEmailVerified ? '已验证' : '待验证'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-slate-300">
                    账户类型: {user?.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </div>
                <div className="flex items-center">
                  <User className="h-5 w-5 text-purple-500 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-slate-300">
                    注册时间: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '未知'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 左侧导航栏 */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* 头部 */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">MX</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">MXacc</h1>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 用户信息 */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {user?.role === 'admin' ? '系统管理员' : '普通用户'}
              </p>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveView(item.id as ActiveView)
                      setSidebarOpen(false)
                    }}
                    className={`
                      w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors
                      ${activeView === item.id 
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${activeView === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`} />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{item.description}</div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 底部操作 */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          {/* 主题切换 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-700 dark:text-slate-300">主题</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-md ${theme === 'light' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-md ${theme === 'dark' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Moon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme('auto')}
                className={`p-2 rounded-md ${theme === 'auto' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 退出登录 */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-left rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            退出登录
          </button>
        </div>
      </div>

      {/* 右侧主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 mr-3"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {navigationItems.find(item => item.id === activeView)?.label || '首页'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {navigationItems.find(item => item.id === activeView)?.description || '系统概览'}
              </p>
            </div>
          </div>

          {/* 通知按钮 */}
          <div className="flex items-center space-x-4">
            {!user?.isEmailVerified && (
              <button
                onClick={() => setActiveView('verify-email')}
                className="relative p-2 text-yellow-600 hover:text-yellow-700"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
            )}
          </div>
        </div>

        {/* 主内容 */}
        <div className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage 