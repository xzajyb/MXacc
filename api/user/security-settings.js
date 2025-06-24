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

    const client = await clientPromise
    const db = client.db('mxacc')
    const usersCollection = db.collection('users')

    if (req.method === 'GET') {
      // 获取用户安全设置
      const user = await usersCollection.findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { 'settings.notifications.loginNotification': 1, isEmailVerified: 1 } }
      )

      if (!user) {
        return res.status(404).json({ message: '用户不存在' })
      }

      return res.status(200).json({
        success: true,
        securitySettings: {
          loginNotification: user.settings?.notifications?.loginNotification ?? true,
          emailVerified: user.isEmailVerified || false
        }
      })

    } else if (req.method === 'PUT') {
      // 更新安全设置
      const { loginNotification } = req.body

      if (typeof loginNotification !== 'boolean') {
        return res.status(400).json({ message: '无效的设置值' })
      }

      // 更新用户设置
      const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(decoded.userId) },
        { 
          $set: { 
            'settings.notifications.loginNotification': loginNotification,
            updatedAt: new Date()
          }
        }
      )

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: '用户不存在' })
      }

      return res.status(200).json({
        success: true,
        message: '安全设置更新成功'
      })

    } else {
      res.setHeader('Allow', ['GET', 'PUT'])
      return res.status(405).json({ message: '不支持的请求方法' })
    }

  } catch (error) {
    console.error('安全设置API错误:', error)
    return res.status(500).json({ 
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : error.name
    })
  }
} 