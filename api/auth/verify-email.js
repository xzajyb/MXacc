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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允许' })
  }

  try {
    const { verificationCode } = req.body

    if (!verificationCode) {
      return res.status(400).json({ message: '请输入验证码' })
    }

    // 获取token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '需要登录' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ message: 'Token无效' })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    // 查找用户
    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: '邮箱已经验证过了' })
    }

    // 检查验证码
    if (!user.verificationCode || user.verificationCode !== verificationCode.toString()) {
      return res.status(400).json({ message: '验证码错误' })
    }

    // 检查验证码是否过期
    if (user.verificationCodeExpiresAt && new Date() > user.verificationCodeExpiresAt) {
      return res.status(400).json({ message: '验证码已过期，请重新发送' })
    }

    // 更新用户验证状态
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          isEmailVerified: true,
          verifiedAt: new Date()
        },
        $unset: {
          verificationCode: '',
          verificationCodeExpiresAt: ''
        }
      }
    )

    res.status(200).json({ 
      message: '邮箱验证成功！',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: true,
        role: user.role || 'user',
        profile: user.profile
      }
    })

  } catch (error) {
    console.error('邮箱验证错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 