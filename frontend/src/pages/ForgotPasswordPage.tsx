import React from 'react'

const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-mx rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            重置密码
          </h1>
          <p className="text-muted-foreground">
            输入您的邮箱地址，我们将发送重置链接
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                placeholder="输入您的邮箱地址"
              />
            </div>
            <button
              type="submit"
              className="w-full gradient-mx text-white font-medium py-3 rounded-lg hover:opacity-90 transition-all duration-200"
            >
              发送重置链接
            </button>
          </form>
          
          <div className="text-center mt-6 pt-6 border-t border-border">
            <a href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              返回登录
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage 