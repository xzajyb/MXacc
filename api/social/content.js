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

    // 验证用户身份
    console.log('🔍 开始验证用户身份...')
    const decoded = verifyToken(req.headers.authorization)
    console.log('✅ Token解码成功, 用户ID:', decoded.userId)
    
    const currentUser = await getUserById(users, decoded.userId)
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
            getUserById(users, post.authorId),
            likes.countDocuments({ targetId: post._id, type: 'post' }),
            comments.countDocuments({ postId: post._id, parentId: { $exists: false } }),
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
              role: author.role || 'user'
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

      // 获取评论列表（支持二级评论）
      if (action === 'comments') {
        if (!postId) {
          return res.status(400).json({ 
            success: false, 
            message: '帖子ID不能为空' 
          })
        }

        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        // 获取一级评论
        const commentList = await comments.find({ 
          postId: new ObjectId(postId),
          parentId: { $exists: false } // 只获取一级评论
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        // 获取评论详情和二级评论
        const commentsWithDetails = await Promise.all(commentList.map(async (comment) => {
          const [author, likesCount, repliesCount, isLiked, replies] = await Promise.all([
            getUserById(users, comment.authorId),
            likes.countDocuments({ targetId: comment._id, type: 'comment' }),
            comments.countDocuments({ parentId: comment._id }),
            likes.findOne({ 
              targetId: comment._id, 
              userId: new ObjectId(decoded.userId), 
              type: 'comment' 
            }),
            // 获取最新的3条二级评论作为预览
            comments.find({ parentId: comment._id })
              .sort({ createdAt: -1 })
              .limit(3)
              .toArray()
          ])

          // 获取二级评论的作者信息
          const repliesWithAuthors = await Promise.all(replies.map(async (reply) => {
            const replyAuthor = await getUserById(users, reply.authorId)
            return {
              id: reply._id,
              content: reply.content,
              author: {
                id: replyAuthor._id,
                username: replyAuthor.username,
                nickname: replyAuthor.profile?.nickname || replyAuthor.username,
                avatar: replyAuthor.profile?.avatar,
                role: replyAuthor.role || 'user'
              },
              replyTo: reply.replyTo ? {
                id: reply.replyTo.userId,
                username: reply.replyTo.username
              } : null,
              canDelete: reply.authorId.toString() === decoded.userId || currentUser.role === 'admin',
              createdAt: reply.createdAt
            }
          }))

          return {
            id: comment._id,
            content: comment.content,
            author: {
              id: author._id,
              username: author.username,
              nickname: author.profile?.nickname || author.username,
              avatar: author.profile?.avatar,
              role: author.role || 'user'
            },
            likesCount,
            repliesCount,
            isLiked: !!isLiked,
            replies: repliesWithAuthors.reverse(), // 最新的在下面
            canDelete: comment.authorId.toString() === decoded.userId || currentUser.role === 'admin',
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
          const author = await getUserById(users, reply.authorId)
          return {
            id: reply._id,
            content: reply.content,
            author: {
              id: author._id,
              username: author.username,
              nickname: author.profile?.nickname || author.username,
              avatar: author.profile?.avatar,
              role: author.role || 'user'
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
        const author = await getUserById(users, decoded.userId)

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
              role: author.role || 'user'
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
          newComment.parentId = new ObjectId(parentId)
          
          // 如果指定了回复目标用户
          if (replyTo && replyTo.userId && replyTo.username) {
            newComment.replyTo = {
              userId: new ObjectId(replyTo.userId),
              username: replyTo.username
            }
          }
        }

        const result = await comments.insertOne(newComment)
        const author = await getUserById(users, decoded.userId)

        // 更新评论计数
        const commentsCount = await comments.countDocuments({ 
          postId: new ObjectId(postId),
          parentId: parentId ? new ObjectId(parentId) : { $exists: false }
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
                role: author.role || 'user'
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