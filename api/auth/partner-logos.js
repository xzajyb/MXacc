const clientPromise = require('../_lib/mongodb')

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' })
  }

  try {
    const client = await clientPromise
    const db = client.db('mxacc')
    const systemSettings = db.collection('system_settings')
    
    // 获取合作伙伴Logo设置
    const partnerLogos = await systemSettings.findOne({ _id: 'partner_logos' }) || { logos: [], enabled: true }
    
    return res.status(200).json({ 
      message: '获取合作伙伴Logo成功', 
      partnerLogos 
    })
  } catch (error) {
    console.error('获取合作伙伴Logo失败:', error)
    return res.status(500).json({ message: '服务器内部错误' })
  }
} 