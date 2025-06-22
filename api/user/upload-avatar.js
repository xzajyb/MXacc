const clientPromise = require('../_lib/mongodb')
const { getTokenFromRequest, verifyToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// 配置multer进行文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname))
  }
})

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
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传 JPG、PNG、GIF、WebP、SVG 格式的图片文件'))
    }
  }
})

module.exports = async function handler(req, res) {
  console.log('头像上传API被调用:', req.method, req.url)
  
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    console.log('方法不允许:', req.method)
    return res.status(405).json({ message: '方法不允许' })
  }

  try {
    // 验证身份
    const token = getTokenFromRequest(req)
    console.log('Token检查:', token ? '存在' : '不存在')
    
    if (!token) {
      return res.status(401).json({ message: '需要登录' })
    }

    const decoded = verifyToken(token)
    console.log('Token验证结果:', decoded ? '成功' : '失败')
    
    if (!decoded) {
      return res.status(401).json({ message: '无效的令牌' })
    }

    console.log('用户ID:', decoded.userId)

    // 处理文件上传
    const uploadSingle = upload.single('avatar')
    
    uploadSingle(req, res, async function (err) {
      if (err) {
        console.error('Multer文件上传错误:', err.message)
        return res.status(400).json({ message: err.message || '文件上传失败' })
      }

      if (!req.file) {
        console.log('没有收到文件')
        return res.status(400).json({ message: '没有选择文件' })
      }

      console.log('文件上传成功:', req.file.filename, req.file.size, req.file.mimetype)

      try {
        const client = await clientPromise
        const db = client.db('mxacc')
        const users = db.collection('users')

        console.log('连接数据库成功，查找用户...')

        // 获取用户信息
        const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
        if (!user) {
          console.log('用户不存在:', decoded.userId)
          // 删除已上传的文件
          try {
            fs.unlinkSync(req.file.path)
          } catch (deleteErr) {
            console.error('删除文件失败:', deleteErr)
          }
          return res.status(404).json({ message: '用户不存在' })
        }

        console.log('找到用户:', user.username)

        // 删除旧头像文件（如果存在）
        if (user.profile?.avatar) {
          const oldAvatarPath = path.join(process.cwd(), 'public', user.profile.avatar)
          console.log('尝试删除旧头像:', oldAvatarPath)
          if (fs.existsSync(oldAvatarPath)) {
            try {
              fs.unlinkSync(oldAvatarPath)
              console.log('旧头像删除成功')
            } catch (deleteErr) {
              console.error('删除旧头像失败:', deleteErr)
              // 不阻止继续执行
            }
          }
        }

        // 构建新的头像URL
        const avatarUrl = `/uploads/avatars/${req.file.filename}`
        console.log('新头像URL:', avatarUrl)

        // 更新数据库中的头像信息
        const updateResult = await users.updateOne(
          { _id: new ObjectId(decoded.userId) },
          { $set: { 'profile.avatar': avatarUrl } }
        )

        console.log('数据库更新结果:', updateResult)

        if (updateResult.modifiedCount === 0) {
          console.warn('数据库更新未修改任何记录')
        }

        res.status(200).json({
          success: true,
          message: '头像上传成功',
          avatarUrl: avatarUrl
        })

        console.log('头像上传完成')

      } catch (error) {
        console.error('数据库操作错误:', error)
        // 删除已上传的文件
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path)
          } catch (deleteErr) {
            console.error('删除文件失败:', deleteErr)
          }
        }
        res.status(500).json({ message: '数据库操作失败: ' + error.message })
      }
    })

  } catch (error) {
    console.error('头像上传API顶级错误:', error)
    res.status(500).json({ message: '服务器内部错误: ' + error.message })
  }
} 