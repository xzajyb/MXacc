const clientPromise = require('../_lib/mongodb')
const { verifyToken, hashPassword } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // 验证管理员权限
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '需要登录' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ message: 'Token无效' })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    // 检查当前用户是否为管理员
    const currentUser = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: '权限不足，需要管理员权限' })
    }

    switch (req.method) {
      case 'GET':
        return handleGetUsers(req, res, users)
      case 'PUT':
        return handleUpdateUser(req, res, users)
      case 'DELETE':
        return handleDeleteUser(req, res, users)
      default:
        return res.status(405).json({ message: '方法不允许' })
    }

  } catch (error) {
    console.error('管理员API错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// 获取所有用户
async function handleGetUsers(req, res, users) {
  try {
    const { page = 1, limit = 20, search = '' } = req.query

    // 构建搜索条件
    const searchQuery = search ? {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.displayName': { $regex: search, $options: 'i' } }
      ]
    } : {}

    // 分页查询
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const totalUsers = await users.countDocuments(searchQuery)
    
    const userList = await users.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .project({ password: 0, verificationCode: 0 }) // 不返回敏感信息
      .toArray()

    res.status(200).json({
      users: userList,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalUsers / parseInt(limit))
      }
    })

  } catch (error) {
    console.error('获取用户列表错误:', error)
    res.status(500).json({ message: '获取用户列表失败' })
  }
}

// 更新用户信息
async function handleUpdateUser(req, res, users) {
  try {
    const { userId } = req.query
    const updateData = req.body

    if (!userId) {
      return res.status(400).json({ message: '缺少用户ID' })
    }

    // 构建更新对象
    const updateFields = {}
    
    if (updateData.username) updateFields.username = updateData.username
    if (updateData.email) updateFields.email = updateData.email
    if (updateData.role) updateFields.role = updateData.role
    if (updateData.status) updateFields.status = updateData.status
    if (typeof updateData.isEmailVerified === 'boolean') {
      updateFields.isEmailVerified = updateData.isEmailVerified
    }

    // 处理密码更新
    if (updateData.password) {
      updateFields.password = await hashPassword(updateData.password)
    }

    // 处理个人资料更新
    if (updateData.profile) {
      Object.keys(updateData.profile).forEach(key => {
        updateFields[`profile.${key}`] = updateData.profile[key]
      })
    }

    updateFields.updatedAt = new Date()

    // 检查用户名和邮箱是否已被其他用户使用
    if (updateData.username || updateData.email) {
      const existingUser = await users.findOne({
        $and: [
          { _id: { $ne: new ObjectId(userId) } },
          {
            $or: [
              updateData.username ? { username: updateData.username } : {},
              updateData.email ? { email: updateData.email } : {}
            ].filter(condition => Object.keys(condition).length > 0)
          }
        ]
      })

      if (existingUser) {
        return res.status(400).json({ 
          message: existingUser.username === updateData.username ? '用户名已被使用' : '邮箱已被注册' 
        })
      }
    }

    // 更新用户
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: '用户不存在' })
    }

    // 返回更新后的用户信息
    const updatedUser = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0, verificationCode: 0 } }
    )

    res.status(200).json({ 
      message: '用户信息更新成功',
      user: updatedUser
    })

  } catch (error) {
    console.error('更新用户错误:', error)
    res.status(500).json({ message: '更新用户失败' })
  }
}

// 删除用户
async function handleDeleteUser(req, res, users) {
  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ message: '缺少用户ID' })
    }

    // 检查要删除的用户是否存在
    const userToDelete = await users.findOne({ _id: new ObjectId(userId) })
    if (!userToDelete) {
      return res.status(404).json({ message: '用户不存在' })
    }

    // 防止删除管理员账户（可以根据需要调整这个逻辑）
    if (userToDelete.role === 'admin') {
      return res.status(400).json({ message: '不能删除管理员账户' })
    }

    // 删除用户
    const result = await users.deleteOne({ _id: new ObjectId(userId) })

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: '删除失败，用户不存在' })
    }

    res.status(200).json({ message: '用户已成功删除' })

  } catch (error) {
    console.error('删除用户错误:', error)
    res.status(500).json({ message: '删除用户失败' })
  }
} 