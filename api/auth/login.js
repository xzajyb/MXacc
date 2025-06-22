const clientPromise = require('../_lib/mongodb')
const { comparePassword, generateToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

module.exports = async function handler(req, res) {
  // 记录请求开始
  console.log(`[${new Date().toISOString()}] 登录请求开始`)
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
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: '请求方法不允许，仅支持POST请求' 
    })
  }

  try {
    const { emailOrUsername, password } = req.body
    console.log('登录尝试 - 用户标识:', emailOrUsername ? emailOrUsername.replace(/./g, '*') : 'undefined')
    console.log('密码长度:', password ? password.length : 0)

    // 验证输入
    if (!emailOrUsername || !password) {
      console.log('输入验证失败 - 缺少必要字段')
      return res.status(400).json({ 
        error: 'Bad Request',
        message: '请填写邮箱/用户名和密码' 
      })
    }

    console.log('连接数据库...')
    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')
    console.log('数据库连接成功')

    // 查找用户
    console.log('查找用户...')
    const user = await users.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    })

    if (!user) {
      console.log('用户未找到')
      return res.status(400).json({ 
        error: 'Invalid Credentials',
        message: '邮箱/用户名或密码错误' 
      })
    }

    console.log('找到用户:', {
      id: user._id,
      username: user.username,
      email: user.email?.replace(/./g, '*'),
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      role: user.role
    })

    // 检查账户状态
    if (user.status === 'locked') {
      console.log('账户已锁定')
      return res.status(403).json({ 
        error: 'Account Locked',
        message: '账户已被锁定，请联系管理员' 
      })
    }

    // 验证密码
    console.log('验证密码...')
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      console.log('密码验证失败')
      // 记录失败的登录尝试
      await users.updateOne(
        { _id: user._id },
        { 
          $inc: { loginAttempts: 1 },
          $set: { lastFailedLogin: new Date() }
        }
      )
      console.log('已记录失败登录尝试')
      
      return res.status(400).json({ 
        error: 'Invalid Credentials',
        message: '邮箱/用户名或密码错误' 
      })
    }

    console.log('密码验证成功')

    // 重置登录尝试次数并更新最后登录时间
    console.log('更新用户登录信息...')
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastLoginAt: new Date(),
          loginAttempts: 0
        },
        $push: {
          loginHistory: {
            timestamp: new Date(),
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        }
      }
    )
    console.log('用户登录信息已更新')

    // 生成token
    console.log('生成JWT token...')
    const token = generateToken(user._id)
    console.log('JWT token已生成')

    const loginResponse = {
      success: true,
      message: '登录成功',
      token,
      needsEmailVerification: !user.isEmailVerified, // 提示前端是否需要验证
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role || 'user', // 添加用户角色
        profile: user.profile || { 
          displayName: user.username, 
          nickname: user.username,
          avatar: null,
          bio: null,
          location: null,
          website: null
        }
      }
    }

    console.log('登录成功响应:', {
      success: loginResponse.success,
      message: loginResponse.message,
      needsEmailVerification: loginResponse.needsEmailVerification,
      userId: loginResponse.user.id,
      username: loginResponse.user.username,
      email: loginResponse.user.email?.replace(/./g, '*'),
      role: loginResponse.user.role
    })

    // 返回成功响应（无论邮箱是否验证都允许登录）
    res.status(200).json(loginResponse)

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 登录错误:`, error)
    console.error('错误堆栈:', error.stack)
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      code: error.code
    })
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后再试' 
    })
  }
  
  console.log(`[${new Date().toISOString()}] 登录请求处理完成`)
} 