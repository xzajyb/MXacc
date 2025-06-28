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

// 获取评论统计信息（带缓存）
async function getCommentStats(commentId, userId, db) {
  const cacheKey = `comment_stats_${commentId}_${userId}`
  const cachedStats = cacheManager.get('comments', cacheKey)
  
  if (cachedStats) {
    return cachedStats
  }

  const [likesCount, isLiked, repliesCount] = await Promise.all([
    db.collection('likes').countDocuments({ 
      postId: new ObjectId(commentId), 
      type: 'comment_like' 
    }),
    db.collection('likes').findOne({ 
      postId: new ObjectId(commentId), 
      userId: new ObjectId(userId), 
      type: 'comment_like' 
    }),
    db.collection('comments').countDocuments({ 
      parentCommentId: new ObjectId(commentId) 
    })
  ])

  const stats = { likesCount, isLiked: !!isLiked, repliesCount }
  cacheManager.set('comments', cacheKey, stats)
  
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
    console.log('=== Social Comments API ===')
    console.log('Method:', req.method)
    console.log('Query:', req.query)

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const comments = db.collection('comments')
    const users = db.collection('users')
    const likes = db.collection('likes')

    // 验证用户身份
    const decoded = verifyToken(req.headers.authorization)

    // 定期同步缓存到数据库
    if (Date.now() - cacheManager.lastSync.getTime() > 5 * 60 * 1000) {
      cacheManager.syncToDatabase(db).catch(console.error)
    }

    if (req.method === 'GET') {
      const { postId, parentCommentId, page = 1, limit = 20 } = req.query

      if (!postId) {
        return res.status(400).json({ 
          success: false, 
          message: '帖子ID不能为空' 
        })
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)
      
      // 构建查询条件
      let query = { postId: new ObjectId(postId) }
      
      if (parentCommentId) {
        // 获取二级评论
        query.parentCommentId = new ObjectId(parentCommentId)
      } else {
        // 获取一级评论
        query.parentCommentId = null
      }
      
      // 先尝试从缓存获取评论列表
      const cacheKey = `comments_${postId}_${parentCommentId || 'root'}_${page}_${limit}`
      let commentList = cacheManager.get('comments', cacheKey)
      
      if (!commentList) {
        // 从数据库获取
        commentList = await comments.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()
        
        // 缓存评论列表
        cacheManager.set('comments', cacheKey, commentList)
      }

      // 获取评论作者信息和统计数据
      const commentsWithDetails = await Promise.all(commentList.map(async (comment) => {
        const [author, stats] = await Promise.all([
          getUserById(users, comment.authorId),
          getCommentStats(comment._id.toString(), decoded.userId, db)
        ])
        
        return {
          id: comment._id,
          content: comment.content,
          parentCommentId: comment.parentCommentId,
          level: comment.level || 1,
          author: {
            id: author._id,
            username: author.username,
            nickname: author.profile?.nickname || author.username,
            avatar: author.profile?.avatar
          },
          likesCount: stats.likesCount,
          repliesCount: stats.repliesCount,
          isLiked: stats.isLiked,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        }
      }))

      const total = await comments.countDocuments(query)

      return res.status(200).json({
        success: true,
        data: {
          comments: commentsWithDetails,
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
      const { action, commentId } = req.body

      if (action === 'like') {
        // 点赞/取消点赞评论
        if (!commentId) {
          return res.status(400).json({ 
            success: false, 
            message: '评论ID不能为空' 
          })
        }

        const existingLike = await likes.findOne({
          postId: new ObjectId(commentId), // 这里复用postId字段存储commentId
          userId: new ObjectId(decoded.userId),
          type: 'comment_like'
        })

        let isLiked, likesCount

        if (existingLike) {
          // 取消点赞
          cacheManager.markForSync('likes', `comment_${commentId}_${decoded.userId}`, {
            action: 'unlike',
            commentId,
            userId: decoded.userId,
            type: 'comment_like'
          })
          
          await likes.deleteOne({ _id: existingLike._id })
          likesCount = await likes.countDocuments({ 
            postId: new ObjectId(commentId), 
            type: 'comment_like' 
          })
          isLiked = false
        } else {
          // 添加点赞
          cacheManager.markForSync('likes', `comment_${commentId}_${decoded.userId}`, {
            action: 'like',
            commentId,
            userId: decoded.userId,
            type: 'comment_like',
            createdAt: new Date()
          })
          
          await likes.insertOne({
            postId: new ObjectId(commentId), // 复用postId字段
            userId: new ObjectId(decoded.userId),
            type: 'comment_like',
            createdAt: new Date()
          })
          
          likesCount = await likes.countDocuments({ 
            postId: new ObjectId(commentId), 
            type: 'comment_like' 
          })
          isLiked = true
        }

        // 更新缓存中的统计信息
        const statsKey = `comment_stats_${commentId}_${decoded.userId}`
        const currentStats = cacheManager.get('comments', statsKey) || {}
        cacheManager.set('comments', statsKey, { 
          ...currentStats, 
          likesCount, 
          isLiked 
        })

        return res.status(200).json({
          success: true,
          message: isLiked ? '点赞成功' : '取消点赞成功',
          data: { isLiked, likesCount }
        })
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    if (req.method === 'DELETE') {
      const { commentId } = req.query

      if (!commentId) {
        return res.status(400).json({ 
          success: false, 
          message: '评论ID不能为空' 
        })
      }

      // 检查评论是否存在
      const comment = await comments.findOne({ _id: new ObjectId(commentId) })
      
      if (!comment) {
        return res.status(404).json({ 
          success: false, 
          message: '评论不存在' 
        })
      }

      // 检查权限（只有评论作者或管理员可以删除）
      const currentUser = await getUserById(users, decoded.userId)
      if (comment.authorId.toString() !== decoded.userId && currentUser.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: '没有权限删除此评论' 
        })
      }

      // 删除评论及其所有二级评论和点赞
      await Promise.all([
        comments.deleteOne({ _id: new ObjectId(commentId) }),
        comments.deleteMany({ parentCommentId: new ObjectId(commentId) }), // 删除子评论
        likes.deleteMany({ 
          postId: new ObjectId(commentId), 
          type: 'comment_like' 
        }) // 删除评论点赞
      ])

      // 清除相关缓存
      const cacheKeys = Array.from(cacheManager.caches.comments.keys()).filter(key => 
        key.includes(commentId) || key.includes(`comments_${comment.postId}`)
      )
      cacheKeys.forEach(key => cacheManager.caches.comments.delete(key))

      return res.status(200).json({
        success: true,
        message: '评论删除成功'
      })
    }

    return res.status(405).json({ 
      success: false, 
      message: '方法不允许' 
    })

  } catch (error) {
    console.error('Social Comments API Error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    })
  }
} 