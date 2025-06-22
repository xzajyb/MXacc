import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Shield, 
  Settings, 
  Bell, 
  Search,
  Home,
  Menu,
  X,
  Mail,
  Users,
  Database
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate, useLocation } from 'react-router-dom'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentTheme, setCurrentTheme] = useState(theme)
  const navigate = useNavigate()
  const location = useLocation()

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto']
    const currentIndex = themes.indexOf(currentTheme as 'light' | 'dark' | 'auto')
    const nextIndex = (currentIndex + 1) % themes.length
    const newTheme = themes[nextIndex]
    setCurrentTheme(newTheme)
    setTheme(newTheme)
  }

  const getDisplayName = () => {
    return (user as any)?.nickname || user?.username || user?.email?.split('@')[0] || 'User'
  }

  const getInitial = () => {
    const displayName = getDisplayName()
    return displayName.charAt(0).toUpperCase()
  }

  const navigationItems = [
    {
      id: 'dashboard',
      label: '总览',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'profile',
      label: '个人资料', 
      icon: User,
      path: '/profile'
    },
    {
      id: 'security',
      label: '安全',
      icon: Shield,
      path: '/security'
    },
    {
      id: 'settings',
      label: '设置',
      icon: Settings,
      path: '/settings'
    }
  ]

  const adminNavigationItems = user?.role === 'admin' ? [
    {
      id: 'admin-users',
      label: '用户管理',
      icon: Users,
      path: '/admin/users'
    },
    {
      id: 'admin-email',
      label: '邮件管理',
      icon: Mail,
      path: '/admin/email'
    },
    {
      id: 'admin-system',
      label: '系统管理',
      icon: Database,
      path: '/admin/system'
    }
  ] : []

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    // 在移动端导航后关闭侧边栏
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* 移动端汉堡菜单按钮 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg"
      >
        {sidebarOpen ? (
          <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        ) : (
          <Menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        )}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed lg:relative z-40 lg:z-auto"
          >
            <div className="w-72 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-lg lg:shadow-none">
              {/* Logo and User Section */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="mx-logo">
                    <img 
                      src="/logo.svg" 
                      alt="MX Logo" 
                      className="w-10 h-10 object-contain"
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
                    {user?.role === 'admin' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 mt-1">
                        管理员
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                {/* 主要导航 */}
                <div className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.path)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                          isActive(item.path)
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* 管理员导航 */}
                {adminNavigationItems.length > 0 && (
                  <>
                    <div className="my-4 border-t border-slate-200 dark:border-slate-700"></div>
                    <div className="px-3 py-2">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        管理员功能
                      </span>
                    </div>
                    <div className="space-y-1">
                      {adminNavigationItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                              isActive(item.path)
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </nav>

              {/* Bottom Section */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
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

      {/* 移动端蒙层 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* 移动端留出菜单按钮空间 */}
              <div className="w-8 lg:hidden"></div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                {(() => {
                  const path = location.pathname
                  if (path === '/' || path === '/dashboard') return '控制台总览'
                  if (path === '/profile') return '个人资料'
                  if (path === '/security') return '安全设置'
                  if (path === '/settings') return '系统设置'
                  if (path.startsWith('/admin/users')) return '用户管理'
                  if (path.startsWith('/admin/email')) return '邮件管理'
                  if (path.startsWith('/admin/system')) return '系统管理'
                  return '梦锡账号控制台'
                })()}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                {getInitial()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout 