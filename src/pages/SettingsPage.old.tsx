import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  Settings, 
  Bell, 
  Moon, 
  Sun, 
  Monitor, 
  Globe, 
  Shield, 
  Save, 
  Check,
  Mail,
  Smartphone,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'

interface SettingsData {
  theme: 'light' | 'dark' | 'system'
  language: 'zh-CN' | 'en-US'
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  securityAlerts: boolean
  twoFactorEnabled: boolean
  showEmail: boolean
  showProfile: boolean
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<SettingsData>({
    theme: 'system',
    language: 'zh-CN',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    twoFactorEnabled: false,
    showEmail: false,
    showProfile: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // 从用户数据和localStorage加载设置
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({
          ...settings,
          ...parsed,
          theme: theme
        })
      } catch (error) {
        console.error('解析设置失败:', error)
      }
    }
  }, [theme])

  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
    
    // 主题设置立即生效
    if (key === 'theme') {
      setTheme(value)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)
    
    try {
      // 保存到localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings))
      
      setMessage({ type: 'success', text: '设置已保存！' })
      setHasChanges(false)
      
      // 3秒后清除消息
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: '保存设置失败，请稍后重试' })
    } finally {
      setIsLoading(false)
    }
  }

  const themeOptions = [
    { value: 'light', icon: Sun, label: '浅色模式', description: '始终使用浅色主题' },
    { value: 'dark', icon: Moon, label: '深色模式', description: '始终使用深色主题' },
    { value: 'system', icon: Monitor, label: '跟随系统', description: '根据系统设置自动切换' }
  ]

  const languageOptions = [
    { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
    { value: 'en-US', label: 'English', flag: '🇺🇸' }
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          系统设置
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          管理您的账户设置和应用偏好
        </p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* 外观设置 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              外观设置
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              自定义应用的外观和感觉
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                  主题模式
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {themeOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = settings.theme === option.value
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSettingChange('theme', option.value)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <Icon className={`h-5 w-5 mr-2 ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                          }`} />
                          <span className={`font-medium ${
                            isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                          }`}>
                            {option.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {option.description}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                  语言设置
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {languageOptions.map((option) => {
                    const isSelected = settings.language === option.value
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSettingChange('language', option.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{option.flag}</span>
                          <span className={`font-medium ${
                            isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                          }`}>
                            {option.label}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 通知设置 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              通知设置
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              控制您接收通知的方式和类型
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      邮件通知
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      接收重要更新和消息的邮件通知
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      推送通知
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      在浏览器中接收推送通知
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      安全提醒
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      账户安全相关的重要通知
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange('securityAlerts', !settings.securityAlerts)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.securityAlerts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.securityAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        {hasChanges && (
          <div className="sticky bottom-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg flex items-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              {isLoading ? '保存中...' : '保存设置'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage 