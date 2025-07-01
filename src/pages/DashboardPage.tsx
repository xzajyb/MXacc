import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { useLanguage } from '../contexts/LanguageContext'
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
  Monitor,
  MessageCircle,
  Globe,
  Book
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PartnerLogos from '../components/PartnerLogos'

// 导入各功能组件
import ProfilePage from './ProfilePage'
import SettingsPage from './SettingsPage'
import SecurityPage from './SecurityPage'
import AdminPage from './AdminPage'
import VerifyEmailPage from './VerifyEmailPage'
import SocialPage from './SocialPage'
import WikiPage from './WikiPage'
import SystemNotifications from '../components/SystemNotifications'

type ActiveView = 'home' | 'profile' | 'settings' | 'security' | 'admin' | 'verify-email' | 'social' | 'wiki'

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth()
  const { theme, setTheme, isDark } = useTheme()
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  const { t, formatDate, language } = useLanguage()
  const [activeView, setActiveView] = useState<ActiveView>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [socialUnreadCount, setSocialUnreadCount] = useState(0)  // 新增：社交未读消息数量
  const navigate = useNavigate()

  // 根据用户状态自动显示邮箱验证
  useEffect(() => {
    if (user && !user.isEmailVerified) {
      setActiveView('verify-email')
    }
  }, [user])

  const navigationItems = [
    {
      id: 'home',
      label: t.navigation.dashboard,
      icon: Home,
      description: t.dashboard.stats
    },
    {
      id: 'social',
      label: '社交中心',
      icon: MessageCircle,
      description: '与朋友分享动态，发现有趣内容'
    },
    {
      id: 'wiki',
      label: 'Wiki知识库',
      icon: Book,
      description: '浏览文档和知识库，管理员可编辑'
    },
    {
      id: 'profile',
      label: t.navigation.profile,
      icon: User,
      description: t.profile.description
    },
    {
      id: 'settings',
      label: t.navigation.settings,
      icon: Settings,
      description: t.settings.description
    },
    {
      id: 'security',
      label: t.navigation.security,
      icon: Shield,
      description: t.security.description
    },
    ...(user?.role === 'admin' ? [{
      id: 'admin',
      label: t.navigation.admin,
      icon: Users,
      description: t.admin.systemStats
    }] : []),
    ...(!user?.isEmailVerified ? [{
      id: 'verify-email',
      label: t.auth.verifyEmail,
      icon: Mail,
      description: t.auth.emailVerified
    }] : [])
  ]

  const handleLogout = () => {
    logout()
  }

  const handleNavClick = (viewId: ActiveView) => {
    // 如果邮箱未验证，除了验证邮箱、个人资料、社交功能和Wiki，其他功能都禁用
    if (!user?.isEmailVerified && viewId !== 'verify-email' && viewId !== 'profile' && viewId !== 'home' && viewId !== 'social' && viewId !== 'wiki') {
      showWarning('请先验证邮箱后再使用此功能')
      return
    }
    setActiveView(viewId)
    setSidebarOpen(false) // 移动端点击后关闭侧边栏
  }

  const getPageTitle = () => {
    const item = navigationItems.find(item => item.id === activeView)
    return item?.label || t.navigation.dashboard
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

  const testMultipleToasts = () => {
    showSuccess('操作成功！这是第一条消息')
    setTimeout(() => showError('出现错误！这是第二条消息'), 500)
    setTimeout(() => showWarning('警告信息！这是第三条消息'), 1000)
    setTimeout(() => showInfo('提示信息！这是第四条消息'), 1500)
  }

  // 主题切换并自动保存到服务器
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    // 立即应用主题
    setTheme(newTheme)
    
    // 保存到服务器
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const response = await fetch('/api/user/user-settings', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            settings: { 
              theme: newTheme,
              notifications: { email: true, browser: true, marketing: false },
              privacy: { profileVisible: true, activityVisible: false, allowDataCollection: true },
              language: language,
              timezone: 'Asia/Shanghai'
            }
          })
        })
        
        if (response.ok) {
          showSuccess(t.settings.title + '已保存')
        }
      }
    } catch (error) {
      console.error('保存主题设置失败:', error)
    }
  }

  const renderContent = () => {
    const content = (() => {
      switch (activeView) {
        case 'social':
          return <SocialPage embedded={true} onUnreadCountChange={setSocialUnreadCount} />
        case 'wiki':
          return <WikiPage embedded={true} />
        case 'profile':
          return <ProfilePage embedded={true} />
        case 'settings':
          return !user?.isEmailVerified ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">需要验证邮箱</h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">请先验证您的邮箱地址后再使用系统设置功能</p>
              <button
                onClick={() => setActiveView('verify-email')}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
              >
                立即验证
              </button>
            </div>
          ) : (
            <SettingsPage embedded={true} />
          )
        case 'security':
          return !user?.isEmailVerified ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">需要验证邮箱</h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">请先验证您的邮箱地址后再使用安全中心功能</p>
              <button
                onClick={() => setActiveView('verify-email')}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
              >
                立即验证
              </button>
            </div>
          ) : (
            <SecurityPage embedded={true} />
          )
        case 'admin':
          return user?.role === 'admin' ? (
            !user?.isEmailVerified ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">需要验证邮箱</h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">请先验证您的邮箱地址后再使用管理控制台功能</p>
                <button
                  onClick={() => setActiveView('verify-email')}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                >
                  立即验证
                </button>
              </div>
            ) : (
              <AdminPage embedded={true} />
            )
          ) : (
            <div>权限不足</div>
          )
        case 'verify-email':
          return <VerifyEmailPage embedded={true} />
        case 'home':
        default:
          return (
            <>
              {/* 欢迎区域 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm border border-blue-200/50 dark:border-blue-800/50 p-6 mb-6">
                <div className="flex items-center justify-between">
              <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {t.dashboard.welcome}，{user?.username}！
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {formatDate(new Date(), 'date')}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    {user?.profile?.avatar ? (
                      <img 
                        src={user.profile.avatar} 
                        alt={t.profile.avatar} 
                        className="w-full h-full object-cover"
                        style={{ backgroundColor: 'transparent' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {user?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
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
                        请验证您的邮箱地址以确保账户安全。未验证邮箱将限制部分功能使用。
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
                  const isDisabled = !user?.isEmailVerified && item.id !== 'verify-email' && item.id !== 'profile' && item.id !== 'social' && item.id !== 'wiki'
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative ${
                        isDisabled 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'cursor-pointer hover:shadow-md'
                      } transition-all`}
                      onClick={() => handleNavClick(item.id as ActiveView)}
                    >
                      {/* 社交中心未读消息红点 */}
                      {item.id === 'social' && socialUnreadCount > 0 && !isDisabled && (
                        <span className="absolute top-3 right-3 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          {socialUnreadCount > 99 ? '99+' : socialUnreadCount}
                        </span>
                      )}
                      
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isDisabled 
                            ? 'bg-gray-100 dark:bg-gray-700' 
                            : item.id === 'social'
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : item.id === 'wiki'
                            ? 'bg-purple-50 dark:bg-purple-900/20'
                            : 'bg-blue-50 dark:bg-blue-900/20'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            isDisabled 
                              ? 'text-gray-400' 
                              : item.id === 'social'
                              ? 'text-green-600 dark:text-green-400'
                              : item.id === 'wiki'
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${
                            isDisabled 
                              ? 'text-gray-500 dark:text-gray-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>{item.label}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isDisabled ? '需要验证邮箱' : item.description}
                          </p>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.profile.lastLogin}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {user?.lastLogin ? formatDate(user.lastLogin, 'date') : '今天'}
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
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
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
          {/* Logo区域 - 固定高度 */}
          <div className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center">
              <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
              <PartnerLogos />
            </div>
            <div className="ml-3">
              <h1 className="font-bold text-xl text-gray-900 dark:text-white">梦锡账号</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">统一管理</p>
            </div>
          </div>

          {/* 导航菜单 - 可滚动区域 */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-h-0">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as ActiveView)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors relative ${
                    activeView === item.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                  {/* 社交中心未读消息红点 */}
                  {item.id === 'social' && socialUnreadCount > 0 && (
                    <span className="absolute top-1 right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {socialUnreadCount > 99 ? '99+' : socialUnreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* 主题切换和用户菜单 - 固定在底部 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4 flex-shrink-0">
            {/* 主题切换 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t.settings.theme}</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-2 rounded-md transition-colors ${theme === 'light' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <Sun size={16} />
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-2 rounded-md transition-colors ${theme === 'dark' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <Moon size={16} />
                </button>
                <button
                  onClick={() => handleThemeChange('auto')}
                  className={`p-2 rounded-md transition-colors ${theme === 'auto' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <Monitor size={16} />
                </button>
              </div>
            </div>

            {/* 用户信息 */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                {user?.profile?.avatar ? (
                  <img 
                    src={user.profile.avatar} 
                    alt={t.profile.avatar} 
                    className="w-full h-full object-cover"
                    style={{ backgroundColor: 'transparent' }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
          </div>
                )}
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
                title={t.auth.logout}
              >
                <LogOut size={16} />
              </button>
            </div>
            
            {/* 官网入口链接 */}
            <a 
              href="https://mxos.top" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center space-x-2 p-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors border-t border-gray-200 dark:border-gray-700 pt-3"
            >
              <Globe size={16} />
              <span>访问官网</span>
              <span className="font-semibold">mxos.top</span>
            </a>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* 顶部栏 - 固定高度 */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Menu size={20} />
              </button>
            </div>
            <h1 className="font-semibold text-gray-900 dark:text-white lg:block hidden">{getPageTitle()}</h1>
            <h1 className="font-semibold text-gray-900 dark:text-white lg:hidden block">{getPageTitle()}</h1>
            <div className="flex items-center space-x-2">
              <SystemNotifications />
            </div>
          </div>
        </div>

        {/* 内容区域 - 可滚动 */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 min-h-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
          </div>
        </main>
        </div>
    </div>
  )
}

export default DashboardPage 