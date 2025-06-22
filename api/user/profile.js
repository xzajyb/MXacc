const clientPromise = require('../_lib/mongodb')
const jwt = require('jsonwebtoken')

export default async function handler(req, res) {
  const client = await clientPromise
  const db = client.db('mxacc')
  
  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' })
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await db.collection('users').findOne({ 
        _id: decoded.userId 
      })

      if (!user) {
        return res.status(404).json({ message: '用户不存在' })
      }

      // 返回用户信息，包含所有需要的字段
      const userResponse = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        isEmailVerified: user.isEmailVerified || false,
        fullName: user.fullName || '',
        profile: {
          bio: user.profile?.bio || '',
          location: user.profile?.location || '',
          website: user.profile?.website || '',
          avatar: user.profile?.avatar || ''
        },
        settings: user.settings || {
          theme: 'system',
          language: 'zh-CN',
          emailNotifications: true,
          twoFactorEnabled: false
        },
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }

      res.status(200).json({ 
        message: '获取用户信息成功',
        user: userResponse
      })
    } catch (error) {
      console.error('获取用户信息失败:', error)
      res.status(500).json({ message: '获取用户信息失败' })
    }
  } 
  else if (req.method === 'PUT') {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' })
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const { fullName, bio, location, website } = req.body

      // 构建更新对象
      const updateData = {}
      
      if (fullName !== undefined) {
        updateData.fullName = fullName
      }
      
      if (bio !== undefined || location !== undefined || website !== undefined) {
        updateData['profile.bio'] = bio || ''
        updateData['profile.location'] = location || ''
        updateData['profile.website'] = website || ''
      }
      
      updateData.updatedAt = new Date()

      // 更新用户信息
      const result = await db.collection('users').updateOne(
        { _id: decoded.userId },
        { $set: updateData }
      )

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: '用户不存在' })
      }

      // 获取更新后的用户信息
      const updatedUser = await db.collection('users').findOne({ 
        _id: decoded.userId 
      })

      const userResponse = {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role || 'user',
        isEmailVerified: updatedUser.isEmailVerified || false,
        fullName: updatedUser.fullName || '',
        profile: {
          bio: updatedUser.profile?.bio || '',
          location: updatedUser.profile?.location || '',
          website: updatedUser.profile?.website || '',
          avatar: updatedUser.profile?.avatar || ''
        },
        settings: updatedUser.settings || {
          theme: 'system',
          language: 'zh-CN',
          emailNotifications: true,
          twoFactorEnabled: false
        },
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt
      }

      res.status(200).json({ 
        message: '个人资料更新成功',
        user: userResponse
      })
    } catch (error) {
      console.error('更新个人资料失败:', error)
      res.status(500).json({ message: '更新个人资料失败' })
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'PUT'])
    res.status(405).json({ message: '方法不被允许' })
  }
} 