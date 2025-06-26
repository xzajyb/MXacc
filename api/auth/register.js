const clientPromise = require('../_lib/mongodb')
const { hashPassword, generateToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

// 导入邮件服务
let sendWelcomeEmail, sendEmail
try {
  const emailModule = require('../_lib/luckycola-email')
  sendWelcomeEmail = emailModule.sendWelcomeEmail
  sendEmail = emailModule.sendEmail
  console.log('✅ 邮件模块加载成功')
} catch (error) {
  console.error('❌ 无法导入邮件模块:', error)
  sendWelcomeEmail = async () => {
    console.log('邮件服务不可用，跳过欢迎邮件发送')
    return { success: false, error: '邮件服务不可用' }
  }
  sendEmail = async () => {
    throw new Error('邮件服务配置错误，请检查配置文件')
  }
}

// 生成6位数字验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 发送密码重置邮件模板
const sendPasswordResetEmail = async (email, code, username = '') => {
  console.log('📧 准备发送密码重置邮件到:', email)
  
  const subject = '梦锡账号 - 密码重置验证码'
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MXacc 密码重置</title>
      <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
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
        .security-title { color: #7f1d1d; font-weight: bold; margin-bottom: 10px; }
        .security-list { color: #991b1b; margin: 0; padding-left: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 密码重置</div>
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
            <div class="security-title">🛡️ 安全建议</div>
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

  try {
    const result = await sendEmail(email, subject, htmlContent, true)
    
    if (!result.success) {
      throw new Error(result.error || result.message || '邮件发送失败')
    }
    
    console.log('✅ 密码重置邮件发送成功:', email)
    return result
  } catch (error) {
    console.error('❌ 密码重置邮件发送失败:', error)
    throw error
  }
}

// 发送密码重置安全通知邮件
const sendPasswordResetNotification = async (email, username, ip, userAgent) => {
  console.log('📧 准备发送密码重置安全通知到:', email)
  
  const subject = '梦锡账号 - 密码重置安全通知'
  
  // 解析设备信息
  const getDeviceInfo = (userAgent) => {
    const ua = userAgent.toLowerCase()
    let device = '未知设备'
    let os = '未知系统'
    let browser = '未知浏览器'

    // 检测设备类型
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      device = '移动设备'
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      device = '平板设备'
    } else {
      device = '桌面设备'
    }

    // 检测操作系统
    if (ua.includes('windows')) os = 'Windows'
    else if (ua.includes('mac')) os = 'macOS'
    else if (ua.includes('linux')) os = 'Linux'
    else if (ua.includes('android')) os = 'Android'
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'

    // 检测浏览器
    if (ua.includes('chrome')) browser = 'Chrome'
    else if (ua.includes('firefox')) browser = 'Firefox'
    else if (ua.includes('safari')) browser = 'Safari'
    else if (ua.includes('edge')) browser = 'Edge'

    return { device, os, browser }
  }

  const deviceInfo = getDeviceInfo(userAgent)
  const timestamp = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MXacc 密码重置安全通知</title>
      <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .alert-box { background: #fef3cd; border: 2px solid #f59e0b; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .alert-icon { font-size: 48px; margin-bottom: 15px; }
        .alert-title { font-size: 20px; font-weight: bold; color: #92400e; margin-bottom: 10px; }
        .alert-desc { color: #6b7280; font-size: 14px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
        .info-table th, .info-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .info-table th { background-color: #f9fafb; font-weight: bold; color: #374151; width: 120px; }
        .info-table td { color: #6b7280; }
        .security-tips { background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .security-title { color: #065f46; font-weight: bold; margin-bottom: 10px; }
        .security-list { color: #047857; margin: 0; padding-left: 20px; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        .action-button { background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 安全通知</div>
          <div class="subtitle">梦锡工作室</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            您好 ${username}！
          </div>
          
          <div class="alert-box">
            <div class="alert-icon">🛡️</div>
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
              <td>${deviceInfo.device}</td>
            </tr>
            <tr>
              <th>操作系统</th>
              <td>${deviceInfo.os}</td>
            </tr>
            <tr>
              <th>浏览器</th>
              <td>${deviceInfo.browser}</td>
            </tr>
          </table>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'https://mxacc.mxos.top'}/security" class="action-button">
              查看安全中心
            </a>
          </div>
          
          <div class="security-tips">
            <div class="security-title">🔒 安全建议</div>
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

  try {
    const result = await sendEmail(email, subject, htmlContent, true)
    
    if (!result.success) {
      throw new Error(result.error || result.message || '邮件发送失败')
    }
    
    console.log('✅ 密码重置安全通知发送成功:', email)
    return result
  } catch (error) {
    console.error('❌ 密码重置安全通知发送失败:', error)
    throw error
  }
}

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  console.log('=== Auth Register API Start ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method)
    return res.status(405).json({ success: false, message: '方法不允许' })
  }

  try {
    // 检查环境变量
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI 环境变量未设置')
      return res.status(500).json({
        success: false,
        message: '数据库配置错误'
      })
    }

    const { action = 'register', username, email, password, code, newPassword } = req.body

    console.log('📝 Request data:', { 
      action,
      username: username ? username.substring(0, 3) + '***' : undefined,
      email: email ? email.substring(0, 3) + '***' : undefined, 
      hasPassword: !!password,
      hasCode: !!code, 
      hasNewPassword: !!newPassword 
    })

    // 连接数据库
    console.log('🔌 连接数据库...')
    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')
    console.log('✅ 数据库连接成功')

    if (action === 'register') {
      // 用户注册逻辑
      console.log('📝 处理用户注册')

      // 验证输入
      if (!username || !email || !password) {
        console.log('❌ 缺少必填字段')
        return res.status(400).json({ success: false, message: '请填写所有必填字段' })
      }

      if (password.length < 6) {
        console.log('❌ 密码长度不足')
        return res.status(400).json({ success: false, message: '密码至少需要6个字符' })
      }

      // 检查用户是否已存在
      console.log('🔍 检查用户是否存在')
      const existingUser = await users.findOne({
        $or: [{ email }, { username }]
      })

      if (existingUser) {
        console.log('❌ 用户已存在')
        return res.status(400).json({ 
          success: false,
          message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用' 
        })
      }

      // 检查是否是第一个用户（自动设为管理员）
      const userCount = await users.countDocuments()
      const isFirstUser = userCount === 0

      console.log('👤 创建新用户，是否为首个用户:', isFirstUser)

      // 创建新用户
      const hashedPassword = await hashPassword(password)
      const newUser = {
        username,
        email,
        password: hashedPassword,
        role: isFirstUser ? 'admin' : 'user', // 第一个用户为管理员
        isEmailVerified: isFirstUser ? true : false, // 管理员自动验证
        status: 'active',
        loginAttempts: 0,
        createdAt: new Date(),
        profile: {
          displayName: username,
          nickname: username,
          avatar: null,
          bio: null,
          location: null,
          website: null
        }
      }

      const result = await users.insertOne(newUser)
      const token = generateToken(result.insertedId)

      // 发送欢迎邮件（异步，不阻塞响应）
      sendWelcomeEmail(email, username).catch(error => {
        console.error('发送欢迎邮件失败:', error)
      })

      console.log('✅ 用户注册成功:', username)

      return res.status(201).json({
        success: true,
        message: '注册成功',
        token,
        needsEmailVerification: !newUser.isEmailVerified,
        user: {
          id: result.insertedId,
          username,
          email,
          role: newUser.role,
          isEmailVerified: newUser.isEmailVerified,
          profile: newUser.profile
        }
      })

    } else if (action === 'send-reset-code') {
      // 发送密码重置验证码
      console.log('📧 处理发送密码重置验证码')

      if (!email) {
        console.log('❌ 缺少邮箱地址')
        return res.status(400).json({ 
          success: false, 
          message: '请提供邮箱地址' 
        })
      }

      // 检查邮箱是否存在
      console.log('🔍 查找用户:', email)
      const user = await users.findOne({ email: email.toLowerCase() })
      if (!user) {
        console.log('❌ 用户不存在:', email)
        return res.status(400).json({ 
          success: false, 
          message: '该邮箱地址未注册' 
        })
      }

      console.log('✅ 找到用户:', user.username)

      // 生成验证码
      const verificationCode = generateVerificationCode()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10分钟有效期

      console.log('🔢 生成验证码:', verificationCode)

      // 保存验证码到数据库
      console.log('💾 保存验证码到数据库...')
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetCode: verificationCode,
            passwordResetExpires: expiresAt,
            passwordResetAttempts: 0
          }
        }
      )

      // 发送邮件
      try {
        console.log('📧 发送邮件...')
        await sendPasswordResetEmail(email, verificationCode, user.username)
        
        console.log('✅ 密码重置邮件发送成功')
        
        return res.status(200).json({
          success: true,
          message: '验证码已发送到您的邮箱，请查收'
        })
      } catch (emailError) {
        console.error('❌ 邮件发送失败:', emailError)
        return res.status(500).json({
          success: false,
          message: '邮件发送失败，请稍后重试',
          error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        })
      }

    } else if (action === 'verify-reset-code') {
      // 验证密码重置验证码
      console.log('🔍 处理验证密码重置验证码')

      if (!email || !code) {
        console.log('❌ 缺少邮箱或验证码')
        return res.status(400).json({
          success: false,
          message: '请提供邮箱和验证码'
        })
      }

      const user = await users.findOne({ email: email.toLowerCase() })
      if (!user) {
        console.log('❌ 用户不存在')
        return res.status(400).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 检查验证码
      if (!user.passwordResetCode) {
        console.log('❌ 无验证码记录')
        return res.status(400).json({
          success: false,
          message: '请先请求密码重置'
        })
      }

      if (user.passwordResetExpires < new Date()) {
        console.log('❌ 验证码已过期')
        return res.status(400).json({
          success: false,
          message: '验证码已过期，请重新请求'
        })
      }

      if (user.passwordResetCode !== code) {
        console.log('❌ 验证码错误')
        // 增加尝试次数
        await users.updateOne(
          { _id: user._id },
          { $inc: { passwordResetAttempts: 1 } }
        )

        return res.status(400).json({
          success: false,
          message: '验证码错误'
        })
      }

      console.log('✅ 验证码验证成功')
      return res.status(200).json({
        success: true,
        message: '验证码验证成功，请设置新密码'
      })

    } else if (action === 'reset-password') {
      // 重置密码
      console.log('🔄 处理密码重置')

      if (!email || !code || !newPassword) {
        console.log('❌ 缺少必要参数')
        return res.status(400).json({
          success: false,
          message: '请提供完整信息'
        })
      }

      const user = await users.findOne({ email: email.toLowerCase() })
      if (!user) {
        console.log('❌ 用户不存在')
        return res.status(400).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 再次验证验证码
      if (!user.passwordResetCode || user.passwordResetCode !== code) {
        console.log('❌ 验证码无效')
        return res.status(400).json({
          success: false,
          message: '验证码无效'
        })
      }

      if (user.passwordResetExpires < new Date()) {
        console.log('❌ 验证码已过期')
        return res.status(400).json({
          success: false,
          message: '验证码已过期'
        })
      }

      // 验证新密码强度
      if (newPassword.length < 6) {
        console.log('❌ 密码长度不足')
        return res.status(400).json({
          success: false,
          message: '密码长度至少为6位'
        })
      }

      // 使用与注册相同的密码哈希方法
      const hashedPassword = await hashPassword(newPassword)

      // 获取客户端信息
      const clientIP = req.headers['x-forwarded-for'] || 
                       req.headers['x-real-ip'] || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress ||
                       '未知'
      const userAgent = req.headers['user-agent'] || '未知设备'

      // 更新密码并清除重置信息，同时记录安全日志
      console.log('🔄 更新密码...')
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedPassword,
            lastPasswordChange: new Date()
          },
          $unset: {
            passwordResetCode: '',
            passwordResetExpires: '',
            passwordResetAttempts: ''
          },
          $push: {
            securityLogs: {
              type: 'password_reset',
              timestamp: new Date(),
              ip: clientIP,
              userAgent: userAgent,
              details: {
                email: email,
                resetMethod: 'email_verification'
              }
            }
          }
        }
      )

      console.log('✅ 密码重置完成:', user.email)

      // 发送安全通知邮件（异步，不阻塞响应）
      sendPasswordResetNotification(email, user.username, clientIP, userAgent).catch(error => {
        console.error('发送密码重置安全通知失败:', error)
      })

      return res.status(200).json({
        success: true,
        message: '密码重置成功，请使用新密码登录'
      })

    } else {
      console.log('❌ 无效的操作类型:', action)
      return res.status(400).json({
        success: false,
        message: '无效的操作类型'
      })
    }

  } catch (error) {
    console.error('=== Auth Register API Error ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // 区分不同类型的错误
    let errorMessage = '服务器内部错误'
    let statusCode = 500

    if (error.name === 'MongoNetworkError' || error.message.includes('connection')) {
      errorMessage = '数据库连接失败'
      console.error('❌ 数据库连接错误')
    } else if (error.message.includes('邮件')) {
      errorMessage = '邮件发送失败'
      console.error('❌ 邮件服务错误')
    }
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 