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
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 0; padding: 0; background: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: 20px; margin-bottom: 20px; }
        .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; }
        .logo-icon { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-weight: bold; }
        .subtitle { color: #e1f5ff; font-size: 18px; font-weight: bold; margin: 10px 0 0 0; }
        .sub-subtitle { color: #b3e5ff; margin: 5px 0 0 0; font-size: 14px; }
        .content { padding: 40px 30px; }
        .welcome-section { text-align: center; margin-bottom: 20px; }
        .welcome-icon { display: inline-block; width: 20px; height: 20px; background: #4facfe; border-radius: 3px; margin-right: 8px; }
        .welcome-title { color: #333; margin-bottom: 20px; font-size: 20px; font-weight: bold; display: flex; align-items: center; justify-content: center; }
        .welcome-text { color: #666; line-height: 1.6; font-size: 16px; margin-bottom: 20px; }
        .features-box { background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4facfe; }
        .features-title { color: #1565c0; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center; }
        .features-title-icon { width: 16px; height: 16px; background: #1565c0; border-radius: 3px; margin-right: 8px; }
        .features-list { color: #333; line-height: 1.8; margin: 0; padding-left: 20px; }
        .features-list li { margin-bottom: 5px; }
        .cta-section { text-align: center; margin: 30px 0; }
        .cta-button { background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            欢迎加入
          </div>
          <div class="subtitle">梦锡工作室</div>
          <div class="sub-subtitle">MXacc 梦锡账号管理系统</div>
        </div>
        
        <div class="content">
          <div class="welcome-section">
            <h2 class="welcome-title">
              <div class="welcome-icon"></div>
              欢迎您的加入！
            </h2>
            <div class="welcome-text">尊敬的 <strong>${username}</strong>，</div>
            <div class="welcome-text">欢迎您加入梦锡工作室大家庭！您的账号已成功创建。</div>
          </div>
          
          <div class="features-box">
            <h3 class="features-title">
              <div class="features-title-icon"></div>
              您可以使用以下功能：
            </h3>
            <ul class="features-list">
              <li>个人资料管理</li>
              <li>安全设置配置</li>
              <li>登录历史查看</li>
              <li>账户安全中心</li>
            </ul>
          </div>

          <div class="cta-section">
            <a href="${process.env.FRONTEND_URL || 'https://mxacc.mxos.top'}/dashboard" class="cta-button">
              立即体验
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 14px; margin: 0; text-align: center;">
            此邮件由 <strong>梦锡工作室官方</strong> 发送<br>
            感谢您对我们的信任与支持
          </p>
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