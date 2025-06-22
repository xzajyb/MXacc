import React from 'react'

const ResetPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-mx rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            设置新密码
          </h1>
          <p className="text-muted-foreground">
            请输入您的新密码
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                新密码
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                placeholder="输入新密码"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                确认新密码
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                placeholder="再次输入新密码"
              />
            </div>
            <button
              type="submit"
              className="w-full gradient-mx text-white font-medium py-3 rounded-lg hover:opacity-90 transition-all duration-200"
            >
              重置密码
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage 