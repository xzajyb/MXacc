import React from 'react'

const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            系统设置
          </h1>
          <p className="text-muted-foreground">
            管理您的账户设置和应用偏好
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <div className="text-center py-12">
            <div className="w-16 h-16 gradient-mx rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              设置页面
            </h2>
            <p className="text-muted-foreground">
              此功能正在开发中，敬请期待...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage 