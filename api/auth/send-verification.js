const clientPromise = require('../_lib/mongodb')
const { verifyToken } = require('../_lib/auth')
const { sendVerificationEmail } = require('../_lib/email-config')
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

    // 生成验证码
    const verificationCode = Math.random().toString(36).substr(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期

    // 保存验证码
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          verificationCode,
          verificationCodeExpiresAt: expiresAt
        }
      }
    )

    // 发送验证邮件
    try {
      await sendVerificationEmail(user.email, user.username, verificationCode)
      res.status(200).json({ message: '验证邮件已发送，请检查您的邮箱' })
    } catch (emailError) {
      console.error('发送邮件失败:', emailError)
      // 即使邮件发送失败，也返回验证码（用于测试）
      res.status(200).json({ 
        message: '验证邮件发送可能失败，验证码：' + verificationCode,
        verificationCode // 仅用于开发测试
      })
    }

  } catch (error) {
    console.error('发送验证邮件错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 