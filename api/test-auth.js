// 简化的测试版本，用于诊断问题
module.exports = async (req, res) => {
  try {
    // 设置CORS头部
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    // 测试基本功能
    if (req.method === 'GET') {
      return res.status(200).json({ message: '测试API正常工作' })
    }

    // 测试MongoDB连接
    if (req.method === 'POST' && req.query.test === 'mongodb') {
      try {
        const { connectToDatabase } = require('./_lib/mongodb')
        const { db } = await connectToDatabase()
        
        // 简单的数据库查询测试
        const collections = await db.listCollections().toArray()
        
        return res.status(200).json({ 
          message: 'MongoDB连接成功',
          collections: collections.map(c => c.name)
        })
      } catch (dbError) {
        return res.status(500).json({ 
          message: 'MongoDB连接失败',
          error: dbError.message,
          stack: dbError.stack
        })
      }
    }

    // 测试模块导入
    if (req.method === 'POST' && req.query.test === 'modules') {
      try {
        const bcrypt = require('bcrypt')
        const jwt = require('jsonwebtoken')
        
        // 测试bcrypt
        const testHash = await bcrypt.hash('test', 10)
        const testCompare = await bcrypt.compare('test', testHash)
        
        // 测试jwt
        const testToken = jwt.sign({ test: true }, 'secret', { expiresIn: '1h' })
        const testVerify = jwt.verify(testToken, 'secret')
        
        return res.status(200).json({ 
          message: '所有模块正常工作',
          bcrypt: { hash: !!testHash, compare: testCompare },
          jwt: { sign: !!testToken, verify: !!testVerify }
        })
      } catch (moduleError) {
        return res.status(500).json({ 
          message: '模块测试失败',
          error: moduleError.message,
          stack: moduleError.stack
        })
      }
    }

    return res.status(400).json({ message: '请使用正确的测试参数' })

  } catch (error) {
    return res.status(500).json({ 
      message: '服务器错误',
      error: error.message,
      stack: error.stack
    })
  }
} 