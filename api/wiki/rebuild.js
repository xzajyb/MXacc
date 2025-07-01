const buildWiki = require('../../scripts/build-wiki')

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: '方法不允许' 
    })
  }

  try {
    // 验证管理员权限
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: '未提供有效的授权token' 
      })
    }

    const token = authHeader.split(' ')[1]
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 连接数据库验证用户权限
    const clientPromise = require('../_lib/mongodb')
    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    const user = await users.findOne({ _id: new require('mongodb').ObjectId(decoded.userId) })
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '需要管理员权限' 
      })
    }

    console.log('🔧 管理员', user.username, '触发Wiki重建...')

    // 调用Wiki构建脚本
    await buildWiki()

    console.log('✅ Wiki重建完成')

    return res.status(200).json({
      success: true,
      message: 'Wiki重建成功！文档已更新',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Wiki重建失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Wiki重建失败'
    })
  }
} 