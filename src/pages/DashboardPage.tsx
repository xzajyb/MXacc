import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Shield, 
  Settings, 
  Bell, 
  Activity, 
  Globe, 
  CreditCard, 
  Users,
  ChevronRight,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Edit3,
  Key,
  Smartphone,
  Mail,
  Calendar,
  BarChart3,
  FileText,
  HelpCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { cn } from '../utils/cn'

const DashboardPage = () => {
  const { user, logout } = useAuth()
  const { theme, setTheme, isDark } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('auto')
    } else {
      setTheme('light')
    }
  }

  const menuItems = [
    { id: 'overview', label: '概览', icon: BarChart3 },
    { id: 'profile', label: '个人资料', icon: User },
    { id: 'security', label: '安全中心', icon: Shield },
    { id: 'privacy', label: '隐私设置', icon: Settings },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'activity', label: '活动记录', icon: Activity },
    { id: 'billing', label: '账单管理', icon: CreditCard },
    { id: 'help', label: '帮助支持', icon: HelpCircle },
  ]

  const quickActions = [
    { 
      title: '编辑个人资料', 
      description: '更新您的个人信息和头像',
      icon: Edit3,
      color: 'from-blue-500 to-blue-600',
      action: () => setActiveSection('profile')
    },
    { 
      title: '安全检查', 
      description: '检查账号安全状态',
      icon: Shield,
      color: 'from-green-500 to-green-600',
      action: () => setActiveSection('security')
    },
    { 
      title: '隐私设置', 
      description: '管理数据隐私和可见性',
      icon: Settings,
      color: 'from-purple-500 to-purple-600',
      action: () => setActiveSection('privacy')
    },
    { 
      title: '通知管理', 
      description: '自定义通知偏好设置',
      icon: Bell,
      color: 'from-orange-500 to-orange-600',
      action: () => setActiveSection('notifications')
    }
  ]

  const recentActivity = [
    { type: 'login', message: '在 Windows 设备上登录', time: '2 小时前', location: '中国上海' },
    { type: 'security', message: '安全检查完成', time: '1 天前', location: '系统自动' },
    { type: 'profile', message: '更新个人资料', time: '3 天前', location: '中国上海' },
    { type: 'privacy', message: '隐私设置已更新', time: '1 周前', location: '中国上海' }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <Globe className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'profile': return <User className="h-4 w-4" />
      case 'privacy': return <Settings className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getDisplayName = () => {
    return user?.profile?.nickname || user?.username || '用户'
  }

  const getInitial = () => {
    const displayName = getDisplayName()
    return displayName.charAt(0).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* 侧边栏 */}
      <motion.div
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : -320,
          opacity: sidebarOpen ? 1 : 0
        }}
        className="fixed inset-y-0 left-0 z-50 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 lg:relative lg:x-0 lg:opacity-100"
      >
        <div className="flex h-full flex-col">
          {/* 侧边栏头部 */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center">
                <span className="text-lg font-bold text-white">MX</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">梦锡账号</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">管理中心</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 用户信息 */}
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-white">
                  {getInitial()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  'w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {activeSection === item.id && (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </button>
            ))}
          </nav>

          {/* 底部操作 */}
          <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50 space-y-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="font-medium">
                {theme === 'light' ? '深色模式' : theme === 'dark' ? '自动模式' : '浅色模式'}
              </span>
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">退出登录</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 主内容区域 */}
      <div className="lg:ml-80">
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {menuItems.find(item => item.id === activeSection)?.label || '概览'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索..."
                  className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* 主要内容 */}
        <main className="p-6 space-y-8">
          {activeSection === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* 欢迎信息 */}
              <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-2">
                    欢迎回来，{getDisplayName()}！
                  </h2>
                  <p className="text-blue-100 text-lg">
                    您的账号状态良好，所有服务正常运行
                  </p>
                </div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
              </div>

              {/* 快速操作 */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">快速操作</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={action.action}
                      className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    >
                      <div className={cn(
                        'w-12 h-12 bg-gradient-to-br rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform',
                        action.color
                      )}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{action.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{action.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 账号状态 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">账号安全</h4>
                    <Shield className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">邮箱验证</span>
                      <span className="text-sm font-medium text-green-600">已验证</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">双重验证</span>
                      <span className="text-sm font-medium text-orange-600">未启用</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">密码强度</span>
                      <span className="text-sm font-medium text-green-600">强</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">使用统计</h4>
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">今日登录</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">3 次</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">本月活动</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">28 次</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">设备数量</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">2 台</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">服务状态</h4>
                    <Activity className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">所有服务</span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-green-600">正常</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">连接状态</span>
                      <span className="text-sm font-medium text-green-600">稳定</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">延迟</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">12ms</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 最近活动 */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">最近活动</h3>
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
                  <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {activity.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {activity.time} • {activity.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 其他页面内容占位符 */}
          {activeSection !== 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-slate-700/50 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {React.createElement(menuItems.find(item => item.id === activeSection)?.icon || Settings, {
                  className: "h-8 w-8 text-white"
                })}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {menuItems.find(item => item.id === activeSection)?.label}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                此功能正在开发中，敬请期待...
              </p>
              <button
                onClick={() => setActiveSection('overview')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium"
              >
                返回概览
              </button>
            </motion.div>
          )}
        </main>
      </div>

      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default DashboardPage 