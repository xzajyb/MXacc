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
    const { emailOrUsername, password, rememberMe } = req.body

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

    // 解析用户代理字符串获取设备信息
    const parseUserAgent = (userAgent) => {
      if (!userAgent) return '未知设备'
      
      // 简单的用户代理解析
      if (userAgent.includes('Chrome')) {
        if (userAgent.includes('Mobile')) {
          return userAgent.includes('Android') ? 'Chrome Android' : 'Chrome Mobile'
        }
        return `Chrome ${userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : 'Linux'}`
      } else if (userAgent.includes('Firefox')) {
        return `Firefox ${userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : 'Linux'}`
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        return userAgent.includes('Mobile') ? 'Safari iOS' : 'Safari macOS'
      } else if (userAgent.includes('Edge')) {
        return 'Microsoft Edge'
      }
      
      return userAgent.substring(0, 50) // 限制长度
    }

    // 解析IP地址获取大概位置（简单版本）
    const parseLocation = (ip) => {
      if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return '本地网络'
      }
      // 这里可以集成第三方IP地理位置服务
      return '未知位置'
    }

    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || req.socket.remoteAddress
    const userAgent = req.headers['user-agent']
    
    // 重置登录尝试次数并更新最后登录时间，记录登录历史
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastLoginAt: new Date(),
          loginAttempts: 0
        },
        $push: {
          loginHistory: {
            $each: [{
              timestamp: new Date(),
              ip: clientIp,
              userAgent: parseUserAgent(userAgent),
              location: parseLocation(clientIp)
            }],
            $slice: -20 // 只保留最近20条记录
          }
        }
      }
    )

    // 生成token
    const token = generateToken(user._id, rememberMe ? '48h' : '24h')

    // 返回成功响应（无论邮箱是否验证都允许登录）
    res.status(200).json({
      success: true,
      message: '登录成功',
      token,
      expiresIn: rememberMe ? '48h' : '24h',
      needsEmailVerification: !user.isEmailVerified, // 提示前端是否需要验证
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role || 'user', // 添加用户角色
        createdAt: user.createdAt,
        lastLogin: user.lastLoginAt,
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