const VerifyEmailPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 gradient-mx rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <span className="text-2xl">📧</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-4">
          验证您的邮箱
        </h1>
        <p className="text-muted-foreground mb-6">
          我们已向您的邮箱发送了验证链接，请点击邮件中的链接完成验证。
        </p>
        <div className="bg-card border border-border rounded-xl p-6">
          <button className="w-full gradient-mx text-white font-medium py-3 rounded-lg hover:opacity-90 transition-all duration-200">
            重新发送验证邮件
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage 