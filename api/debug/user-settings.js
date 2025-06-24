const clientPromise = require('../_lib/mongodb')
const { getTokenFromRequest, verifyToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

module.exports = async function handler(req, res) {
  // 启用CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
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

    // 获取完整的用户信息用于调试
    const user = await usersCollection.findOne(
      { _id: new ObjectId(decoded.userId) }
    )

    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    return res.status(200).json({
      success: true,
      debug: {
        userId: decoded.userId,
        hasSettings: !!user.settings,
        settings: user.settings,
        username: user.username,
        email: user.email
      }
    })

  } catch (error) {
    console.error('调试API错误:', error)
    return res.status(500).json({ 
      message: '服务器内部错误',
      error: error.message
    })
  }
} 