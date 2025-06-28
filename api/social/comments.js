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

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const comments = db.collection('comments')
    const users = db.collection('users')

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
        postId: new ObjectId(postId) 
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray()

      // 获取评论作者信息
      const commentsWithAuthors = await Promise.all(commentList.map(async (comment) => {
        const author = await getUserById(users, comment.authorId)
        return {
          id: comment._id,
          content: comment.content,
          author: {
            id: author._id,
            username: author.username,
            nickname: author.profile?.nickname || author.username,
            avatar: author.profile?.avatar
          },
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        }
      }))

      const total = await comments.countDocuments({ postId: new ObjectId(postId) })

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

      // 删除评论
      await comments.deleteOne({ _id: new ObjectId(commentId) })

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