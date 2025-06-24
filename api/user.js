const { connectToDatabase } = require('./_lib/mongodb')
const jwt = require('jsonwebtoken')
const { ObjectId } = require('mongodb')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 验证JWT token
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
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
    const { db } = await connectToDatabase()

    switch (action) {
      case 'profile':
        return await handleProfile(req, res, db, decoded.userId)
      case 'settings':
        return await handleSettings(req, res, db, decoded.userId)
      case 'security-settings':
        return await handleSecuritySettings(req, res, db, decoded.userId)
      case 'upload-avatar':
        return await handleUploadAvatar(req, res, db, decoded.userId)
      case 'login-history':
        return await handleLoginHistory(req, res, db, decoded.userId)
      default:
        return res.status(400).json({ message: '无效的操作' })
    }
  } catch (error) {
    console.error('User API Error:', error)
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '认证令牌无效' })
    }
    return res.status(500).json({ message: '服务器错误' })
  }
}

// 个人资料处理
async function handleProfile(req, res, db, userId) {
  if (req.method === 'GET') {
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0, emailVerificationCode: 0 } }
    )
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    return res.status(200).json({ user })
  }

  if (req.method === 'PUT') {
    const { username, bio } = req.body

    if (!username) {
      return res.status(400).json({ message: '用户名不能为空' })
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          username,
          'profile.bio': bio || ''
        } 
      }
    )

    return res.status(200).json({ message: '个人资料更新成功' })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

// 设置处理
async function handleSettings(req, res, db, userId) {
  if (req.method === 'GET') {
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { settings: 1 } }
    )
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    return res.status(200).json({ 
      settings: user.settings || {
        theme: 'auto',
        notifications: { email: true, browser: true, marketing: false },
        privacy: { profileVisible: true, activityVisible: false, allowDataCollection: true },
        language: 'zh-CN',
        timezone: 'Asia/Shanghai'
      }
    })
  }

  if (req.method === 'PUT') {
    const { settings } = req.body

    if (!settings) {
      return res.status(400).json({ message: '设置数据不能为空' })
    }

    // 验证设置数据结构
    const validatedSettings = {
      theme: settings.theme || 'auto',
      notifications: {
        email: settings.notifications?.email ?? true,
        browser: settings.notifications?.browser ?? true,
        marketing: settings.notifications?.marketing ?? false
      },
      privacy: {
        profileVisible: settings.privacy?.profileVisible ?? true,
        activityVisible: settings.privacy?.activityVisible ?? false,
        allowDataCollection: settings.privacy?.allowDataCollection ?? true
      },
      language: settings.language || 'zh-CN',
      timezone: settings.timezone || 'Asia/Shanghai'
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { settings: validatedSettings } }
    )

    return res.status(200).json({ 
      message: '设置保存成功',
      settings: validatedSettings
    })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

// 安全设置处理
async function handleSecuritySettings(req, res, db, userId) {
  if (req.method === 'GET') {
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { securitySettings: 1 } }
    )
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    return res.status(200).json({ 
      securitySettings: user.securitySettings || { loginNotifications: false }
    })
  }

  if (req.method === 'PUT') {
    const { loginNotifications } = req.body

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          'securitySettings.loginNotifications': loginNotifications === true
        } 
      }
    )

    return res.status(200).json({ message: '安全设置更新成功' })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

// 头像上传处理
async function handleUploadAvatar(req, res, db, userId) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { avatar, remove } = req.body

  if (remove) {
    // 移除头像
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { 'profile.avatar': null } }
    )
    return res.status(200).json({ message: '头像已移除', avatar: null })
  }

  if (!avatar) {
    return res.status(400).json({ message: '头像数据不能为空' })
  }

  // 验证base64格式
  if (!avatar.startsWith('data:image/')) {
    return res.status(400).json({ message: '无效的图片格式' })
  }

  // 检查文件大小（base64编码后大约比原文件大1.37倍）
  const sizeInBytes = (avatar.length * 0.75) // 大概估算
  const maxSize = 2 * 1024 * 1024 // 2MB
  
  if (sizeInBytes > maxSize) {
    return res.status(400).json({ message: '文件大小超过2MB限制' })
  }

  try {
    // 保存头像到数据库
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { 'profile.avatar': avatar } }
    )

    return res.status(200).json({ 
      message: '头像上传成功',
      avatar: avatar
    })
  } catch (error) {
    console.error('头像上传失败:', error)
    return res.status(500).json({ message: '头像上传失败' })
  }
}

// 登录历史处理
async function handleLoginHistory(req, res, db, userId) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { loginHistory: 1 } }
  )
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' })
  }

  // 获取最近20条登录记录并按时间倒序排列
  const loginHistory = (user.loginHistory || [])
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20)

  return res.status(200).json({ loginHistory })
}