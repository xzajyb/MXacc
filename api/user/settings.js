const clientPromise = require('../_lib/mongodb')
const { getTokenFromRequest, verifyToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

module.exports = async function handler(req, res) {
  // 启用CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // 验证身份
    const token = getTokenFromRequest(req)
    if (!token) {
      return res.status(401).json({ message: '需要登录' })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ message: '无效的令牌' })
    }

    console.log('Settings API - 用户ID:', decoded.userId)

    const client = await clientPromise
    const db = client.db('mxacc')
    const usersCollection = db.collection('users')

    if (req.method === 'GET') {
      // 获取用户设置
      let user
      try {
        user = await usersCollection.findOne(
          { _id: new ObjectId(decoded.userId) },
          { projection: { settings: 1 } }
        )
      } catch (mongoError) {
        console.error('MongoDB查询错误:', mongoError)
        return res.status(500).json({ message: 'Database query failed', error: mongoError.message })
      }

      if (!user) {
        return res.status(404).json({ message: '用户不存在' })
      }

      // 返回默认设置或用户自定义设置
      const defaultSettings = {
        theme: 'auto',
        notifications: {
          email: true,
          browser: true,
          marketing: false
        },
        privacy: {
          profileVisible: true,
          activityVisible: false,
          allowDataCollection: true
        },
        language: 'zh-CN',
        timezone: 'Asia/Shanghai'
      }

      return res.status(200).json({
        success: true,
        settings: user.settings || defaultSettings
      })

    } else if (req.method === 'PUT') {
      // 更新用户设置
      const { settings } = req.body

      if (!settings) {
        return res.status(400).json({ message: '设置数据不能为空' })
      }

      // 验证设置数据结构
      const allowedThemes = ['light', 'dark', 'auto']
      if (settings.theme && !allowedThemes.includes(settings.theme)) {
        return res.status(400).json({ message: '无效的主题设置' })
      }

      console.log('更新设置:', settings)

      // 更新用户设置
      let updateResult
      try {
        updateResult = await usersCollection.updateOne(
          { _id: new ObjectId(decoded.userId) },
          { 
            $set: { 
              settings: settings,
              updatedAt: new Date()
            }
          }
        )
      } catch (mongoError) {
        console.error('MongoDB更新错误:', mongoError)
        return res.status(500).json({ message: 'Database update failed', error: mongoError.message })
      }

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: '用户不存在' })
      }

      console.log('设置更新成功')
      return res.status(200).json({
        success: true,
        message: '设置保存成功'
      })

    } else {
      res.setHeader('Allow', ['GET', 'PUT'])
      return res.status(405).json({ message: '不支持的请求方法' })
    }

  } catch (error) {
    console.error('用户设置API错误:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的认证token' })
    }
    
    return res.status(500).json({ 
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : error.name
    })
  }
} 