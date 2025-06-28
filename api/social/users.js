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
    console.log('=== Social Users API ===')
    console.log('Method:', req.method)
    console.log('Query:', req.query)
    console.log('Body:', req.body)

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')
    const follows = db.collection('follows')
    const posts = db.collection('posts')

    // 验证用户身份
    const decoded = verifyToken(req.headers.authorization)
    const currentUser = await getUserById(users, decoded.userId)
    
    if (!currentUser) {
      return res.status(401).json({ success: false, message: '用户不存在' })
    }

    if (req.method === 'GET') {
      const { action, userId, search, page = 1, limit = 20 } = req.query

      if (action === 'search') {
        // 搜索用户
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
          _id: { $ne: new ObjectId(decoded.userId) } // 排除自己
        })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray()

        // 检查关注状态
        const usersWithFollowStatus = await Promise.all(userList.map(async (user) => {
          const isFollowing = await follows.findOne({
            followerId: new ObjectId(decoded.userId),
            followingId: user._id
          })

          const [followersCount, followingCount, postsCount] = await Promise.all([
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
            users: usersWithFollowStatus,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        })
      }

      if (action === 'profile' && userId) {
        // 获取用户详情
        const user = await getUserById(users, userId)
        
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: '用户不存在' 
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
            isOwnProfile: user._id.toString() === decoded.userId
          }
        })
      }

      if (action === 'followers' && userId) {
        // 获取关注者列表
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

      if (action === 'following' && userId) {
        // 获取关注列表
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

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    if (req.method === 'POST') {
      const { action, userId } = req.body

      if (action === 'follow') {
        // 关注用户
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

        // 检查目标用户是否存在
        const targetUser = await getUserById(users, userId)
        if (!targetUser) {
          return res.status(404).json({ 
            success: false, 
            message: '目标用户不存在' 
          })
        }

        // 检查是否已经关注
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

        // 创建关注关系
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

      if (action === 'unfollow') {
        // 取消关注
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

    return res.status(405).json({ 
      success: false, 
      message: '方法不允许' 
    })

  } catch (error) {
    console.error('Social Users API Error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    })
  }
} 