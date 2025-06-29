import { ObjectId } from 'mongodb'
import { connectToDatabase } from '../_lib/mongodb.js'
import { verifyToken } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'POST') {
    return handlePost(req, res)
  } else if (req.method === 'PUT') {
    return handlePut(req, res)
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res)
  }
  
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
  return res.status(405).json({ message: '方法不被允许' })
}

// 获取封禁列表或申述列表
async function handleGet(req, res) {
  try {
    const authResult = verifyToken(req)
    if (!authResult.valid) {
      return res.status(401).json({ message: authResult.message })
    }

    const { db } = await connectToDatabase()
    const { action, page = 1, limit = 20, status, userId } = req.query

    if (action === 'bans') {
      // 管理员获取封禁列表
      if (authResult.user.role !== 'admin') {
        return res.status(403).json({ message: '需要管理员权限' })
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)
      const filter = {}
      
      if (status && status !== 'all') {
        if (status === 'active') {
          filter.$or = [
            { status: 'active' },
            { status: 'active', expiresAt: { $gt: new Date() } }
          ]
        } else {
          filter.status = status
        }
      }

      const bans = await db.collection('user_bans')
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray()

      // 获取被封禁用户信息
      const userIds = bans.map(ban => new ObjectId(ban.userId))
      const users = await db.collection('users')
        .find({ _id: { $in: userIds } })
        .project({ username: 1, email: 1, profile: 1 })
        .toArray()

      const userMap = {}
      users.forEach(user => {
        userMap[user._id.toString()] = user
      })

      const bansWithUserInfo = bans.map(ban => ({
        ...ban,
        _id: ban._id.toString(),
        userId: ban.userId.toString(),
        user: userMap[ban.userId.toString()] || null
      }))

      const total = await db.collection('user_bans').countDocuments(filter)

      return res.status(200).json({
        success: true,
        data: {
          bans: bansWithUserInfo,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      })
    } else if (action === 'appeals') {
      // 管理员获取申述列表
      if (authResult.user.role !== 'admin') {
        return res.status(403).json({ message: '需要管理员权限' })
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)
      const filter = {}
      
      if (status && status !== 'all') {
        filter.status = status
      }

      const appeals = await db.collection('ban_appeals')
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray()

      // 获取申述用户信息和对应的封禁信息
      const userIds = appeals.map(appeal => new ObjectId(appeal.userId))
      const banIds = appeals.map(appeal => new ObjectId(appeal.banId))

      const [users, bans] = await Promise.all([
        db.collection('users')
          .find({ _id: { $in: userIds } })
          .project({ username: 1, email: 1, profile: 1 })
          .toArray(),
        db.collection('user_bans')
          .find({ _id: { $in: banIds } })
          .toArray()
      ])

      const userMap = {}
      const banMap = {}
      users.forEach(user => {
        userMap[user._id.toString()] = user
      })
      bans.forEach(ban => {
        banMap[ban._id.toString()] = ban
      })

      const appealsWithInfo = appeals.map(appeal => ({
        ...appeal,
        _id: appeal._id.toString(),
        userId: appeal.userId.toString(),
        banId: appeal.banId.toString(),
        user: userMap[appeal.userId.toString()] || null,
        ban: banMap[appeal.banId.toString()] || null
      }))

      const total = await db.collection('ban_appeals').countDocuments(filter)

      return res.status(200).json({
        success: true,
        data: {
          appeals: appealsWithInfo,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      })
    } else if (action === 'check') {
      // 检查用户是否被封禁
      const targetUserId = userId || authResult.user.id

      const activeBan = await db.collection('user_bans').findOne({
        userId: new ObjectId(targetUserId),
        status: 'active',
        $or: [
          { expiresAt: null }, // 永久封禁
          { expiresAt: { $gt: new Date() } } // 临时封禁未到期
        ]
      })

      return res.status(200).json({
        success: true,
        data: {
          isBanned: !!activeBan,
          ban: activeBan ? {
            ...activeBan,
            _id: activeBan._id.toString(),
            userId: activeBan.userId.toString()
          } : null
        }
      })
    } else if (action === 'my-appeals') {
      // 用户查看自己的申述记录
      const appeals = await db.collection('ban_appeals')
        .find({ userId: new ObjectId(authResult.user.id) })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()

      const appealsWithInfo = appeals.map(appeal => ({
        ...appeal,
        _id: appeal._id.toString(),
        userId: appeal.userId.toString(),
        banId: appeal.banId.toString()
      }))

      return res.status(200).json({
        success: true,
        data: { appeals: appealsWithInfo }
      })
    }

    return res.status(400).json({ message: '无效的操作类型' })
  } catch (error) {
    console.error('获取封禁信息失败:', error)
    return res.status(500).json({ message: '服务器内部错误' })
  }
}

// 创建封禁或申述
async function handlePost(req, res) {
  try {
    const authResult = verifyToken(req)
    if (!authResult.valid) {
      return res.status(401).json({ message: authResult.message })
    }

    const { db } = await connectToDatabase()
    const { action } = req.body

    if (action === 'ban') {
      // 管理员封禁用户
      if (authResult.user.role !== 'admin') {
        return res.status(403).json({ message: '需要管理员权限' })
      }

      const { userId, reason, duration, durationType, notes } = req.body

      if (!userId || !reason) {
        return res.status(400).json({ message: '缺少必要参数：用户ID和封禁原因' })
      }

      // 检查用户是否存在
      const targetUser = await db.collection('users').findOne({
        _id: new ObjectId(userId)
      })

      if (!targetUser) {
        return res.status(404).json({ message: '用户不存在' })
      }

      // 不能封禁管理员
      if (targetUser.role === 'admin') {
        return res.status(400).json({ message: '不能封禁管理员用户' })
      }

      // 检查是否已经被封禁
      const existingBan = await db.collection('user_bans').findOne({
        userId: new ObjectId(userId),
        status: 'active'
      })

      if (existingBan) {
        return res.status(400).json({ message: '用户已经被封禁' })
      }

      // 计算到期时间
      let expiresAt = null
      if (duration && durationType && duration > 0) {
        const now = new Date()
        const durationMs = duration * (
          durationType === 'hours' ? 60 * 60 * 1000 :
          durationType === 'days' ? 24 * 60 * 60 * 1000 :
          durationType === 'weeks' ? 7 * 24 * 60 * 60 * 1000 :
          durationType === 'months' ? 30 * 24 * 60 * 60 * 1000 : 0
        )
        expiresAt = new Date(now.getTime() + durationMs)
      }

      // 创建封禁记录
      const banRecord = {
        userId: new ObjectId(userId),
        reason,
        notes: notes || '',
        duration: duration || null,
        durationType: durationType || null,
        expiresAt,
        status: 'active',
        createdBy: new ObjectId(authResult.user.id),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await db.collection('user_bans').insertOne(banRecord)

      return res.status(200).json({
        success: true,
        message: '用户封禁成功',
        data: {
          banId: result.insertedId.toString(),
          expiresAt
        }
      })
    } else if (action === 'appeal') {
      // 用户申述封禁
      const { banId, reason, details } = req.body

      if (!banId || !reason) {
        return res.status(400).json({ message: '缺少必要参数：封禁ID和申述原因' })
      }

      // 检查封禁记录是否存在且属于当前用户
      const ban = await db.collection('user_bans').findOne({
        _id: new ObjectId(banId),
        userId: new ObjectId(authResult.user.id),
        status: 'active'
      })

      if (!ban) {
        return res.status(404).json({ message: '封禁记录不存在或已失效' })
      }

      // 检查是否已经提交过申述
      const existingAppeal = await db.collection('ban_appeals').findOne({
        banId: new ObjectId(banId),
        userId: new ObjectId(authResult.user.id),
        status: { $in: ['pending', 'under_review'] }
      })

      if (existingAppeal) {
        return res.status(400).json({ message: '已存在待处理的申述，请耐心等待处理结果' })
      }

      // 创建申述记录
      const appealRecord = {
        banId: new ObjectId(banId),
        userId: new ObjectId(authResult.user.id),
        reason,
        details: details || '',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await db.collection('ban_appeals').insertOne(appealRecord)

      return res.status(200).json({
        success: true,
        message: '申述已提交，我们会尽快处理',
        data: {
          appealId: result.insertedId.toString()
        }
      })
    }

    return res.status(400).json({ message: '无效的操作类型' })
  } catch (error) {
    console.error('处理封禁操作失败:', error)
    return res.status(500).json({ message: '服务器内部错误' })
  }
}

// 更新封禁或申述状态
async function handlePut(req, res) {
  try {
    const authResult = verifyToken(req)
    if (!authResult.valid) {
      return res.status(401).json({ message: authResult.message })
    }

    // 需要管理员权限
    if (authResult.user.role !== 'admin') {
      return res.status(403).json({ message: '需要管理员权限' })
    }

    const { db } = await connectToDatabase()
    const { action, id, response, notes } = req.body

    if (action === 'unban') {
      // 解除封禁
      const result = await db.collection('user_bans').updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: 'revoked',
            revokedBy: new ObjectId(authResult.user.id),
            revokedAt: new Date(),
            revokeReason: notes || '管理员解除封禁',
            updatedAt: new Date()
          }
        }
      )

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: '封禁记录不存在' })
      }

      return res.status(200).json({
        success: true,
        message: '封禁已解除'
      })
    } else if (action === 'handle-appeal') {
      // 处理申述
      if (!response || !['approved', 'rejected'].includes(response)) {
        return res.status(400).json({ message: '无效的处理结果' })
      }

      const appeal = await db.collection('ban_appeals').findOne({
        _id: new ObjectId(id)
      })

      if (!appeal) {
        return res.status(404).json({ message: '申述记录不存在' })
      }

      const updateData = {
        status: response,
        handledBy: new ObjectId(authResult.user.id),
        handledAt: new Date(),
        adminResponse: notes || '',
        updatedAt: new Date()
      }

      // 如果申述通过，同时解除封禁
      if (response === 'approved') {
        await db.collection('user_bans').updateOne(
          { _id: new ObjectId(appeal.banId) },
          {
            $set: {
              status: 'revoked',
              revokedBy: new ObjectId(authResult.user.id),
              revokedAt: new Date(),
              revokeReason: '申述通过，解除封禁',
              updatedAt: new Date()
            }
          }
        )
      }

      await db.collection('ban_appeals').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )

      return res.status(200).json({
        success: true,
        message: response === 'approved' ? '申述已通过，封禁已解除' : '申述已驳回'
      })
    }

    return res.status(400).json({ message: '无效的操作类型' })
  } catch (error) {
    console.error('更新封禁状态失败:', error)
    return res.status(500).json({ message: '服务器内部错误' })
  }
}

// 删除封禁或申述记录
async function handleDelete(req, res) {
  try {
    const authResult = verifyToken(req)
    if (!authResult.valid) {
      return res.status(401).json({ message: authResult.message })
    }

    // 需要管理员权限
    if (authResult.user.role !== 'admin') {
      return res.status(403).json({ message: '需要管理员权限' })
    }

    const { db } = await connectToDatabase()
    const { type, id } = req.query

    if (type === 'ban') {
      const result = await db.collection('user_bans').deleteOne({
        _id: new ObjectId(id)
      })

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: '封禁记录不存在' })
      }

      return res.status(200).json({
        success: true,
        message: '封禁记录已删除'
      })
    } else if (type === 'appeal') {
      const result = await db.collection('ban_appeals').deleteOne({
        _id: new ObjectId(id)
      })

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: '申述记录不存在' })
      }

      return res.status(200).json({
        success: true,
        message: '申述记录已删除'
      })
    }

    return res.status(400).json({ message: '无效的删除类型' })
  } catch (error) {
    console.error('删除记录失败:', error)
    return res.status(500).json({ message: '服务器内部错误' })
  }
} 