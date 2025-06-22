const { connectToDatabase } = require('../_lib/mongodb')
const jwt = require('jsonwebtoken')
const { ObjectId } = require('mongodb')

module.exports = async (req, res) => {
  // CORS处理
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: '请提供有效的认证token',
        code: 'MISSING_TOKEN'
      })
    }

    const token = authHeader.substring(7)
    let decoded
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      return res.status(401).json({ 
        message: 'Token无效或已过期',
        code: 'INVALID_TOKEN'
      })
    }

    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    if (req.method === 'GET') {
      // 获取用户设置
      const user = await usersCollection.findOne(
        { _id: new ObjectId(decoded.userId) },
        { 
          projection: { 
            settings: 1
          } 
        }
      )

      if (!user) {
        return res.status(404).json({ 
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        })
      }

      const defaultSettings = {
        notifications: {
          emailNotifications: true,
          pushNotifications: false,
          securityAlerts: true,
          marketingEmails: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showLastActive: true,
          allowDirectMessages: true
        },
        language: 'zh-CN',
        timezone: 'Asia/Shanghai'
      }

      res.status(200).json({
        message: '获取设置成功',
        ...defaultSettings,
        ...user.settings
      })

    } else if (req.method === 'PUT') {
      // 更新用户设置
      const { notifications, privacy, language, timezone } = req.body

      // 构建更新数据
      const updateData = {
        'settings.updatedAt': new Date()
      }

      if (notifications) {
        updateData['settings.notifications'] = notifications
      }

      if (privacy) {
        updateData['settings.privacy'] = privacy
      }

      if (language) {
        updateData['settings.language'] = language
      }

      if (timezone) {
        updateData['settings.timezone'] = timezone
      }

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $set: updateData }
      )

      if (result.matchedCount === 0) {
        return res.status(404).json({
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        })
      }

      res.status(200).json({
        message: '设置保存成功',
        code: 'SETTINGS_UPDATED'
      })

    } else {
      res.status(405).json({ 
        message: '方法不允许',
        code: 'METHOD_NOT_ALLOWED'
      })
    }
  } catch (error) {
    console.error('设置API错误:', error)
    res.status(500).json({ 
      message: '服务器内部错误',
      code: 'INTERNAL_SERVER_ERROR'
    })
  }
} 