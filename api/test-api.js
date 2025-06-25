// 独立测试API
module.exports = async function handler(req, res) {
  console.log('=== Test API Called ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Body:', req.body)

  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  return res.status(200).json({
    success: true,
    message: '测试API工作正常',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    body: req.body
  })
}
