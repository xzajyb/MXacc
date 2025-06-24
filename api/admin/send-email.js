const clientPromise = require('../_lib/mongodb')
const { verifyToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

// 导入邮件服务
let sendEmail
try {
  const emailModule = require('../_lib/luckycola-email')
  sendEmail = emailModule.sendEmail
} catch (error) {
  console.error('无法导入邮件模块:', error)
  sendEmail = async () => {
    throw new Error('邮件服务配置错误，请检查配置文件')
  }
}

// 邮件模板
const EMAIL_TEMPLATES = {
  // 系统通知模板
  system_notification: {
    name: '系统通知',
    subject: '梦锡账号 - 系统通知',
    template: (data) => `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">梦锡工作室</h1>
          <p style="color: #e1e8ff; margin: 10px 0 0 0; font-size: 16px;">MXacc 梦锡账号管理系统</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">📢 系统通知</h2>
          <p style="color: #666; line-height: 1.6; font-size: 16px;">尊敬的用户 <strong>${data.username || '用户'}</strong>，您好！</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <div style="color: #333; line-height: 1.8; font-size: 15px;">
              ${data.content || '这是一条系统通知消息。'}
            </div>
          </div>
          ${data.actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">立即查看</a>
            </div>
          ` : ''}
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 14px; margin: 0;">
            此邮件由 <strong>梦锡工作室官方</strong> 发送<br>
            如有疑问，请联系我们的客服团队
          </p>
        </div>
      </div>
    `
  },

  // 账户安全提醒
  security_alert: {
    name: '安全提醒',
    subject: '梦锡账号 - 安全提醒',
    template: (data) => `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 安全提醒</h1>
          <p style="color: #ffe1e1; margin: 10px 0 0 0; font-size: 16px;">梦锡工作室团队</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">⚠️ 重要安全提醒</h2>
          <p style="color: #666; line-height: 1.6; font-size: 16px;">尊敬的用户 <strong>${data.username || '用户'}</strong>，</p>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <div style="color: #856404; line-height: 1.8; font-size: 15px;">
              <strong>🚨 检测到以下安全事件：</strong><br><br>
              ${data.content || '您的账户出现异常活动，请及时处理。'}
            </div>
          </div>
          <div style="background: #d1ecf1; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #0c5460; margin: 0; font-size: 14px;">
              <strong>建议操作：</strong><br>
              • 立即修改密码<br>
              • 检查登录记录<br>
              • 启用两步验证
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'https://mxacc.mxos.top'}/security" style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">立即处理</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 14px; margin: 0;">
            此邮件由 <strong>梦锡工作室官方</strong> 安全系统发送<br>
            请勿回复此邮件，如有疑问请联系客服
          </p>
        </div>
      </div>
    `
  },

  // 欢迎邮件
  welcome: {
    name: '欢迎邮件',
    subject: '欢迎加入梦锡账号！',
    template: (data) => `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 欢迎加入</h1>
          <p style="color: #e1f5ff; margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">梦锡工作室</p>
          <p style="color: #b3e5ff; margin: 5px 0 0 0; font-size: 14px;">MXacc 梦锡账号管理系统</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">👋 欢迎您的加入！</h2>
          <p style="color: #666; line-height: 1.6; font-size: 16px;">尊敬的 <strong>${data.username || '用户'}</strong>，</p>
          <p style="color: #666; line-height: 1.6; font-size: 16px;">欢迎您加入梦锡工作室大家庭！您的账号已成功创建。</p>
          
          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4facfe;">
            <h3 style="color: #1565c0; margin: 0 0 15px 0; font-size: 16px;">🌟 您可以使用以下功能：</h3>
            <ul style="color: #333; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>个人资料管理</li>
              <li>安全设置配置</li>
              <li>登录历史查看</li>
              <li>账户安全中心</li>
            </ul>
          </div>

          ${data.content ? `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="color: #333; line-height: 1.8; font-size: 15px;">
                ${data.content}
              </div>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'https://mxacc.mxos.top'}/dashboard" style="background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">开始使用</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 14px; margin: 0;">
            感谢您选择 <strong>梦锡工作室</strong><br>
            如有任何问题，我们的团队随时为您服务
          </p>
        </div>
      </div>
    `
  },

  // 自定义邮件
  custom: {
    name: '自定义邮件',
    subject: '梦锡工作室 - 重要通知',
    template: (data) => `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">梦锡工作室</h1>
          <p style="color: #e1e8ff; margin: 10px 0 0 0; font-size: 16px;">MXacc 梦锡账号管理系统</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">${data.title || '重要通知'}</h2>
          <p style="color: #666; line-height: 1.6; font-size: 16px;">尊敬的用户 <strong>${data.username || '用户'}</strong>，您好！</p>
          <div style="color: #333; line-height: 1.8; font-size: 15px; margin: 20px 0;">
            ${data.content || '这是一封来自梦锡工作室团队的邮件。'}
          </div>
          ${data.actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">${data.actionText || '查看详情'}</a>
            </div>
          ` : ''}
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 14px; margin: 0;">
            此邮件由 <strong>梦锡工作室官方</strong> 发送<br>
            感谢您对我们的信任与支持
          </p>
        </div>
      </div>
    `
  }
}

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 获取模板列表
  if (req.method === 'GET') {
    const templates = Object.keys(EMAIL_TEMPLATES).map(key => ({
      id: key,
      name: EMAIL_TEMPLATES[key].name,
      subject: EMAIL_TEMPLATES[key].subject
    }))
    
    return res.status(200).json({
      success: true,
      templates
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允许' })
  }

  try {
    // 验证管理员权限
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '需要管理员权限' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ message: 'Token无效' })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    // 检查管理员权限
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ 
        message: '权限不足，需要管理员权限',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    const { 
      recipients, // 收件人类型: 'all', 'selected', 'email'
      userIds = [], // 选中的用户ID列表
      customEmails = [], // 自定义邮箱列表
      template, // 邮件模板
      subject, // 自定义主题
      data = {} // 模板数据
    } = req.body

    // 验证必要参数
    if (!template || !EMAIL_TEMPLATES[template]) {
      return res.status(400).json({ 
        message: '无效的邮件模板',
        availableTemplates: Object.keys(EMAIL_TEMPLATES)
      })
    }

    // 获取收件人列表
    let recipientList = []

    if (recipients === 'all') {
      // 发送给所有用户
      const allUsers = await users.find({ isEmailVerified: true }).toArray()
      recipientList = allUsers.map(user => ({
        email: user.email,
        username: user.username
      }))
    } else if (recipients === 'selected' && userIds.length > 0) {
      // 发送给选中的用户
      const selectedUsers = await users.find({ 
        _id: { $in: userIds.map(id => new ObjectId(id)) },
        isEmailVerified: true 
      }).toArray()
      recipientList = selectedUsers.map(user => ({
        email: user.email,
        username: user.username
      }))
    } else if (recipients === 'email' && customEmails.length > 0) {
      // 发送给自定义邮箱
      recipientList = customEmails.map(email => ({
        email: email.trim(),
        username: '用户'
      }))
    } else {
      return res.status(400).json({ 
        message: '请选择有效的收件人',
        code: 'INVALID_RECIPIENTS'
      })
    }

    if (recipientList.length === 0) {
      return res.status(400).json({ 
        message: '没有找到有效的收件人',
        code: 'NO_RECIPIENTS'
      })
    }

    // 限制批量发送数量（防止滥用）
    if (recipientList.length > 100) {
      return res.status(400).json({ 
        message: '单次发送不能超过100个收件人',
        code: 'TOO_MANY_RECIPIENTS'
      })
    }

    const templateConfig = EMAIL_TEMPLATES[template]
    const emailSubject = subject || templateConfig.subject

    // 发送邮件
    const results = {
      total: recipientList.length,
      success: 0,
      failed: 0,
      errors: []
    }

    for (const recipient of recipientList) {
      try {
        const emailData = {
          username: recipient.username,
          ...data
        }
        
        const htmlContent = templateConfig.template(emailData)
        
        await sendEmail(recipient.email, emailSubject, htmlContent, true)
        results.success++
        
        // 记录发送日志
        console.log(`✅ 邮件发送成功: ${recipient.email}`)
        
      } catch (emailError) {
        results.failed++
        results.errors.push({
          email: recipient.email,
          error: emailError.message
        })
        console.error(`❌ 邮件发送失败: ${recipient.email}`, emailError.message)
      }

      // 添加发送间隔，避免频率限制
      if (recipientList.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1秒间隔
      }
    }

    // 记录管理员操作日志
    await users.updateOne(
      { _id: adminUser._id },
      {
        $push: {
          adminLogs: {
            action: 'send_email',
            template,
            recipients: recipients,
            recipientCount: recipientList.length,
            successCount: results.success,
            failedCount: results.failed,
            timestamp: new Date(),
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
          }
        }
      }
    )

    res.status(200).json({
      success: true,
      message: `邮件发送完成，成功：${results.success}，失败：${results.failed}`,
      results
    })

  } catch (error) {
    console.error('管理员邮件发送错误:', error)
    res.status(500).json({ 
      message: '邮件发送失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 