import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Palette, 
  Bell, 
  Shield, 
  Globe, 
  Sun,
  Moon,
  Monitor,
  Mail,
  MessageSquare,
  Lock,
  Eye,
  EyeOff,
  Check,
  RefreshCw
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import LoadingSpinner from '../components/LoadingSpinner'

interface SettingsPageProps {
  embedded?: boolean
}

interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  notifications: {
    email: boolean
    browser: boolean
    marketing: boolean
  }
  privacy: {
    profileVisible: boolean
    activityVisible: boolean
    allowDataCollection: boolean
    showFollowers: boolean
    showFollowing: boolean
  }
  language: string
  timezone: string
}

const SettingsPage: React.FC<SettingsPageProps> = ({ embedded = false }) => {
  const { theme, setTheme } = useTheme()
  const { showSuccess, showError } = useToast()
  const { user } = useAuth()
  const { language, timezone, t, setLanguage, setTimezone } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    theme: theme,
    notifications: {
      email: true,
      browser: true,
      marketing: false
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
      allowDataCollection: true,
      showFollowers: true,
      showFollowing: true
    },
    language: language,
    timezone: timezone
  })

  // 防抖保存函数
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (settingsToSave: UserSettings) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          saveSettings(settingsToSave)
        }, 1000) // 1秒后自动保存
      }
    })(),
    []
  )

  // 加载用户设置
  useEffect(() => {
    loadUserSettings()
  }, [])

  // 监听设置变化，自动保存（除了主题和语言）
  useEffect(() => {
    if (user) {
      debouncedSave(settings)
    }
  }, [settings.notifications, settings.privacy, debouncedSave, user])

  // 同步语言上下文的变化到本地状态
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      language: language,
      timezone: timezone
    }))
  }, [language, timezone])

  const loadUserSettings = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/user/user-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          console.log('加载到的用户设置:', data.settings)
          setSettings(prevSettings => ({
            ...data.settings,
            theme: theme // 保持当前主题设置
          }))
        }
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (settingsToSave?: UserSettings) => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/user/user-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: settingsToSave || settings })
      })

      if (response.ok) {
        // 静默保存，不显示成功消息（除非是主题更改）
        if (settingsToSave && settingsToSave.theme !== settings.theme) {
          showSuccess(t.settings.title + '已保存')
        }
      } else {
        const data = await response.json()
        showError(data.message || '保存设置失败')
      }
    } catch (error) {
      console.error('保存设置失败:', error)
      showError('保存设置失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (section: keyof UserSettings, key: string, value: any) => {
    if (typeof settings[section] === 'object' && settings[section] !== null) {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...(prev[section] as object),
          [key]: value
        }
      }))
    } else {
      setSettings(prev => ({
        ...prev,
        [section]: value
      }))
    }
  }

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    // 立即应用主题
    setTheme(newTheme)
    
    // 更新设置状态
    const newSettings = { ...settings, theme: newTheme }
    setSettings(newSettings)
    
    // 立即保存到服务器
    await saveSettings(newSettings)
  }

  // 处理语言更改
  const handleLanguageChange = async (newLanguage: string) => {
    // 立即应用语言
    setLanguage(newLanguage as any)
    
    // 更新设置状态
    const newSettings = { ...settings, language: newLanguage }
    setSettings(newSettings)
    
    // 立即保存到服务器
    await saveSettings(newSettings)
    showSuccess(t.settings.interfaceLanguage + '已更新')
  }

  // 处理时区更改
  const handleTimezoneChange = async (newTimezone: string) => {
    // 立即应用时区
    setTimezone(newTimezone)
    
    // 更新设置状态
    const newSettings = { ...settings, timezone: newTimezone }
    setSettings(newSettings)
    
    // 立即保存到服务器
    await saveSettings(newSettings)
    showSuccess(t.settings.timezoneSettings + '已更新')
  }

  const themes = [
    { value: 'light', label: t.settings.lightMode, icon: Sun, desc: t.settings.lightModeDesc },
    { value: 'dark', label: t.settings.darkMode, icon: Moon, desc: t.settings.darkModeDesc },
    { value: 'auto', label: t.settings.autoMode, icon: Monitor, desc: t.settings.autoModeDesc }
  ]

  const languages = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'zh-TW', label: '繁體中文' },
    { value: 'en-US', label: 'English' },
    { value: 'ja-JP', label: '日本語' }
  ]

  const timezones = [
    { value: 'Asia/Shanghai', label: '北京时间 (UTC+8)' },
    { value: 'Asia/Tokyo', label: '东京时间 (UTC+9)' },
    { value: 'America/New_York', label: '纽约时间 (UTC-5)' },
    { value: 'Europe/London', label: '伦敦时间 (UTC+0)' }
  ]

  if (loading) {
    return (
      <div className={embedded ? "space-y-6" : "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gray-50 dark:bg-gray-900"}>
      <div className={embedded ? "" : "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* 页面标题 */}
        {!embedded && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                  {t.settings.title}
          </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{t.settings.description}</p>
              </div>
              {/* 保存状态指示器 */}
              {saving && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  {t.settings.saving}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* 外观设置 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Palette className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.settings.appearance}</h2>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t.settings.immediately}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.settings.appearanceDesc}</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t.settings.theme}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {themes.map((themeOption) => {
                      const Icon = themeOption.icon
                      const isSelected = settings.theme === themeOption.value
                      return (
                        <motion.button
                          key={themeOption.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleThemeChange(themeOption.value as any)}
                          className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <Icon className={`h-6 w-6 mx-auto mb-2 transition-colors duration-200 ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                          }`} />
                          <div className={`text-sm font-medium transition-colors duration-200 ${
                            isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                          }`}>
                            {themeOption.label}
                          </div>
                          <div className={`text-xs mt-1 transition-colors duration-200 ${
                            isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {themeOption.desc}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 通知设置 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.settings.notifications}</h2>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t.settings.autoSave}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.settings.notificationsDesc}</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { key: 'email', label: t.settings.emailNotifications, desc: t.settings.emailNotificationsDesc, icon: Mail },
                  { key: 'browser', label: t.settings.browserNotifications, desc: t.settings.browserNotificationsDesc, icon: MessageSquare },
                  { key: 'marketing', label: t.settings.marketingNotifications, desc: t.settings.marketingNotificationsDesc, icon: Bell }
                ].map((notification) => {
                  const Icon = notification.icon
                  return (
                    <div key={notification.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {notification.label}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {notification.desc}
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications[notification.key as keyof typeof settings.notifications]}
                          onChange={(e) => updateSettings('notifications', notification.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* 隐私设置 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.settings.privacy}</h2>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t.settings.autoSave}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.settings.privacyDesc}</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { key: 'profileVisible', label: t.settings.profileVisible, desc: t.settings.profileVisibleDesc, icon: Eye },
                  { key: 'activityVisible', label: t.settings.activityVisible, desc: t.settings.activityVisibleDesc, icon: Globe },
                  { key: 'allowDataCollection', label: t.settings.dataCollection, desc: t.settings.dataCollectionDesc, icon: Shield },
                  { key: 'showFollowers', label: t.settings.showFollowers, desc: t.settings.showFollowersDesc, icon: Eye },
                  { key: 'showFollowing', label: t.settings.showFollowing, desc: t.settings.showFollowingDesc, icon: Globe }
                ].map((privacy) => {
                  const Icon = privacy.icon
                  return (
                    <div key={privacy.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {privacy.label}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {privacy.desc}
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy[privacy.key as keyof typeof settings.privacy]}
                          onChange={(e) => updateSettings('privacy', privacy.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* 语言和地区 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.settings.language}</h2>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t.settings.immediately}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.settings.languageDesc}</p>
        </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.settings.interfaceLanguage}
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    {t.settings.timezoneSettings}
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleTimezoneChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          </motion.div>

          {/* 自动保存提示 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div className="flex items-center">
              <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {t.settings.autoSaveEnabled}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {t.settings.autoSaveDesc}
            </p>
          </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage 