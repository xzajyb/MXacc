const clientPromise = require('../_lib/mongodb')
const { verifyToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // 验证管理员权限
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '需要管理员权限' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ message: 'Token无效' })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')
    const systemSettings = db.collection('system_settings')

    // 检查管理员权限
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ 
        message: '权限不足，需要管理员权限',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    // GET: 获取系统设置
    if (req.method === 'GET') {
      // 获取合作伙伴logo设置
      const settings = await systemSettings.findOne({ type: 'partnerLogos' }) || {
        enabled: true,
        logos: [
          // 默认为空，没有合作伙伴logo
        ]
      }

      return res.status(200).json({
        success: true,
        data: settings
      })
    }

    // PUT: 更新系统设置
    if (req.method === 'PUT') {
      const { type, settings } = req.body

      if (type === 'partnerLogos') {
        // 验证数据
        if (!settings || typeof settings !== 'object') {
          return res.status(400).json({ message: '无效的设置数据' })
        }

        // 更新或创建设置
        await systemSettings.updateOne(
          { type: 'partnerLogos' },
          { 
            $set: {
              enabled: !!settings.enabled,
              logos: Array.isArray(settings.logos) ? settings.logos : [],
              updatedAt: new Date(),
              updatedBy: decoded.userId
            }
          },
          { upsert: true }
        )

        return res.status(200).json({
          success: true,
          message: '合作伙伴logo设置已更新'
        })
      }

      return res.status(400).json({ message: '不支持的设置类型' })
    }

    return res.status(405).json({ message: '方法不允许' })

  } catch (error) {
    console.error('系统设置API错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 