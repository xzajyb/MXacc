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

// 检查用户是否被封禁
async function checkUserBanStatus(db, userId) {
  const activeBan = await db.collection('user_bans').findOne({
    userId: new ObjectId(userId),
    status: 'active',
    $or: [
      { expiresAt: null }, // 永久封禁
      { expiresAt: { $gt: new Date() } } // 临时封禁未到期
    ]
  })
  
  return activeBan
}

// 获取用户信息（包含头衔）
async function getUserById(users, userId, db = null) {
  const user = await users.findOne(
    { _id: new ObjectId(userId) },
    { 
      projection: { 
        username: 1, 
        email: 1, 
        'profile.nickname': 1,
        'profile.avatar': 1,
        'profile.bio': 1,
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
  
  // 如果提供了db，获取用户头衔
  if (user && db) {
    try {
      const userTitleAssignments = await db.collection('user_title_assignments')
        .find({ userId: new ObjectId(userId) })
        .toArray()
      
      if (userTitleAssignments.length > 0) {
        const titleIds = userTitleAssignments.map(assignment => new ObjectId(assignment.titleId))
        const userTitlesList = await db.collection('user_titles')
          .find({ _id: { $in: titleIds } })
          .toArray()
        
        user.titles = userTitlesList.map(title => ({
          id: title._id.toString(),
          name: title.name,
          color: title.color,
          description: title.description
        }))
      } else {
        user.titles = []
      }
    } catch (error) {
      console.error('获取用户头衔失败:', error)
      user.titles = []
    }
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
    console.log('=== Social Content API ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)
    console.log('Headers:', req.headers.authorization ? 'Token present' : 'No token')

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const posts = db.collection('posts')
    const users = db.collection('users')
    const comments = db.collection('comments')
    const likes = db.collection('likes')
    const follows = db.collection('follows')
    const titles = db.collection('user_titles')
    const userTitles = db.collection('user_title_assignments')

    // 验证用户身份
    console.log('🔍 开始验证用户身份...')
    const decoded = verifyToken(req.headers.authorization)
    console.log('✅ Token解码成功, 用户ID:', decoded.userId)
    
    const currentUser = await getUserById(users, decoded.userId, db)
    console.log('👤 查询到的用户:', currentUser ? {
      id: currentUser._id,
      username: currentUser.username,
      email: currentUser.email,
      role: currentUser.role,
      isEmailVerified: currentUser.isEmailVerified
    } : null)
    
    if (!currentUser) {
      console.log('❌ 用户不存在，用户ID:', decoded.userId)
      return res.status(401).json({ success: false, message: '用户不存在' })
    }

    // 检查用户是否被封禁（只对写操作进行检查，但申述功能除外）
    if (req.method !== 'GET') {
      // 检查是否是申述相关操作，申述功能不受封禁限制
      const action = req.body?.action || req.query?.action
      const isAppealAction = action === 'submit-appeal' || 
        (action === 'ban-management' && (req.body?.subAction === 'submit-appeal' || req.query?.subAction === 'my-appeals'))
      
      if (!isAppealAction) {
        console.log('🔍 检查用户封禁状态...')
        const userBan = await checkUserBanStatus(db, decoded.userId)
        
        if (userBan) {
          console.log('❌ 用户被封禁:', {
            banId: userBan._id,
            reason: userBan.reason,
            expiresAt: userBan.expiresAt
          })
          
          const banInfo = {
            reason: userBan.reason,
            expiresAt: userBan.expiresAt,
            isPermanent: !userBan.expiresAt,
            banId: userBan._id.toString()
          }
          
          return res.status(403).json({ 
            success: false, 
            message: '您已被封禁，无法使用社交功能',
            ban: banInfo
          })
        }
        console.log('✅ 用户未被封禁')
      } else {
        console.log('⚖️ 申述操作，跳过封禁检查')
      }
    }

    console.log('✅ 用户验证成功')

    // GET: 获取内容
    if (req.method === 'GET') {
      const { action, type = 'feed', page = 1, limit = 10, postId, commentId } = req.query

      // 获取帖子列表
      if (action === 'posts' || !action) {
        let query = {}
        let sort = { createdAt: -1 }

        if (type === 'user' && req.query.userId) {
          query = { authorId: new ObjectId(req.query.userId) }
        } else if (type === 'following') {
          const followingUsers = await follows.find({ 
            followerId: new ObjectId(decoded.userId) 
          }).toArray()
          
          const followingIds = followingUsers.map(f => f.followingId)
          followingIds.push(new ObjectId(decoded.userId))
          
          query = { authorId: { $in: followingIds } }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        const postList = await posts.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        const postsWithStats = await Promise.all(postList.map(async (post) => {
          const [author, likesCount, commentsCount, isLiked] = await Promise.all([
            getUserById(users, post.authorId, db),
            likes.countDocuments({ targetId: post._id, type: 'post' }),
            comments.countDocuments({ postId: post._id }), // 统计所有评论，包括子评论
            likes.findOne({ 
              targetId: post._id, 
              userId: new ObjectId(decoded.userId), 
              type: 'post' 
            })
          ])

          return {
            id: post._id,
            content: post.content,
            images: post.images || [],
            author: {
              id: author._id,
              username: author.username,
              nickname: author.profile?.nickname || author.username,
              avatar: author.profile?.avatar,
              role: author.role || 'user',
              titles: author.titles || []
            },
            likesCount,
            commentsCount,
            isLiked: !!isLiked,
            canDelete: post.authorId.toString() === decoded.userId || currentUser.role === 'admin',
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
          }
        }))

        const total = await posts.countDocuments(query)

        return res.status(200).json({
          success: true,
          data: {
            posts: postsWithStats,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        })
      }

      // 获取合作伙伴logo
      if (action === 'partner-logos') {
        // 获取系统设置中的合作伙伴logo
        const systemSettings = db.collection('system_settings')
        const settings = await systemSettings.findOne({ type: 'partnerLogos' }) || {
          enabled: true,
          logos: []
        }

        return res.status(200).json({
          success: true,
          data: settings
        })
      }
      
      // 获取评论列表（支持多级树状评论）
      if (action === 'comments') {
        if (!postId) {
          return res.status(400).json({ 
            success: false, 
            message: '帖子ID不能为空' 
          })
        }

        // 获取该帖子的所有评论（不分页，因为需要构建树状结构）
        const allComments = await comments.find({ 
          postId: new ObjectId(postId)
        })
          .sort({ createdAt: 1 }) // 按时间正序获取，方便构建树状结构
          .toArray()

        // 获取评论详情
        const commentsWithDetails = await Promise.all(allComments.map(async (comment) => {
          const [author, likesCount, repliesCount, isLiked] = await Promise.all([
            getUserById(users, comment.authorId, db),
            likes.countDocuments({ targetId: comment._id, type: 'comment' }),
            comments.countDocuments({ parentId: comment._id }),
            likes.findOne({ 
              targetId: comment._id, 
              userId: new ObjectId(decoded.userId), 
              type: 'comment' 
            })
          ])

          return {
            id: comment._id,
            content: comment.content,
            author: {
              id: author._id,
              username: author.username,
              nickname: author.profile?.nickname || author.username,
              avatar: author.profile?.avatar,
              role: author.role, // 包含用户角色信息
              titles: author.titles || []
            },
            replyTo: comment.replyTo ? {
              id: comment.replyTo.userId,
              username: comment.replyTo.username,
              nickname: comment.replyTo.nickname || comment.replyTo.username
            } : null,
            likesCount,
            repliesCount,
            isLiked: !!isLiked,
            canDelete: comment.authorId.toString() === decoded.userId || currentUser.role === 'admin',
            createdAt: comment.createdAt,
            parentId: comment.parentId?.toString() || null
          }
        }))

        // 统计信息
        const totalComments = allComments.length
        const rootCommentsCount = allComments.filter(c => !c.parentId).length

        return res.status(200).json({
          success: true,
          data: {
            comments: commentsWithDetails,
            stats: {
              totalComments,
              rootCommentsCount
            }
          }
        })
      }

      // 获取二级评论列表
      if (action === 'replies') {
        if (!commentId) {
          return res.status(400).json({ 
            success: false, 
            message: '评论ID不能为空' 
          })
        }

        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        const repliesList = await comments.find({ 
          parentId: new ObjectId(commentId)
        })
          .sort({ createdAt: 1 }) // 二级评论按时间正序
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        const repliesWithAuthors = await Promise.all(repliesList.map(async (reply) => {
          const author = await getUserById(users, reply.authorId, db)
          return {
            id: reply._id,
            content: reply.content,
            author: {
              id: author._id,
              username: author.username,
              nickname: author.profile?.nickname || author.username,
              avatar: author.profile?.avatar,
              role: author.role || 'user',
              titles: author.titles || []
            },
            replyTo: reply.replyTo ? {
              id: reply.replyTo.userId,
              username: reply.replyTo.username
            } : null,
            canDelete: reply.authorId.toString() === decoded.userId || currentUser.role === 'admin',
            createdAt: reply.createdAt
          }
        }))

        const total = await comments.countDocuments({ parentId: new ObjectId(commentId) })

        return res.status(200).json({
          success: true,
          data: {
            replies: repliesWithAuthors,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        })
      }

      // 封禁管理相关功能
      if (action === 'ban-management') {
        const { subAction, page = 1, limit = 20, status, targetUserId } = req.query

        if (subAction === 'bans') {
          // 管理员获取封禁列表
          if (currentUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: '需要管理员权限' })
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
          const banUsers = await users.find({ _id: { $in: userIds } })
            .project({ username: 1, email: 1, profile: 1 })
            .toArray()

          const userMap = {}
          banUsers.forEach(user => {
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
        } else if (subAction === 'appeals') {
          // 管理员获取申述列表
          if (currentUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: '需要管理员权限' })
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

          const [appealUsers, bans] = await Promise.all([
            users.find({ _id: { $in: userIds } })
              .project({ username: 1, email: 1, profile: 1 })
              .toArray(),
            db.collection('user_bans')
              .find({ _id: { $in: banIds } })
              .toArray()
          ])

          const userMap = {}
          const banMap = {}
          appealUsers.forEach(user => {
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
        } else if (subAction === 'check') {
          // 检查用户是否被封禁
          const checkUserId = targetUserId || decoded.userId

          const activeBan = await db.collection('user_bans').findOne({
            userId: new ObjectId(checkUserId),
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
        } else if (subAction === 'my-appeals') {
          // 用户查看自己的申述记录
          const appeals = await db.collection('ban_appeals')
            .find({ userId: new ObjectId(decoded.userId) })
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
      }

      // 头衔管理相关功能
      if (action === 'title-management') {
        const { subAction, page = 1, limit = 20, titleId, userId } = req.query

        if (subAction === 'titles') {
          // 获取所有头衔列表（管理员专用）
          if (currentUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: '需要管理员权限' })
          }

          const skip = (parseInt(page) - 1) * parseInt(limit)
          
          const titlesList = await titles
            .find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray()

          // 获取每个头衔的用户数量
          const titlesWithStats = await Promise.all(titlesList.map(async (title) => {
            const userCount = await userTitles.countDocuments({ 
              titleId: new ObjectId(title._id) 
            })
            
            return {
              ...title,
              _id: title._id.toString(),
              userCount
            }
          }))

          const total = await titles.countDocuments({})

          return res.status(200).json({
            success: true,
            data: {
              titles: titlesWithStats,
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
              }
            }
          })
        } else if (subAction === 'title-users') {
          // 获取拥有指定头衔的用户列表（管理员专用）
          if (currentUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: '需要管理员权限' })
          }

          if (!titleId) {
            return res.status(400).json({ success: false, message: '头衔ID不能为空' })
          }

          const skip = (parseInt(page) - 1) * parseInt(limit)
          
          const titleAssignments = await userTitles
            .find({ titleId: new ObjectId(titleId) })
            .sort({ assignedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray()

          // 获取用户信息
          const userIds = titleAssignments.map(assignment => new ObjectId(assignment.userId))
          const titleUsers = await users.find({ _id: { $in: userIds } })
            .project({ username: 1, email: 1, profile: 1, role: 1 })
            .toArray()

          const userMap = {}
          titleUsers.forEach(user => {
            userMap[user._id.toString()] = user
          })

          const usersWithTitle = titleAssignments.map(assignment => ({
            ...assignment,
            _id: assignment._id.toString(),
            userId: assignment.userId.toString(),
            titleId: assignment.titleId.toString(),
            user: userMap[assignment.userId.toString()] || null
          }))

          const total = await userTitles.countDocuments({ titleId: new ObjectId(titleId) })

          return res.status(200).json({
            success: true,
            data: {
              assignments: usersWithTitle,
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
              }
            }
          })
        } else if (subAction === 'user-titles') {
          // 获取指定用户的头衔列表（管理员专用）
          if (currentUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: '需要管理员权限' })
          }

          if (!userId) {
            return res.status(400).json({ success: false, message: '用户ID不能为空' })
          }

          const userAssignments = await userTitles
            .find({ userId: new ObjectId(userId) })
            .sort({ assignedAt: -1 })
            .toArray()

          const titleIds = userAssignments.map(assignment => new ObjectId(assignment.titleId))
          const userTitlesList = await titles
            .find({ _id: { $in: titleIds } })
            .toArray()

          const titleMap = {}
          userTitlesList.forEach(title => {
            titleMap[title._id.toString()] = title
          })

          const userTitlesWithInfo = userAssignments.map(assignment => ({
            ...assignment,
            _id: assignment._id.toString(),
            userId: assignment.userId.toString(),
            titleId: assignment.titleId.toString(),
            title: titleMap[assignment.titleId.toString()] || null
          }))

          return res.status(200).json({
            success: true,
            data: { userTitles: userTitlesWithInfo }
          })
        }
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    // POST: 创建内容和互动
    if (req.method === 'POST') {
      // 处理不同的内容类型
      let body = req.body
      
      // 如果是multipart/form-data（有图片上传）
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // 这里需要处理文件上传，但Vercel函数有限制
        // 暂时先解析formdata字段
        console.log('检测到文件上传请求')
        // 简单处理：提取text字段
        const formData = req.body
        body = {
          action: formData.action,
          content: formData.content,
          images: [] // 暂时先设为空数组，后续可以集成文件存储服务
        }
      }
      
      const { action, postId, commentId, content, images, parentId, replyTo } = body

      // 创建帖子
      if (action === 'create-post') {
        if (!content || content.trim().length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: '帖子内容不能为空' 
          })
        }

        if (content.length > 1000) {
          return res.status(400).json({ 
            success: false, 
            message: '帖子内容不能超过1000个字符' 
          })
        }

        const newPost = {
          authorId: new ObjectId(decoded.userId),
          content: content.trim(),
          images: images || [],
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = await posts.insertOne(newPost)
        const author = await getUserById(users, decoded.userId, db)

        return res.status(201).json({
          success: true,
          message: '帖子发布成功',
          data: {
            id: result.insertedId,
            content: newPost.content,
            images: newPost.images,
            author: {
              id: author._id,
              username: author.username,
              nickname: author.profile?.nickname || author.username,
              avatar: author.profile?.avatar,
              role: author.role || 'user',
              titles: author.titles || []
            },
            likesCount: 0,
            commentsCount: 0,
            isLiked: false,
            canDelete: true,
            createdAt: newPost.createdAt,
            updatedAt: newPost.updatedAt
          }
        })
      }

      // 创建评论（支持二级评论）
      if (action === 'create-comment') {
        if (!postId || !content) {
          return res.status(400).json({ 
            success: false, 
            message: '帖子ID和评论内容不能为空' 
          })
        }

        if (content.trim().length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: '评论内容不能为空' 
          })
        }

        if (content.length > 500) {
          return res.status(400).json({ 
            success: false, 
            message: '评论内容不能超过500个字符' 
          })
        }

        const newComment = {
          postId: new ObjectId(postId),
          authorId: new ObjectId(decoded.userId),
          content: content.trim(),
          createdAt: new Date(),
          updatedAt: new Date()
        }

        // 如果有parentId，说明是二级评论
        if (parentId) {
          // 检查父评论是否存在
          const parentComment = await comments.findOne({ _id: new ObjectId(parentId) })
          if (!parentComment) {
            return res.status(400).json({ 
              success: false, 
              message: '父评论不存在' 
            })
          }

          // 限制为二级评论：如果父评论已经有父评论，则不允许再回复
          if (parentComment.parentId) {
            return res.status(400).json({ 
              success: false, 
              message: '只支持二级评论，不能回复二级评论' 
            })
          }

          newComment.parentId = new ObjectId(parentId)
          
          // 如果指定了回复目标用户
          if (replyTo && replyTo.userId && replyTo.username) {
            newComment.replyTo = {
              userId: new ObjectId(replyTo.userId),
              username: replyTo.username,
              nickname: replyTo.nickname || replyTo.username
            }
          }
        }

        const result = await comments.insertOne(newComment)
        const author = await getUserById(users, decoded.userId, db)

        // 更新评论计数 - 统计该帖子的所有评论（包括所有级别的评论）
        const commentsCount = await comments.countDocuments({ 
          postId: new ObjectId(postId)
        })

        return res.status(201).json({
          success: true,
          message: parentId ? '回复发布成功' : '评论发布成功',
          data: {
            comment: {
              id: result.insertedId,
              content: newComment.content,
              author: {
                id: author._id,
                username: author.username,
                nickname: author.profile?.nickname || author.username,
                avatar: author.profile?.avatar,
                role: author.role || 'user',
                titles: author.titles || []
              },
              replyTo: newComment.replyTo || null,
              likesCount: 0,
              repliesCount: 0,
              isLiked: false,
              canDelete: true,
              createdAt: newComment.createdAt
            },
            commentsCount
          }
        })
      }

      // 点赞/取消点赞（支持帖子和评论）
      if (action === 'toggle-like') {
        const targetId = postId || commentId
        const targetType = postId ? 'post' : 'comment'

        if (!targetId) {
          return res.status(400).json({ 
            success: false, 
            message: '目标ID不能为空' 
          })
        }

        const existingLike = await likes.findOne({
          targetId: new ObjectId(targetId),
          userId: new ObjectId(decoded.userId),
          type: targetType
        })

        if (existingLike) {
          // 取消点赞
          await likes.deleteOne({ _id: existingLike._id })
          const likesCount = await likes.countDocuments({ 
            targetId: new ObjectId(targetId), 
            type: targetType 
          })
          
          return res.status(200).json({
            success: true,
            message: '取消点赞成功',
            data: { isLiked: false, likesCount }
          })
        } else {
          // 添加点赞
          await likes.insertOne({
            targetId: new ObjectId(targetId),
            userId: new ObjectId(decoded.userId),
            type: targetType,
            createdAt: new Date()
          })
          
          const likesCount = await likes.countDocuments({ 
            targetId: new ObjectId(targetId), 
            type: targetType 
          })
          
          return res.status(200).json({
            success: true,
            message: '点赞成功',
            data: { isLiked: true, likesCount }
          })
        }
      }

      // 封禁管理操作
      if (action === 'ban-user') {
        // 管理员封禁用户
        if (currentUser.role !== 'admin') {
          return res.status(403).json({ success: false, message: '需要管理员权限' })
        }

        const { userId, reason, durationType, durationValue, notes } = body

        if (!userId || !reason) {
          return res.status(400).json({ success: false, message: '用户ID和封禁原因不能为空' })
        }

        // 检查目标用户是否存在
        const targetUser = await getUserById(users, userId, db)
        if (!targetUser) {
          return res.status(404).json({ success: false, message: '目标用户不存在' })
        }

        // 不能封禁管理员
        if (targetUser.role === 'admin') {
          return res.status(403).json({ success: false, message: '不能封禁管理员用户' })
        }

        // 检查是否已有活跃封禁
        const existingBan = await db.collection('user_bans').findOne({
          userId: new ObjectId(userId),
          status: 'active',
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        })

        if (existingBan) {
          return res.status(400).json({ success: false, message: '用户已被封禁' })
        }

        // 计算到期时间
        let expiresAt = null
        if (durationType !== 'permanent' && durationValue) {
          const now = new Date()
          const value = parseInt(durationValue)
          
          switch (durationType) {
            case 'hours':
              expiresAt = new Date(now.getTime() + value * 60 * 60 * 1000)
              break
            case 'days':
              expiresAt = new Date(now.getTime() + value * 24 * 60 * 60 * 1000)
              break
            case 'weeks':
              expiresAt = new Date(now.getTime() + value * 7 * 24 * 60 * 60 * 1000)
              break
            case 'months':
              expiresAt = new Date(now.getTime() + value * 30 * 24 * 60 * 60 * 1000)
              break
          }
        }

        // 创建封禁记录
        const banData = {
          userId: new ObjectId(userId),
          reason: reason.trim(),
          durationType: durationType || 'permanent',
          durationValue: durationType === 'permanent' ? null : parseInt(durationValue),
          expiresAt,
          notes: notes ? notes.trim() : null,
          status: 'active',
          bannedBy: new ObjectId(decoded.userId),
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = await db.collection('user_bans').insertOne(banData)

        return res.status(201).json({
          success: true,
          message: '用户封禁成功',
          data: {
            banId: result.insertedId.toString(),
            userId: userId,
            reason: banData.reason,
            type: durationType === 'permanent' ? '永久封禁' : `临时封禁${durationValue}${
              durationType === 'hours' ? '小时' :
              durationType === 'days' ? '天' :
              durationType === 'weeks' ? '周' : '月'
            }`,
            expiresAt: expiresAt
          }
        })
      }

      if (action === 'submit-appeal') {
        // 用户提交申述
        const { banId, reason, description, images } = body

        if (!banId || !reason) {
          return res.status(400).json({ success: false, message: '封禁ID和申述原因不能为空' })
        }

        // 验证封禁记录是否存在且属于当前用户
        const ban = await db.collection('user_bans').findOne({
          _id: new ObjectId(banId),
          userId: new ObjectId(decoded.userId),
          status: 'active'
        })

        if (!ban) {
          return res.status(404).json({ success: false, message: '封禁记录不存在或已解除' })
        }

        // 检查是否已有待处理的申述
        const existingAppeal = await db.collection('ban_appeals').findOne({
          banId: new ObjectId(banId),
          userId: new ObjectId(decoded.userId),
          status: 'pending'
        })

        if (existingAppeal) {
          return res.status(400).json({ success: false, message: '已有待处理的申述，请勿重复提交' })
        }

        // 验证图片数据
        let validImages = []
        if (images && Array.isArray(images)) {
          // 限制最多3张图片
          if (images.length > 3) {
            return res.status(400).json({ success: false, message: '最多只能上传3张图片' })
          }
          
          validImages = images.filter(img => {
            if (typeof img === 'string' && img.startsWith('data:image/')) {
              // 检查图片大小（base64编码后约为原始大小的1.33倍）
              const sizeInBytes = (img.length * 3) / 4
              if (sizeInBytes > 5 * 1024 * 1024) { // 5MB限制
                return false
              }
              return true
            }
            return false
          })
        }

        // 创建申述记录
        const appealData = {
          banId: new ObjectId(banId),
          userId: new ObjectId(decoded.userId),
          reason: reason.trim(),
          description: description ? description.trim() : null,
          images: validImages, // 存储图片的base64数据
          status: 'pending',
          submittedAt: new Date(),
          createdAt: new Date(), // 添加createdAt字段保持一致性
          processedAt: null,
          processedBy: null,
          adminReply: null
        }

        const result = await db.collection('ban_appeals').insertOne(appealData)

        // 发送申述接收确认通知给用户
        try {
          const systemMessages = db.collection('system_messages')
          
          const notificationData = {
            title: '申述已接收',
            content: `我们已收到您的申述请求。\n\n申述原因：${reason.trim()}\n\n我们会在48小时内处理您的申述，请耐心等待。如有任何疑问，请联系客服。`,
            type: 'info',
            priority: 'normal',
            autoRead: false,
            targetUserId: new ObjectId(decoded.userId), // 个人专属消息
            authorId: new ObjectId(decoded.userId), // 系统自动发送，设置为用户自己
            authorName: '系统通知',
            createdAt: new Date(),
            updatedAt: new Date()
          }

          await systemMessages.insertOne(notificationData)
          console.log('申述接收确认通知已发送给用户:', decoded.userId)
        } catch (notificationError) {
          console.error('发送申述确认通知失败:', notificationError)
          // 不阻断主流程
        }

        return res.status(201).json({
          success: true,
          message: '申述提交成功，请等待管理员处理',
          data: {
            appealId: result.insertedId.toString(),
            status: 'pending',
            submittedAt: appealData.submittedAt
          }
        })
      }

      // 头衔管理操作
      if (action === 'create-title') {
        // 管理员创建头衔
        if (currentUser.role !== 'admin') {
          return res.status(403).json({ success: false, message: '需要管理员权限' })
        }

        const { name, color, description } = body

        if (!name || !color) {
          return res.status(400).json({ success: false, message: '头衔名称和颜色不能为空' })
        }

        // 检查头衔名称是否已存在
        const existingTitle = await titles.findOne({ name: name.trim() })
        if (existingTitle) {
          return res.status(400).json({ success: false, message: '头衔名称已存在' })
        }

        // 验证颜色格式（支持 hex 和预设颜色名）
        const colorPattern = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i
        const presetColors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'gray', 'orange']
        if (!colorPattern.test(color) && !presetColors.includes(color.toLowerCase())) {
          return res.status(400).json({ success: false, message: '颜色格式无效' })
        }

        // 创建头衔
        const titleData = {
          name: name.trim(),
          color: color.toLowerCase(),
          description: description ? description.trim() : null,
          createdBy: new ObjectId(decoded.userId),
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = await titles.insertOne(titleData)

        return res.status(201).json({
          success: true,
          message: '头衔创建成功',
          data: {
            titleId: result.insertedId.toString(),
            name: titleData.name,
            color: titleData.color,
            description: titleData.description
          }
        })
      }

      if (action === 'assign-title') {
        // 管理员分配头衔给用户
        if (currentUser.role !== 'admin') {
          return res.status(403).json({ success: false, message: '需要管理员权限' })
        }

        const { userId, titleId } = body

        if (!userId || !titleId) {
          return res.status(400).json({ success: false, message: '用户ID和头衔ID不能为空' })
        }

        // 检查用户是否存在
        const targetUser = await getUserById(users, userId, db)
        if (!targetUser) {
          return res.status(404).json({ success: false, message: '目标用户不存在' })
        }

        // 检查头衔是否存在
        const title = await titles.findOne({ _id: new ObjectId(titleId) })
        if (!title) {
          return res.status(404).json({ success: false, message: '头衔不存在' })
        }

        // 检查用户是否已拥有该头衔
        const existingAssignment = await userTitles.findOne({
          userId: new ObjectId(userId),
          titleId: new ObjectId(titleId)
        })

        if (existingAssignment) {
          return res.status(400).json({ success: false, message: '用户已拥有该头衔' })
        }

        // 分配头衔
        const assignmentData = {
          userId: new ObjectId(userId),
          titleId: new ObjectId(titleId),
          assignedBy: new ObjectId(decoded.userId),
          assignedAt: new Date()
        }

        const result = await userTitles.insertOne(assignmentData)

        return res.status(201).json({
          success: true,
          message: '头衔分配成功',
          data: {
            assignmentId: result.insertedId.toString(),
            userId: userId,
            titleId: titleId,
            titleName: title.name,
            titleColor: title.color
          }
        })
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    // PUT: 更新操作（处理申述等）
    if (req.method === 'PUT') {
      const { action } = req.body

      if (action === 'unban-user') {
        // 管理员解除封禁
        if (currentUser.role !== 'admin') {
          return res.status(403).json({ success: false, message: '需要管理员权限' })
        }

        const { banId } = req.body

        if (!banId) {
          return res.status(400).json({ success: false, message: '封禁ID不能为空' })
        }

        const ban = await db.collection('user_bans').findOne({ _id: new ObjectId(banId) })
        if (!ban) {
          return res.status(404).json({ success: false, message: '封禁记录不存在' })
        }

        if (ban.status !== 'active') {
          return res.status(400).json({ success: false, message: '封禁已解除' })
        }

        // 更新封禁状态
        await db.collection('user_bans').updateOne(
          { _id: new ObjectId(banId) },
          { 
            $set: { 
              status: 'lifted',
              liftedBy: new ObjectId(decoded.userId),
              liftedAt: new Date(),
              updatedAt: new Date()
            } 
          }
        )

        return res.status(200).json({
          success: true,
          message: '封禁解除成功'
        })
      }

      if (action === 'process-appeal') {
        // 管理员处理申述
        if (currentUser.role !== 'admin') {
          return res.status(403).json({ success: false, message: '需要管理员权限' })
        }

        const { appealId, decision, adminReply } = req.body

        if (!appealId || !decision) {
          return res.status(400).json({ success: false, message: '申述ID和处理决定不能为空' })
        }

        if (!['approved', 'rejected'].includes(decision)) {
          return res.status(400).json({ success: false, message: '处理决定只能是approved或rejected' })
        }

        const appeal = await db.collection('ban_appeals').findOne({ 
          _id: new ObjectId(appealId),
          status: 'pending'
        })

        if (!appeal) {
          return res.status(404).json({ success: false, message: '申述记录不存在或已处理' })
        }

        // 更新申述状态
        await db.collection('ban_appeals').updateOne(
          { _id: new ObjectId(appealId) },
          {
            $set: {
              status: decision,
              processedAt: new Date(),
              processedBy: new ObjectId(decoded.userId),
              adminReply: adminReply ? adminReply.trim() : null
            }
          }
        )

        // 如果申述通过，自动解除封禁
        if (decision === 'approved') {
          await db.collection('user_bans').updateOne(
            { _id: new ObjectId(appeal.banId) },
            {
              $set: {
                status: 'lifted',
                liftedBy: new ObjectId(decoded.userId),
                liftedAt: new Date(),
                updatedAt: new Date(),
                liftReason: 'appeal_approved'
              }
            }
          )
        }

        return res.status(200).json({
          success: true,
          message: decision === 'approved' ? '申述通过，封禁已解除' : '申述已驳回'
        })
      }

      if (action === 'update-title') {
        // 管理员更新头衔
        if (currentUser.role !== 'admin') {
          return res.status(403).json({ success: false, message: '需要管理员权限' })
        }

        const { titleId, name, color, description } = req.body

        if (!titleId) {
          return res.status(400).json({ success: false, message: '头衔ID不能为空' })
        }

        // 检查头衔是否存在
        const title = await titles.findOne({ _id: new ObjectId(titleId) })
        if (!title) {
          return res.status(404).json({ success: false, message: '头衔不存在' })
        }

        const updateData = { updatedAt: new Date() }

        if (name && name.trim() !== title.name) {
          // 检查新名称是否已存在
          const existingTitle = await titles.findOne({ 
            name: name.trim(),
            _id: { $ne: new ObjectId(titleId) }
          })
          if (existingTitle) {
            return res.status(400).json({ success: false, message: '头衔名称已存在' })
          }
          updateData.name = name.trim()
        }

        if (color && color !== title.color) {
          // 验证颜色格式
          const colorPattern = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i
          const presetColors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'gray', 'orange']
          if (!colorPattern.test(color) && !presetColors.includes(color.toLowerCase())) {
            return res.status(400).json({ success: false, message: '颜色格式无效' })
          }
          updateData.color = color.toLowerCase()
        }

        if (description !== undefined) {
          updateData.description = description ? description.trim() : null
        }

        await titles.updateOne(
          { _id: new ObjectId(titleId) },
          { $set: updateData }
        )

        return res.status(200).json({
          success: true,
          message: '头衔更新成功'
        })
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    // DELETE: 删除内容
    if (req.method === 'DELETE') {
      const { action, id } = req.query

      // 删除帖子（支持作者和管理员删除）
      if (action === 'post') {
        if (!id) {
          return res.status(400).json({ 
            success: false, 
            message: '帖子ID不能为空' 
          })
        }

        const post = await posts.findOne({ _id: new ObjectId(id) })
        
        if (!post) {
          return res.status(404).json({ 
            success: false, 
            message: '帖子不存在' 
          })
        }

        // 检查删除权限：帖子作者或管理员
        if (post.authorId.toString() !== decoded.userId && currentUser.role !== 'admin') {
          return res.status(403).json({ 
            success: false, 
            message: '没有权限删除此帖子' 
          })
        }

        // 删除帖子及相关数据
        await Promise.all([
          posts.deleteOne({ _id: new ObjectId(id) }),
          comments.deleteMany({ postId: new ObjectId(id) }),
          likes.deleteMany({ targetId: new ObjectId(id), type: 'post' })
        ])

        return res.status(200).json({
          success: true,
          message: '帖子删除成功'
        })
      }

      // 删除评论（支持作者和管理员删除）
      if (action === 'comment') {
        if (!id) {
          return res.status(400).json({ 
            success: false, 
            message: '评论ID不能为空' 
          })
        }

        const comment = await comments.findOne({ _id: new ObjectId(id) })
        
        if (!comment) {
          return res.status(404).json({ 
            success: false, 
            message: '评论不存在' 
          })
        }

        // 检查删除权限：评论作者或管理员
        if (comment.authorId.toString() !== decoded.userId && currentUser.role !== 'admin') {
          return res.status(403).json({ 
            success: false, 
            message: '没有权限删除此评论' 
          })
        }

        // 删除评论及其子评论
        await Promise.all([
          comments.deleteMany({ 
            $or: [
              { _id: new ObjectId(id) },
              { parentId: new ObjectId(id) }
            ]
          }),
          likes.deleteMany({ targetId: new ObjectId(id), type: 'comment' })
        ])

        return res.status(200).json({
          success: true,
          message: '评论删除成功'
        })
      }

      // 删除头衔（管理员专用）
      if (action === 'title') {
        if (!id) {
          return res.status(400).json({ 
            success: false, 
            message: '头衔ID不能为空' 
          })
        }

        if (currentUser.role !== 'admin') {
          return res.status(403).json({ success: false, message: '需要管理员权限' })
        }

        const title = await titles.findOne({ _id: new ObjectId(id) })
        
        if (!title) {
          return res.status(404).json({ 
            success: false, 
            message: '头衔不存在' 
          })
        }

        // 删除头衔及所有相关分配
        await Promise.all([
          titles.deleteOne({ _id: new ObjectId(id) }),
          userTitles.deleteMany({ titleId: new ObjectId(id) })
        ])

        return res.status(200).json({
          success: true,
          message: '头衔删除成功'
        })
      }

      // 移除用户头衔（管理员专用）
      if (action === 'user-title') {
        const { userId, titleId } = req.query

        if (!userId || !titleId) {
          return res.status(400).json({ 
            success: false, 
            message: '用户ID和头衔ID不能为空' 
          })
        }

        if (currentUser.role !== 'admin') {
          return res.status(403).json({ success: false, message: '需要管理员权限' })
        }

        const assignment = await userTitles.findOne({ 
          userId: new ObjectId(userId),
          titleId: new ObjectId(titleId)
        })
        
        if (!assignment) {
          return res.status(404).json({ 
            success: false, 
            message: '用户头衔分配不存在' 
          })
        }

        await userTitles.deleteOne({ 
          userId: new ObjectId(userId),
          titleId: new ObjectId(titleId)
        })

        return res.status(200).json({
          success: true,
          message: '用户头衔移除成功'
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
    console.error('Social Content API Error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    })
  }
} 