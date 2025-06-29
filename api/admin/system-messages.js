const clientPromise = require('../_lib/mongodb')
const { ObjectId } = require('mongodb')

// 验证JWT token
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未提供有效的授权token')
  }
  
  const token = authHeader.split(' ')[1]
  try {
    const jwt = require('jsonwebtoken')
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    throw new Error('Token无效')
  }
}

// 获取用户信息
async function getUserById(users, userId) {
  return await users.findOne(
    { _id: new ObjectId(userId) },
    { 
      projection: { 
        username: 1, 
        email: 1, 
        'profile.nickname': 1,
        'profile.avatar': 1,
        role: 1,
        isEmailVerified: 1,
        'security.emailVerified': 1
      } 
    }
  )
}

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    console.log('=== System Messages API ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')
    const systemMessages = db.collection('system_messages')
    const userReadStatus = db.collection('user_read_status')

    // 验证用户身份
    const decoded = verifyToken(req.headers.authorization)
    const currentUser = await getUserById(users, decoded.userId)
    
    if (!currentUser) {
      return res.status(401).json({ success: false, message: '用户不存在' })
    }

    // GET: 获取系统消息
    if (req.method === 'GET') {
      const { action, page = 1, limit = 20 } = req.query

      // 获取系统消息列表
      if (action === 'list') {
        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        // 查询全局消息和专属于当前用户的消息
        const messagesList = await systemMessages.find({
          $or: [
            { targetUserId: null }, // 全局消息
            { targetUserId: new ObjectId(decoded.userId) } // 个人专属消息
          ]
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        // 获取用户的已读状态
        const messagesWithReadStatus = await Promise.all(messagesList.map(async (message) => {
          const readStatus = await userReadStatus.findOne({
            userId: new ObjectId(decoded.userId),
            messageId: message._id
          })

          return {
            id: message._id,
            title: message.title,
            content: message.content,
            type: message.type,
            priority: message.priority,
            autoRead: message.autoRead || false,
            isRead: !!readStatus,
            createdAt: message.createdAt,
            author: {
              id: message.authorId,
              nickname: message.authorName
            }
          }
        }))

        const total = await systemMessages.countDocuments({
          $or: [
            { targetUserId: null },
            { targetUserId: new ObjectId(decoded.userId) }
          ]
        })

        return res.status(200).json({
          success: true,
          data: {
            messages: messagesWithReadStatus,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        })
      }

      // 获取未读消息数量
      if (action === 'unread-count') {
        const totalMessages = await systemMessages.countDocuments({
          $or: [
            { targetUserId: null },
            { targetUserId: new ObjectId(decoded.userId) }
          ]
        })
        const readMessages = await userReadStatus.countDocuments({
          userId: new ObjectId(decoded.userId)
        })
        const unreadCount = totalMessages - readMessages

        return res.status(200).json({
          success: true,
          data: { unreadCount: Math.max(0, unreadCount) }
        })
      }

      // 管理员获取所有消息（包括统计信息）
      if (action === 'admin-list') {
        if (currentUser.role !== 'admin') {
          return res.status(403).json({ 
            success: false, 
            message: '需要管理员权限' 
          })
        }

        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        const messagesList = await systemMessages.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        // 获取每条消息的阅读统计
        const messagesWithStats = await Promise.all(messagesList.map(async (message) => {
          const readCount = await userReadStatus.countDocuments({
            messageId: message._id
          })
          
          // 根据消息类型计算总用户数
          let totalUsers
          let targetUser = null
          let isPersonal = false
          
          if (message.targetUserId) {
            // 个人专属消息，总用户数为1
            totalUsers = 1
            isPersonal = true
            targetUser = await getUserById(users, message.targetUserId)
          } else {
            // 全局消息，总用户数为所有用户
            totalUsers = await users.countDocuments()
          }

          return {
            id: message._id,
            title: message.title,
            content: message.content,
            type: message.type,
            priority: message.priority,
            autoRead: message.autoRead || false,
            isPersonal,
            targetUser: targetUser ? {
              id: targetUser._id,
              username: targetUser.username,
              email: targetUser.email,
              nickname: targetUser.profile?.nickname || targetUser.username
            } : null,
            readCount,
            totalUsers,
            readRate: totalUsers > 0 ? (readCount / totalUsers * 100).toFixed(1) : '0',
            createdAt: message.createdAt,
            author: {
              id: message.authorId,
              nickname: message.authorName
            }
          }
        }))

        const total = await systemMessages.countDocuments()

        return res.status(200).json({
          success: true,
          data: {
            messages: messagesWithStats,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        })
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    // POST: 创建系统消息和操作
    if (req.method === 'POST') {
      const { action, title, content, type = 'info', priority = 'normal', messageId, autoRead = false } = req.body

      // 发布系统消息（管理员专用）
      if (action === 'create') {
        if (currentUser.role !== 'admin') {
          return res.status(403).json({ 
            success: false, 
            message: '需要管理员权限' 
          })
        }

        if (!title || !content) {
          return res.status(400).json({ 
            success: false, 
            message: '标题和内容不能为空' 
          })
        }

        if (title.length > 100) {
          return res.status(400).json({ 
            success: false, 
            message: '标题不能超过100个字符' 
          })
        }

        if (content.length > 2000) {
          return res.status(400).json({ 
            success: false, 
            message: '内容不能超过2000个字符' 
          })
        }

        const validTypes = ['info', 'warning', 'success', 'error']
        const validPriorities = ['low', 'normal', 'high', 'urgent']

        if (!validTypes.includes(type)) {
          return res.status(400).json({ 
            success: false, 
            message: '消息类型无效' 
          })
        }

        if (!validPriorities.includes(priority)) {
          return res.status(400).json({ 
            success: false, 
            message: '优先级无效' 
          })
        }

        const newMessage = {
          title: title.trim(),
          content: content.trim(),
          type,
          priority,
          autoRead: autoRead || false, // 是否自动标记已读
          targetUserId: req.body.targetUserId ? new ObjectId(req.body.targetUserId) : null, // 目标用户ID，null表示全局消息
          authorId: new ObjectId(decoded.userId),
          authorName: currentUser.profile?.nickname || currentUser.username,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = await systemMessages.insertOne(newMessage)

        return res.status(201).json({
          success: true,
          message: '系统消息发布成功',
          data: {
            id: result.insertedId,
            title: newMessage.title,
            content: newMessage.content,
            type: newMessage.type,
            priority: newMessage.priority,
            createdAt: newMessage.createdAt
          }
        })
      }

      // 标记消息为已读
      if (action === 'mark-read') {
        if (!messageId) {
          return res.status(400).json({ 
            success: false, 
            message: '消息ID不能为空' 
          })
        }

        // 检查消息是否存在
        const message = await systemMessages.findOne({ _id: new ObjectId(messageId) })
        if (!message) {
          return res.status(404).json({ 
            success: false, 
            message: '消息不存在' 
          })
        }

        // 检查是否已经标记为已读
        const existingRead = await userReadStatus.findOne({
          userId: new ObjectId(decoded.userId),
          messageId: new ObjectId(messageId)
        })

        if (!existingRead) {
          await userReadStatus.insertOne({
            userId: new ObjectId(decoded.userId),
            messageId: new ObjectId(messageId),
            readAt: new Date()
          })
        }

        return res.status(200).json({
          success: true,
          message: '消息已标记为已读'
        })
      }

      // 标记所有消息为已读
      if (action === 'mark-all-read') {
        const allMessages = await systemMessages.find({
          $or: [
            { targetUserId: null },
            { targetUserId: new ObjectId(decoded.userId) }
          ]
        }, { projection: { _id: 1 } }).toArray()
        
        const readOperations = allMessages.map(message => ({
          updateOne: {
            filter: {
              userId: new ObjectId(decoded.userId),
              messageId: message._id
            },
            update: {
              $setOnInsert: {
                userId: new ObjectId(decoded.userId),
                messageId: message._id,
                readAt: new Date()
              }
            },
            upsert: true
          }
        }))

        if (readOperations.length > 0) {
          await userReadStatus.bulkWrite(readOperations)
        }

        return res.status(200).json({
          success: true,
          message: '所有消息已标记为已读'
        })
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    // DELETE: 删除系统消息（管理员专用）
    if (req.method === 'DELETE') {
      const { id } = req.query

      if (currentUser.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: '需要管理员权限' 
        })
      }

      if (!id) {
        return res.status(400).json({ 
          success: false, 
          message: '消息ID不能为空' 
        })
      }

      const message = await systemMessages.findOne({ _id: new ObjectId(id) })
      
      if (!message) {
        return res.status(404).json({ 
          success: false, 
          message: '消息不存在' 
        })
      }

      // 删除消息和相关的已读状态
      await Promise.all([
        systemMessages.deleteOne({ _id: new ObjectId(id) }),
        userReadStatus.deleteMany({ messageId: new ObjectId(id) })
      ])

      return res.status(200).json({
        success: true,
        message: '系统消息删除成功'
      })
    }

    return res.status(405).json({ 
      success: false, 
      message: '方法不允许' 
    })

  } catch (error) {
    console.error('System Messages API Error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    })
  }
} 