const clientPromise = require('../_lib/mongodb')
const { getTokenFromRequest, verifyToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' })
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
    const users = db.collection('users')

    // 获取用户信息
    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    // 返回登录历史
    const loginHistory = user.loginHistory || []
    
    // 格式化登录历史
    const formattedHistory = loginHistory.map(record => ({
      ip: record.ip || '未知IP',
      userAgent: record.userAgent || '未知设备',
      location: record.location || '未知位置',
      timestamp: record.timestamp || new Date().toISOString()
    })).slice(0, 10) // 只返回最近10条记录

    res.status(200).json({
      success: true,
      loginHistory: formattedHistory
    })

  } catch (error) {
    console.error('获取登录历史失败:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 