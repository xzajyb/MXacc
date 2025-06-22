const clientPromise = require('../_lib/mongodb')
const { verifyToken } = require('../_lib/auth')
// 修复导入问题
let sendVerificationEmail
try {
  const emailModule = require('../_lib/luckycola-email')
  sendVerificationEmail = emailModule.sendVerificationEmail
} catch (error) {
  console.error('无法导入邮件模块:', error)
  sendVerificationEmail = async () => {
    throw new Error('邮件服务配置错误，请检查配置文件')
  }
}
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

    // 严格检查：只有未认证邮箱的用户才能发送验证邮件
    if (user.isEmailVerified) {
      return res.status(403).json({ 
        message: '邮箱已经通过验证，无需重复发送验证邮件',
        code: 'ALREADY_VERIFIED'
      })
    }

    // 确保用户账户状态正常
    if (user.isDisabled) {
      return res.status(403).json({ 
        message: '账户已被禁用，无法发送验证邮件',
        code: 'ACCOUNT_DISABLED'
      })
    }

    // 检查发送频率限制
    const now = new Date()
    const emailSendInfo = user.emailSendInfo || {
      sendCount: 0,
      firstSendTime: null,
      lastSendTime: null
    }

    // 如果是第一次发送，初始化计数
    if (!emailSendInfo.firstSendTime) {
      emailSendInfo.firstSendTime = now
      emailSendInfo.sendCount = 0
      emailSendInfo.lastSendTime = null
    }

    // 严格检查是否超过3次限制
    if (emailSendInfo.sendCount >= 3) {
      const timeSinceFirst = now - new Date(emailSendInfo.firstSendTime)
      const threeMinutes = 3 * 60 * 1000 // 3分钟

      if (timeSinceFirst < threeMinutes) {
        const remainingTime = Math.ceil((threeMinutes - timeSinceFirst) / 1000)
        const remainingMinutes = Math.ceil(remainingTime / 60)
        return res.status(429).json({ 
          message: `发送次数已达上限（3次），请等待 ${remainingMinutes} 分钟后再试`,
          code: 'RATE_LIMIT_EXCEEDED',
          remainingTime: remainingTime,
          canSendAgainAt: new Date(new Date(emailSendInfo.firstSendTime).getTime() + threeMinutes),
          sendInfo: {
            sendCount: emailSendInfo.sendCount,
            maxAttempts: 3,
            remainingAttempts: 0
          }
        })
      } else {
        // 超过3分钟，重置计数
        emailSendInfo.sendCount = 0
        emailSendInfo.firstSendTime = now
      }
    }

    // 严格检查最后发送时间间隔（防止频繁点击）
    if (emailSendInfo.lastSendTime) {
      const timeSinceLastSend = now - new Date(emailSendInfo.lastSendTime)
      const minInterval = 30 * 1000 // 30秒最小间隔

      if (timeSinceLastSend < minInterval) {
        const remainingTime = Math.ceil((minInterval - timeSinceLastSend) / 1000)
        return res.status(429).json({ 
          message: `发送过于频繁，请等待 ${remainingTime} 秒后再次发送`,
          code: 'TOO_FREQUENT',
          remainingTime: remainingTime,
          canSendAgainAt: new Date(new Date(emailSendInfo.lastSendTime).getTime() + minInterval)
        })
      }
    }

    // 生成6位数字验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10分钟后过期

    // 更新发送信息
    emailSendInfo.sendCount += 1
    emailSendInfo.lastSendTime = now

    // 保存验证码和发送信息
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          verificationCode,
          verificationCodeExpiresAt: expiresAt,
          emailSendInfo
        }
      }
    )

    // 发送验证邮件 - 修复参数顺序
    try {
      // 正确的参数顺序：email, code, username
      await sendVerificationEmail(user.email, verificationCode, user.username)
      res.status(200).json({ 
        message: '验证邮件已发送，请检查您的邮箱',
        expiresAt: expiresAt,
        sendInfo: {
          sendCount: emailSendInfo.sendCount,
          remainingAttempts: Math.max(0, 3 - emailSendInfo.sendCount),
          canSendAgainAt: emailSendInfo.sendCount >= 3 ? 
            new Date(new Date(emailSendInfo.firstSendTime).getTime() + 3 * 60 * 1000) : null
        }
      })
    } catch (emailError) {
      console.error('发送邮件失败:', emailError)
      
      // 邮件发送失败，回滚计数器
      emailSendInfo.sendCount -= 1
      await users.updateOne(
        { _id: user._id },
        {
          $set: { emailSendInfo }
        }
      )
      
      // 邮件发送失败，严格返回错误，不泄露验证码
      res.status(500).json({ 
        message: '邮件发送失败，请稍后重试或联系管理员',
        code: 'EMAIL_SEND_FAILED',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      })
    }

  } catch (error) {
    console.error('发送验证邮件错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 