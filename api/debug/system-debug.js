const clientPromise = require('../_lib/mongodb')
const { verifyToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' })
  }

  try {
    const { type } = req.query

    if (type === 'email-status') {
      return await handleEmailStatus(req, res)
    } else if (type === 'user-settings') {
      return await handleUserSettings(req, res)
    } else {
      return res.status(400).json({ message: '未指定调试类型' })
    }

  } catch (error) {
    console.error('系统调试API错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// 处理邮件状态调试
async function handleEmailStatus(req, res) {
  try {
    // 检查邮件配置
    const emailConfig = {
      host: process.env.EMAIL_HOST || '未配置',
      port: process.env.EMAIL_PORT || '未配置',
      user: process.env.EMAIL_USER || '未配置',
      hasPassword: !!process.env.EMAIL_PASSWORD,
      service: process.env.EMAIL_SERVICE || '未配置'
    }

    // 检查邮件模块
    let emailModuleStatus = {
      loaded: false,
      error: null,
      functions: []
    }

    try {
      const emailModule = require('../_lib/luckycola-email')
      emailModuleStatus.loaded = true
      emailModuleStatus.functions = Object.keys(emailModule)
    } catch (error) {
      emailModuleStatus.error = error.message
    }

    // 检查数据库中的邮件相关数据
    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    const usersWithEmailSendInfo = await users.countDocuments({ emailSendInfo: { $exists: true } })
    const usersWithVerificationCode = await users.countDocuments({ verificationCode: { $exists: true } })
    const verifiedUsers = await users.countDocuments({ isEmailVerified: true })
    const unverifiedUsers = await users.countDocuments({ isEmailVerified: { $ne: true } })

    // 获取最近的邮件发送记录
    const recentEmailUsers = await users.find(
      { 'emailSendInfo.lastSendTime': { $exists: true } },
      { 
        projection: { 
          email: 1, 
          'emailSendInfo.sendCount': 1, 
          'emailSendInfo.lastSendTime': 1,
          'emailSendInfo.firstSendTime': 1 
        } 
      }
    ).sort({ 'emailSendInfo.lastSendTime': -1 }).limit(10).toArray()

    const debugInfo = {
      timestamp: new Date().toISOString(),
      emailConfig,
      emailModuleStatus,
      databaseStats: {
        usersWithEmailSendInfo,
        usersWithVerificationCode,
        verifiedUsers,
        unverifiedUsers
      },
      recentEmailActivity: recentEmailUsers.map(user => ({
        email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // 脱敏处理
        sendCount: user.emailSendInfo?.sendCount || 0,
        lastSendTime: user.emailSendInfo?.lastSendTime,
        firstSendTime: user.emailSendInfo?.firstSendTime
      }))
    }

    res.status(200).json({
      message: '邮件系统状态获取成功',
      debug: debugInfo
    })

  } catch (error) {
    console.error('邮件状态调试错误:', error)
    res.status(500).json({
      message: '邮件状态检查失败',
      error: error.message
    })
  }
}

// 处理用户设置调试
async function handleUserSettings(req, res) {
  try {
    const authHeader = req.headers.authorization
    
    let userInfo = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      
      if (decoded) {
        const client = await clientPromise
        const db = client.db('mxacc')
        const users = db.collection('users')
        
        const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
        if (user) {
          userInfo = {
            userId: user._id,
            username: user.username,
            email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // 脱敏处理
            settings: user.settings || {},
            securitySettings: user.securitySettings || {},
            hasSettings: !!user.settings,
            hasSecuritySettings: !!user.securitySettings
          }
        }
      }
    }

    const debugResponse = {
      timestamp: new Date().toISOString(),
      tokenProvided: !!authHeader,
      tokenValid: !!userInfo,
      userInfo,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        platform: process.platform,
        nodeVersion: process.version
      }
    }

    res.status(200).json({
      message: '用户设置调试信息获取成功',
      debug: debugResponse
    })

  } catch (error) {
    console.error('用户设置调试错误:', error)
    res.status(500).json({
      message: '用户设置调试失败',
      error: error.message
    })
  }
}