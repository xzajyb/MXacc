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

    if (req.method === 'GET') {
      const { type = 'feed', page = 1, limit = 10, userId } = req.query

      let query = {}
      let sort = { createdAt: -1 }

      if (type === 'user' && userId) {
        // 获取特定用户的帖子
        query = { authorId: new ObjectId(userId) }
      } else if (type === 'following') {
        // 获取关注用户的帖子
        const followingUsers = await follows.find({ 
          followerId: new ObjectId(decoded.userId) 
        }).toArray()
        
        const followingIds = followingUsers.map(f => f.followingId)
        followingIds.push(new ObjectId(decoded.userId)) // 包含自己的帖子
        
        query = { authorId: { $in: followingIds } }
      }
      // type === 'feed' 时获取所有公开帖子

      const skip = (parseInt(page) - 1) * parseInt(limit)
      
      // 获取帖子
      const postList = await posts.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray()

      // 获取帖子统计信息
      const postsWithStats = await Promise.all(postList.map(async (post) => {
        const [author, likesCount, commentsCount, isLiked] = await Promise.all([
          getUserById(users, post.authorId),
          likes.countDocuments({ postId: post._id, type: 'like' }),
          comments.countDocuments({ postId: post._id }),
          likes.findOne({ 
            postId: post._id, 
            userId: new ObjectId(decoded.userId), 
            type: 'like' 
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
            avatar: author.profile?.avatar
          },
          likesCount,
          commentsCount,
          isLiked: !!isLiked,
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
      const { action, postId, content, images, commentContent } = req.body

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

        const result = await posts.insertOne(newPost)
        
        // 获取完整的帖子信息返回
        const createdPost = await posts.findOne({ _id: result.insertedId })
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

        if (existingLike) {
          // 取消点赞
          await likes.deleteOne({ _id: existingLike._id })
          const likesCount = await likes.countDocuments({ 
            postId: new ObjectId(postId), 
            type: 'like' 
          })
          
          return res.status(200).json({
            success: true,
            message: '取消点赞成功',
            data: { isLiked: false, likesCount }
          })
        } else {
          // 添加点赞
          await likes.insertOne({
            postId: new ObjectId(postId),
            userId: new ObjectId(decoded.userId),
            type: 'like',
            createdAt: new Date()
          })
          
          const likesCount = await likes.countDocuments({ 
            postId: new ObjectId(postId), 
            type: 'like' 
          })
          
          return res.status(200).json({
            success: true,
            message: '点赞成功',
            data: { isLiked: true, likesCount }
          })
        }
      }

      if (action === 'comment') {
        // 添加评论
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
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = await comments.insertOne(newComment)
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

    if (req.method === 'DELETE') {
      const { postId } = req.query

      if (!postId) {
        return res.status(400).json({ 
          success: false, 
          message: '帖子ID不能为空' 
        })
      }

      // 检查帖子是否存在且属于当前用户
      const post = await posts.findOne({ _id: new ObjectId(postId) })
      
      if (!post) {
        return res.status(404).json({ 
          success: false, 
          message: '帖子不存在' 
        })
      }

      if (post.authorId.toString() !== decoded.userId && currentUser.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: '没有权限删除此帖子' 
        })
      }

      // 删除帖子及相关数据
      await Promise.all([
        posts.deleteOne({ _id: new ObjectId(postId) }),
        comments.deleteMany({ postId: new ObjectId(postId) }),
        likes.deleteMany({ postId: new ObjectId(postId) })
      ])

      return res.status(200).json({
        success: true,
        message: '帖子删除成功'
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