const clientPromise = require('../_lib/mongodb')
const { hashPassword, generateToken } = require('../_lib/auth')

module.exports = async function handler(req, res) {
  console.log(`[${new Date().toISOString()}] 注册请求开始`)
  console.log('请求方法:', req.method)
  console.log('请求头:', {
    'user-agent': req.headers['user-agent'],
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'content-type': req.headers['content-type']
  })

  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    console.log('处理OPTIONS预检请求')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    console.log('请求方法不正确:', req.method)
    return res.status(405).json({ message: '方法不允许' })
  }

  try {
    const { username, email, password } = req.body
    console.log('注册尝试:', {
      username: username || 'undefined',
      email: email ? email.replace(/./g, '*') : 'undefined',
      passwordLength: password ? password.length : 0
    })

    // 验证输入
    if (!username || !email || !password) {
      console.log('输入验证失败 - 缺少必要字段')
      return res.status(400).json({ message: '请填写所有必填字段' })
    }

    if (password.length < 6) {
      console.log('密码长度不足')
      return res.status(400).json({ message: '密码至少需要6个字符' })
    }

    console.log('连接数据库...')
    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')
    console.log('数据库连接成功')

    // 检查用户是否已存在
    console.log('检查用户是否已存在...')
    const existingUser = await users.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      console.log('用户已存在:', existingUser.email === email ? '邮箱冲突' : '用户名冲突')
      return res.status(400).json({ 
        message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用' 
      })
    }

    // 检查是否是第一个用户（自动设为管理员）
    console.log('检查用户数量...')
    const userCount = await users.countDocuments()
    const isFirstUser = userCount === 0
    console.log('用户数量:', userCount, '是否为第一个用户:', isFirstUser)

    // 创建新用户
    console.log('生成密码哈希...')
    const hashedPassword = await hashPassword(password)
    console.log('密码哈希生成成功')
    
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

    console.log('插入新用户到数据库...')
    const result = await users.insertOne(newUser)
    console.log('用户创建成功, ID:', result.insertedId)

    console.log('生成JWT token...')
    const token = generateToken(result.insertedId)
    console.log('JWT token已生成')

    const registerResponse = {
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
    }

    console.log('注册成功响应:', {
      message: registerResponse.message,
      needsEmailVerification: registerResponse.needsEmailVerification,
      userId: registerResponse.user.id,
      username: registerResponse.user.username,
      email: registerResponse.user.email?.replace(/./g, '*'),
      role: registerResponse.user.role
    })

    res.status(201).json(registerResponse)

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 注册错误:`, error)
    console.error('错误堆栈:', error.stack)
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      code: error.code
    })
    
    res.status(500).json({ message: '服务器内部错误' })
  }
  
  console.log(`[${new Date().toISOString()}] 注册请求处理完成`)
} 