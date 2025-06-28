const clientPromise = require('../_lib/mongodb')
const { ObjectId } = require('mongodb')

// 内存缓存系统
const cache = {
  conversations: new Map(), // 会话列表缓存
  messages: new Map(),      // 消息缓存
  userProfiles: new Map(),  // 用户资料缓存
  maxSize: 1000,           // 最大缓存条目数
  lastSync: new Date()     // 最后同步时间
}

// 缓存清理函数
function cleanCache() {
  const maxSize = cache.maxSize
  
  // 清理会话缓存
  if (cache.conversations.size > maxSize) {
    const entries = Array.from(cache.conversations.entries())
    const toKeep = entries.slice(-Math.floor(maxSize * 0.8)) // 保留80%最新的
    cache.conversations.clear()
    toKeep.forEach(([key, value]) => cache.conversations.set(key, value))
  }
  
  // 清理消息缓存
  if (cache.messages.size > maxSize * 2) {
    const entries = Array.from(cache.messages.entries())
    const toKeep = entries.slice(-Math.floor(maxSize * 1.6)) // 保留更多消息
    cache.messages.clear()
    toKeep.forEach(([key, value]) => cache.messages.set(key, value))
  }
  
  // 清理用户资料缓存
  if (cache.userProfiles.size > 500) {
    const entries = Array.from(cache.userProfiles.entries())
    const toKeep = entries.slice(-400) // 保留400个用户资料
    cache.userProfiles.clear()
    toKeep.forEach(([key, value]) => cache.userProfiles.set(key, value))
  }
}

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

// 获取用户信息（带缓存）
async function getUserById(users, userId) {
  const cacheKey = `user_${userId}`
  
  // 先检查缓存
  if (cache.userProfiles.has(cacheKey)) {
    return cache.userProfiles.get(cacheKey)
  }
  
  // 从数据库获取
  const user = await users.findOne(
    { _id: new ObjectId(userId) },
    { 
      projection: { 
        username: 1, 
        email: 1, 
        'profile.nickname': 1,
        'profile.avatar': 1,
        'profile.displayName': 1,
        role: 1,
        isEmailVerified: 1,
        'security.emailVerified': 1,
        lastActive: 1
      } 
    }
  )
  
  if (user) {
    user.isEmailVerified = user.isEmailVerified || user.security?.emailVerified || false
    // 缓存用户信息
    cache.userProfiles.set(cacheKey, user)
  }
  
  return user
}

