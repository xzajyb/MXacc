const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* 头部导航 */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-mx rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">MX</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">梦锡账号</h1>
                <p className="text-xs text-muted-foreground">MXAcc 管理中心</p>
              </div>
            </div>

            {/* 用户菜单 */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">欢迎回来</span>
              <div className="w-8 h-8 bg-primary rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">仪表板</h2>
          <p className="text-muted-foreground">管理您的梦锡账号和设置</p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 个人资料卡片 */}
          <div className="bg-card border border-border rounded-xl p-6 card-hover">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary">👤</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">个人资料</h3>
                <p className="text-sm text-muted-foreground">管理您的个人信息</p>
              </div>
            </div>
            <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors">
              查看资料
            </button>
          </div>

          {/* 安全设置卡片 */}
          <div className="bg-card border border-border rounded-xl p-6 card-hover">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <span className="text-secondary-600">🔒</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">安全设置</h3>
                <p className="text-sm text-muted-foreground">两步验证和密码管理</p>
              </div>
            </div>
            <button className="w-full bg-secondary text-secondary-foreground py-2 rounded-lg hover:bg-secondary/90 transition-colors">
              安全设置
            </button>
          </div>

          {/* 偏好设置卡片 */}
          <div className="bg-card border border-border rounded-xl p-6 card-hover">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground">⚙️</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">偏好设置</h3>
                <p className="text-sm text-muted-foreground">主题、语言和通知</p>
              </div>
            </div>
            <button className="w-full bg-accent text-accent-foreground py-2 rounded-lg hover:bg-accent/90 transition-colors">
              偏好设置
            </button>
          </div>
        </div>

        {/* 欢迎信息 */}
        <div className="mt-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              欢迎使用 MXAcc
            </h3>
            <p className="text-muted-foreground mb-4">
              梦锡工作室统一账号管理系统，为您提供安全、便捷的账号服务
            </p>
            <div className="text-sm text-muted-foreground">
              © 2024 梦锡工作室 - 简单的设计，可靠的性能
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage 