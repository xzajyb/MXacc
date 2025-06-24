const { connectToDatabase } = require('./_lib/mongodb')
const { ObjectId } = require('mongodb')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { sendEmail } = require('./_lib/email')
const { sendLoginNotification } = require('./_lib/login-notification')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 生成JWT token
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// 生成验证码
function generateVerificationCode() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

module.exports = async (req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { action } = req.query

  try {
    const { db } = await connectToDatabase()

    switch (action) {
      case 'login':
        return await handleLogin(req, res, db)
      case 'register':
        return await handleRegister(req, res, db)
      case 'verify-email':
        return await handleVerifyEmail(req, res, db)
      case 'send-verification':
        return await handleSendVerification(req, res, db)
      case 'refresh-token':
        return await handleRefreshToken(req, res, db)
      default:
        return res.status(400).json({ message: '无效的操作' })
    }
  } catch (error) {
    console.error('Auth API Error:', error)
    return res.status(500).json({ message: '服务器错误' })
  }
}

// 登录处理
async function handleLogin(req, res, db) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: '邮箱和密码不能为空' })
  }

  const user = await db.collection('users').findOne({ email })
  if (!user) {
    return res.status(401).json({ message: '邮箱或密码错误' })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return res.status(401).json({ message: '邮箱或密码错误' })
  }

  // 更新最后登录时间
  await db.collection('users').updateOne(
    { _id: user._id },
    { 
      $set: { lastLogin: new Date() },
      $push: { 
        loginHistory: {
          timestamp: new Date(),
          ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '未知',
          userAgent: req.headers['user-agent'] || '未知'
        }
      }
    }
  )

  // 生成token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role
  })

  // 发送登录通知（如果启用）
  try {
    if (user.securitySettings?.loginNotifications) {
      await sendLoginNotification(user.email, {
        timestamp: new Date(),
        ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '未知',
        userAgent: req.headers['user-agent'] || '未知'
      })
    }
  } catch (notificationError) {
    console.error('发送登录通知失败:', notificationError)
  }

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user
  
  return res.status(200).json({
    token,
    user: userWithoutPassword
  })
}

// 注册处理
async function handleRegister(req, res, db) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ message: '用户名、邮箱和密码不能为空' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '密码长度至少6位' })
  }

  // 检查用户是否已存在
  const existingUser = await db.collection('users').findOne({ email })
  if (existingUser) {
    return res.status(400).json({ message: '该邮箱已被注册' })
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10)

  // 生成邮箱验证码
  const verificationCode = generateVerificationCode()

  // 创建用户
  const newUser = {
    username,
    email,
    password: hashedPassword,
    role: 'user',
    isEmailVerified: false,
    emailVerificationCode: verificationCode,
    createdAt: new Date(),
    lastLogin: null,
    loginHistory: [],
    profile: {
      avatar: null,
      bio: ''
    },
    settings: {
      theme: 'auto',
      notifications: {
        email: true,
        browser: true,
        marketing: false
      },
      privacy: {
        profileVisible: true,
        activityVisible: false,
        allowDataCollection: true
      },
      language: 'zh-CN',
      timezone: 'Asia/Shanghai'
    },
    securitySettings: {
      loginNotifications: false
    }
  }

  const result = await db.collection('users').insertOne(newUser)

  // 发送验证邮件
  try {
    await sendEmail({
      to: email,
      subject: '欢迎注册 MXAcc - 请验证您的邮箱',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">欢迎注册 MXAcc！</h2>
          <p>您好 ${username}，</p>
          <p>感谢您注册 MXAcc 账号管理系统。请点击下面的链接验证您的邮箱：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?code=${verificationCode}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              验证邮箱
            </a>
          </div>
          <p>或者复制以下链接到浏览器：</p>
          <p style="word-break: break-all; color: #666;">
            ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?code=${verificationCode}
          </p>
          <p>如果您没有注册过此账号，请忽略此邮件。</p>
          <hr style="margin: 30px 0; border: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">此邮件由 MXAcc 系统自动发送，请勿回复。</p>
        </div>
      `
    })
  } catch (emailError) {
    console.error('发送验证邮件失败:', emailError)
  }

  return res.status(201).json({ 
    message: '注册成功，请检查邮箱验证邮件',
    userId: result.insertedId
  })
}

// 邮箱验证处理
async function handleVerifyEmail(req, res, db) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { code } = req.body

  if (!code) {
    return res.status(400).json({ message: '验证码不能为空' })
  }

  const user = await db.collection('users').findOne({ emailVerificationCode: code })
  if (!user) {
    return res.status(400).json({ message: '验证码无效或已过期' })
  }

  if (user.isEmailVerified) {
    return res.status(400).json({ message: '邮箱已经验证过了' })
  }

  // 更新用户验证状态
  await db.collection('users').updateOne(
    { _id: user._id },
    { 
      $set: { 
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      },
      $unset: { emailVerificationCode: 1 }
    }
  )

  return res.status(200).json({ message: '邮箱验证成功' })
}

// 发送验证邮件处理
async function handleSendVerification(req, res, db) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: '未提供认证令牌' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: '邮箱已经验证过了' })
    }

    // 生成新的验证码
    const verificationCode = generateVerificationCode()
    
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { emailVerificationCode: verificationCode } }
    )

    // 发送验证邮件
    await sendEmail({
      to: user.email,
      subject: 'MXAcc - 重新发送邮箱验证',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">重新发送邮箱验证</h2>
          <p>您好 ${user.username}，</p>
          <p>请点击下面的链接验证您的邮箱：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?code=${verificationCode}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              验证邮箱
            </a>
          </div>
          <p>或者复制以下链接到浏览器：</p>
          <p style="word-break: break-all; color: #666;">
            ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?code=${verificationCode}
          </p>
          <hr style="margin: 30px 0; border: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">此邮件由 MXAcc 系统自动发送，请勿回复。</p>
        </div>
      `
    })

    return res.status(200).json({ message: '验证邮件已重新发送' })
  } catch (error) {
    return res.status(401).json({ message: '认证令牌无效' })
  }
}

// 刷新Token处理
async function handleRefreshToken(req, res, db) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: '未提供认证令牌' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    // 生成新的token
    const newToken = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    })

    return res.status(200).json({ token: newToken })
  } catch (error) {
    return res.status(401).json({ message: '认证令牌无效' })
  }
}