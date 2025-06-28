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
        'security.emailVerified': 1
      } 
    }
  )
  
  // 统一处理邮箱验证状态字段
  if (user) {
    user.isEmailVerified = user.isEmailVerified || user.security?.emailVerified || false
  }
  
  return user
}

// 生成对话ID（确保两个用户之间只有一个对话）
function generateConversationId(userId1, userId2) {
  const sortedIds = [userId1, userId2].sort()
  return `conv_${sortedIds[0]}_${sortedIds[1]}`
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
    console.log('Query:', req.query)
    console.log('Body:', req.body)

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const messages = db.collection('messages')
    const conversations = db.collection('conversations')
    const users = db.collection('users')

    // 验证用户身份
    const decoded = verifyToken(req.headers.authorization)
    const currentUser = await getUserById(users, decoded.userId)
    
    if (!currentUser) {
      return res.status(401).json({ success: false, message: '用户不存在' })
    }

    if (req.method === 'GET') {
      const { action, conversationId, page = 1, limit = 20 } = req.query

      if (action === 'conversations') {
        // 获取当前用户的对话列表
        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        const conversationList = await conversations.find({
          participants: new ObjectId(decoded.userId)
        })
          .sort({ lastMessageAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        // 获取对话详情
        const conversationsWithDetails = await Promise.all(conversationList.map(async (conv) => {
          // 获取对方用户信息
          const otherUserId = conv.participants.find(id => id.toString() !== decoded.userId)
          const otherUser = await getUserById(users, otherUserId)
          
          // 获取未读消息数
          const unreadCount = await messages.countDocuments({
            conversationId: conv._id,
            senderId: { $ne: new ObjectId(decoded.userId) },
            readAt: { $exists: false }
          })

          return {
            id: conv._id,
            conversationId: conv.conversationId,
            otherUser: {
              id: otherUser._id,
              username: otherUser.username,
              nickname: otherUser.profile?.nickname || otherUser.username,
              avatar: otherUser.profile?.avatar
            },
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unreadCount,
            createdAt: conv.createdAt
          }
        }))

        const total = await conversations.countDocuments({
          participants: new ObjectId(decoded.userId)
        })

        return res.status(200).json({
          success: true,
          data: {
            conversations: conversationsWithDetails,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        })
      }

      if (action === 'messages' && conversationId) {
        // 获取对话中的消息列表
        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        // 验证用户是否属于该对话
        const conversation = await conversations.findOne({
          _id: new ObjectId(conversationId),
          participants: new ObjectId(decoded.userId)
        })

        if (!conversation) {
          return res.status(403).json({
            success: false,
            message: '无权访问此对话'
          })
        }

        const messageList = await messages.find({
          conversationId: new ObjectId(conversationId)
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        // 获取消息发送者信息
        const messagesWithSenders = await Promise.all(messageList.map(async (msg) => {
          const sender = await getUserById(users, msg.senderId)
          return {
            id: msg._id,
            content: msg.content,
            messageType: msg.messageType || 'text',
            sender: {
              id: sender._id,
              username: sender.username,
              nickname: sender.profile?.nickname || sender.username,
              avatar: sender.profile?.avatar
            },
            isOwn: msg.senderId.toString() === decoded.userId,
            readAt: msg.readAt,
            createdAt: msg.createdAt
          }
        }))

        const total = await messages.countDocuments({
          conversationId: new ObjectId(conversationId)
        })

        return res.status(200).json({
          success: true,
          data: {
            messages: messagesWithSenders.reverse(), // 按时间正序返回
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

    if (req.method === 'POST') {
      const { action, receiverId, content, messageType = 'text' } = req.body

      if (action === 'send') {
        // 发送私信
        if (!receiverId || !content) {
          return res.status(400).json({
            success: false,
            message: '接收者ID和消息内容不能为空'
          })
        }

        if (content.trim().length === 0) {
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

        if (receiverId === decoded.userId) {
          return res.status(400).json({
            success: false,
            message: '不能给自己发送消息'
          })
        }

        // 检查接收者是否存在
        const receiver = await getUserById(users, receiverId)
        if (!receiver) {
          return res.status(404).json({
            success: false,
            message: '接收者不存在'
          })
        }

        // 生成对话ID
        const convId = generateConversationId(decoded.userId, receiverId)
        
        // 查找或创建对话
        let conversation = await conversations.findOne({
          conversationId: convId
        })

        if (!conversation) {
          // 创建新对话
          const newConversation = {
            conversationId: convId,
            participants: [new ObjectId(decoded.userId), new ObjectId(receiverId)],
            lastMessage: content.trim(),
            lastMessageAt: new Date(),
            createdAt: new Date()
          }
          
          const convResult = await conversations.insertOne(newConversation)
          conversation = { _id: convResult.insertedId, ...newConversation }
        }

        // 创建消息
        const newMessage = {
          conversationId: conversation._id,
          senderId: new ObjectId(decoded.userId),
          receiverId: new ObjectId(receiverId),
          content: content.trim(),
          messageType,
          createdAt: new Date()
        }

        const msgResult = await messages.insertOne(newMessage)

        // 更新对话最后消息
        await conversations.updateOne(
          { _id: conversation._id },
          {
            $set: {
              lastMessage: content.trim(),
              lastMessageAt: new Date()
            }
          }
        )

        // 获取发送者信息
        const sender = await getUserById(users, decoded.userId)

        return res.status(201).json({
          success: true,
          message: '消息发送成功',
          data: {
            messageId: msgResult.insertedId,
            conversationId: conversation._id,
            content: newMessage.content,
            messageType: newMessage.messageType,
            sender: {
              id: sender._id,
              username: sender.username,
              nickname: sender.profile?.nickname || sender.username,
              avatar: sender.profile?.avatar
            },
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

      if (action === 'mark-read') {
        // 标记对话中的消息为已读
        if (!conversationId) {
          return res.status(400).json({
            success: false,
            message: '对话ID不能为空'
          })
        }

        // 验证用户是否属于该对话
        const conversation = await conversations.findOne({
          _id: new ObjectId(conversationId),
          participants: new ObjectId(decoded.userId)
        })

        if (!conversation) {
          return res.status(403).json({
            success: false,
            message: '无权访问此对话'
          })
        }

        // 标记对方发送的未读消息为已读
        const result = await messages.updateMany(
          {
            conversationId: new ObjectId(conversationId),
            senderId: { $ne: new ObjectId(decoded.userId) },
            readAt: { $exists: false }
          },
          {
            $set: { readAt: new Date() }
          }
        )

        return res.status(200).json({
          success: true,
          message: '消息已标记为已读',
          data: { markedCount: result.modifiedCount }
        })
      }

      return res.status(400).json({
        success: false,
        message: '不支持的操作'
      })
    }

    if (req.method === 'DELETE') {
      const { messageId, conversationId } = req.query

      if (messageId) {
        // 删除单条消息
        const message = await messages.findOne({ _id: new ObjectId(messageId) })
        
        if (!message) {
          return res.status(404).json({
            success: false,
            message: '消息不存在'
          })
        }

        // 只有消息发送者或管理员可以删除消息
        if (message.senderId.toString() !== decoded.userId && currentUser.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: '没有权限删除此消息'
          })
        }

        await messages.deleteOne({ _id: new ObjectId(messageId) })

        return res.status(200).json({
          success: true,
          message: '消息删除成功'
        })
      }

      if (conversationId) {
        // 删除整个对话
        const conversation = await conversations.findOne({
          _id: new ObjectId(conversationId),
          participants: new ObjectId(decoded.userId)
        })

        if (!conversation) {
          return res.status(403).json({
            success: false,
            message: '无权删除此对话'
          })
        }

        // 删除对话和所有相关消息
        await Promise.all([
          conversations.deleteOne({ _id: new ObjectId(conversationId) }),
          messages.deleteMany({ conversationId: new ObjectId(conversationId) })
        ])

        return res.status(200).json({
          success: true,
          message: '对话删除成功'
        })
      }

      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
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