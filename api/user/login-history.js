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
    
    console.log('数据库中的登录历史记录数:', loginHistory.length) // 调试日志
    console.log('原始登录历史:', loginHistory.slice(0, 3)) // 显示前3条记录
    
    // 格式化登录历史并按时间倒序排列
    const formattedHistory = loginHistory
      .map(record => ({
        ip: record.ip || '未知IP',
        userAgent: record.userAgent || '未知设备',
        location: record.location || '未知位置',
        timestamp: record.timestamp || new Date().toISOString()
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // 按时间倒序
      .slice(0, 10) // 只返回最近10条记录

    console.log('格式化后的登录历史:', formattedHistory.slice(0, 3)) // 调试日志

    res.status(200).json({
      success: true,
      loginHistory: formattedHistory
    })

  } catch (error) {
    console.error('获取登录历史失败:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 