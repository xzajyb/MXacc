import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  securityAlerts: boolean
  marketingEmails: boolean
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends'
  showEmail: boolean
  showLastActive: boolean
  allowDirectMessages: boolean
}

const SettingsPage: React.FC = () => {
  const { user, token } = useAuth()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    securityAlerts: true,
    marketingEmails: false
  })
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showEmail: false,
    showLastActive: true,
    allowDirectMessages: true
  })

  const [language, setLanguage] = useState('zh-CN')
  const [timezone, setTimezone] = useState('Asia/Shanghai')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotificationSettings(data.notifications || notificationSettings)
        setPrivacySettings(data.privacy || privacySettings)
        setLanguage(data.language || 'zh-CN')
        setTimezone(data.timezone || 'Asia/Shanghai')
      }
    } catch (err) {
      setError('获取设置失败')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notifications: notificationSettings,
          privacy: privacySettings,
          language,
          timezone
        })
      })

      if (response.ok) {
        setSuccess('设置保存成功')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.message || '保存失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch('/api/user/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mxacc-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        setSuccess('数据导出成功')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('数据导出失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm('确定要删除账户吗？此操作不可撤销！')) {
      return
    }

    if (!window.confirm('最后确认：删除账户将永久删除所有数据，您确定要继续吗？')) {
      return
    }

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setSuccess('账户删除成功，正在跳转...')
        setTimeout(() => {
          localStorage.removeItem('token')
          window.location.href = '/'
        }, 2000)
      } else {
        setError('账户删除失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    }
  }

  const themes = [
    { value: 'light', label: '浅色模式', icon: '☀️' },
    { value: 'dark', label: '深色模式', icon: '🌙' },
    { value: 'system', label: '跟随系统', icon: '💻' }
  ]

  const languages = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'zh-TW', label: '繁體中文' },
    { value: 'en-US', label: 'English' },
    { value: 'ja-JP', label: '日本語' }
  ]

  const timezones = [
    { value: 'Asia/Shanghai', label: '中国标准时间 (UTC+8)' },
    { value: 'Asia/Tokyo', label: '日本标准时间 (UTC+9)' },
    { value: 'Asia/Seoul', label: '韩国标准时间 (UTC+9)' },
    { value: 'America/New_York', label: '东部时间 (UTC-5)' },
    { value: 'America/Los_Angeles', label: '太平洋时间 (UTC-8)' },
    { value: 'Europe/London', label: '格林威治时间 (UTC+0)' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            系统设置
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            管理您的账户设置和应用偏好
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* 外观设置 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">外观设置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                主题模式
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => setTheme(themeOption.value as any)}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      theme === themeOption.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{themeOption.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {themeOption.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 语言和地区设置 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">语言和地区</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                界面语言
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                时区设置
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 通知设置 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">通知设置</h2>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: '邮件通知', desc: '接收重要更新和提醒' },
              { key: 'pushNotifications', label: '推送通知', desc: '浏览器推送消息' },
              { key: 'securityAlerts', label: '安全提醒', desc: '账户安全相关通知' },
              { key: 'marketingEmails', label: '营销邮件', desc: '产品更新和推广信息' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{item.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotificationSettings(prev => ({
                    ...prev,
                    [item.key]: !prev[item.key as keyof NotificationSettings]
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings[item.key as keyof NotificationSettings] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings[item.key as keyof NotificationSettings] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 隐私设置 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">隐私设置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                个人资料可见性
              </label>
              <select
                value={privacySettings.profileVisibility}
                onChange={(e) => setPrivacySettings(prev => ({
                  ...prev,
                  profileVisibility: e.target.value as any
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="public">公开</option>
                <option value="friends">仅好友</option>
                <option value="private">私密</option>
              </select>
            </div>

            {[
              { key: 'showEmail', label: '显示邮箱地址', desc: '在个人资料中显示邮箱' },
              { key: 'showLastActive', label: '显示最后活跃时间', desc: '让其他用户看到您的在线状态' },
              { key: 'allowDirectMessages', label: '允许私信', desc: '其他用户可以给您发送私信' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{item.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
                <button
                  onClick={() => setPrivacySettings(prev => ({
                    ...prev,
                    [item.key]: !prev[item.key as keyof PrivacySettings]
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacySettings[item.key as keyof PrivacySettings] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacySettings[item.key as keyof PrivacySettings] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 数据管理 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">数据管理</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">导出数据</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  下载您的个人数据副本
                </p>
              </div>
              <button
                onClick={exportData}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                下载数据
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-300">删除账户</h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  永久删除您的账户和所有数据
                </p>
              </div>
              <button
                onClick={deleteAccount}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              >
                删除账户
              </button>
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage 