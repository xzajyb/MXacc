const nodemailer = require('nodemailer');

// 创建邮件传输器
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// 邮件模板
const emailTemplates = {
  emailVerification: (data) => ({
    subject: '验证您的梦锡账号邮箱',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>邮箱验证 - 梦锡工作室</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
          .logo { color: #ffffff; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .header-subtitle { color: #e2e8f0; font-size: 16px; }
          .content { padding: 40px 30px; }
          .title { font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 20px; }
          .text { font-size: 16px; color: #4a5568; line-height: 1.6; margin-bottom: 25px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; text-align: center; }
          .button:hover { opacity: 0.9; }
          .footer { background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer-text { font-size: 14px; color: #718096; }
          .warning { background-color: #fef5e7; border: 1px solid #f6e05e; border-radius: 8px; padding: 20px; margin-top: 25px; }
          .warning-text { font-size: 14px; color: #744210; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">梦锡工作室</div>
            <div class="header-subtitle">MXAcc 账号管理系统</div>
          </div>
          <div class="content">
            <h1 class="title">验证您的邮箱地址</h1>
            <p class="text">Hi ${data.username}，</p>
            <p class="text">感谢您注册梦锡账号！为了保护您的账户安全，请点击下方按钮验证您的邮箱地址：</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.verificationUrl}" class="button">验证邮箱</a>
            </p>
            <p class="text">或者您也可以复制以下链接到浏览器中打开：</p>
            <p style="word-break: break-all; background-color: #f7fafc; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px;">
              ${data.verificationUrl}
            </p>
            <div class="warning">
              <p class="warning-text">
                <strong>注意：</strong><br>
                • 此验证链接将在24小时后过期<br>
                • 如果您没有注册梦锡账号，请忽略此邮件<br>
                • 请勿将此链接转发给他人
              </p>
            </div>
          </div>
          <div class="footer">
            <p class="footer-text">
              此邮件由梦锡工作室自动发送，请勿回复。<br>
              如有疑问，请访问 <a href="https://mxos.top" style="color: #667eea;">mxos.top</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordReset: (data) => ({
    subject: '重置您的梦锡账号密码',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>密码重置 - 梦锡工作室</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
          .logo { color: #ffffff; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .header-subtitle { color: #e2e8f0; font-size: 16px; }
          .content { padding: 40px 30px; }
          .title { font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 20px; }
          .text { font-size: 16px; color: #4a5568; line-height: 1.6; margin-bottom: 25px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; text-align: center; }
          .button:hover { opacity: 0.9; }
          .footer { background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer-text { font-size: 14px; color: #718096; }
          .warning { background-color: #fed7d7; border: 1px solid #fc8181; border-radius: 8px; padding: 20px; margin-top: 25px; }
          .warning-text { font-size: 14px; color: #742a2a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">梦锡工作室</div>
            <div class="header-subtitle">MXAcc 账号管理系统</div>
          </div>
          <div class="content">
            <h1 class="title">重置您的密码</h1>
            <p class="text">Hi ${data.username}，</p>
            <p class="text">我们收到了您的密码重置请求。点击下方按钮设置新密码：</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" class="button">重置密码</a>
            </p>
            <p class="text">或者您也可以复制以下链接到浏览器中打开：</p>
            <p style="word-break: break-all; background-color: #f7fafc; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px;">
              ${data.resetUrl}
            </p>
            <div class="warning">
              <p class="warning-text">
                <strong>安全提醒：</strong><br>
                • 此重置链接将在1小时后过期<br>
                • 如果您没有申请重置密码，请忽略此邮件<br>
                • 请勿将此链接转发给他人<br>
                • 建议设置包含大小写字母、数字和特殊字符的强密码
              </p>
            </div>
          </div>
          <div class="footer">
            <p class="footer-text">
              此邮件由梦锡工作室自动发送，请勿回复。<br>
              如有疑问，请访问 <a href="https://mxos.top" style="color: #667eea;">mxos.top</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// 发送邮件
const sendEmail = async ({ to, subject, template, data }) => {
  try {
    const transporter = createTransporter();
    
    let emailContent;
    if (template && emailTemplates[template]) {
      emailContent = emailTemplates[template](data);
      subject = emailContent.subject;
    }
    
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html: emailContent?.html || data?.html || '',
      text: data?.text || ''
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);
    return info;
  } catch (error) {
    console.error('邮件发送失败:', error);
    throw error;
  }
};

// 验证邮件服务配置
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ 邮件服务配置正确');
    return true;
  } catch (error) {
    console.error('❌ 邮件服务配置错误:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  verifyEmailConfig
}; 