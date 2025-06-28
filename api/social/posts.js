const clientPromise = require('../_lib/mongodb')
const { ObjectId } = require('mongodb')
const cacheManager = require('./cache-manager')

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
  // 先从缓存获取
  const cachedUser = cacheManager.get('users', userId)
  if (cachedUser) {
    return cachedUser
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
        'profile.bio': 1,
        'profile.displayName': 1,
        role: 1,
        isEmailVerified: 1,
        'security.emailVerified': 1
      } 
    }
  )
  
  if (user) {
    user.isEmailVerified = user.isEmailVerified || user.security?.emailVerified || false
    // 缓存用户信息
    cacheManager.set('users', userId, user)
  }
  
  return user
}

// 获取帖子统计信息（带缓存）
async function getPostStats(postId, userId, db) {
  const cacheKey = `stats_${postId}_${userId}`
  const cachedStats = cacheManager.get('posts', cacheKey)
  
  if (cachedStats) {
    return cachedStats
  }

  const [likesCount, commentsCount, isLiked] = await Promise.all([
    db.collection('likes').countDocuments({ postId: new ObjectId(postId), type: 'like' }),
    db.collection('comments').countDocuments({ postId: new ObjectId(postId) }),
    db.collection('likes').findOne({ 
      postId: new ObjectId(postId), 
      userId: new ObjectId(userId), 
      type: 'like' 
    })
  ])

  const stats = { likesCount, commentsCount, isLiked: !!isLiked }
  cacheManager.set('posts', cacheKey, stats)
  
  return stats
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
    console.log('=== Social Posts API ===')
    console.log('Method:', req.method)
    console.log('Headers:', req.headers.authorization ? 'Token present' : 'No token')
    console.log('Body:', req.body)

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const posts = db.collection('posts')
    const users = db.collection('users')
    const comments = db.collection('comments')
    const likes = db.collection('likes')
    const follows = db.collection('follows')

    // 验证用户身份
    console.log('🔍 开始验证用户身份...')
    const decoded = verifyToken(req.headers.authorization)
    console.log('✅ Token解码成功, 用户ID:', decoded.userId)
    
    const currentUser = await getUserById(users, decoded.userId)
    console.log('👤 查询到的用户:', currentUser ? {
      id: currentUser._id,
      username: currentUser.username,
      email: currentUser.email,
      isEmailVerified: currentUser.isEmailVerified,
      hasProfile: !!currentUser.profile
    } : null)
    
    if (!currentUser) {
      console.log('❌ 用户不存在，用户ID:', decoded.userId)
      return res.status(401).json({ success: false, message: '用户不存在' })
    }

    console.log('✅ 用户验证成功')

    // 定期同步缓存到数据库
    if (Date.now() - cacheManager.lastSync.getTime() > 5 * 60 * 1000) {
      cacheManager.syncToDatabase(db).catch(console.error)
    }

    if (req.method === 'GET') {
      const { type = 'feed', page = 1, limit = 10, userId } = req.query

      let query = {}
      let sort = { createdAt: -1 }

      if (type === 'user' && userId) {
        query = { authorId: new ObjectId(userId) }
      } else if (type === 'following') {
        const followingUsers = await follows.find({ 
          followerId: new ObjectId(decoded.userId) 
        }).toArray()
        
        const followingIds = followingUsers.map(f => f.followingId)
        followingIds.push(new ObjectId(decoded.userId))
        
        query = { authorId: { $in: followingIds } }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)
      
      // 先尝试从缓存获取帖子
      const cacheKey = `${type}_${page}_${limit}_${userId || 'all'}`
      let postList = cacheManager.get('posts', cacheKey)
      
      if (!postList) {
        // 从数据库获取
        postList = await posts.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()
        
        // 缓存帖子列表
        cacheManager.set('posts', cacheKey, postList)
      }

      // 获取帖子统计信息
      const postsWithStats = await Promise.all(postList.map(async (post) => {
        const [author, stats] = await Promise.all([
          getUserById(users, post.authorId),
          getPostStats(post._id.toString(), decoded.userId, db)
        ])

        return {
          id: post._id,
          content: post.content,
          images: post.images || [],
          author: {
            id: author._id,
            username: author.username,
            nickname: author.profile?.nickname || author.username,
            avatar: author.profile?.avatar
          },
          likesCount: stats.likesCount,
          commentsCount: stats.commentsCount,
          isLiked: stats.isLiked,
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

    if (req.method === 'POST') {
      const { action, postId, content, images, commentContent, parentCommentId } = req.body

      if (action === 'create') {
        // 创建新帖子
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

        // 同时写入数据库和缓存
        const result = await posts.insertOne(newPost)
        const createdPost = { ...newPost, _id: result.insertedId }
        
        // 缓存新帖子
        cacheManager.set('posts', result.insertedId.toString(), createdPost, true)
        
        const author = await getUserById(users, decoded.userId)

        return res.status(201).json({
          success: true,
          message: '帖子发布成功',
          data: {
            id: createdPost._id,
            content: createdPost.content,
            images: createdPost.images,
            author: {
              id: author._id,
              username: author.username,
              nickname: author.profile?.nickname || author.username,
              avatar: author.profile?.avatar
            },
            likesCount: 0,
            commentsCount: 0,
            isLiked: false,
            createdAt: createdPost.createdAt,
            updatedAt: createdPost.updatedAt
          }
        })
      }

      if (action === 'like') {
        // 点赞/取消点赞
        if (!postId) {
          return res.status(400).json({ 
            success: false, 
            message: '帖子ID不能为空' 
          })
        }

        const existingLike = await likes.findOne({
          postId: new ObjectId(postId),
          userId: new ObjectId(decoded.userId),
          type: 'like'
        })

        let isLiked, likesCount

        if (existingLike) {
          // 取消点赞 - 记录到缓存，延迟同步到数据库
          cacheManager.markForSync('likes', `${postId}_${decoded.userId}`, {
            action: 'unlike',
            postId,
            userId: decoded.userId
          })
          
          await likes.deleteOne({ _id: existingLike._id })
          likesCount = await likes.countDocuments({ 
            postId: new ObjectId(postId), 
            type: 'like' 
          })
          isLiked = false
        } else {
          // 添加点赞 - 记录到缓存，延迟同步到数据库
          cacheManager.markForSync('likes', `${postId}_${decoded.userId}`, {
            action: 'like',
            postId,
            userId: decoded.userId,
            createdAt: new Date()
          })
          
          await likes.insertOne({
            postId: new ObjectId(postId),
            userId: new ObjectId(decoded.userId),
            type: 'like',
            createdAt: new Date()
          })
          
          likesCount = await likes.countDocuments({ 
            postId: new ObjectId(postId), 
            type: 'like' 
          })
          isLiked = true
        }

        // 更新缓存中的统计信息
        const statsKey = `stats_${postId}_${decoded.userId}`
        cacheManager.set('posts', statsKey, { likesCount, isLiked })

        return res.status(200).json({
          success: true,
          message: isLiked ? '点赞成功' : '取消点赞成功',
          data: { isLiked, likesCount }
        })
      }

      if (action === 'comment') {
        // 添加评论（支持二级评论）
        if (!postId || !commentContent) {
          return res.status(400).json({ 
            success: false, 
            message: '帖子ID和评论内容不能为空' 
          })
        }

        if (commentContent.trim().length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: '评论内容不能为空' 
          })
        }

        if (commentContent.length > 500) {
          return res.status(400).json({ 
            success: false, 
            message: '评论内容不能超过500个字符' 
          })
        }

        const newComment = {
          postId: new ObjectId(postId),
          authorId: new ObjectId(decoded.userId),
          content: commentContent.trim(),
          parentCommentId: parentCommentId ? new ObjectId(parentCommentId) : null,
          level: parentCommentId ? 2 : 1, // 最多支持2级评论
          createdAt: new Date(),
          updatedAt: new Date()
        }

        // 同时写入数据库和缓存
        const result = await comments.insertOne(newComment)
        const createdComment = { ...newComment, _id: result.insertedId }
        
        // 缓存评论，标记需要同步
        cacheManager.set('comments', result.insertedId.toString(), createdComment, true)
        
        const author = await getUserById(users, decoded.userId)
        const commentsCount = await comments.countDocuments({ 
          postId: new ObjectId(postId) 
        })

        return res.status(201).json({
          success: true,
          message: '评论发布成功',
          data: {
            comment: {
              id: result.insertedId,
              content: newComment.content,
              parentCommentId: newComment.parentCommentId,
              level: newComment.level,
              author: {
                id: author._id,
                username: author.username,
                nickname: author.profile?.nickname || author.username,
                avatar: author.profile?.avatar
              },
              createdAt: newComment.createdAt
            },
            commentsCount
          }
        })
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    // 注意：不支持DELETE方法（帖子删除功能已移除）
    if (req.method === 'DELETE') {
      return res.status(405).json({ 
        success: false, 
        message: '不支持删除帖子功能' 
      })
    }

    return res.status(405).json({ 
      success: false, 
      message: '方法不允许' 
    })

  } catch (error) {
    console.error('Social Posts API Error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    })
  }
} 