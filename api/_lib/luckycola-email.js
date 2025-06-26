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
      <title>MXacc 邮箱验证</title>
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
        .security-title { color: #065f46; font-weight: bold; margin-bottom: 10px; }
        .security-list { color: #047857; margin: 0; padding-left: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">MXacc</div>
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
            <div class="security-title">🔒 安全小贴士</div>
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
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .welcome-title { font-size: 24px; color: #1f2937; margin-bottom: 20px; text-align: center; }
        .features { margin: 30px 0; }
        .feature-item { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
        .feature-icon { width: 40px; height: 40px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; color: white; font-weight: bold; }
        .feature-text { flex: 1; }
        .feature-title { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
        .feature-desc { color: #6b7280; font-size: 14px; }
        .cta-button { background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; text-align: center; margin: 25px 0; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">MXacc</div>
          <div class="subtitle">梦锡工作室账号系统</div>
        </div>
        
        <div class="content">
          <h1 class="welcome-title">🎉 欢迎加入 梦锡工作室，${username}！</h1>
          
          <p style="color: #4b5563; line-height: 1.6; text-align: center;">
            恭喜您成功注册梦锡账号！现在您可以享受我们提供的各种便捷服务。
          </p>
          
          <div class="features">
            <div class="feature-item">
              <div class="feature-icon">🔐</div>
              <div class="feature-text">
                <div class="feature-title">安全可靠</div>
                <div class="feature-desc">企业级安全防护，保障您的账户安全</div>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">⚡</div>
              <div class="feature-text">
                <div class="feature-title">高效便捷</div>
                <div class="feature-desc">一键登录多个系统，提升使用效率</div>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">🎨</div>
              <div class="feature-text">
                <div class="feature-title">现代设计</div>
                <div class="feature-desc">简洁美观的界面，带来愉悦的使用体验</div>
              </div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'https://mxacc.mxos.top'}/dashboard" class="cta-button">
              立即体验
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
            如果您有任何问题或建议，请随时联系我们。感谢您选择 MXacc！
          </p>
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

  return await sendEmail(email, subject, htmlContent, true)
}

// 发送密码重置成功通知邮件
const sendPasswordResetSuccessEmail = async (email, username, resetInfo) => {
  const subject = '密码重置成功通知 - 梦锡账号'
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>密码重置成功通知</title>
      <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .success-icon { background: #d1fae5; border: 2px solid #10b981; border-radius: 50%; width: 80px; height: 80px; margin: 20px auto; display: flex; align-items: center; justify-content: center; font-size: 36px; color: #059669; }
        .info-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .info-title { color: #0369a1; font-weight: bold; margin-bottom: 10px; font-size: 16px; }
        .info-item { margin: 8px 0; color: #374151; }
        .info-label { font-weight: 600; color: #1f2937; display: inline-block; min-width: 80px; }
        .warning { background: #fef3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px; }
        .warning-text { color: #92400e; margin: 0; }
        .security-tips { background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .security-title { color: #065f46; font-weight: bold; margin-bottom: 10px; }
        .security-list { color: #047857; margin: 0; padding-left: 20px; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        .button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">✅ 密码重置成功</div>
          <div class="subtitle">梦锡工作室安全中心</div>
        </div>
        
        <div class="content">
          <div class="success-icon">🔒</div>
          
          <div class="greeting">
            您好 ${username}！
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; text-align: center; font-size: 16px;">
            您的梦锡账号密码已成功重置。为了您的账户安全，我们将此次操作的详细信息发送给您。
          </p>
          
          <div class="info-box">
            <div class="info-title">🔍 重置操作详情</div>
            <div class="info-item">
              <span class="info-label">操作时间：</span>
              ${resetInfo.timestamp}
            </div>
            <div class="info-item">
              <span class="info-label">IP 地址：</span>
              ${resetInfo.ip}
            </div>
            <div class="info-item">
              <span class="info-label">设备信息：</span>
              ${resetInfo.userAgent}
            </div>
            <div class="info-item">
              <span class="info-label">位置信息：</span>
              ${resetInfo.location || '未知位置'}
            </div>
            <div class="info-item">
              <span class="info-label">重置方式：</span>
              ${resetInfo.method === 'email' ? '邮箱验证码重置' : '安全中心重置'}
            </div>
          </div>
          
          <div class="warning">
            <p class="warning-text">
              <strong>⚠️ 重要提醒：</strong>如果这不是您本人的操作，请立即联系我们的客服团队，您的账户可能存在安全风险。
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'https://mxacc.mxos.top'}/security" class="button">
              查看安全中心
            </a>
          </div>
          
          <div class="security-tips">
            <div class="security-title">🛡️ 安全建议</div>
            <ul class="security-list">
              <li>定期更换密码，使用强密码组合</li>
              <li>不要在多个网站使用相同密码</li>
              <li>开启登录通知功能</li>
              <li>发现异常活动请及时联系我们</li>
              <li>不要在公共网络环境下进行敏感操作</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            此邮件由梦锡工作室安全系统自动发送，请勿回复<br>
            如有疑问请联系我们 QQ:915435295<br>
            © ${new Date().getFullYear()} 梦锡工作室. 保留所有权利
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const result = await sendEmail(email, subject, htmlContent, true)
    
    if (!result.success) {
      throw new Error(result.error || result.message || '邮件发送失败')
    }
    
    console.log('✅ 密码重置成功通知邮件发送成功:', email)
    return result
  } catch (error) {
    console.error('❌ 密码重置成功通知邮件发送失败:', error)
    throw error
  }
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetSuccessEmail
} 