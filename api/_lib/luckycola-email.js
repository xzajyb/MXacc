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
      <title>欢迎加入 MXacc</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Helvetica, Arial, sans-serif; 
          margin: 0; 
          padding: 40px 20px; 
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
          line-height: 1.6;
          color: #334155;
        }
        .container { 
          max-width: 500px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 20px 40px rgba(0,0,0,0.08); 
          border: 1px solid #e2e8f0;
        }
        .header { 
          padding: 48px 32px 32px; 
          text-align: center; 
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-bottom: 1px solid #f1f5f9;
        }
        .logo-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
        }
        .welcome-title { 
          font-size: 24px; 
          font-weight: 600; 
          color: #1e293b; 
          margin: 0 0 8px; 
          letter-spacing: -0.025em;
        }
        .welcome-subtitle { 
          color: #64748b; 
          font-size: 16px; 
          margin: 0;
          font-weight: 400;
        }
        .content { 
          padding: 32px; 
        }
        .welcome-message {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin-bottom: 32px;
        }
        .welcome-text {
          color: #0f172a;
          font-size: 16px;
          margin: 0;
          font-weight: 500;
        }
        .features { 
          margin: 32px 0; 
        }
        .feature-item { 
          display: flex; 
          align-items: flex-start; 
          margin-bottom: 24px; 
          padding: 0;
        }
        .feature-icon { 
          width: 40px; 
          height: 40px; 
          background: #f1f5f9;
          border-radius: 10px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          margin-right: 16px; 
          flex-shrink: 0;
          border: 1px solid #e2e8f0;
        }
        .feature-text { 
          flex: 1; 
          padding-top: 2px;
        }
        .feature-title { 
          font-size: 15px; 
          font-weight: 600; 
          color: #1e293b; 
          margin: 0 0 4px; 
        }
        .feature-desc { 
          font-size: 14px; 
          color: #64748b; 
          margin: 0;
          font-weight: 400;
        }
        .cta-section {
          text-align: center;
          margin: 40px 0 32px;
          padding: 24px;
          background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%);
          border-radius: 12px;
          border: 1px solid #e4e4e7;
        }
        .cta-button { 
          display: inline-block; 
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white; 
          padding: 14px 32px; 
          text-decoration: none; 
          border-radius: 10px; 
          font-weight: 600; 
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transition: all 0.2s ease;
          border: 1px solid #2563eb;
        }
        .cta-button:hover { 
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }
        .footer { 
          background: #f8fafc; 
          padding: 24px 32px; 
          text-align: center; 
          border-top: 1px solid #f1f5f9; 
        }
        .footer-text { 
          color: #64748b; 
          font-size: 13px; 
          margin: 0; 
          line-height: 1.5;
        }
        @media (max-width: 600px) {
          body { padding: 20px 10px; }
          .container { margin: 0 10px; }
          .header { padding: 32px 24px 24px; }
          .content { padding: 24px; }
          .welcome-title { font-size: 22px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h1 class="welcome-title">欢迎加入 MXacc</h1>
          <p class="welcome-subtitle">您的账户已成功创建</p>
        </div>
        
        <div class="content">
          <div class="welcome-message">
            <p class="welcome-text">
              您好 ${username}，感谢您选择梦锡工作室的服务！
            </p>
          </div>
          
          <div class="features">
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="m7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div class="feature-text">
                <div class="feature-title">安全保障</div>
                <div class="feature-desc">企业级加密技术，确保您的数据安全</div>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"></polyline>
                </svg>
              </div>
              <div class="feature-text">
                <div class="feature-title">高效便捷</div>
                <div class="feature-desc">简化工作流程，提升您的使用效率</div>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10 9 10s9-4.45 9-10V7z"></path>
                  <path d="M9 12l2 2 4-4"></path>
                </svg>
              </div>
              <div class="feature-text">
                <div class="feature-title">可靠服务</div>
                <div class="feature-desc">7x24小时稳定运行，随时为您服务</div>
              </div>
            </div>
          </div>
          
          <div class="cta-section">
            <a href="${process.env.FRONTEND_URL || 'https://mxacc.mxos.top'}/dashboard" class="cta-button">
              开始使用
            </a>
            <p style="color: #64748b; font-size: 13px; margin: 16px 0 0; line-height: 1.5;">
              点击上方按钮即可访问您的个人仪表板
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            如有疑问请联系客服 QQ: 915435295<br>
            © ${new Date().getFullYear()} 梦锡工作室 · 专业可靠的技术服务
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