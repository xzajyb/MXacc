const clientPromise = require('../_lib/mongodb')
const { verifyToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { type } = req.query || {}
    
    // 合作伙伴Logo不需要登录验证
    if (req.method === 'GET' && type === 'partner-logos') {
      const client = await clientPromise
      const db = client.db('mxacc')
      const systemSettings = db.collection('system_settings')
      const partnerLogos = await systemSettings.findOne({ _id: 'partner_logos' }) || { logos: [], enabled: true }
      return res.status(200).json({ 
        message: '获取合作伙伴Logo成功', 
        partnerLogos 
      })
    }
    
    // 其他请求需要token验证
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

    if (req.method === 'GET') {
      if (type === 'security') {
        const defaultSecuritySettings = { loginNotifications: false }
        const securitySettings = { ...defaultSecuritySettings, ...user.securitySettings }
        return res.status(200).json({ message: '获取安全设置成功', securitySettings })
      } else {
        const defaultSettings = {
          theme: 'auto',
          notifications: { email: true, browser: true, marketing: false },
          privacy: { 
            profileVisible: true, 
            activityVisible: false, 
            allowDataCollection: true,
            showFollowers: true,
            showFollowing: true
          },
          language: 'zh-CN',
          timezone: 'Asia/Shanghai'
        }
        const settings = { ...defaultSettings, ...user.settings }
        return res.status(200).json({ message: '获取设置成功', settings })
      }
    } else if (req.method === 'PUT') {
      if (type === 'security') {
        const { securitySettings } = req.body
        if (!securitySettings || typeof securitySettings !== 'object') {
          return res.status(400).json({ message: '无效的安全设置数据' })
        }

        const validatedSettings = {}
        if (typeof securitySettings.loginNotifications === 'boolean') {
          validatedSettings.loginNotifications = securitySettings.loginNotifications
        }

        await users.updateOne({ _id: user._id }, {
          $set: {
            'securitySettings': { ...user.securitySettings, ...validatedSettings },
            updatedAt: new Date()
          }
        })

        return res.status(200).json({
          message: '安全设置保存成功',
          securitySettings: { ...user.securitySettings, ...validatedSettings }
        })
      } else {
        const { settings } = req.body
        if (!settings || typeof settings !== 'object') {
          return res.status(400).json({ message: '无效的设置数据' })
        }

        const validatedSettings = {}
        
        if (settings.theme && ['light', 'dark', 'auto'].includes(settings.theme)) {
          validatedSettings.theme = settings.theme
        }

        if (settings.notifications && typeof settings.notifications === 'object') {
          validatedSettings.notifications = {}
          if (typeof settings.notifications.email === 'boolean') {
            validatedSettings.notifications.email = settings.notifications.email
          }
          if (typeof settings.notifications.browser === 'boolean') {
            validatedSettings.notifications.browser = settings.notifications.browser
          }
          if (typeof settings.notifications.marketing === 'boolean') {
            validatedSettings.notifications.marketing = settings.notifications.marketing
          }
        }

        if (settings.privacy && typeof settings.privacy === 'object') {
          validatedSettings.privacy = {}
          if (typeof settings.privacy.profileVisible === 'boolean') {
            validatedSettings.privacy.profileVisible = settings.privacy.profileVisible
          }
          if (typeof settings.privacy.activityVisible === 'boolean') {
            validatedSettings.privacy.activityVisible = settings.privacy.activityVisible
          }
          if (typeof settings.privacy.allowDataCollection === 'boolean') {
            validatedSettings.privacy.allowDataCollection = settings.privacy.allowDataCollection
          }
          if (typeof settings.privacy.showFollowers === 'boolean') {
            validatedSettings.privacy.showFollowers = settings.privacy.showFollowers
          }
          if (typeof settings.privacy.showFollowing === 'boolean') {
            validatedSettings.privacy.showFollowing = settings.privacy.showFollowing
          }
        }

        if (settings.language && typeof settings.language === 'string') {
          const validLanguages = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP']
          if (validLanguages.includes(settings.language)) {
            validatedSettings.language = settings.language
          }
        }

        if (settings.timezone && typeof settings.timezone === 'string') {
          const validTimezones = ['Asia/Shanghai', 'Asia/Tokyo', 'America/New_York', 'Europe/London']
          if (validTimezones.includes(settings.timezone)) {
            validatedSettings.timezone = settings.timezone
          }
        }

        // 深度合并设置对象
        const mergedSettings = { ...user.settings }
        
        // 合并顶层设置
        Object.keys(validatedSettings).forEach(key => {
          if (key === 'notifications' && validatedSettings.notifications) {
            mergedSettings.notifications = { ...mergedSettings.notifications, ...validatedSettings.notifications }
          } else if (key === 'privacy' && validatedSettings.privacy) {
            mergedSettings.privacy = { ...mergedSettings.privacy, ...validatedSettings.privacy }
          } else {
            mergedSettings[key] = validatedSettings[key]
          }
        })

        await users.updateOne({ _id: user._id }, {
          $set: {
            'settings': mergedSettings,
            updatedAt: new Date()
          }
        })

        return res.status(200).json({
          message: '设置保存成功',
          settings: mergedSettings
        })
      }
    } else {
      return res.status(405).json({ message: '方法不允许' })
    }

  } catch (error) {
    console.error('用户设置API错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}