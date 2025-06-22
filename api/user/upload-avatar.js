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
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传图片文件'))
    }
  }
})

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
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

    // 处理文件上传
    const uploadSingle = upload.single('avatar')
    
    uploadSingle(req, res, async function (err) {
      if (err) {
        console.error('文件上传错误:', err)
        return res.status(400).json({ message: err.message || '文件上传失败' })
      }

      if (!req.file) {
        return res.status(400).json({ message: '没有选择文件' })
      }

      try {
        const client = await clientPromise
        const db = client.db('mxacc')
        const users = db.collection('users')

        // 获取用户信息
        const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
        if (!user) {
          // 删除已上传的文件
          fs.unlinkSync(req.file.path)
          return res.status(404).json({ message: '用户不存在' })
        }

        // 删除旧头像文件（如果存在）
        if (user.profile?.avatar) {
          const oldAvatarPath = path.join(process.cwd(), 'public', user.profile.avatar)
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath)
          }
        }

        // 构建新的头像URL
        const avatarUrl = `/uploads/avatars/${req.file.filename}`

        // 更新数据库中的头像信息
        await users.updateOne(
          { _id: new ObjectId(decoded.userId) },
          { $set: { 'profile.avatar': avatarUrl } }
        )

        res.status(200).json({
          success: true,
          message: '头像上传成功',
          avatarUrl: avatarUrl
        })

      } catch (error) {
        console.error('数据库更新错误:', error)
        // 删除已上传的文件
        if (req.file) {
          fs.unlinkSync(req.file.path)
        }
        res.status(500).json({ message: '服务器内部错误' })
      }
    })

  } catch (error) {
    console.error('头像上传API错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 