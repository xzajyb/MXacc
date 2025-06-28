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
    console.log('Body:', req.body)

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const comments = db.collection('comments')
    const users = db.collection('users')
    const likes = db.collection('likes')

    // 验证用户身份
    const decoded = verifyToken(req.headers.authorization)

    if (req.method === 'GET') {
      const { postId, page = 1, limit = 20 } = req.query

      if (!postId) {
        return res.status(400).json({ 
          success: false, 
          message: '帖子ID不能为空' 
        })
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)
      
      // 获取评论列表
      const commentList = await comments.find({ 
        postId: new ObjectId(postId),
        parentId: { $exists: false } // 只获取顶级评论
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray()

      // 获取评论作者信息和统计数据
      const commentsWithAuthors = await Promise.all(commentList.map(async (comment) => {
        const [author, likesCount, repliesCount, isLiked] = await Promise.all([
          getUserById(users, comment.authorId),
          likes.countDocuments({ commentId: comment._id, type: 'comment_like' }),
          comments.countDocuments({ parentId: comment._id }),
          likes.findOne({ 
            commentId: comment._id, 
            userId: new ObjectId(decoded.userId), 
            type: 'comment_like' 
          })
        ])
        
        return {
          id: comment._id,
          content: comment.content,
          author: {
            id: author._id,
            username: author.username,
            nickname: author.profile?.nickname || author.username,
            avatar: author.profile?.avatar
          },
          likesCount,
          repliesCount,
          isLiked: !!isLiked,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        }
      }))

      const total = await comments.countDocuments({ 
        postId: new ObjectId(postId),
        parentId: { $exists: false }
      })

      return res.status(200).json({
        success: true,
        data: {
          comments: commentsWithAuthors,
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
      const { action, commentId, postId, content, parentId } = req.body

      if (action === 'like') {
        // 点赞/取消点赞评论
        if (!commentId) {
          return res.status(400).json({ 
            success: false, 
            message: '评论ID不能为空' 
          })
        }

        const existingLike = await likes.findOne({
          commentId: new ObjectId(commentId),
          userId: new ObjectId(decoded.userId),
          type: 'comment_like'
        })

        if (existingLike) {
          // 取消点赞
          await likes.deleteOne({ _id: existingLike._id })
          const likesCount = await likes.countDocuments({ 
            commentId: new ObjectId(commentId), 
            type: 'comment_like' 
          })
          
          return res.status(200).json({
            success: true,
            message: '取消点赞成功',
            data: { isLiked: false, likesCount }
          })
        } else {
          // 添加点赞
          await likes.insertOne({
            commentId: new ObjectId(commentId),
            userId: new ObjectId(decoded.userId),
            type: 'comment_like',
            createdAt: new Date()
          })
          
          const likesCount = await likes.countDocuments({ 
            commentId: new ObjectId(commentId), 
            type: 'comment_like' 
          })
          
          return res.status(200).json({
            success: true,
            message: '点赞成功',
            data: { isLiked: true, likesCount }
          })
        }
      }

      if (action === 'reply') {
        // 创建回复（二级评论）
        if (!parentId || !content) {
          return res.status(400).json({ 
            success: false, 
            message: '父评论ID和回复内容不能为空' 
          })
        }

        if (content.trim().length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: '回复内容不能为空' 
          })
        }

        if (content.length > 300) {
          return res.status(400).json({ 
            success: false, 
            message: '回复内容不能超过300个字符' 
          })
        }

        // 检查父评论是否存在
        const parentComment = await comments.findOne({ _id: new ObjectId(parentId) })
        if (!parentComment) {
          return res.status(404).json({ 
            success: false, 
            message: '父评论不存在' 
          })
        }

        const newReply = {
          postId: parentComment.postId,
          parentId: new ObjectId(parentId),
          authorId: new ObjectId(decoded.userId),
          content: content.trim(),
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = await comments.insertOne(newReply)
        const author = await getUserById(users, decoded.userId)
        const repliesCount = await comments.countDocuments({ 
          parentId: new ObjectId(parentId) 
        })

        return res.status(201).json({
          success: true,
          message: '回复发布成功',
          data: {
            reply: {
              id: result.insertedId,
              content: newReply.content,
              author: {
                id: author._id,
                username: author.username,
                nickname: author.profile?.nickname || author.username,
                avatar: author.profile?.avatar
              },
              likesCount: 0,
              isLiked: false,
              createdAt: newReply.createdAt
            },
            repliesCount
          }
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

      // 删除评论及其回复和点赞
      await Promise.all([
        comments.deleteOne({ _id: new ObjectId(commentId) }),
        comments.deleteMany({ parentId: new ObjectId(commentId) }), // 删除所有回复
        likes.deleteMany({ commentId: new ObjectId(commentId) }) // 删除所有点赞
      ])

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