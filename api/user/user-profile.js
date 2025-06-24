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
      // 更新用户资料
      const { username, bio } = req.body

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

    return res.status(405).json({ message: '方法不允许' })

  } catch (error) {
    console.error('用户资料API错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}