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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>欢迎加入梦锡工作室</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .email-wrapper {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0,0,0,0.15);
        }
        .header { 
          background: linear-gradient(135deg, #91F5FC 0%, #10b981 100%); 
          padding: 50px 30px 40px; 
          text-align: center; 
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .logo-container {
          position: relative;
          z-index: 2;
          margin-bottom: 20px;
        }
        .logo {
          width: 90px;
          height: 90px;
          margin: 0 auto 20px;
          background: white;
          border-radius: 22px;
          padding: 18px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .header h1 { 
          color: white; 
          font-size: 32px; 
          margin: 0 0 8px; 
          font-weight: 800; 
          text-shadow: 0 3px 15px rgba(0,0,0,0.2);
          position: relative;
          z-index: 2;
        }
        .header p {
          color: rgba(255,255,255,0.9);
          font-size: 18px;
          margin: 0;
          position: relative;
          z-index: 2;
          font-weight: 500;
        }
        .content { 
          padding: 50px 40px; 
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }
        .celebration { 
          text-align: center; 
          margin: 0 0 45px; 
        }
        .celebration-icon { 
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 30px;
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.4);
          animation: pulse 2s infinite;
          position: relative;
        }
        .celebration-icon::before {
          content: '';
          position: absolute;
          width: 140px;
          height: 140px;
          border: 3px solid rgba(16, 185, 129, 0.2);
          border-radius: 50%;
          animation: ripple 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        .welcome-title { 
          font-size: 36px; 
          color: #1f2937; 
          margin: 0 0 18px; 
          font-weight: 800;
          background: linear-gradient(135deg, #1f2937, #059669);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }
        .welcome-subtitle {
          color: #6b7280;
          font-size: 20px;
          line-height: 1.6;
          margin: 0 0 45px;
          font-weight: 400;
        }
        .features { 
          margin: 45px 0; 
          display: grid;
          gap: 25px;
        }
        .feature-item { 
          display: flex; 
          align-items: center; 
          padding: 30px; 
          background: white;
          border-radius: 20px; 
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(0,0,0,0.06);
          position: relative;
          overflow: hidden;
        }
        .feature-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transition: left 0.5s;
        }
        .feature-item:hover::before {
          left: 100%;
        }
        .feature-icon { 
          width: 70px; 
          height: 70px; 
          border-radius: 18px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold; 
          margin-right: 25px;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }
        .feature-icon.security {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }
        .feature-icon.speed {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);
        }
        .feature-icon.design {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
        }
        .feature-text { 
          flex: 1; 
          position: relative;
          z-index: 1;
        }
        .feature-title { 
          font-weight: 700; 
          color: #1f2937; 
          margin-bottom: 10px; 
          font-size: 20px;
        }
        .feature-desc { 
          color: #6b7280; 
          font-size: 16px; 
          line-height: 1.6;
        }
        .cta-section {
          text-align: center;
          margin: 50px 0;
          padding: 45px 30px;
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border-radius: 25px;
          border: 2px solid #bae6fd;
          position: relative;
          overflow: hidden;
        }
        .cta-section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%);
          animation: rotate 10s linear infinite;
        }
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .cta-icon {
          position: relative;
          z-index: 2;
          margin-bottom: 25px;
        }
        .cta-title {
          position: relative;
          z-index: 2;
          margin: 0 0 18px; 
          color: #1f2937; 
          font-size: 26px;
          font-weight: 700;
        }
        .cta-desc {
          position: relative;
          z-index: 2;
          color: #6b7280; 
          margin: 0 0 30px; 
          font-size: 18px;
          line-height: 1.6;
        }
        .cta-button { 
          background: linear-gradient(135deg, #10b981, #059669);
          color: white; 
          padding: 20px 45px; 
          text-decoration: none; 
          border-radius: 15px; 
          display: inline-block; 
          font-weight: 700; 
          font-size: 18px;
          box-shadow: 0 15px 35px rgba(16, 185, 129, 0.4);
          transition: all 0.3s ease;
          position: relative;
          z-index: 2;
          border: none;
          cursor: pointer;
        }
        .support-section {
          background: #f8fafc;
          padding: 35px 30px;
          border-radius: 20px;
          text-align: center;
          margin: 35px 0;
          border: 1px solid #e2e8f0;
        }
        .support-title {
          font-size: 22px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 18px;
        }
        .support-text {
          color: #6b7280;
          font-size: 16px;
          line-height: 1.7;
        }
        .footer { 
          background: linear-gradient(135deg, #1f2937, #111827);
          padding: 45px 35px; 
          text-align: center; 
        }
        .footer p { 
          color: #9ca3af; 
          font-size: 15px; 
          margin: 0; 
          line-height: 1.7;
        }
        .footer a {
          color: #91F5FC;
          text-decoration: none;
          font-weight: 500;
        }
        .footer strong {
          color: #f3f4f6;
          font-size: 18px;
        }
        @media (max-width: 600px) {
          .email-wrapper { padding: 10px; }
          .container { border-radius: 16px; }
          .content { padding: 35px 25px; }
          .feature-item { flex-direction: column; text-align: center; padding: 25px; }
          .feature-icon { margin: 0 0 20px 0; }
          .welcome-title { font-size: 28px; }
          .cta-section { padding: 35px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <div class="logo-container">
              <div class="logo">
                <svg width="54" height="54" viewBox="0 0 620 905" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g style="mix-blend-mode:passthrough">
                    <ellipse cx="149" cy="149" rx="149" ry="149" fill="#91F5FC"/>
                    <ellipse cx="149" cy="149" rx="146.5" ry="146.5" stroke="#10b981" stroke-width="5" fill="none"/>
                    <ellipse cx="384.5" cy="669.5" rx="235.5" ry="235.5" fill="#10b981"/>
                    <ellipse cx="211" cy="99" rx="37" ry="37" fill="#91F5FC"/>
                    <ellipse cx="297.5" cy="805.5" rx="49.5" ry="49.5" fill="#FFFFFF"/>
                  </g>
                </svg>
              </div>
            </div>
            <h1>梦锡工作室</h1>
            <p>MXacc 统一身份认证平台</p>
          </div>
          
          <div class="content">
            <div class="celebration">
              <div class="celebration-icon">
                <svg width="60" height="60" fill="white" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 class="welcome-title">欢迎加入，${username}！</h1>
              <p class="welcome-subtitle">
                🎉 恭喜您成功注册梦锡账号！您的数字生活从这里开始，让我们一起探索无限可能。
              </p>
            </div>
            
            <div class="features">
              <div class="feature-item">
                <div class="feature-icon security">
                  <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1l3.09 2.26L22 2l-1.26 6.91L23 12l-2.26 3.09L22 22l-6.91-1.26L12 23l-3.09-2.26L2 22l1.26-6.91L1 12l2.26-3.09L2 2l6.91 1.26L12 1z"/>
                  </svg>
                </div>
                <div class="feature-text">
                  <div class="feature-title">🛡️ 企业级安全</div>
                  <div class="feature-desc">多重安全防护机制，256位加密技术，确保您的账户和个人数据安全无忧</div>
                </div>
              </div>
              
              <div class="feature-item">
                <div class="feature-icon speed">
                  <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z"/>
                  </svg>
                </div>
                <div class="feature-text">
                  <div class="feature-title">⚡ 极速体验</div>
                  <div class="feature-desc">一键登录所有服务，智能同步个人设置，让您在不同平台间无缝切换</div>
                </div>
              </div>
              
              <div class="feature-item">
                <div class="feature-icon design">
                  <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 2.26L22 3l-1.26 6.91L23 13l-2.26 3.09L22 23l-6.91-1.26L12 22l-3.09-2.26L2 23l1.26-6.91L1 13l2.26-3.09L2 3l6.91 1.26L12 2z"/>
                  </svg>
                </div>
                <div class="feature-text">
                  <div class="feature-title">🎨 现代设计</div>
                  <div class="feature-desc">精心打造的用户界面，支持深色模式，响应式设计适配所有设备</div>
                </div>
              </div>
            </div>
            
            <div class="cta-section">
              <div class="cta-icon">
                <svg width="50" height="50" fill="#10b981" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 class="cta-title">🚀 开始您的数字之旅</h3>
              <p class="cta-desc">点击下方按钮，立即进入您的专属仪表板，开始探索更多功能</p>
              <a href="${process.env.FRONTEND_URL || 'https://mxacc.mxos.top'}/dashboard" class="cta-button">
                立即体验
              </a>
            </div>
            
            <div class="support-section">
              <div class="support-title">💬 需要帮助？</div>
              <div class="support-text">
                如果您在使用过程中遇到任何问题，或者有宝贵的意见建议，<br>
                请随时联系我们的客服团队，我们将竭诚为您服务！
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>
              <strong>梦锡工作室 MXacc</strong><br><br>
              📧 此邮件由系统自动发送，请勿回复<br>
              🤖 QQ客服: <a href="https://qm.qq.com/cgi-bin/qm/qr?k=xxx">915435295</a> | 
              📮 邮箱: <a href="mailto:support@mxos.top">support@mxos.top</a><br><br>
              © ${new Date().getFullYear()} 梦锡工作室. 保留所有权利 | 
              <a href="${process.env.FRONTEND_URL || 'https://mxacc.mxos.top'}/privacy">隐私政策</a> | 
              <a href="${process.env.FRONTEND_URL || 'https://mxacc.mxos.top'}/terms">服务条款</a>
            </p>
          </div>
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