// LuckyCola 邮件API配置
// 使用第三方邮件发送服务，避免SMTP配置复杂性

const sendEmail = async (to, subject, content, isHTML = true) => {
  try {
    const apiUrl = 'https://luckycola.com.cn/tools/customMail'
    
    const requestData = {
      ColaKey: process.env.LUCKYCOLA_API_KEY,
      tomail: to,
      fromTitle: "梦锡工作室官方",
      subject: subject,
      content: content,
      isTextContent: !isHTML, // 默认发送HTML邮件
      smtpCode: process.env.LUCKYCOLA_SMTP_CODE,
      smtpEmail: process.env.LUCKYCOLA_SMTP_EMAIL,
      smtpCodeType: process.env.LUCKYCOLA_SMTP_TYPE || 'qq'
    }

    console.log('发送邮件请求:', {
      ...requestData,
      smtpCode: '***隐藏***', // 隐藏敏感信息
      ColaKey: '***隐藏***'
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MXOS/1.0'
      },
      body: JSON.stringify(requestData)
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} - ${JSON.stringify(result)}`)
    }

    console.log('邮件发送成功:', result)
    return {
      success: true,
      data: result,
      message: '邮件发送成功'
    }

  } catch (error) {
    console.error('邮件发送失败:', error)
    return {
      success: false,
      error: error.message,
      message: '邮件发送失败'
    }
  }
}

// 发送验证码邮件
const sendVerificationEmail = async (email, code, username = '') => {
  const subject = '梦锡账号邮箱验证码'
  
  const htmlContent = `
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

  const result = await sendEmail(email, subject, htmlContent, true)
  
  if (!result.success) {
    throw new Error(result.error || result.message || '邮件发送失败')
  }
  
  return result
}

// 发送欢迎邮件
const sendWelcomeEmail = async (email, username) => {
  const subject = '欢迎加入梦锡工作室！'
  
  const htmlContent = `
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

  console.log('📧 准备发送欢迎邮件到:', email, '用户名:', username)
  
  try {
    const result = await sendEmail(email, subject, htmlContent, true)
    console.log('✅ 欢迎邮件发送结果:', result)
    return result
  } catch (error) {
    console.error('❌ 欢迎邮件发送失败:', error)
    // 重新抛出错误以便上层处理
    throw error
  }
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail
} 