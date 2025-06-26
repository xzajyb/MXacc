const clientPromise = require('../_lib/mongodb')
const { verifyToken, hashPassword } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

// 导入邮件服务
let sendEmail
try {
  const emailModule = require('../_lib/luckycola-email')
  sendEmail = emailModule.sendEmail
  console.log('✅ 邮件模块加载成功')
} catch (error) {
  console.error('❌ 无法导入邮件模块:', error)
  sendEmail = async () => {
    throw new Error('邮件服务配置错误，请检查配置文件')
  }
}

// 发送密码修改安全通知邮件
const sendPasswordChangeNotification = async (email, username, ip, userAgent) => {
  console.log('📧 准备发送密码修改安全通知到:', email)
  
  const subject = '梦锡账号 - 密码修改安全通知'
  
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
      <title>MXacc 密码修改安全通知</title>
      <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .alert-box { background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .alert-icon { font-size: 48px; margin-bottom: 15px; }
        .alert-title { font-size: 20px; font-weight: bold; color: #065f46; margin-bottom: 10px; }
        .alert-desc { color: #6b7280; font-size: 14px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
        .info-table th, .info-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .info-table th { background-color: #f9fafb; font-weight: bold; color: #374151; width: 120px; }
        .info-table td { color: #6b7280; }
        .security-tips { background: #fef3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .security-title { color: #92400e; font-weight: bold; margin-bottom: 10px; }
        .security-list { color: #d97706; margin: 0; padding-left: 20px; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        .action-button { background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">✅ 安全通知</div>
          <div class="subtitle">梦锡工作室</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            您好 ${username}！
          </div>
          
          <div class="alert-box">
            <div class="alert-icon">🔐</div>
            <div class="alert-title">您的账户密码已成功修改</div>
            <div class="alert-desc">密码修改操作已完成，如果这不是您本人的操作，请立即联系我们</div>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 25px 0;">
            为了您的账户安全，我们会在密码修改后向您发送通知。以下是本次修改的详细信息：
          </p>
          
          <table class="info-table">
            <tr>
              <th>修改时间</th>
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
            <div class="security-title">⚠️ 安全提醒</div>
            <ul class="security-list">
              <li>如果您没有进行此操作，说明您的账户可能被盗用</li>
              <li>请立即联系客服并检查您的登录历史</li>
              <li>建议定期更换密码并启用两步验证</li>
              <li>不要在不安全的网络环境下使用账户</li>
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
    
    console.log('✅ 密码修改安全通知发送成功:', email)
    return result
  } catch (error) {
    console.error('❌ 密码修改安全通知发送失败:', error)
    throw error
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '需要登录' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ message: 'Token无效' })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    const { type } = req.query || {}

    if (req.method === 'GET') {
      if (type === 'login-history') {
        // 获取登录历史
        const loginHistory = user.loginHistory || []
        const sortedHistory = loginHistory
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 50) // 最多返回50条记录

        return res.status(200).json({
          message: '获取登录历史成功',
          loginHistory: sortedHistory
        })
      } else {
        // 获取用户资料
        const profile = {
          id: user._id,
          username: user.username,
          email: user.email,
          isEmailVerified: user.isEmailVerified || false,
          role: user.role || 'user',
          profile: user.profile || {},
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }

        return res.status(200).json({
          message: '获取用户信息成功',
          user: profile
        })
      }
    }

    if (req.method === 'PUT') {
      const { type: bodyType, username, bio, currentPassword, newPassword } = req.body

      if (bodyType === 'change-password') {
        // 密码修改功能
        console.log('🔄 处理密码修改请求')

        if (!currentPassword || !newPassword) {
          return res.status(400).json({ 
            success: false, 
            message: '请提供当前密码和新密码' 
          })
        }

        if (newPassword.length < 6) {
          return res.status(400).json({ 
            success: false, 
            message: '新密码长度至少为6位' 
          })
        }

        // 验证当前密码
        const crypto = require('crypto')
        const currentPasswordHash = crypto.createHash('sha256').update(currentPassword).digest('hex')
        
        if (user.password !== currentPasswordHash) {
          return res.status(400).json({ 
            success: false, 
            message: '当前密码错误' 
          })
        }

        // 生成新密码哈希
        const newPasswordHash = await hashPassword(newPassword)

        // 获取客户端信息
        const clientIP = req.headers['x-forwarded-for'] || 
                         req.headers['x-real-ip'] || 
                         req.connection.remoteAddress || 
                         req.socket.remoteAddress ||
                         '未知'
        const userAgent = req.headers['user-agent'] || '未知设备'

        // 更新密码并记录安全日志
        await users.updateOne(
          { _id: user._id },
          {
            $set: {
              password: newPasswordHash,
              lastPasswordChange: new Date(),
              updatedAt: new Date()
            },
            $push: {
              securityLogs: {
                type: 'password_change',
                timestamp: new Date(),
                ip: clientIP,
                userAgent: userAgent,
                details: {
                  email: user.email,
                  changeMethod: 'security_center'
                }
              }
            }
          }
        )

        console.log('✅ 密码修改完成:', user.email)

        // 发送安全通知邮件（异步，不阻塞响应）
        sendPasswordChangeNotification(user.email, user.username, clientIP, userAgent).catch(error => {
          console.error('发送密码修改安全通知失败:', error)
        })

        return res.status(200).json({
          success: true,
          message: '密码修改成功，已发送安全通知邮件'
        })
      } else {
        // 更新用户资料
        const updateData = {}

        // 验证用户名
        if (username !== undefined) {
          if (!username || username.trim().length === 0) {
            return res.status(400).json({ message: '用户名不能为空' })
          }

          const trimmedUsername = username.trim()
          if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
            return res.status(400).json({ message: '用户名长度必须在2-20个字符之间' })
          }

          // 检查用户名是否已存在（除了当前用户）
          const existingUser = await users.findOne({
            username: trimmedUsername,
            _id: { $ne: user._id }
          })

          if (existingUser) {
            return res.status(400).json({ message: '用户名已存在' })
          }

          updateData.username = trimmedUsername
        }

        // 验证个人简介
        if (bio !== undefined) {
          if (bio && bio.length > 200) {
            return res.status(400).json({ message: '个人简介不能超过200个字符' })
          }
          updateData['profile.bio'] = bio || ''
        }

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ message: '没有需要更新的数据' })
        }

        // 更新数据库
        updateData.updatedAt = new Date()
        await users.updateOne({ _id: user._id }, { $set: updateData })

        // 返回更新后的用户信息
        const updatedUser = await users.findOne({ _id: user._id })
        const responseUser = {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          isEmailVerified: updatedUser.isEmailVerified || false,
          role: updatedUser.role || 'user',
          profile: updatedUser.profile || {},
          lastLogin: updatedUser.lastLogin,
          createdAt: updatedUser.createdAt
        }

        return res.status(200).json({
          message: '用户信息更新成功',
          user: responseUser
        })
      }
    }

    return res.status(405).json({ message: '方法不允许' })

  } catch (error) {
    console.error('用户资料API错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}