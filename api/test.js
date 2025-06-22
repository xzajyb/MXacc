module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    res.status(200).json({
      message: '✅ API测试成功！',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: req.headers,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasMongoURI: !!process.env.MONGODB_URI,
        hasJWTSecret: !!process.env.JWT_SECRET
      }
    })
  } catch (error) {
    console.error('测试API错误:', error)
    res.status(500).json({ 
      message: '❌ API测试失败',
      error: error.message 
    })
  }
} 