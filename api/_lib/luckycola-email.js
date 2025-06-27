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
        .code-container { 
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
          border: 2px solid #3b82f6; 
          border-radius: 16px; 
          padding: 35px; 
          text-align: center; 
          margin: 30px 0;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
          position: relative;
          overflow: hidden;
        }
        .code-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8, #1e40af, #3b82f6);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .code { 
          font-size: 36px; 
          font-weight: 900; 
          color: #1d4ed8; 
          letter-spacing: 12px; 
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          text-shadow: 0 2px 4px rgba(29, 78, 216, 0.2);
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
        }
        .code-label { 
          color: #1e40af; 
          margin-bottom: 20px; 
          font-size: 16px; 
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .instructions { color: #4b5563; line-height: 1.6; margin: 25px 0; }
        .warning { 
          background: linear-gradient(135deg, #fef3cd 0%, #fde68a 100%); 
          border: 1px solid #f59e0b; 
          border-left: 4px solid #d97706; 
          padding: 20px; 
          margin: 25px 0; 
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.15);
        }
        .warning-text { 
          color: #92400e; 
          margin: 0; 
          display: flex;
          align-items: center;
          font-weight: 500;
        }
        .warning-icon {
          margin-right: 8px;
          color: #d97706;
          flex-shrink: 0;
        }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        .security-tips { background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .security-title { color: #065f46; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; }
        .security-list { color: #047857; margin: 0; padding-left: 20px; }
        .security-tips { background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 12px; padding: 20px; margin: 25px 0; }
        .security-title { color: #065f46; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; }
        .security-list { color: #047857; margin: 0; padding-left: 20px; }
        .security-icon {
          margin-right: 8px;
          color: #10b981;
          flex-shrink: 0;
        }
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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="warning-icon">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <path d="M12 9v4"></path>
                <path d="m12 17 .01 0"></path>
              </svg>
              <span><strong>安全提醒：</strong>请勿将此验证码告诉任何人，梦锡工作人员不会主动向您索要验证码。</span>
            </p>
          </div>
          
          <div class="security-tips">
            <div class="security-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="security-icon">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              安全小贴士
            </div>
            <ul class="security-list">
              <li>📱 定期更新您的账户密码</li>
              <li>🚫 不要在公共设备上保存登录信息</li>
              <li>⚠️ 发现异常活动请及时联系我们</li>
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
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .welcome-title { font-size: 24px; color: #1f2937; margin-bottom: 20px; text-align: center; }
        .features { margin: 30px 0; }
        .feature-item { 
          display: flex; 
          align-items: center; 
          margin: 20px 0; 
          padding: 20px; 
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        .feature-icon { 
          width: 48px; 
          height: 48px; 
          background: linear-gradient(135deg, #dbeafe, #bfdbfe); 
          border: 2px solid #3b82f6;
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          margin-right: 15px; 
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
          transition: all 0.3s ease;
        }
        .feature-icon svg {
          color: #1d4ed8;
          filter: drop-shadow(0 1px 2px rgba(59, 130, 246, 0.2));
        }
        .feature-text { flex: 1; }
        .feature-title { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
        .feature-desc { color: #6b7280; font-size: 14px; }
        .cta-button { 
          background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
          color: white; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 12px; 
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600; 
          font-size: 16px;
          text-align: center; 
          margin: 25px 0;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
          transform: translateY(0);
        }
        .cta-button:hover {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
        }
        .cta-button svg {
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        .celebration { 
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); 
          border: 2px solid #10b981; 
          border-radius: 16px; 
          padding: 30px; 
          margin: 25px 0; 
          text-align: center;
          box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15);
        }
        .celebration-icon { 
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px; 
          height: 80px; 
          background: linear-gradient(135deg, #ffffff, #f0fdf4); 
          border: 3px solid #10b981;
          border-radius: 50%; 
          margin: 0 auto 15px;
          box-shadow: 0 6px 24px rgba(16, 185, 129, 0.25);
          animation: celebrateIcon 2s ease-in-out infinite;
        }
        @keyframes celebrateIcon {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.05) rotate(5deg); }
          75% { transform: scale(1.05) rotate(-5deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">MXacc</div>
          <div class="subtitle">梦锡工作室账号系统</div>
        </div>
        
        <div class="content">
          <div class="celebration">
            <div class="celebration-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22,4 12,14.01 9,11.01"></polyline>
              </svg>
            </div>
            <h1 class="welcome-title">欢迎加入梦锡工作室，${username}！</h1>
            <p style="color: #10b981; font-weight: 600; margin: 10px 0 0 0;">邮箱验证成功</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 24px; margin: 30px 0; border: 1px solid #0ea5e9;">
            <p style="color: #1e40af; line-height: 1.6; text-align: center; margin: 0; font-size: 16px;">
              🎉 恭喜您成功注册梦锡账号！现在您可以享受我们提供的各种便捷服务。
            </p>
          </div>
          
          <div class="features">
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="m7 11 V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div class="feature-text">
                <div class="feature-title">安全可靠</div>
                <div class="feature-desc">企业级安全防护，保障您的账户安全</div>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
                </svg>
              </div>
              <div class="feature-text">
                <div class="feature-title">高效便捷</div>
                <div class="feature-desc">一键登录多个系统，提升使用效率</div>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="13.5" cy="6.5" r=".5"></circle>
                  <circle cx="17.5" cy="10.5" r=".5"></circle>
                  <circle cx="8.5" cy="7.5" r=".5"></circle>
                  <circle cx="6.5" cy="12.5" r=".5"></circle>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
                </svg>
              </div>
              <div class="feature-text">
                <div class="feature-title">现代设计</div>
                <div class="feature-desc">简洁美观的界面，带来愉悦的使用体验</div>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://mxacc.mxos.top'}/dashboard" class="cta-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;">
                <path d="M3 3h18v18H3z"></path>
                <path d="M9 9h6v6H9z"></path>
                <path d="M3 9h18"></path>
                <path d="M9 21V9"></path>
              </svg>
              立即体验
            </a>
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #10b981;">
            <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.5;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: middle; color: #10b981;">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              如果您有任何问题或建议，请随时联系我们。感谢您选择 MXacc！
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            此邮件由系统自动发送，请勿回复,如有疑问请联系我们QQ:915435295<br>
            © ${new Date().getFullYear()} 梦锡工作室MXOS. 保留所有权利
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