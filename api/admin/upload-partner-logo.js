const clientPromise = require('../_lib/mongodb')
const { getTokenFromRequest, verifyToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')
const multer = require('multer')

// 配置multer使用内存存储（Vercel友好）
const storage = multer.memoryStorage()

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB
  },
  fileFilter: function (req, file, cb) {
    // 支持常见图片格式包括SVG
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传 JPG、PNG、GIF、WebP、SVG 格式的图片文件'))
    }
  }
})

// 将图片转换为base64 data URL
function bufferToDataURL(buffer, mimetype) {
  const base64 = buffer.toString('base64')
  return `data:${mimetype};base64,${base64}`
}

module.exports = async function handler(req, res) {
  // 设置CORS头部和内容类型
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 验证身份
  const token = getTokenFromRequest(req)
  
  if (!token) {
    return res.status(401).json({ success: false, message: '需要登录' })
  }

  const decoded = verifyToken(token)
  
  if (!decoded) {
    return res.status(401).json({ success: false, message: '无效的令牌' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' })
  }

  try {
    // 验证管理员权限
    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')
    const systemSettings = db.collection('system_settings')

    // 检查管理员权限
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: '权限不足，需要管理员权限'
      })
    }

    // 处理文件上传
    const uploadSingle = upload.single('logo')
    
    uploadSingle(req, res, async function (err) {
      try {
        if (err) {
          return res.status(400).json({ success: false, message: err.message || '文件上传失败' })
        }

        if (!req.file) {
          return res.status(400).json({ success: false, message: '没有选择文件' })
        }

        const { name } = req.body
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
          return res.status(400).json({ success: false, message: '请提供合作伙伴名称' })
        }

        // 将上传的文件转换为base64 data URL
        const logoDataURL = bufferToDataURL(req.file.buffer, req.file.mimetype)
        
        // 获取当前的合作伙伴Logo设置
        const partnerLogos = await systemSettings.findOne({ _id: 'partner_logos' }) || { logos: [], enabled: true }
        
        // 添加新Logo
        const newLogo = {
          url: logoDataURL,
          name: name.trim(),
          uploadedAt: new Date()
        }
        
        // 更新数据库
        await systemSettings.updateOne(
          { _id: 'partner_logos' },
          { 
            $set: { 
              enabled: partnerLogos.enabled !== undefined ? partnerLogos.enabled : true,
              updatedAt: new Date(),
              updatedBy: decoded.userId
            },
            $push: { logos: newLogo }
          },
          { upsert: true }
        )

        res.status(200).json({
          success: true,
          message: 'Logo上传成功',
          logo: newLogo
        })

      } catch (uploadError) {
        return res.status(500).json({ success: false, message: '文件处理错误: ' + uploadError.message })
      }
    })

  } catch (error) {
    return res.status(500).json({ success: false, message: '服务器内部错误: ' + error.message })
  }
} 