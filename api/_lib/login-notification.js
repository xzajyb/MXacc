const nodemailer = require('nodemailer')

// 邮件配置
const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'qrfuci164227@outlook.com',
    pass: process.env.EMAIL_PASS || 'tdrhcke6603'
  }
})

// 发送登录通知邮件
async function sendLoginNotification(email, loginInfo) {
  const { ip, userAgent, location, timestamp } = loginInfo
  
  const mailOptions = {
    from: `"梦锡账号安全" <${process.env.EMAIL_USER || 'qrfuci164227@outlook.com'}>`,
    to: email,
    subject: '🔐 新设备登录通知',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🔐 登录通知</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">检测到您的账户有新的登录活动</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-bottom: 15px; font-size: 20px;">登录详情</h2>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #4299e1;">
              <div style="margin-bottom: 12px;">
                <strong style="color: #2d3748;">🕐 登录时间：</strong>
                <span style="color: #4a5568;">${new Date(timestamp).toLocaleString('zh-CN')}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <strong style="color: #2d3748;">🌍 IP地址：</strong>
                <span style="color: #4a5568;">${ip}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <strong style="color: #2d3748;">📍 位置：</strong>
                <span style="color: #4a5568;">${location}</span>
              </div>
              
              <div style="margin-bottom: 0;">
                <strong style="color: #2d3748;">💻 设备信息：</strong>
                <span style="color: #4a5568;">${userAgent}</span>
              </div>
            </div>
          </div>
          
          <div style="background: #e6fffa; padding: 20px; border-radius: 8px; border-left: 4px solid #38b2ac; margin-bottom: 25px;">
            <h3 style="color: #234e52; margin: 0 0 10px 0; font-size: 16px;">✅ 这是您的登录吗？</h3>
            <p style="color: #2c7a7b; margin: 0; line-height: 1.5;">
              如果这是您本人的登录操作，请忽略此邮件。您的账户是安全的。
            </p>
          </div>
          
          <div style="background: #fed7d7; padding: 20px; border-radius: 8px; border-left: 4px solid #e53e3e; margin-bottom: 25px;">
            <h3 style="color: #742a2a; margin: 0 0 10px 0; font-size: 16px;">⚠️ 这不是您的登录？</h3>
            <p style="color: #c53030; margin: 0 0 15px 0; line-height: 1.5;">
              如果您没有进行此次登录，请立即采取以下措施：
            </p>
            <ul style="color: #c53030; margin: 0; padding-left: 20px;">
              <li>立即修改您的密码</li>
              <li>检查账户是否有异常活动</li>
              <li>联系我们的客服团队</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://mxacc.mxos.top/security" 
               style="background: #4299e1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              查看安全设置
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <div style="text-align: center; color: #718096; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">此邮件由梦锡账号安全系统自动发送</p>
            <p style="margin: 0;">如需帮助，请访问 <a href="https://mxacc.mxos.top" style="color: #4299e1;">梦锡账号</a></p>
          </div>
        </div>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`登录通知邮件已发送到: ${email}`)
    return { success: true }
  } catch (error) {
    console.error('发送登录通知邮件失败:', error)
    return { success: false, error: error.message }
  }
}

module.exports = {
  sendLoginNotification
}