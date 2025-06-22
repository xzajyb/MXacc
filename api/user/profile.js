import clientPromise from '../_lib/mongodb.js'
import { verifyToken, getTokenFromRequest } from '../_lib/auth.js'
import { ObjectId } from 'mongodb'

export default async function handler(req, res) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ message: '无效的认证令牌' })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    if (req.method === 'GET') {
      // 获取用户资料
      const user = await users.findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { password: 0 } }
      )

      if (!user) {
        return res.status(404).json({ message: '用户不存在' })
      }

      res.status(200).json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          profile: user.profile || { displayName: user.username, avatar: null },
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      })

    } else if (req.method === 'PUT') {
      // 更新用户资料
      const { displayName, bio } = req.body

      const updateData = {}
      if (displayName) updateData['profile.displayName'] = displayName
      if (bio !== undefined) updateData['profile.bio'] = bio

      await users.updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $set: updateData }
      )

      res.status(200).json({ message: '资料更新成功' })

    } else {
      res.status(405).json({ message: '方法不允许' })
    }

  } catch (error) {
    console.error('用户资料错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 