const clientPromise = require('../_lib/mongodb')
const { hashPassword, generateToken } = require('../_lib/auth')
// 修复导入问题
let sendWelcomeEmail
try {
  const emailModule = require('../_lib/luckycola-email')
  sendWelcomeEmail = emailModule.sendWelcomeEmail
} catch (error) {
  console.error('无法导入邮件模块:', error)
  sendWelcomeEmail = async () => {
    console.log('邮件服务不可用，跳过欢迎邮件发送')
    return { success: false, error: '邮件服务不可用' }
  }
}

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
    const { username, email, password } = req.body

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ message: '请填写所有必填字段' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密码至少需要6个字符' })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    // 检查用户是否已存在
    const existingUser = await users.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用' 
      })
    }

    // 检查是否是第一个用户（自动设为管理员）
    const userCount = await users.countDocuments()
    const isFirstUser = userCount === 0

    // 创建新用户
    const hashedPassword = await hashPassword(password)
    const newUser = {
      username,
      email,
      password: hashedPassword,
      role: isFirstUser ? 'admin' : 'user', // 第一个用户为管理员
      isEmailVerified: isFirstUser ? true : false, // 管理员自动验证
      status: 'active',
      loginAttempts: 0,
      createdAt: new Date(),
      profile: {
        displayName: username,
        nickname: username,
        avatar: null,
        bio: null,
        location: null,
        website: null
      }
    }

    const result = await users.insertOne(newUser)
    const token = generateToken(result.insertedId)

    // 发送欢迎邮件（异步，不阻塞响应）
    sendWelcomeEmail(email, username).catch(error => {
      console.error('发送欢迎邮件失败:', error)
    })

    res.status(201).json({
      message: '注册成功',
      token,
      needsEmailVerification: !newUser.isEmailVerified,
      user: {
        id: result.insertedId,
        username,
        email,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
        profile: newUser.profile
      }
    })

  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 