// 获取会话ID（两个用户之间的唯一标识）
function getConversationId(userId1, userId2) {
  const sorted = [userId1, userId2].sort()
  return `${sorted[0]}_${sorted[1]}`
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
    console.log('=== Social Messages API ===')
    console.log('Method:', req.method)
    console.log('Body:', req.body)

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')
    const conversations = db.collection('conversations')
    const messages = db.collection('messages')

    // 验证用户身份
    const decoded = verifyToken(req.headers.authorization)
    const currentUser = await getUserById(users, decoded.userId)
    
    if (!currentUser) {
      return res.status(401).json({ success: false, message: '用户不存在' })
    }

    // 定期清理缓存
    cleanCache()

    if (req.method === 'GET') {
      const { action, conversationId, userId, page = 1, limit = 20 } = req.query

      if (action === 'conversations') {
        // 获取会话列表
        const cacheKey = `conversations_${decoded.userId}`
        let conversationList = cache.conversations.get(cacheKey)
        
        if (!conversationList) {
          // 从数据库获取
          conversationList = await conversations.find({
            participants: new ObjectId(decoded.userId)
          })
            .sort({ lastMessageAt: -1 })
            .limit(50) // 限制会话数量
            .toArray()
          
          // 缓存会话列表
          cache.conversations.set(cacheKey, conversationList)
        }

        // 获取会话详情（包含最后一条消息和对方用户信息）
        const conversationsWithDetails = await Promise.all(conversationList.map(async (conv) => {
          const otherUserId = conv.participants.find(id => id.toString() !== decoded.userId)
          const otherUser = await getUserById(users, otherUserId)
          
          // 获取最后一条消息
          const lastMessage = await messages.findOne(
            { conversationId: conv._id },
            { sort: { createdAt: -1 } }
          )

          return {
            id: conv._id,
            otherUser: {
              id: otherUser._id,
              username: otherUser.username,
              nickname: otherUser.profile?.nickname || otherUser.username,
              avatar: otherUser.profile?.avatar,
              lastActive: otherUser.lastActive
            },
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.readBy?.includes(new ObjectId(decoded.userId))
            } : null,
            unreadCount: conv.unreadCount?.[decoded.userId] || 0,
            updatedAt: conv.lastMessageAt || conv.createdAt
          }
        }))

        return res.status(200).json({
          success: true,
          data: { conversations: conversationsWithDetails }
        })
      }

      if (action === 'messages' && (conversationId || userId)) {
        let convId = conversationId
        
        // 如果提供了userId，查找或创建会话
        if (userId && !conversationId) {
          const participants = [new ObjectId(decoded.userId), new ObjectId(userId)].sort()
          let conversation = await conversations.findOne({
            participants: { $all: participants, $size: 2 }
          })
          
          if (!conversation) {
            // 创建新会话
            const newConv = {
              participants,
              createdAt: new Date(),
              lastMessageAt: new Date(),
              unreadCount: {}
            }
            const result = await conversations.insertOne(newConv)
            convId = result.insertedId
          } else {
            convId = conversation._id
          }
        }

        // 获取消息列表
        const skip = (parseInt(page) - 1) * parseInt(limit)
        const messageList = await messages.find({
          conversationId: new ObjectId(convId)
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        // 标记消息为已读
        await messages.updateMany(
          {
            conversationId: new ObjectId(convId),
            senderId: { $ne: new ObjectId(decoded.userId) },
            readBy: { $ne: new ObjectId(decoded.userId) }
          },
          {
            $addToSet: { readBy: new ObjectId(decoded.userId) }
          }
        )

        // 更新会话未读计数
        await conversations.updateOne(
          { _id: new ObjectId(convId) },
          { $unset: { [`unreadCount.${decoded.userId}`]: 1 } }
        )

        const messagesWithSender = await Promise.all(messageList.map(async (message) => {
          const sender = await getUserById(users, message.senderId)
          return {
            id: message._id,
            content: message.content,
            senderId: message.senderId,
            sender: {
              id: sender._id,
              username: sender.username,
              nickname: sender.profile?.nickname || sender.username,
              avatar: sender.profile?.avatar
            },
            isRead: message.readBy?.includes(new ObjectId(decoded.userId)),
            createdAt: message.createdAt
          }
        }))

        return res.status(200).json({
          success: true,
          data: {
            conversationId: convId,
            messages: messagesWithSender.reverse(), // 按时间正序返回
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              hasMore: messageList.length === parseInt(limit)
            }
          }
        })
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    if (req.method === 'POST') {
      const { action, userId, content, conversationId } = req.body

      if (action === 'send') {
        // 发送私信
        if (!content || content.trim().length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: '消息内容不能为空' 
          })
        }

        if (content.length > 1000) {
          return res.status(400).json({ 
            success: false, 
            message: '消息内容不能超过1000个字符' 
          })
        }

        let convId = conversationId
        let conversation

        // 如果没有会话ID，通过用户ID查找或创建会话
        if (!convId && userId) {
          if (userId === decoded.userId) {
            return res.status(400).json({ 
              success: false, 
              message: '不能给自己发消息' 
            })
          }

          // 检查目标用户是否存在
          const targetUser = await getUserById(users, userId)
          if (!targetUser) {
            return res.status(404).json({ 
              success: false, 
              message: '目标用户不存在' 
            })
          }

          const participants = [new ObjectId(decoded.userId), new ObjectId(userId)].sort()
          conversation = await conversations.findOne({
            participants: { $all: participants, $size: 2 }
          })

          if (!conversation) {
            // 创建新会话
            const newConv = {
              participants,
              createdAt: new Date(),
              lastMessageAt: new Date(),
              unreadCount: { [userId]: 0 }
            }
            const result = await conversations.insertOne(newConv)
            convId = result.insertedId
            conversation = newConv
            conversation._id = convId
          } else {
            convId = conversation._id
          }
        } else if (convId) {
          conversation = await conversations.findOne({ _id: new ObjectId(convId) })
          if (!conversation) {
            return res.status(404).json({ 
              success: false, 
              message: '会话不存在' 
            })
          }

          // 检查用户是否是会话参与者
          if (!conversation.participants.some(id => id.toString() === decoded.userId)) {
            return res.status(403).json({ 
              success: false, 
              message: '没有权限访问此会话' 
            })
          }
        } else {
          return res.status(400).json({ 
            success: false, 
            message: '必须提供用户ID或会话ID' 
          })
        }

        // 创建消息
        const newMessage = {
          conversationId: new ObjectId(convId),
          senderId: new ObjectId(decoded.userId),
          content: content.trim(),
          readBy: [new ObjectId(decoded.userId)], // 发送者默认已读
          createdAt: new Date()
        }

        const messageResult = await messages.insertOne(newMessage)

        // 更新会话信息
        const otherUserId = conversation.participants.find(id => id.toString() !== decoded.userId)
        await conversations.updateOne(
          { _id: new ObjectId(convId) },
          {
            $set: { lastMessageAt: new Date() },
            $inc: { [`unreadCount.${otherUserId}`]: 1 }
          }
        )

        // 清除相关缓存
        cache.conversations.delete(`conversations_${decoded.userId}`)
        cache.conversations.delete(`conversations_${otherUserId}`)

        const sender = await getUserById(users, decoded.userId)

        return res.status(201).json({
          success: true,
          message: '消息发送成功',
          data: {
            id: messageResult.insertedId,
            conversationId: convId,
            content: newMessage.content,
            senderId: decoded.userId,
            sender: {
              id: sender._id,
              username: sender.username,
              nickname: sender.profile?.nickname || sender.username,
              avatar: sender.profile?.avatar
            },
            isRead: true,
            createdAt: newMessage.createdAt
          }
        })
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    if (req.method === 'PUT') {
      const { action, conversationId } = req.body

      if (action === 'markRead' && conversationId) {
        // 标记会话为已读
        await messages.updateMany(
          {
            conversationId: new ObjectId(conversationId),
            senderId: { $ne: new ObjectId(decoded.userId) },
            readBy: { $ne: new ObjectId(decoded.userId) }
          },
          {
            $addToSet: { readBy: new ObjectId(decoded.userId) }
          }
        )

        await conversations.updateOne(
          { _id: new ObjectId(conversationId) },
          { $unset: { [`unreadCount.${decoded.userId}`]: 1 } }
        )

        // 清除缓存
        cache.conversations.delete(`conversations_${decoded.userId}`)

        return res.status(200).json({
          success: true,
          message: '已标记为已读'
        })
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    return res.status(405).json({ 
      success: false, 
      message: '方法不允许' 
    })

  } catch (error) {
    console.error('Social Messages API Error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    })
  }
} 