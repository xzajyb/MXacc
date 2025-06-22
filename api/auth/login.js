const clientPromise = require('../_lib/mongodb')
const { comparePassword, generateToken } = require('../_lib/auth')
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
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: '请求方法不允许，仅支持POST请求' 
    })
  }

  try {
    const { emailOrUsername, password } = req.body

    // 验证输入
    if (!emailOrUsername || !password) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: '请填写邮箱/用户名和密码' 
      })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    // 查找用户
    const user = await users.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    })

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid Credentials',
        message: '邮箱/用户名或密码错误' 
      })
    }

    // 检查账户状态
    if (user.status === 'locked') {
      return res.status(403).json({ 
        error: 'Account Locked',
        message: '账户已被锁定，请联系管理员' 
      })
    }

    // 验证密码
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      // 记录失败的登录尝试
      await users.updateOne(
        { _id: user._id },
        { 
          $inc: { loginAttempts: 1 },
          $set: { lastFailedLogin: new Date() }
        }
      )
      
      return res.status(400).json({ 
        error: 'Invalid Credentials',
        message: '邮箱/用户名或密码错误' 
      })
    }

    // 重置登录尝试次数并更新最后登录时间
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

    // 生成token
    const token = generateToken(user._id)

    // 返回成功响应（无论邮箱是否验证都允许登录）
    res.status(200).json({
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
    })

  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后再试' 
    })
  }
} 