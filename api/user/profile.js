const clientPromise = require('../_lib/mongodb')
const { getTokenFromRequest, verifyToken } = require('../_lib/auth')
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
    // 验证身份
    const token = getTokenFromRequest(req)
    if (!token) {
      return res.status(401).json({ message: '需要登录' })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ message: '无效的令牌' })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    if (req.method === 'GET') {
      // 获取用户信息
      const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
      if (!user) {
        return res.status(404).json({ message: '用户不存在' })
      }

      // 返回用户信息
      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          role: user.role || 'user',
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
    } else if (req.method === 'PUT') {
      // 更新个人资料
      const { profile } = req.body

      if (!profile) {
        return res.status(400).json({ message: '缺少个人资料数据' })
      }

      // 更新用户个人资料
      const updateData = {}
      if (profile.nickname !== undefined) updateData['profile.nickname'] = profile.nickname
      if (profile.bio !== undefined) updateData['profile.bio'] = profile.bio
      if (profile.location !== undefined) updateData['profile.location'] = profile.location
      if (profile.website !== undefined) updateData['profile.website'] = profile.website

      await users.updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $set: updateData }
      )

      // 获取更新后的用户信息
      const updatedUser = await users.findOne({ _id: new ObjectId(decoded.userId) })
      
      res.status(200).json({
        success: true,
        message: '个人资料更新成功',
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          isEmailVerified: updatedUser.isEmailVerified,
          role: updatedUser.role || 'user',
          createdAt: updatedUser.createdAt,
          lastLogin: updatedUser.lastLoginAt,
          profile: updatedUser.profile || { 
            displayName: updatedUser.username, 
            nickname: updatedUser.username,
            avatar: null,
            bio: null,
            location: null,
            website: null
          }
        }
      })
    } else {
      return res.status(405).json({ message: '方法不允许' })
    }

  } catch (error) {
    console.error('用户资料API错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 