const { sendEmail } = require('../_lib/luckycola-email')

// 邮件队列 (简单的内存队列，生产环境建议使用Redis)
const emailQueue = []
let isProcessing = false

// 邮件模板类型
const EMAIL_TYPES = {
  VERIFICATION: 'verification',
  WELCOME: 'welcome', 
  PASSWORD_RESET: 'password_reset',
  PASSWORD_RESET_NOTIFICATION: 'password_reset_notification',
  PASSWORD_CHANGE_NOTIFICATION: 'password_change_notification',
  SECURITY_ALERT: 'security_alert',
  ADMIN_NOTIFICATION: 'admin_notification'
}

// 生成验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 邮件模板生成器
const emailTemplates = {
  // 邮箱验证码邮件
  [EMAIL_TYPES.VERIFICATION]: (data) => ({
    subject: '梦锡账号邮箱验证码',
    html: generateVerificationEmailHTML(data.code, data.username)
  }),

  // 欢迎邮件
  [EMAIL_TYPES.WELCOME]: (data) => ({
    subject: '欢迎加入梦锡工作室！',
    html: generateWelcomeEmailHTML(data.username)
  }),

  // 密码重置邮件
  [EMAIL_TYPES.PASSWORD_RESET]: (data) => ({
    subject: '梦锡账号 - 密码重置验证码',
    html: generatePasswordResetEmailHTML(data.code, data.username)
  }),

  // 密码重置安全通知
  [EMAIL_TYPES.PASSWORD_RESET_NOTIFICATION]: (data) => ({
    subject: '梦锡账号 - 密码重置安全通知',
    html: generatePasswordResetNotificationHTML(data.username, data.timestamp, data.ip, data.deviceInfo)
  }),

  // 密码修改安全通知
  [EMAIL_TYPES.PASSWORD_CHANGE_NOTIFICATION]: (data) => ({
    subject: '梦锡账号 - 密码修改安全通知',
    html: generatePasswordChangeNotificationHTML(data.username, data.timestamp, data.ip, data.deviceInfo)
  }),

  // 安全警报
  [EMAIL_TYPES.SECURITY_ALERT]: (data) => ({
    subject: '梦锡账号 - 安全警报',
    html: generateSecurityAlertHTML(data.username, data.alertType, data.details)
  }),

  // 管理员通知
  [EMAIL_TYPES.ADMIN_NOTIFICATION]: (data) => ({
    subject: data.subject || '梦锡工作室 - 系统通知',
    html: generateAdminNotificationHTML(data.title, data.content, data.username)
  })
}

