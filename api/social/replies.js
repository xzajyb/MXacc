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
    console.log('=== Social Replies API ===')
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

    if (req.method === 'GET') {
      const { commentId, page = 1, limit = 10 } = req.query

      if (!commentId) {
        return res.status(400).json({ 
          success: false, 
          message: '评论ID不能为空' 
        })
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)
      
      // 获取回复列表
      const repliesList = await comments.find({ 
        parentId: new ObjectId(commentId)
      })
        .sort({ createdAt: 1 }) // 回复按时间正序排列
        .skip(skip)
        .limit(parseInt(limit))
        .toArray()

      // 获取回复作者信息和统计数据
      const repliesWithAuthors = await Promise.all(repliesList.map(async (reply) => {
        const [author, likesCount, isLiked] = await Promise.all([
          getUserById(users, reply.authorId),
          likes.countDocuments({ commentId: reply._id, type: 'comment_like' }),
          likes.findOne({ 
            commentId: reply._id, 
            userId: new ObjectId(decoded.userId), 
            type: 'comment_like' 
          })
        ])
        
        return {
          id: reply._id,
          content: reply.content,
          author: {
            id: author._id,
            username: author.username,
            nickname: author.profile?.nickname || author.username,
            avatar: author.profile?.avatar
          },
          likesCount,
          isLiked: !!isLiked,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt
        }
      }))

      const total = await comments.countDocuments({ 
        parentId: new ObjectId(commentId)
      })

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

    return res.status(405).json({ 
      success: false, 
      message: '方法不允许' 
    })

  } catch (error) {
    console.error('Social Replies API Error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    })
  }
} 