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
        'profile.bio': 1,
        'profile.location': 1,
        'profile.displayName': 1,
        role: 1,
        isEmailVerified: 1,
        'security.emailVerified': 1,
        settings: 1, // 添加settings字段以支持隐私检查
        createdAt: 1
      } 
    }
  )
  
  // 统一处理邮箱验证状态字段
  if (user) {
    user.isEmailVerified = user.isEmailVerified || user.security?.emailVerified || false
  }
  
  return user
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
    console.log('=== Social Messaging API ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')
    const follows = db.collection('follows')
    const posts = db.collection('posts')
    const messages = db.collection('messages')
    const conversations = db.collection('conversations')

    // 验证用户身份
    const decoded = verifyToken(req.headers.authorization)
    const currentUser = await getUserById(users, decoded.userId)
    
    if (!currentUser) {
      return res.status(401).json({ success: false, message: '用户不存在' })
    }

    // GET: 获取数据
    if (req.method === 'GET') {
      const { action, page = 1, limit = 20, search, userId, conversationId, otherUserId } = req.query

      // 根据otherUserId获取与特定用户的消息（直接私信模式）
      if (otherUserId && !action && !conversationId) {
        console.log('获取与用户的消息，otherUserId:', otherUserId)
        
        // 查找或创建会话
        let conversation = await conversations.findOne({
          participants: { 
            $all: [new ObjectId(decoded.userId), new ObjectId(otherUserId)],
            $size: 2
          }
        })

        // 如果会话不存在，创建一个新的会话
        if (!conversation) {
          console.log('会话不存在，创建新会话')
          const newConversation = {
            participants: [new ObjectId(decoded.userId), new ObjectId(otherUserId)],
            createdAt: new Date(),
            lastMessageAt: new Date()
          }
          
          const result = await conversations.insertOne(newConversation)
          conversation = { _id: result.insertedId, ...newConversation }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        const messagesList = await messages.find({
          conversationId: conversation._id,
          // 过滤掉被当前用户删除的消息
          deletedBy: { $ne: new ObjectId(decoded.userId) }
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        const messagesWithDetails = await Promise.all(messagesList.map(async (message) => {
          const sender = await getUserById(users, message.senderId)
          return {
            id: message._id,
            content: message.content,
            senderId: message.senderId,
            recipientId: message.recipientId,
            isRead: !!message.readAt,
            createdAt: message.createdAt
          }
        }))

        // 标记来自对方的消息为已读
        await messages.updateMany(
          {
            conversationId: conversation._id,
            senderId: new ObjectId(otherUserId),
            readAt: { $exists: false }
          },
          {
            $set: { readAt: new Date() }
          }
        )

        const total = await messages.countDocuments({
          conversationId: conversation._id
        })

        return res.status(200).json({
          success: true,
          data: {
            messages: messagesWithDetails.reverse(), // 按时间正序返回
            conversationId: conversation._id,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        })
      }

      // 获取会话列表（当没有参数或action为conversations时）
      if (!action || action === 'conversations') {
        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        const conversationsList = await conversations.find({
          participants: new ObjectId(decoded.userId),
          // 过滤掉被当前用户隐藏的会话
          hiddenBy: { $ne: new ObjectId(decoded.userId) }
        })
          .sort({ lastMessageAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        const conversationsWithDetails = await Promise.all(conversationsList.map(async (conversation) => {
          // 获取对方用户信息
          const otherUserId = conversation.participants.find(id => id.toString() !== decoded.userId)
          const otherUser = await getUserById(users, otherUserId)
          
          // 获取最后一条消息（排除被当前用户删除的消息）
          const lastMessage = await messages.findOne(
            { 
              conversationId: conversation._id,
              deletedBy: { $ne: new ObjectId(decoded.userId) }
            },
            { sort: { createdAt: -1 } }
          )

          // 获取未读消息数（排除被当前用户删除的消息）
          const unreadCount = await messages.countDocuments({
            conversationId: conversation._id,
            senderId: { $ne: new ObjectId(decoded.userId) },
            readAt: { $exists: false },
            deletedBy: { $ne: new ObjectId(decoded.userId) }
          })

          return {
            id: conversation._id,
            otherUser: {
              id: otherUser._id,
              username: otherUser.username,
              nickname: otherUser.profile?.nickname || otherUser.username,
              avatar: otherUser.profile?.avatar
            },
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt
            } : null,
            unreadCount,
            lastMessageAt: conversation.lastMessageAt,
            createdAt: conversation.createdAt
          }
        }))

        const total = await conversations.countDocuments({
          participants: new ObjectId(decoded.userId),
          hiddenBy: { $ne: new ObjectId(decoded.userId) }
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

      // 搜索用户
      if (action === 'search-users') {
        if (!search || search.trim().length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: '搜索关键词不能为空' 
          })
        }

        const searchRegex = new RegExp(search.trim(), 'i')
        const skip = (parseInt(page) - 1) * parseInt(limit)

        const userList = await users.find({
          $or: [
            { username: searchRegex },
            { 'profile.nickname': searchRegex },
            { email: searchRegex }
          ],
          _id: { $ne: new ObjectId(decoded.userId) }
        })
          .skip(skip)
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
            role: user.role,
            isFollowing: !!isFollowing,
            followersCount,
            followingCount,
            postsCount,
            joinedAt: user.createdAt
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

        // 检查个人资料可见性
        const isOwnProfile = user._id.toString() === decoded.userId
        const isProfileVisible = user.settings?.privacy?.profileVisible !== false
        
        // 如果不是本人且用户设置了不公开个人资料
        if (!isOwnProfile && !isProfileVisible) {
          return res.status(403).json({ 
            success: false, 
            message: '该用户设置了隐私保护，无法查看个人资料' 
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

        // 检查隐私设置，确定是否可以查看粉丝和关注列表
        const canViewFollowers = isOwnProfile || (user.settings?.privacy?.showFollowers !== false)
        const canViewFollowing = isOwnProfile || (user.settings?.privacy?.showFollowing !== false)

        return res.status(200).json({
          success: true,
          data: {
            id: user._id,
            username: user.username,
            nickname: user.profile?.nickname || user.username,
            avatar: user.profile?.avatar,
            bio: user.profile?.bio,
            location: user.profile?.location,
            role: user.role,
            isFollowing: !!isFollowing,
            followersCount,
            followingCount,
            postsCount,
            joinedAt: user.createdAt,
            isOwnProfile,
            canViewFollowers,
            canViewFollowing
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

        // 获取目标用户信息以检查隐私设置
        const targetUser = await getUserById(users, userId)
        if (!targetUser) {
          return res.status(404).json({ 
            success: false, 
            message: '用户不存在' 
          })
        }

        // 隐私设置检查：如果不是本人且设置了不公开粉丝列表
        const isOwnProfile = userId === decoded.userId
        const showFollowers = targetUser.settings?.privacy?.showFollowers !== false
        
        if (!isOwnProfile && !showFollowers) {
          return res.status(403).json({ 
            success: false, 
            message: '该用户设置了不公开粉丝列表' 
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
            role: user.role,
            isFollowing: !!isFollowing,
            followedAt: follow.createdAt
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

        // 获取目标用户信息以检查隐私设置
        const targetUser = await getUserById(users, userId)
        if (!targetUser) {
          return res.status(404).json({ 
            success: false, 
            message: '用户不存在' 
          })
        }

        // 隐私设置检查：如果不是本人且设置了不公开关注列表
        const isOwnProfile = userId === decoded.userId
        const showFollowing = targetUser.settings?.privacy?.showFollowing !== false
        
        if (!isOwnProfile && !showFollowing) {
          return res.status(403).json({ 
            success: false, 
            message: '该用户设置了不公开关注列表' 
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
            role: user.role,
            isFollowing: !!isFollowing,
            followedAt: follow.createdAt
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

      // 获取消息列表
      if (action === 'messages') {
        if (!conversationId) {
          return res.status(400).json({ 
            success: false, 
            message: '会话ID不能为空' 
          })
        }

        // 验证用户是否为该会话的参与者
        const conversation = await conversations.findOne({
          _id: new ObjectId(conversationId),
          participants: new ObjectId(decoded.userId)
        })

        if (!conversation) {
          return res.status(403).json({ 
            success: false, 
            message: '无权访问此会话' 
          })
        }

        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        const messagesList = await messages.find({
          conversationId: new ObjectId(conversationId),
          // 过滤掉被当前用户删除的消息
          deletedBy: { $ne: new ObjectId(decoded.userId) }
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        const messagesWithSenders = await Promise.all(messagesList.map(async (message) => {
          // 检查是否为系统消息
          if (message.isSystemMessage || message.senderId === 'SYSTEM') {
            return {
              id: message._id,
              content: message.content,
              sender: null,
              isSystemMessage: true,
              isOwnMessage: false,
              readAt: message.readAt,
              createdAt: message.createdAt
            }
          }

          const sender = await getUserById(users, message.senderId)
          return {
            id: message._id,
            content: message.content,
            sender: {
              id: sender._id,
              username: sender.username,
              nickname: sender.profile?.nickname || sender.username,
              avatar: sender.profile?.avatar
            },
            isOwnMessage: message.senderId.toString() === decoded.userId,
            isSystemMessage: false,
            readAt: message.readAt,
            createdAt: message.createdAt
          }
        }))

        // 标记消息为已读（排除被当前用户删除的消息）
        await messages.updateMany(
          {
            conversationId: new ObjectId(conversationId),
            senderId: { $ne: new ObjectId(decoded.userId) },
            readAt: { $exists: false },
            deletedBy: { $ne: new ObjectId(decoded.userId) }
          },
          {
            $set: { readAt: new Date() }
          }
        )

        const total = await messages.countDocuments({
          conversationId: new ObjectId(conversationId),
          deletedBy: { $ne: new ObjectId(decoded.userId) }
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

    // POST: 创建和操作
    if (req.method === 'POST') {
      const { action, userId, content, receiverId, recipientId, conversationId } = req.body

      // 兼容新旧API，支持recipientId和receiverId
      const targetRecipientId = recipientId || receiverId

      // 发送私信（支持新的无action格式）
      if (!action && targetRecipientId && content) {
        console.log('发送私信 - 新格式，recipientId:', targetRecipientId)
        
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

        // 更新会话的最后消息时间，并确保会话对双方都可见
        await conversations.updateOne(
          { _id: conversation._id },
          { 
            $set: { lastMessageAt: new Date() },
            $unset: { hiddenBy: "" } // 移除隐藏标记，使会话对双方都可见
          }
        )

        const sender = await getUserById(users, decoded.userId)

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
      const { action, messageId, conversationId } = req.body

      // 撤回消息
      if (action === 'recall-message') {
        if (!messageId) {
          return res.status(400).json({ 
            success: false, 
            message: '消息ID不能为空' 
          })
        }

        // 查找消息
        const message = await messages.findOne({
          _id: new ObjectId(messageId),
          senderId: new ObjectId(decoded.userId)
        })

        if (!message) {
          return res.status(404).json({ 
            success: false, 
            message: '消息不存在或无权限撤回' 
          })
        }

        // 检查消息是否在3分钟内
        const now = new Date()
        const messageTime = new Date(message.createdAt)
        const diffInMinutes = (now - messageTime) / (1000 * 60)

        if (diffInMinutes > 3) {
          return res.status(400).json({ 
            success: false, 
            message: '只能撤回3分钟内发送的消息' 
          })
        }

        // 获取撤回者信息
        const recaller = await getUserById(users, decoded.userId)
        const recipientId = message.recipientId

        // 删除原消息
        await messages.deleteOne({ _id: new ObjectId(messageId) })

        // 发送撤回通知消息
        const recallNotificationMessage = {
          conversationId: message.conversationId,
          senderId: 'SYSTEM', // 使用字符串标识系统消息
          recipientId: recipientId,
          content: `${recaller.profile?.nickname || recaller.username} 撤回了一条消息`,
          isSystemMessage: true, // 标记为系统消息
          createdAt: new Date()
        }

        await messages.insertOne(recallNotificationMessage)

        // 更新会话的最后消息时间
        await conversations.updateOne(
          { _id: message.conversationId },
          { 
            $set: { lastMessageAt: new Date() }
          }
        )

        return res.status(200).json({
          success: true,
          message: '消息撤回成功'
        })
      }

      // 隐藏会话（从私信列表中删除，但不删除聊天记录）
      if (action === 'hide-conversation') {
        if (!conversationId) {
          return res.status(400).json({ 
            success: false, 
            message: '会话ID不能为空' 
          })
        }

        // 验证用户是否为该会话的参与者
        const conversation = await conversations.findOne({
          _id: new ObjectId(conversationId),
          participants: new ObjectId(decoded.userId)
        })

        if (!conversation) {
          return res.status(403).json({ 
            success: false, 
            message: '无权访问此会话' 
          })
        }

        // 添加当前用户到hiddenBy数组中
        await conversations.updateOne(
          { _id: new ObjectId(conversationId) },
          { 
            $addToSet: { hiddenBy: new ObjectId(decoded.userId) }
          }
        )

        return res.status(200).json({
          success: true,
          message: '会话已从列表中删除'
        })
      }

      // 删除聊天记录（只删除当前用户的记录，不影响对方）
      if (action === 'delete-chat-history') {
        if (!conversationId) {
          return res.status(400).json({ 
            success: false, 
            message: '会话ID不能为空' 
          })
        }

        // 验证用户是否为该会话的参与者
        const conversation = await conversations.findOne({
          _id: new ObjectId(conversationId),
          participants: new ObjectId(decoded.userId)
        })

        if (!conversation) {
          return res.status(403).json({ 
            success: false, 
            message: '无权访问此会话' 
          })
        }

        // 将当前用户添加到所有消息的deletedBy数组中
        await messages.updateMany(
          { conversationId: new ObjectId(conversationId) },
          { 
            $addToSet: { deletedBy: new ObjectId(decoded.userId) }
          }
        )

        return res.status(200).json({
          success: true,
          message: '聊天记录已删除'
        })
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的删除操作' 
      })
    }

    return res.status(405).json({ 
      success: false, 
      message: '方法不允许' 
    })

  } catch (error) {
    console.error('Social Messaging API Error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    })
  }
} 