// 验证码邮件HTML模板
function generateVerificationEmailHTML(code, username = '') {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>梦锡账号邮箱验证</title>
      <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .code-container { background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .code { font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; font-family: 'Courier New', monospace; }
        .code-label { color: #6b7280; margin-bottom: 15px; font-size: 14px; }
        .instructions { color: #4b5563; line-height: 1.6; margin: 25px 0; }
        .warning { background: #fef3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px; }
        .warning-text { color: #92400e; margin: 0; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        .security-tips { background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .security-title { color: #065f46; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; }
        .security-list { color: #047857; margin: 0; padding-left: 20px; }
        .icon { display: inline-block; width: 16px; height: 16px; margin-right: 8px; }
        .shield-icon { background: #065f46; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">梦锡账号</div>
          <div class="subtitle">梦锡工作室</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            您好${username ? ` ${username}` : ''}！
          </div>
          
          <p class="instructions">
            感谢您使用梦锡账号系统。为了确保您的账户安全，请使用以下验证码完成邮箱验证：
          </p>
          
          <div class="code-container">
            <div class="code-label">您的验证码</div>
            <div class="code">${code}</div>
          </div>
          
          <p class="instructions">
            请在 <strong>10分钟内</strong> 输入此验证码完成验证。如果您没有请求此验证码，请忽略此邮件。
          </p>
          
          <div class="warning">
            <p class="warning-text">
              <strong>安全提醒：</strong>请勿将此验证码告诉任何人，梦锡工作人员不会主动向您索要验证码。
            </p>
          </div>
          
          <div class="security-tips">
            <div class="security-title">
              <span class="icon shield-icon"></span>安全小贴士
            </div>
            <ul class="security-list">
              <li>定期更新您的账户密码</li>
              <li>不要在公共设备上保存登录信息</li>
              <li>发现异常活动请及时联系我们</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            此邮件由系统自动发送，请勿回复,如有疑问请联系我们QQ:915435295<br>
            © ${new Date().getFullYear()} 梦锡工作室. 保留所有权利
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// 欢迎邮件HTML模板 
function generateWelcomeEmailHTML(username) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>欢迎加入梦锡工作室</title>
      <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; }
        .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .welcome-container { background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .welcome-icon { width: 48px; height: 48px; margin: 0 auto 15px; }
        .welcome-title { font-size: 24px; font-weight: bold; color: #065f46; margin-bottom: 10px; }
        .welcome-desc { color: #6b7280; font-size: 14px; }
        .instructions { color: #4b5563; line-height: 1.6; margin: 25px 0; }
        .features-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .features-title { color: #374151; font-weight: bold; margin-bottom: 15px; display: flex; align-items: center; font-size: 16px; }
        .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
        .feature-item { background: white; border-radius: 8px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .feature-icon { width: 32px; height: 32px; background: #3b82f6; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; position: relative; }
        .feature-title { font-weight: bold; color: #1f2937; margin-bottom: 4px; font-size: 13px; }
        .feature-desc { color: #6b7280; font-size: 12px; line-height: 1.4; }
        .cta-section { text-align: center; margin: 30px 0; }
        .cta-button { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-flex; align-items: center; font-weight: bold; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-1px); }
        .tips-section { background: #fef3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .tips-title { color: #92400e; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; }
        .tips-list { color: #d97706; margin: 0; padding-left: 20px; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        .icon { display: inline-block; width: 16px; height: 16px; margin-right: 8px; }
        .header-icon { width: 24px; height: 24px; margin-right: 10px; }
        .cta-icon { width: 20px; height: 20px; margin-right: 8px; }
        .feature-svg { width: 20px; height: 20px; }
        
        /* SVG 图标样式 */
        .celebration-icon { background: white; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .rocket-icon { background: #10b981; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 15v-3m0 0V9m0 3h3m-3 0H9m11 3a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .sparkle-icon { background: #10b981; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .shield-icon { background: white; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .bolt-icon { background: white; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 10V3L4 14h7v7l9-11h-7z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .palette-icon { background: white; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .cog-icon { background: white; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .target-icon { background: white; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .warning-icon { background: #f59e0b; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span class="header-icon celebration-icon"></span>
            欢迎加入
          </div>
          <div class="subtitle">梦锡工作室</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            您好 ${username}！
          </div>
          
          <p class="instructions">
            恭喜您成功注册梦锡账号！我们很高兴您加入梦锡工作室的大家庭。您的账户已激活，现在可以享受我们提供的各种专业服务。
          </p>
          
          <div class="welcome-container">
            <div class="welcome-icon rocket-icon"></div>
            <div class="welcome-title">注册成功，开启精彩之旅！</div>
            <div class="welcome-desc">您现在可以使用梦锡账号登录各种服务平台</div>
          </div>
          
          <div class="features-section">
            <div class="features-title">
              <span class="icon sparkle-icon"></span>为您提供的核心功能
            </div>
            <div class="features-grid">
              <div class="feature-item">
                <div class="feature-icon">
                  <span class="feature-svg shield-icon"></span>
                </div>
                <div class="feature-title">安全防护</div>
                <div class="feature-desc">企业级加密技术，多重身份验证保障</div>
              </div>
              
              <div class="feature-item">
                <div class="feature-icon">
                  <span class="feature-svg bolt-icon"></span>
                </div>
                <div class="feature-title">高效管理</div>
                <div class="feature-desc">统一账号体系，一键登录所有服务</div>
              </div>
              
              <div class="feature-item">
                <div class="feature-icon">
                  <span class="feature-svg palette-icon"></span>
                </div>
                <div class="feature-title">现代界面</div>
                <div class="feature-desc">精美设计，支持深色模式和国际化</div>
              </div>
              
              <div class="feature-item">
                <div class="feature-icon">
                  <span class="feature-svg cog-icon"></span>
                </div>
                <div class="feature-title">个性定制</div>
                <div class="feature-desc">丰富的设置选项，打造专属体验</div>
              </div>
            </div>
          </div>
          
          <div class="cta-section">
            <a href="${process.env.FRONTEND_URL || 'https://mxacc.mxos.top'}/dashboard" class="cta-button">
              <span class="cta-icon target-icon"></span>
              立即开始体验
            </a>
          </div>
          
          <p class="instructions">
            如果您在使用过程中遇到任何问题，我们的技术团队随时为您提供支持。
          </p>
          
          <div class="tips-section">
            <div class="tips-title">
              <span class="icon warning-icon"></span>使用小贴士
            </div>
            <ul class="tips-list">
              <li>建议启用两步验证以提高账户安全性</li>
              <li>定期更新密码并避免在多个平台使用相同密码</li>
              <li>个人资料中可以上传头像和自定义昵称</li>
              <li>关注我们的更新通知获取最新功能信息</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            此邮件由系统自动发送，请勿回复。如有疑问请联系我们QQ:915435295<br>
            © ${new Date().getFullYear()} 梦锡工作室. 保留所有权利
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// 密码重置邮件HTML模板
function generatePasswordResetEmailHTML(code, username) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MXacc 密码重置</title>
      <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; }
        .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .code-container { background: #fef2f2; border: 2px dashed #ef4444; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .code { font-size: 32px; font-weight: bold; color: #ef4444; letter-spacing: 8px; font-family: 'Courier New', monospace; }
        .code-label { color: #6b7280; margin-bottom: 15px; font-size: 14px; }
        .instructions { color: #4b5563; line-height: 1.6; margin: 25px 0; }
        .warning { background: #fef3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px; }
        .warning-text { color: #92400e; margin: 0; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        .security-tips { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .security-title { color: #7f1d1d; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; }
        .security-list { color: #991b1b; margin: 0; padding-left: 20px; }
        .icon { display: inline-block; width: 16px; height: 16px; margin-right: 8px; }
        .header-icon { width: 24px; height: 24px; margin-right: 10px; }
        .lock-icon { background: white; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 15v2m-6 6h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .shield-icon { background: #7f1d1d; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span class="header-icon lock-icon"></span>
            密码重置
          </div>
          <div class="subtitle">梦锡工作室</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            您好${username ? ` ${username}` : ''}！
          </div>
          
          <p class="instructions">
            我们收到了您的密码重置请求。为了确保您的账户安全，请使用以下验证码完成密码重置：
          </p>
          
          <div class="code-container">
            <div class="code-label">密码重置验证码</div>
            <div class="code">${code}</div>
          </div>
          
          <p class="instructions">
            请在 <strong>10分钟内</strong> 输入此验证码完成密码重置。如果您没有请求重置密码，请忽略此邮件并确保您的账户安全。
          </p>
          
          <div class="warning">
            <p class="warning-text">
              <strong>安全提醒：</strong>请勿将此验证码告诉任何人。如果您怀疑账户被盗用，请立即联系我们的客服团队。
            </p>
          </div>
          
          <div class="security-tips">
            <div class="security-title">
              <span class="icon shield-icon"></span>
              安全建议
            </div>
            <ul class="security-list">
              <li>使用强密码，包含数字、字母和特殊字符</li>
              <li>不要在多个网站使用相同密码</li>
              <li>定期更新您的账户密码</li>
              <li>启用两步验证提高安全性</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            此邮件由系统自动发送，请勿回复。如有疑问请联系我们QQ:915435295<br>
            © ${new Date().getFullYear()} 梦锡工作室. 保留所有权利
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// 密码重置通知邮件HTML模板
function generatePasswordResetNotificationHTML(username, timestamp, ip, deviceInfo) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MXacc 密码重置安全通知</title>
      <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; }
        .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .alert-box { background: #fef3cd; border: 2px solid #f59e0b; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .alert-svg { width: 48px; height: 48px; margin-bottom: 15px; }
        .alert-title { font-size: 20px; font-weight: bold; color: #92400e; margin-bottom: 10px; }
        .alert-desc { color: #6b7280; font-size: 14px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
        .info-table th, .info-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .info-table th { background-color: #f9fafb; font-weight: bold; color: #374151; width: 120px; }
        .info-table td { color: #6b7280; }
        .security-tips { background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .security-title { color: #065f46; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; }
        .security-list { color: #047857; margin: 0; padding-left: 20px; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        .action-button { background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .icon { display: inline-block; width: 16px; height: 16px; margin-right: 8px; }
        .header-icon { width: 24px; height: 24px; margin-right: 10px; }
        .notification-icon { background: white; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 17h5l-5 5-5-5h5V3h0z M5 5a2 2 0 012-2h3m0 0a2 2 0 012 2v1m-4-1h4m-4 0v1m4-1v1M9 8h6'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .shield-large-icon { background: #f59e0b; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .security-small-icon { background: #065f46; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 15v2m-6 6h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span class="header-icon notification-icon"></span>
            安全通知
          </div>
          <div class="subtitle">梦锡工作室</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            您好 ${username}！
          </div>
          
          <div class="alert-box">
            <div class="alert-svg shield-large-icon"></div>
            <div class="alert-title">您的账户密码已成功重置</div>
            <div class="alert-desc">如果这不是您本人的操作，请立即联系我们的客服团队</div>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 25px 0;">
            为了您的账户安全，我们会在密码重置后向您发送通知。以下是本次重置的详细信息：
          </p>
          
          <table class="info-table">
            <tr>
              <th>重置时间</th>
              <td>${timestamp}</td>
            </tr>
            <tr>
              <th>IP 地址</th>
              <td>${ip}</td>
            </tr>
            <tr>
              <th>设备类型</th>
              <td>${deviceInfo.device || '未知设备'}</td>
            </tr>
            <tr>
              <th>操作系统</th>
              <td>${deviceInfo.os || '未知系统'}</td>
            </tr>
            <tr>
              <th>浏览器</th>
              <td>${deviceInfo.browser || '未知浏览器'}</td>
            </tr>
          </table>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'https://mxacc.mxos.top'}/security" class="action-button">
              查看安全中心
            </a>
          </div>
          
          <div class="security-tips">
            <div class="security-title">
              <span class="icon security-small-icon"></span>
              安全建议
            </div>
            <ul class="security-list">
              <li>如果您没有进行此操作，请立即联系客服</li>
              <li>定期检查您的登录历史记录</li>
              <li>不要在公共设备上保存密码</li>
              <li>启用两步验证提高账户安全性</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            此邮件由系统自动发送，请勿回复。如有疑问请联系我们QQ:915435295<br>
            © ${new Date().getFullYear()} 梦锡工作室. 保留所有权利
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// 密码修改通知邮件HTML模板
function generatePasswordChangeNotificationHTML(username, timestamp, ip, deviceInfo) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MXacc 密码修改安全通知</title>
      <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; }
        .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .alert-box { background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .alert-svg { width: 48px; height: 48px; margin-bottom: 15px; }
        .alert-title { font-size: 20px; font-weight: bold; color: #065f46; margin-bottom: 10px; }
        .alert-desc { color: #6b7280; font-size: 14px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
        .info-table th, .info-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .info-table th { background-color: #f9fafb; font-weight: bold; color: #374151; width: 120px; }
        .info-table td { color: #6b7280; }
        .security-tips { background: #fef3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .security-title { color: #92400e; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; }
        .security-list { color: #d97706; margin: 0; padding-left: 20px; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        .action-button { background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .icon { display: inline-block; width: 16px; height: 16px; margin-right: 8px; }
        .header-icon { width: 24px; height: 24px; margin-right: 10px; }
        
        /* SVG 图标样式 */
        .check-icon { background: white; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .shield-success-icon { background: #10b981; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
        .warning-icon { background: #f59e0b; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z'/%3E%3C/svg%3E") no-repeat center; mask-size: cover; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span class="header-icon check-icon"></span>
            安全通知
          </div>
          <div class="subtitle">梦锡工作室</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            您好 ${username}！
          </div>
          
          <div class="alert-box">
            <div class="alert-svg shield-success-icon"></div>
            <div class="alert-title">您的账户密码已成功修改</div>
            <div class="alert-desc">密码修改操作已完成，如果这不是您本人的操作，请立即联系我们</div>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 25px 0;">
            为了您的账户安全，我们会在密码修改后向您发送通知。以下是本次修改的详细信息：
          </p>
          
          <table class="info-table">
            <tr>
              <th>修改时间</th>
              <td>${timestamp}</td>
            </tr>
            <tr>
              <th>IP 地址</th>
              <td>${ip}</td>
            </tr>
            <tr>
              <th>设备类型</th>
              <td>${deviceInfo.device || '未知设备'}</td>
            </tr>
            <tr>
              <th>操作系统</th>
              <td>${deviceInfo.os || '未知系统'}</td>
            </tr>
            <tr>
              <th>浏览器</th>
              <td>${deviceInfo.browser || '未知浏览器'}</td>
            </tr>
          </table>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'https://mxacc.mxos.top'}/security" class="action-button">
              查看安全中心
            </a>
          </div>
          
          <div class="security-tips">
            <div class="security-title">
              <span class="icon warning-icon"></span>
              安全提醒
            </div>
            <ul class="security-list">
              <li>如果您没有进行此操作，说明您的账户可能被盗用</li>
              <li>请立即联系客服并检查您的登录历史</li>
              <li>建议定期更换密码并启用两步验证</li>
              <li>不要在不安全的网络环境下使用账户</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            此邮件由系统自动发送，请勿回复。如有疑问请联系我们QQ:915435295<br>
            © ${new Date().getFullYear()} 梦锡工作室. 保留所有权利
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// 安全警报邮件HTML模板
function generateSecurityAlertHTML(username, alertType, details) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>梦锡账号 - 安全警报</title>
      <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .alert-container { background: #fef2f2; border: 2px solid #dc2626; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .alert-title { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 10px; }
        .alert-desc { color: #6b7280; font-size: 14px; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">安全警报</div>
          <div class="subtitle">梦锡工作室</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            您好 ${username}！
          </div>
          
          <div class="alert-container">
            <div class="alert-title">${alertType || '安全警报'}</div>
            <div class="alert-desc">${details || '检测到账户异常活动'}</div>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            此邮件由系统自动发送，请勿回复。如有疑问请联系我们QQ:915435295<br>
            © ${new Date().getFullYear()} 梦锡工作室. 保留所有权利
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// 管理员通知邮件HTML模板
function generateAdminNotificationHTML(title, content, username) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>梦锡工作室 - 管理员通知</title>
      <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #7c3aed, #5b21b6); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .notification-container { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0; }
        .notification-title { font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 15px; }
        .notification-content { color: #4b5563; line-height: 1.6; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">管理员通知</div>
          <div class="subtitle">梦锡工作室</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            您好${username ? ` ${username}` : ''}！
          </div>
          
          <div class="notification-container">
            <div class="notification-title">${title || '系统通知'}</div>
            <div class="notification-content">${content || '这是一条系统通知消息'}</div>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            此邮件由系统自动发送，请勿回复。如有疑问请联系我们QQ:915435295<br>
            © ${new Date().getFullYear()} 梦锡工作室. 保留所有权利
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// 添加邮件到队列
function addToQueue(emailData) {
  const emailTask = {
    id: Date.now() + Math.random(),
    timestamp: new Date(),
    ...emailData
  }
  
  emailQueue.push(emailTask)
  console.log(`📧 邮件已加入队列: ${emailTask.type} -> ${emailTask.to}`)
  
  // 触发处理队列
  processQueue()
  
  return emailTask.id
}

// 处理邮件队列
async function processQueue() {
  if (isProcessing || emailQueue.length === 0) {
    return
  }
  
  isProcessing = true
  console.log(`📬 开始处理邮件队列，共 ${emailQueue.length} 封邮件`)
  
  while (emailQueue.length > 0) {
    const emailTask = emailQueue.shift()
    
    try {
      console.log(`📧 正在发送邮件: ${emailTask.type} -> ${emailTask.to}`)
      
      // 获取邮件模板
      const template = emailTemplates[emailTask.type]
      if (!template) {
        throw new Error(`未知的邮件类型: ${emailTask.type}`)
      }
      
      const { subject, html } = template(emailTask.data)
      
      // 发送邮件
      const result = await sendEmail(emailTask.to, subject, html, true)
      
      if (result.success) {
        console.log(`✅ 邮件发送成功: ${emailTask.id}`)
      } else {
        throw new Error(result.error || '邮件发送失败')
      }
      
    } catch (error) {
      console.error(`❌ 邮件发送失败: ${emailTask.id}`, error)
      // 可以添加重试逻辑或错误处理
    }
    
    // 发送间隔，避免过于频繁
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  isProcessing = false
  console.log('📭 邮件队列处理完成')
}

// API 处理函数
async function handler(req, res) {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' })
  }

  try {
    const { type, to, data = {} } = req.body

    // 验证必填参数
    if (!type || !to) {
      return res.status(400).json({
        success: false,
        message: '缺少必填参数: type, to'
      })
    }

    // 验证邮件类型
    if (!Object.values(EMAIL_TYPES).includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的邮件类型'
      })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式无效'
      })
    }

    // 特殊处理：验证码类型自动生成验证码
    if (type === EMAIL_TYPES.VERIFICATION && !data.code) {
      data.code = generateVerificationCode()
    }

    // 添加到邮件队列
    const taskId = addToQueue({
      type,
      to,
      data
    })

    console.log(`📧 邮件服务请求: ${type} -> ${to}`)

    // 立即返回响应，不等待邮件发送完成
    return res.status(200).json({
      success: true,
      message: '邮件已加入发送队列',
      taskId,
      code: data.code // 如果是验证码邮件，返回验证码给调用方
    })

  } catch (error) {
    console.error('邮件服务错误:', error)
    return res.status(500).json({
      success: false,
      message: '邮件服务异常',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// 导出处理函数（Vercel需要默认导出）
module.exports = handler

// 导出邮件类型常量和工具函数
module.exports.EMAIL_TYPES = EMAIL_TYPES
module.exports.generateVerificationCode = generateVerificationCode
module.exports.addToQueue = addToQueue
module.exports.processQueue = processQueue 