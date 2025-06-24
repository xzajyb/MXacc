import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { 
  Shield, 
  Lock, 
  Key, 
  Clock, 
  MapPin, 
  Monitor, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'

interface LoginRecord {
  ip: string
  userAgent: string
  location: string
  timestamp: string
}

interface SecuritySettings {
  loginNotification: boolean
  emailVerified: boolean
}

interface SecurityPageProps {
  embedded?: boolean
}

const SecurityPage: React.FC<SecurityPageProps> = ({ embedded = false }) => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [activeTab, setActiveTab] = useState('password')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([])
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    loginNotification: true,
    emailVerified: false
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 获取登录历史数据
  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch('/api/user/user-profile?type=login-history', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('登录历史API返回数据:', data) // 调试日志
          setLoginHistory(data.loginHistory || [])
        } else {
          console.error('获取登录历史失败:', response.status)
          setLoginHistory([])
        }
      } catch (error) {
        console.error('获取登录历史失败:', error)
        setLoginHistory([])
      }
    }

    fetchLoginHistory()
  }, [])

  // 获取安全设置
  useEffect(() => {
    const fetchSecuritySettings = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch('/api/user/security-settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSecuritySettings(data.securitySettings)
        }
      } catch (error) {
        console.error('获取安全设置失败:', error)
      }
    }

    fetchSecuritySettings()
  }, [])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('新密码与确认密码不一致')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage('新密码至少需要8个字符')
      return
    }

    setLoading(true)
    setMessage('')
    
    try {
      // TODO: 实现密码修改API调用
      setMessage('密码修改功能正在开发中')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      setMessage('密码修改失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleLoginNotificationToggle = async (enabled: boolean) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/user/security-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ loginNotification: enabled })
      })

      if (response.ok) {
        setSecuritySettings(prev => ({ ...prev, loginNotification: enabled }))
        showSuccess(enabled ? '登录通知已开启' : '登录通知已关闭')
      } else {
        showError('设置更新失败')
      }
    } catch (error) {
      console.error('更新登录通知设置失败:', error)
      showError('设置更新失败，请重试')
    }
  }

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.toLowerCase().includes('mobile') || userAgent.toLowerCase().includes('android') || userAgent.toLowerCase().includes('iphone')) {
      return <Smartphone size={20} className="text-blue-600" />
    }
    return <Monitor size={20} className="text-green-600" />
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const loginTime = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - loginTime.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return '刚刚'
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}天前`
    }
  }

  const tabs = [
    { id: 'password', label: '密码管理', icon: Lock },
    { id: 'history', label: '登录历史', icon: Clock },
    { id: 'settings', label: '安全设置', icon: Shield }
  ]

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gray-50 dark:bg-gray-900"}>
      <div className={embedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* 页面标题 */}
        {!embedded && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              安全中心
          </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">管理您的账户安全和隐私设置</p>
          </div>
        )}

        {/* 消息提示 */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('成功') || message.includes('开发中') ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
            {message}
          </div>
        )}

        {/* 选项卡导航 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* 密码管理 */}
            {activeTab === 'password' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">修改密码</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    定期更换密码有助于保护您的账户安全
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      当前密码
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={18} className="text-gray-400" />
                        ) : (
                          <Eye size={18} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      新密码
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={8}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeOff size={18} className="text-gray-400" />
                        ) : (
                          <Eye size={18} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      密码至少需要8个字符
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      确认新密码
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} className="text-gray-400" />
                        ) : (
                          <Eye size={18} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Save size={16} />
                    <span>{loading ? '更新中...' : '更新密码'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* 登录历史 */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">登录历史</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    查看您账户的最近登录记录
                  </p>
                </div>

                <div className="space-y-4">
                  {loginHistory.length > 0 ? (
                    loginHistory.map((record, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          {getDeviceIcon(record.userAgent)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {record.userAgent}
                              </span>
                              {index === 0 && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs rounded-full">
                                  当前会话
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center space-x-1">
                                <MapPin size={14} />
                                <span>{record.location}</span>
                              </span>
                              <span>IP: {record.ip}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(record.timestamp)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        暂无登录历史
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        当您登录账户时，系统会记录您的登录信息
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 安全设置 */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">安全设置</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    管理您的账户安全选项
          </p>
        </div>

                <div className="space-y-4">
                  {/* 邮箱验证状态 */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user?.isEmailVerified 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {user?.isEmailVerified ? (
                          <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">邮箱验证</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user?.isEmailVerified ? '您的邮箱已验证' : '请验证您的邮箱地址'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user?.isEmailVerified
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {user?.isEmailVerified ? '已验证' : '未验证'}
                    </span>
                  </div>

                  {/* 登录通知 */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                        <AlertTriangle size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">登录通知</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          当有新设备登录时通过邮件通知您
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={securitySettings.loginNotification}
                        onChange={(e) => handleLoginNotificationToggle(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecurityPage 