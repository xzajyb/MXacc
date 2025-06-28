const clientPromise = require('../_lib/mongodb')
const { ObjectId } = require('mongodb')

// Token验证函数
function verifyToken(authHeader) {
  try {
    const jwt = require('jsonwebtoken')
    const token = authHeader.substring(7)
    const secret = process.env.JWT_SECRET || 'your-secret-key'
    return jwt.verify(token, secret)
  } catch (error) {
    console.error('Token验证失败:', error)
    return null
  }
}

// 获取用户信息
async function getUserById(users, userId) {
  try {
    if (!ObjectId.isValid(userId)) {
      return null
    }
    return await users.findOne({ _id: new ObjectId(userId) })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
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
    // 验证登录状态
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: '需要登录' 
      })
    }

    const decoded = verifyToken(authHeader)
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token无效' 
      })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')
    const messages = db.collection('messages')
    const conversations = db.collection('conversations')
    const follows = db.collection('follows')
    const posts = db.collection('posts')

    // GET: 获取数据
    if (req.method === 'GET') {
      const { action, userId, conversationId, otherUserId, search, page = 1, limit = 10 } = req.query

      // 获取会话列表
      if (!action || action === 'conversations') {
        const userConversations = await conversations.find({
          participants: new ObjectId(decoded.userId)
        })
          .sort({ lastMessageAt: -1 })
          .toArray()

        const conversationsWithDetails = await Promise.all(userConversations.map(async (conv) => {
          const otherUserId = conv.participants.find(p => p.toString() !== decoded.userId)
          const otherUser = await getUserById(users, otherUserId)
          
          const lastMessage = await messages.findOne(
            { conversationId: conv._id },
            { sort: { createdAt: -1 } }
          )
          
          const unreadCount = await messages.countDocuments({
            conversationId: conv._id,
            senderId: { $ne: new ObjectId(decoded.userId) },
            readAt: { $exists: false }
          })

          return {
            id: conv._id,
            otherUser: {
              id: otherUser._id,
              username: otherUser.username,
              nickname: otherUser.profile?.nickname || otherUser.username,
              avatar: otherUser.profile?.avatar,
              role: otherUser.role || 'user'
            },
            lastMessage: lastMessage ? {
              id: lastMessage._id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              recipientId: lastMessage.recipientId,
              createdAt: lastMessage.createdAt,
              isRead: !!lastMessage.readAt
            } : null,
            unreadCount
          }
        }))

        return res.status(200).json({
          success: true,
          data: { conversations: conversationsWithDetails }
        })
      }

      // 获取消息列表
      if (conversationId || otherUserId) {
        let conversation = null
        
        if (conversationId) {
          conversation = await conversations.findOne({
            _id: new ObjectId(conversationId),
            participants: new ObjectId(decoded.userId)
          })
        } else if (otherUserId) {
          conversation = await conversations.findOne({
            participants: { 
              $all: [new ObjectId(decoded.userId), new ObjectId(otherUserId)],
              $size: 2
            }
          })
        }

        if (conversation) {
          const messagesList = await messages.find({
            conversationId: conversation._id
          })
            .sort({ createdAt: 1 })
            .toArray()

          const messagesWithSenders = await Promise.all(messagesList.map(async (message) => {
            const sender = await getUserById(users, message.senderId)
            return {
              id: message._id,
              content: message.content,
              senderId: message.senderId,
              recipientId: message.recipientId,
              createdAt: message.createdAt,
              isRead: !!message.readAt,
              sender: {
                id: sender._id,
                username: sender.username,
                nickname: sender.profile?.nickname || sender.username,
                avatar: sender.profile?.avatar,
                role: sender.role || 'user'
              }
            }
          }))

          // 标记消息为已读
          await messages.updateMany(
            {
              conversationId: conversation._id,
              senderId: { $ne: new ObjectId(decoded.userId) },
              readAt: { $exists: false }
            },
            { $set: { readAt: new Date() } }
          )

          return res.status(200).json({
            success: true,
            data: { messages: messagesWithSenders }
          })
        } else {
          return res.status(200).json({
            success: true,
            data: { messages: [] }
          })
        }
      }

      // 搜索用户
      if (action === 'search-users') {
        if (!search || search.trim().length < 2) {
          return res.status(400).json({ 
            success: false, 
            message: '搜索关键词至少需要2个字符' 
          })
        }

        const searchRegex = new RegExp(search.trim(), 'i')
        const userList = await users.find({
          $or: [
            { username: searchRegex },
            { 'profile.nickname': searchRegex },
            { email: searchRegex }
          ],
          _id: { $ne: new ObjectId(decoded.userId) }
        })
          .limit(parseInt(limit))
          .toArray()

        const usersWithStatus = await Promise.all(userList.map(async (user) => {
          const [isFollowing, followersCount, followingCount, postsCount] = await Promise.all([
            follows.findOne({
              followerId: new ObjectId(decoded.userId),
              followingId: user._id
            }),
            follows.countDocuments({ followingId: user._id }),
            follows.countDocuments({ followerId: user._id }),
            posts.countDocuments({ authorId: user._id })
          ])

          return {
            id: user._id,
            username: user.username,
            nickname: user.profile?.nickname || user.username,
            avatar: user.profile?.avatar,
            bio: user.profile?.bio,
            location: user.profile?.location,
            isFollowing: !!isFollowing,
            followersCount,
            followingCount,
            postsCount,
            joinedAt: user.createdAt,
            role: user.role || 'user'
          }
        }))

        const total = await users.countDocuments({
          $or: [
            { username: searchRegex },
            { 'profile.nickname': searchRegex },
            { email: searchRegex }
          ],
          _id: { $ne: new ObjectId(decoded.userId) }
        })

        return res.status(200).json({
          success: true,
          data: {
            users: usersWithStatus,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        })
      }

      // 获取用户详情
      if (action === 'user-profile') {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            message: '用户ID不能为空' 
          })
        }

        const user = await getUserById(users, userId)
        
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: '用户不存在' 
          })
        }

        // 检查隐私设置 - 如果不是本人且设置为不可见，则拒绝访问
        const isOwnProfile = user._id.toString() === decoded.userId
        const profileVisible = user.settings?.privacy?.profileVisible !== false

        if (!isOwnProfile && !profileVisible) {
          return res.status(403).json({ 
            success: false, 
            message: '该用户设置了隐私保护，无法查看其个人信息' 
          })
        }

        const [isFollowing, followersCount, followingCount, postsCount] = await Promise.all([
          follows.findOne({
            followerId: new ObjectId(decoded.userId),
            followingId: new ObjectId(userId)
          }),
          follows.countDocuments({ followingId: new ObjectId(userId) }),
          follows.countDocuments({ followerId: new ObjectId(userId) }),
          posts.countDocuments({ authorId: new ObjectId(userId) })
        ])

        return res.status(200).json({
          success: true,
          data: {
            id: user._id,
            username: user.username,
            nickname: user.profile?.nickname || user.username,
            avatar: user.profile?.avatar,
            bio: user.profile?.bio,
            location: user.profile?.location,
            isFollowing: !!isFollowing,
            followersCount,
            followingCount,
            postsCount,
            joinedAt: user.createdAt,
            isOwnProfile,
            role: user.role || 'user',
            settings: {
              privacy: user.settings?.privacy || {
                showFollowers: true,
                showFollowing: true,
                profileVisible: true
              }
            }
          }
        })
      }

      // 获取关注者列表
      if (action === 'followers') {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            message: '用户ID不能为空' 
          })
        }

        // 检查目标用户的隐私设置
        const targetUser = await getUserById(users, userId)
        if (!targetUser) {
          return res.status(404).json({ 
            success: false, 
            message: '用户不存在' 
          })
        }

        // 如果不是用户本人，检查隐私设置
        const isOwnProfile = targetUser._id.toString() === decoded.userId
        const showFollowers = targetUser.settings?.privacy?.showFollowers !== false

        if (!isOwnProfile && !showFollowers) {
          return res.status(403).json({ 
            success: false, 
            message: '该用户不允许查看粉丝列表' 
          })
        }

        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        const followersList = await follows.find({ 
          followingId: new ObjectId(userId) 
        })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        const followersWithInfo = await Promise.all(followersList.map(async (follow) => {
          const user = await getUserById(users, follow.followerId)
          const isFollowing = await follows.findOne({
            followerId: new ObjectId(decoded.userId),
            followingId: follow.followerId
          })

          return {
            id: user._id,
            username: user.username,
            nickname: user.profile?.nickname || user.username,
            avatar: user.profile?.avatar,
            bio: user.profile?.bio,
            isFollowing: !!isFollowing,
            followedAt: follow.createdAt,
            role: user.role || 'user'
          }
        }))

        const total = await follows.countDocuments({ followingId: new ObjectId(userId) })

        return res.status(200).json({
          success: true,
          data: {
            followers: followersWithInfo,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        })
      }

      // 获取关注列表
      if (action === 'following') {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            message: '用户ID不能为空' 
          })
        }

        // 检查目标用户的隐私设置
        const targetUser = await getUserById(users, userId)
        if (!targetUser) {
          return res.status(404).json({ 
            success: false, 
            message: '用户不存在' 
          })
        }

        // 如果不是用户本人，检查隐私设置
        const isOwnProfile = targetUser._id.toString() === decoded.userId
        const showFollowing = targetUser.settings?.privacy?.showFollowing !== false

        if (!isOwnProfile && !showFollowing) {
          return res.status(403).json({ 
            success: false, 
            message: '该用户不允许查看关注列表' 
          })
        }

        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        const followingList = await follows.find({ 
          followerId: new ObjectId(userId) 
        })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        const followingWithInfo = await Promise.all(followingList.map(async (follow) => {
          const user = await getUserById(users, follow.followingId)
          const isFollowing = await follows.findOne({
            followerId: new ObjectId(decoded.userId),
            followingId: follow.followingId
          })

          return {
            id: user._id,
            username: user.username,
            nickname: user.profile?.nickname || user.username,
            avatar: user.profile?.avatar,
            bio: user.profile?.bio,
            isFollowing: !!isFollowing,
            followedAt: follow.createdAt,
            role: user.role || 'user'
          }
        }))

        const total = await follows.countDocuments({ followerId: new ObjectId(userId) })

        return res.status(200).json({
          success: true,
          data: {
            following: followingWithInfo,
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

    // POST: 创建和操作
    if (req.method === 'POST') {
      const { action, userId, content, receiverId, recipientId, conversationId } = req.body

      // 兼容新旧API，支持recipientId和receiverId
      const targetRecipientId = recipientId || receiverId

      // 发送私信（支持新的无action格式）
      if (!action && targetRecipientId && content) {
        if (!targetRecipientId || !content) {
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

        if (targetRecipientId === decoded.userId) {
          return res.status(400).json({ 
            success: false, 
            message: '不能给自己发送消息' 
          })
        }

        // 验证接收者是否存在
        const receiver = await getUserById(users, targetRecipientId)
        if (!receiver) {
          return res.status(404).json({ 
            success: false, 
            message: '接收者不存在' 
          })
        }

        // 查找或创建会话
        let conversation
        if (conversationId) {
          // 如果提供了会话ID，验证用户权限
          conversation = await conversations.findOne({
            _id: new ObjectId(conversationId),
            participants: new ObjectId(decoded.userId)
          })
          
          if (!conversation) {
            return res.status(403).json({ 
              success: false, 
              message: '无权访问此会话' 
            })
          }
        } else {
          // 查找现有会话或创建新会话
          conversation = await conversations.findOne({
            participants: { 
              $all: [
                new ObjectId(decoded.userId), 
                new ObjectId(targetRecipientId)
              ],
              $size: 2
            }
          })

          if (!conversation) {
            // 创建新会话
            const conversationResult = await conversations.insertOne({
              participants: [
                new ObjectId(decoded.userId),
                new ObjectId(targetRecipientId)
              ],
              createdAt: new Date(),
              lastMessageAt: new Date()
            })
            conversation = { _id: conversationResult.insertedId }
          }
        }

        // 创建消息
        const newMessage = {
          conversationId: conversation._id,
          senderId: new ObjectId(decoded.userId),
          recipientId: new ObjectId(targetRecipientId),
          content: content.trim(),
          createdAt: new Date()
        }

        const messageResult = await messages.insertOne(newMessage)

        // 更新会话的最后消息时间
        await conversations.updateOne(
          { _id: conversation._id },
          { 
            $set: { lastMessageAt: new Date() }
          }
        )

        return res.status(201).json({
          success: true,
          message: '消息发送成功',
          data: {
            id: messageResult.insertedId,
            content: newMessage.content,
            conversationId: conversation._id,
            senderId: newMessage.senderId,
            recipientId: newMessage.recipientId,
            createdAt: newMessage.createdAt
          }
        })
      }

      // 关注用户
      if (action === 'follow') {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            message: '用户ID不能为空' 
          })
        }

        if (userId === decoded.userId) {
          return res.status(400).json({ 
            success: false, 
            message: '不能关注自己' 
          })
        }

        const targetUser = await getUserById(users, userId)
        if (!targetUser) {
          return res.status(404).json({ 
            success: false, 
            message: '目标用户不存在' 
          })
        }

        const existingFollow = await follows.findOne({
          followerId: new ObjectId(decoded.userId),
          followingId: new ObjectId(userId)
        })

        if (existingFollow) {
          return res.status(400).json({ 
            success: false, 
            message: '已经关注了该用户' 
          })
        }

        await follows.insertOne({
          followerId: new ObjectId(decoded.userId),
          followingId: new ObjectId(userId),
          createdAt: new Date()
        })

        const followersCount = await follows.countDocuments({ 
          followingId: new ObjectId(userId) 
        })

        return res.status(200).json({
          success: true,
          message: '关注成功',
          data: { isFollowing: true, followersCount }
        })
      }

      // 取消关注
      if (action === 'unfollow') {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            message: '用户ID不能为空' 
          })
        }

        const result = await follows.deleteOne({
          followerId: new ObjectId(decoded.userId),
          followingId: new ObjectId(userId)
        })

        if (result.deletedCount === 0) {
          return res.status(400).json({ 
            success: false, 
            message: '尚未关注该用户' 
          })
        }

        const followersCount = await follows.countDocuments({ 
          followingId: new ObjectId(userId) 
        })

        return res.status(200).json({
          success: true,
          message: '取消关注成功',
          data: { isFollowing: false, followersCount }
        })
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    // DELETE: 删除操作
    if (req.method === 'DELETE') {
      const { action, messageId } = req.body

      // 撤回消息
      if (action === 'recall-message') {
        if (!messageId) {
          return res.status(400).json({ 
            success: false, 
            message: '消息ID不能为空' 
          })
        }

        const message = await messages.findOne({
          _id: new ObjectId(messageId),
          senderId: new ObjectId(decoded.userId)
        })

        if (!message) {
          return res.status(404).json({ 
            success: false, 
            message: '消息不存在或无权撤回' 
          })
        }

        // 检查时间限制（3分钟内）
        const messageTime = new Date(message.createdAt).getTime()
        const now = new Date().getTime()
        const diffInMinutes = (now - messageTime) / (1000 * 60)

        if (diffInMinutes > 3) {
          return res.status(400).json({ 
            success: false, 
            message: '消息发送超过3分钟，无法撤回' 
          })
        }

        await messages.deleteOne({ _id: new ObjectId(messageId) })

        return res.status(200).json({
          success: true,
          message: '消息已撤回'
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
    console.error('社交消息API错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 