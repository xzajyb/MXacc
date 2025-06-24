const { connectToDatabase } = require('./_lib/mongodb')
const jwt = require('jsonwebtoken')
const { ObjectId } = require('mongodb')
const { sendEmail } = require('./_lib/email')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 验证JWT token
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

// 验证管理员权限
function verifyAdmin(decoded) {
  return decoded.role === 'admin'
}

module.exports = async (req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { action } = req.query

  // 验证认证
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: '未提供认证令牌' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!verifyAdmin(decoded)) {
      return res.status(403).json({ message: '权限不足，需要管理员权限' })
    }

    const { db } = await connectToDatabase()

    switch (action) {
      case 'users':
        return await handleUsers(req, res, db)
      case 'send-email':
        return await handleSendEmail(req, res, db)
      case 'stats':
        return await handleStats(req, res, db)
      default:
        // 兼容原有API，默认返回统计信息
        return await handleStats(req, res, db)
    }
  } catch (error) {
    console.error('Admin API Error:', error)
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '认证令牌无效' })
    }
    return res.status(500).json({ message: '服务器错误' })
  }
}

// 用户管理处理
async function handleUsers(req, res, db) {
  if (req.method === 'GET') {
    try {
      const users = await db.collection('users')
        .find({}, { 
          projection: { 
            password: 0, 
            emailVerificationCode: 0 
          } 
        })
        .sort({ createdAt: -1 })
        .toArray()

      return res.status(200).json({ users })
    } catch (error) {
      console.error('获取用户列表失败:', error)
      return res.status(500).json({ message: '获取用户列表失败' })
    }
  }

  if (req.method === 'PUT') {
    const { userId, updates } = req.body

    if (!userId || !updates) {
      return res.status(400).json({ message: '用户ID和更新数据不能为空' })
    }

    try {
      // 过滤掉不允许修改的字段
      const allowedUpdates = {}
      if (updates.username) allowedUpdates.username = updates.username
      if (updates.role) allowedUpdates.role = updates.role
      if (typeof updates.isEmailVerified === 'boolean') {
        allowedUpdates.isEmailVerified = updates.isEmailVerified
      }

      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: allowedUpdates }
      )

      return res.status(200).json({ message: '用户信息更新成功' })
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return res.status(500).json({ message: '更新用户信息失败' })
    }
  }

  if (req.method === 'DELETE') {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ message: '用户ID不能为空' })
    }

    try {
      const result = await db.collection('users').deleteOne({
        _id: new ObjectId(userId)
      })

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: '用户不存在' })
      }

      return res.status(200).json({ message: '用户删除成功' })
    } catch (error) {
      console.error('删除用户失败:', error)
      return res.status(500).json({ message: '删除用户失败' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

// 邮件发送处理
async function handleSendEmail(req, res, db) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { template, recipients, subject, customContent } = req.body

  if (!template || !recipients || recipients.length === 0) {
    return res.status(400).json({ message: '模板、收件人不能为空' })
  }

  try {
    let emailContent = ''
    let emailSubject = subject || '来自 MXAcc 的消息'

    // 根据模板生成邮件内容
    switch (template) {
      case 'welcome':
        emailSubject = subject || '欢迎加入 MXAcc'
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">欢迎加入 MXAcc！</h2>
            <p>尊敬的用户，</p>
            <p>欢迎您加入 MXAcc 账号管理系统。我们很高兴为您提供安全、便捷的账号管理服务。</p>
            ${customContent ? `<div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">${customContent}</div>` : ''}
            <p>如果您有任何问题，请随时联系我们的支持团队。</p>
            <p>祝您使用愉快！</p>
            <hr style="margin: 30px 0; border: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">此邮件由 MXAcc 系统发送。</p>
          </div>
        `
        break
      case 'announcement':
        emailSubject = subject || 'MXAcc 系统公告'
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">系统公告</h2>
            <p>尊敬的用户，</p>
            ${customContent ? `<div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">${customContent}</div>` : '<p>我们有重要信息需要通知您。</p>'}
            <p>感谢您对 MXAcc 的支持。</p>
            <hr style="margin: 30px 0; border: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">此邮件由 MXAcc 系统发送。</p>
          </div>
        `
        break
      case 'maintenance':
        emailSubject = subject || 'MXAcc 系统维护通知'
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">系统维护通知</h2>
            <p>尊敬的用户，</p>
            <p>我们将对 MXAcc 系统进行维护升级，在此期间服务可能暂时不可用。</p>
            ${customContent ? `<div style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border-left: 4px solid #dc3545;">${customContent}</div>` : ''}
            <p>我们对可能造成的不便深表歉意，感谢您的理解。</p>
            <hr style="margin: 30px 0; border: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">此邮件由 MXAcc 系统发送。</p>
          </div>
        `
        break
      case 'security':
        emailSubject = subject || 'MXAcc 安全提醒'
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">安全提醒</h2>
            <p>尊敬的用户，</p>
            <p>这是一条重要的安全提醒，请仔细阅读。</p>
            ${customContent ? `<div style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border-left: 4px solid #dc3545;">${customContent}</div>` : ''}
            <p>如果您未进行相关操作，请立即联系我们的支持团队。</p>
            <hr style="margin: 30px 0; border: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">此邮件由 MXAcc 系统发送。</p>
          </div>
        `
        break
      case 'custom':
      default:
        emailContent = customContent || '这是一封来自 MXAcc 的邮件。'
        break
    }

    // 批量发送邮件
    const sendPromises = recipients.map(email => 
      sendEmail({
        to: email,
        subject: emailSubject,
        html: emailContent
      })
    )

    await Promise.all(sendPromises)

    return res.status(200).json({ 
      message: `邮件发送成功，共发送 ${recipients.length} 封`,
      count: recipients.length
    })
  } catch (error) {
    console.error('发送邮件失败:', error)
    return res.status(500).json({ message: '发送邮件失败', error: error.message })
  }
}

// 统计信息处理
async function handleStats(req, res, db) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // 获取用户统计
    const totalUsers = await db.collection('users').countDocuments()
    const verifiedUsers = await db.collection('users').countDocuments({ isEmailVerified: true })
    const adminUsers = await db.collection('users').countDocuments({ role: 'admin' })
    
    // 获取最近30天注册的用户数
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentUsers = await db.collection('users').countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    })

    // 获取最近登录用户数（最近7天）
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const activeUsers = await db.collection('users').countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    })

    return res.status(200).json({
      stats: {
        totalUsers,
        verifiedUsers,
        adminUsers,
        recentUsers,
        activeUsers,
        unverifiedUsers: totalUsers - verifiedUsers
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('获取统计信息失败:', error)
    return res.status(500).json({ message: '获取统计信息失败' })
  }
} 