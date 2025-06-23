import React, { useState } from 'react'
import { Settings } from 'lucide-react'

interface SettingsPageProps {
  embedded?: boolean
}

const SettingsPage: React.FC<SettingsPageProps> = ({ embedded = false }) => {
  const [message, setMessage] = useState('')

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gray-50 dark:bg-gray-900"}>
      <div className={embedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* 页面标题 */}
        {!embedded && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              系统设置
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">个性化您的账户体验和偏好设置</p>
          </div>
        )}

        {/* 消息提示 */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('成功') ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
            {message}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              设置页面
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              此功能正在开发中，敬请期待...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage 