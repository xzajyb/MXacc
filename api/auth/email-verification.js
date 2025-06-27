const clientPromise = require('../_lib/mongodb')
const { verifyToken } = require('../_lib/auth')
// 修复导入问题
let sendVerificationEmail, sendWelcomeEmail
try {
  const emailModule = require('../_lib/luckycola-email')
  sendVerificationEmail = emailModule.sendVerificationEmail
  sendWelcomeEmail = emailModule.sendWelcomeEmail
  console.log('✅ 邮件模块加载成功')
} catch (error) {
  console.error('❌ 无法导入邮件模块:', error)
  sendVerificationEmail = async () => {
    throw new Error('邮件服务配置错误，请检查配置文件')
  }
  sendWelcomeEmail = async () => {
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
    const { action, verificationCode, newEmail, confirmPassword } = req.body

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

    // 根据action处理不同的操作
    if (action === 'send') {
      // 发送验证邮件
      return await handleSendVerification(user, users, res)
    } else if (action === 'verify') {
      // 验证邮箱
      return await handleVerifyEmail(user, users, verificationCode, res)
    } else if (action === 'change-email') {
      // 更改绑定邮箱
      return await handleChangeEmail(user, users, newEmail, confirmPassword, res)
    } else if (action === 'delete-account') {
      // 删除账号
      return await handleDeleteAccount(user, users, confirmPassword, res)
    } else {
      return res.status(400).json({ message: '无效的操作类型' })
    }

  } catch (error) {
    console.error('邮箱验证API错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// 处理发送验证邮件
async function handleSendVerification(user, users, res) {
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

  // 通过邮件服务发送验证邮件
  try {
    console.log('📧 通过邮件服务发送验证邮件到:', user.email)
    
    // 调用邮件服务API
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   process.env.BASE_URL || 'http://localhost:3000'
    
    const emailServiceResponse = await fetch(`${baseUrl}/api/services/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'verification',
        to: user.email,
        data: {
          code: verificationCode,
          username: user.username
        }
      })
    })

    const emailResult = await emailServiceResponse.json()
    
    if (!emailResult.success) {
      throw new Error(emailResult.message || '邮件服务调用失败')
    }
    
    console.log('✅ 验证邮件已提交到发送队列')
    
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
    console.error('❌ 邮件服务调用失败:', emailError)
    
    // 邮件发送失败，回滚计数器
    emailSendInfo.sendCount -= 1
    await users.updateOne(
      { _id: user._id },
      {
        $set: { emailSendInfo }
      }
    )
    
    res.status(500).json({ 
      message: '邮件发送失败，请稍后重试或联系管理员',
      code: 'EMAIL_SEND_FAILED',
      error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
    })
  }
}

// 处理验证邮箱
async function handleVerifyEmail(user, users, verificationCode, res) {
  if (!verificationCode) {
    return res.status(400).json({ message: '请输入验证码' })
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

  // 通过邮件服务发送欢迎邮件
  let welcomeEmailSent = false
  let welcomeEmailError = null
  
  try {
    console.log('📧 通过邮件服务发送欢迎邮件到:', user.email, '用户名:', user.username)
    
    // 调用邮件服务API发送欢迎邮件
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   process.env.BASE_URL || 'http://localhost:3000'
    
    const welcomeEmailResponse = await fetch(`${baseUrl}/api/services/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'welcome',
        to: user.email,
        data: {
          username: user.username
        }
      })
    })

    const welcomeResult = await welcomeEmailResponse.json()
    console.log('✅ 欢迎邮件服务响应:', welcomeResult)
    
    if (welcomeResult && welcomeResult.success) {
      welcomeEmailSent = true
    } else {
      welcomeEmailError = welcomeResult?.message || '邮件服务返回失败状态'
    }
  } catch (error) {
    console.error('❌ 欢迎邮件服务调用失败:', error)
    welcomeEmailError = error.message || '未知错误'
  }

  // 构建响应消息
  let message = '邮箱验证成功！'
  if (welcomeEmailSent) {
    message += '已发送欢迎邮件。'
  } else {
    message += '但欢迎邮件发送失败，请稍后重试。'
    console.warn('⚠️ 欢迎邮件发送失败，错误信息:', welcomeEmailError)
  }

  res.status(200).json({ 
    message: message,
    welcomeEmailSent: welcomeEmailSent,
    ...(welcomeEmailError && process.env.NODE_ENV === 'development' && { 
      welcomeEmailError: welcomeEmailError 
    }),
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      isEmailVerified: true,
      role: user.role || 'user',
      profile: user.profile
    }
  })
}

// 处理更改绑定邮箱
async function handleChangeEmail(user, users, newEmail, confirmPassword, res) {
  if (!newEmail || !confirmPassword) {
    return res.status(400).json({ message: '请提供新邮箱和确认密码' })
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newEmail)) {
    return res.status(400).json({ message: '邮箱格式无效' })
  }

  // 验证密码
  const { comparePassword } = require('../_lib/auth')
  const isPasswordValid = await comparePassword(confirmPassword, user.password)
  if (!isPasswordValid) {
    return res.status(400).json({ message: '密码错误' })
  }

  // 检查新邮箱是否已存在
  const existingUser = await users.findOne({
    email: newEmail.toLowerCase(),
    _id: { $ne: user._id }
  })

  if (existingUser) {
    return res.status(400).json({ message: '该邮箱已被其他用户使用' })
  }

  // 更新邮箱并重置验证状态
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        email: newEmail.toLowerCase(),
        isEmailVerified: false,
        updatedAt: new Date()
      },
      $unset: {
        verificationCode: '',
        verificationCodeExpiresAt: '',
        emailSendInfo: ''
      }
    }
  )

  res.status(200).json({
    success: true,
    message: '邮箱更改成功，请验证新邮箱',
    user: {
      id: user._id,
      username: user.username,
      email: newEmail.toLowerCase(),
      isEmailVerified: false,
      role: user.role || 'user',
      profile: user.profile
    }
  })
}

// 处理删除账号
async function handleDeleteAccount(user, users, confirmPassword, res) {
  if (!confirmPassword) {
    return res.status(400).json({ message: '请输入密码确认删除' })
  }

  // 验证密码
  const { comparePassword } = require('../_lib/auth')
  const isPasswordValid = await comparePassword(confirmPassword, user.password)
  if (!isPasswordValid) {
    return res.status(400).json({ message: '密码错误' })
  }

  // 检查是否为管理员账户
  if (user.role === 'admin') {
    // 检查是否为唯一管理员
    const adminCount = await users.countDocuments({ role: 'admin' })
    if (adminCount <= 1) {
      return res.status(403).json({ 
        message: '无法删除唯一的管理员账户' 
      })
    }
  }

  // 删除用户账户
  await users.deleteOne({ _id: user._id })

  res.status(200).json({
    success: true,
    message: '账户已成功删除'
  })
} 