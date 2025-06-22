import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { 
  Settings, 
  Bell, 
  Moon, 
  Sun, 
  Monitor, 
  Save, 
  Check,
  Mail,
  Smartphone,
  Lock
} from 'lucide-react'

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    securityAlerts: true,
    showEmail: false,
    showProfile: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsLoading(true)
    localStorage.setItem('userSettings', JSON.stringify(settings))
    setMessage({ type: 'success', text: '设置已保存！' })
    setHasChanges(false)
    setIsLoading(false)
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          系统设置
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          管理您的账户设置和应用偏好
        </p>
      </div>

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
          </div>
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                主题模式
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'light', icon: Sun, label: '浅色模式' },
                  { value: 'dark', icon: Moon, label: '深色模式' },
                  { value: 'system', icon: Monitor, label: '跟随系统' }
                ].map((option) => {
                  const Icon = option.icon
                  const isSelected = theme === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value as any)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 mr-2 ${
                          isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                        }`} />
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

        {/* 通知设置 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              通知设置
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', icon: Mail, label: '邮件通知', desc: '接收重要更新和消息的邮件通知' },
                { key: 'pushNotifications', icon: Smartphone, label: '推送通知', desc: '在浏览器中接收推送通知' },
                { key: 'securityAlerts', icon: Lock, label: '安全提醒', desc: '账户安全相关的重要通知' }
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSettingChange(item.key, !settings[item.key as keyof typeof settings])}
                      className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        settings[item.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        settings[item.key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {hasChanges && (
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              保存设置
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage 