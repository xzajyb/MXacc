const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-mx rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">MX</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            创建梦锡账号
          </h1>
          <p className="text-muted-foreground">
            加入梦锡工作室生态系统
          </p>
        </div>

        {/* 注册表单 */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <form className="space-y-4">
            {/* 用户名输入 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                用户名
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                placeholder="输入用户名"
              />
            </div>

            {/* 邮箱输入 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                placeholder="输入邮箱地址"
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                密码
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                placeholder="输入密码"
              />
            </div>

            {/* 注册按钮 */}
            <button
              type="submit"
              className="w-full gradient-mx text-white font-medium py-3 rounded-lg hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
            >
              创建账号
            </button>
          </form>

          {/* 登录链接 */}
          <div className="text-center mt-6 pt-6 border-t border-border">
            <p className="text-muted-foreground">
              已有账号？{' '}
              <a href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                立即登录
              </a>
            </p>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            © 2024 梦锡工作室. 保留所有权利.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage 