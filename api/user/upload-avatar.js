const clientPromise = require('../_lib/mongodb')
const { getTokenFromRequest, verifyToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')
const multer = require('multer')
const crypto = require('crypto')

// 配置multer使用内存存储（Vercel友好）
const storage = multer.memoryStorage()

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: function (req, file, cb) {
    console.log('文件类型检查:', file.mimetype, file.originalname)
    // 支持常见图片格式包括SVG
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ]
    
    // 额外检查SVG文件（有时候浏览器会将SVG识别为其他MIME类型）
    const fileExtension = file.originalname.toLowerCase().split('.').pop()
    const isSvgByExtension = fileExtension === 'svg'
    
    if (allowedTypes.includes(file.mimetype) || isSvgByExtension) {
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
  console.log('头像上传API被调用:', req.method, req.url)
  
  // 设置CORS头部和内容类型
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    console.log('方法不允许:', req.method)
    return res.status(405).json({ success: false, message: '方法不允许' })
  }

  // 包装所有代码在try-catch中确保总是返回JSON
  try {
    // 验证身份
    const token = getTokenFromRequest(req)
    console.log('Token检查:', token ? '存在' : '不存在')
    
    if (!token) {
      return res.status(401).json({ success: false, message: '需要登录' })
    }

    const decoded = verifyToken(token)
    console.log('Token验证结果:', decoded ? '成功' : '失败')
    
    if (!decoded) {
      return res.status(401).json({ success: false, message: '无效的令牌' })
    }

    console.log('用户ID:', decoded.userId)

    // 处理文件上传
    const uploadSingle = upload.single('avatar')
    
    uploadSingle(req, res, async function (err) {
      try {
        if (err) {
          console.error('Multer文件上传错误:', err.message)
          return res.status(400).json({ success: false, message: err.message || '文件上传失败' })
        }

        if (!req.file) {
          console.log('没有收到文件')
          return res.status(400).json({ success: false, message: '没有选择文件' })
        }

        console.log('文件上传成功:', req.file.originalname, req.file.size, req.file.mimetype)

        try {
          const client = await clientPromise
          const db = client.db('mxacc')
          const users = db.collection('users')

          console.log('连接数据库成功，查找用户...')

          // 获取用户信息
          const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
          if (!user) {
            console.log('用户不存在:', decoded.userId)
            return res.status(404).json({ success: false, message: '用户不存在' })
          }

          console.log('找到用户:', user.username)

          // 将上传的文件转换为base64 data URL
          const avatarDataURL = bufferToDataURL(req.file.buffer, req.file.mimetype)
          
          console.log('转换为base64，长度:', avatarDataURL.length)

          // 更新数据库中的头像信息（存储base64 data URL）
          const updateResult = await users.updateOne(
            { _id: new ObjectId(decoded.userId) },
            { $set: { 'profile.avatar': avatarDataURL } }
          )

          console.log('数据库更新结果:', updateResult)

          if (updateResult.modifiedCount === 0) {
            console.warn('数据库更新未修改任何记录')
          }

          res.status(200).json({
            success: true,
            message: '头像上传成功',
            avatarUrl: avatarDataURL
          })

          console.log('头像上传完成')

        } catch (error) {
          console.error('数据库操作错误:', error)
          return res.status(500).json({ success: false, message: '数据库操作失败: ' + error.message })
        }
      } catch (uploadError) {
        console.error('文件上传回调错误:', uploadError)
        return res.status(500).json({ success: false, message: '文件处理错误: ' + uploadError.message })
      }
    })

  } catch (error) {
    console.error('头像上传API顶级错误:', error)
    return res.status(500).json({ success: false, message: '服务器内部错误: ' + error.message })
  }
} 