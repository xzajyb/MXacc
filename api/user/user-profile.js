const clientPromise = require('../_lib/mongodb')
const { verifyToken, hashPassword, comparePassword } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

// 注意：邮件发送已迁移到统一邮件服务 /api/services/email

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
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

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    const { type } = req.query || {}

    if (req.method === 'GET') {
      if (type === 'login-history') {
        // 获取登录历史
        const loginHistory = user.loginHistory || []
        const sortedHistory = loginHistory
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 50) // 最多返回50条记录

        return res.status(200).json({
          message: '获取登录历史成功',
          loginHistory: sortedHistory
        })
      } else {
        // 获取用户资料
        const profile = {
          id: user._id,
          username: user.username,
          email: user.email,
          isEmailVerified: user.isEmailVerified || false,
          role: user.role || 'user',
          profile: user.profile || {},
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }

        return res.status(200).json({
          message: '获取用户信息成功',
          user: profile
        })
      }
    }

    if (req.method === 'PUT') {
      const { type: bodyType, username, bio, currentPassword, newPassword } = req.body

      if (bodyType === 'change-password') {
        // 密码修改功能
        console.log('🔄 处理密码修改请求')

        if (!currentPassword || !newPassword) {
          return res.status(400).json({ 
            success: false, 
            message: '请提供当前密码和新密码' 
          })
        }

        if (newPassword.length < 6) {
          return res.status(400).json({ 
            success: false, 
            message: '新密码长度至少为6位' 
          })
        }

        // 验证当前密码
        const isPasswordValid = await comparePassword(currentPassword, user.password)
        
        if (!isPasswordValid) {
          return res.status(400).json({ 
            success: false, 
            message: '当前密码错误' 
          })
        }

        // 生成新密码哈希
        const newPasswordHash = await hashPassword(newPassword)

        // 获取客户端信息
        const clientIP = req.headers['x-forwarded-for'] || 
                         req.headers['x-real-ip'] || 
                         req.connection.remoteAddress || 
                         req.socket.remoteAddress ||
                         '未知'
        const userAgent = req.headers['user-agent'] || '未知设备'

        // 更新密码并记录安全日志
        await users.updateOne(
          { _id: user._id },
          {
            $set: {
              password: newPasswordHash,
              lastPasswordChange: new Date(),
              updatedAt: new Date()
            },
            $push: {
              securityLogs: {
                type: 'password_change',
                timestamp: new Date(),
                ip: clientIP,
                userAgent: userAgent,
                details: {
                  email: user.email,
                  changeMethod: 'security_center'
                }
              }
            }
          }
        )

        console.log('✅ 密码修改完成:', user.email)

        // 通过邮件服务发送安全通知邮件
        let emailSent = false
        let emailError = null
        
        try {
          console.log('📧 通过邮件服务发送密码修改安全通知...')
          
          // 获取设备信息
          const getDeviceInfo = (userAgent) => {
            const ua = userAgent.toLowerCase()
            let device = '未知设备'
            let os = '未知系统'
            let browser = '未知浏览器'

            if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
              device = '移动设备'
            } else if (ua.includes('tablet') || ua.includes('ipad')) {
              device = '平板设备'
            } else {
              device = '桌面设备'
            }

            if (ua.includes('windows')) os = 'Windows'
            else if (ua.includes('mac')) os = 'macOS'
            else if (ua.includes('linux')) os = 'Linux'
            else if (ua.includes('android')) os = 'Android'
            else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'

            if (ua.includes('chrome')) browser = 'Chrome'
            else if (ua.includes('firefox')) browser = 'Firefox'
            else if (ua.includes('safari')) browser = 'Safari'
            else if (ua.includes('edge')) browser = 'Edge'

            return { device, os, browser }
          }

          const deviceInfo = getDeviceInfo(userAgent)
          const timestamp = new Date().toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
          
          // 调用邮件服务API
          const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                         process.env.BASE_URL || 'http://localhost:3000'
          
          const emailServiceResponse = await fetch(`${baseUrl}/api/services/email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'password_change_notification',
              to: user.email,
              data: {
                username: user.username,
                timestamp: timestamp,
                ip: clientIP,
                deviceInfo: deviceInfo
              }
            })
          })

          const emailResult = await emailServiceResponse.json()
          
          if (emailResult.success) {
            emailSent = true
            console.log('✅ 密码修改安全通知已提交到发送队列')
          } else {
            throw new Error(emailResult.message || '邮件服务调用失败')
          }
        } catch (error) {
          emailError = error.message
          console.error('❌ 密码修改安全通知邮件服务调用失败:', error)
        }

        return res.status(200).json({
          success: true,
          message: emailSent 
            ? '密码修改成功，已发送安全通知邮件' 
            : '密码修改成功，但邮件发送失败：' + (emailError || '未知错误'),
          emailSent: emailSent
        })
      } else {
        // 更新用户资料
        const updateData = {}

        // 验证用户名
        if (username !== undefined) {
          if (!username || username.trim().length === 0) {
            return res.status(400).json({ message: '用户名不能为空' })
          }

          const trimmedUsername = username.trim()
          if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
            return res.status(400).json({ message: '用户名长度必须在2-20个字符之间' })
          }

          // 检查用户名是否已存在（除了当前用户）
          const existingUser = await users.findOne({
            username: trimmedUsername,
            _id: { $ne: user._id }
          })

          if (existingUser) {
            return res.status(400).json({ message: '用户名已存在' })
          }

          updateData.username = trimmedUsername
        }

        // 验证个人简介
        if (bio !== undefined) {
          if (bio && bio.length > 200) {
            return res.status(400).json({ message: '个人简介不能超过200个字符' })
          }
          updateData['profile.bio'] = bio || ''
        }

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ message: '没有需要更新的数据' })
        }

        // 更新数据库
        updateData.updatedAt = new Date()
        await users.updateOne({ _id: user._id }, { $set: updateData })

        // 返回更新后的用户信息
        const updatedUser = await users.findOne({ _id: user._id })
        const responseUser = {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          isEmailVerified: updatedUser.isEmailVerified || false,
          role: updatedUser.role || 'user',
          profile: updatedUser.profile || {},
          lastLogin: updatedUser.lastLogin,
          createdAt: updatedUser.createdAt
        }

        return res.status(200).json({
          message: '用户信息更新成功',
          user: responseUser
        })
      }
    }

    return res.status(405).json({ message: '方法不允许' })

  } catch (error) {
    console.error('用户资料API错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}