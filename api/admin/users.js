const clientPromise = require('../_lib/mongodb')
const { verifyToken } = require('../_lib/auth')
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
      return res.status(401).json({ message: '需要管理员权限' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ message: 'Token无效' })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')
    const systemSettings = db.collection('system_settings')

    // 检查管理员权限
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ 
        message: '权限不足，需要管理员权限',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    if (req.method === 'GET') {
      // 处理合作伙伴Logo设置
      if (req.query.action === 'partner-logos') {
        const partnerLogos = await systemSettings.findOne({ _id: 'partner_logos' }) || { logos: [] }
        return res.status(200).json({
          success: true,
          data: partnerLogos
        })
      }

      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        verified = '', 
        role = '' 
      } = req.query

      const pageNum = parseInt(page)
      const limitNum = Math.min(parseInt(limit), 100) // 最大100条
      const skip = (pageNum - 1) * limitNum

      // 构建查询条件
      const query = {}
      
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }
      
      if (verified === 'true') {
        query.isEmailVerified = true
      } else if (verified === 'false') {
        query.isEmailVerified = false
      }
      
      if (role) {
        query.role = role
      }

      // 获取用户列表
      const userList = await users.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .project({
          _id: 1,
          username: 1,
          email: 1,
          isEmailVerified: 1,
          role: 1,
          createdAt: 1,
          lastLoginAt: 1,
          isDisabled: 1
        })
        .toArray()

      // 获取总数
      const total = await users.countDocuments(query)

      // 统计信息
      const stats = {
        total: await users.countDocuments(),
        verified: await users.countDocuments({ isEmailVerified: true }),
        unverified: await users.countDocuments({ isEmailVerified: false }),
        admins: await users.countDocuments({ role: 'admin' }),
        disabled: await users.countDocuments({ isDisabled: true })
      }

      return res.status(200).json({
        success: true,
        data: {
          users: userList,
          pagination: {
            current: pageNum,
            total: Math.ceil(total / limitNum),
            pageSize: limitNum,
            totalRecords: total
          },
          stats
        }
      })
    }

    if (req.method === 'PUT') {
      // 处理合作伙伴Logo设置
      if (req.body.action === 'update-partner-logos') {
        const { logos, enabled } = req.body
        
        // 验证数据格式
        if (enabled !== undefined && typeof enabled !== 'boolean') {
          return res.status(400).json({ message: '无效的启用状态' })
        }
        
        if (logos !== undefined) {
          if (!Array.isArray(logos)) {
            return res.status(400).json({ message: '无效的Logo数据格式' })
          }
          
          // 验证每个Logo对象
          for (const logo of logos) {
            if (!logo.url || typeof logo.url !== 'string') {
              return res.status(400).json({ message: '无效的Logo URL' })
            }
            if (!logo.name || typeof logo.name !== 'string') {
              return res.status(400).json({ message: '无效的Logo名称' })
            }
          }
        }
        
        // 更新或创建合作伙伴Logo设置
        await systemSettings.updateOne(
          { _id: 'partner_logos' },
          { 
            $set: { 
              logos: logos || [],
              enabled: enabled !== undefined ? enabled : true,
              updatedAt: new Date(),
              updatedBy: decoded.userId
            } 
          },
          { upsert: true }
        )
        
        return res.status(200).json({
          success: true,
          message: '合作伙伴Logo设置已更新'
        })
      }

      // 更新用户状态
      const { userId, action } = req.body

      if (!userId || !ObjectId.isValid(userId)) {
        return res.status(400).json({ message: '无效的用户ID' })
      }

      const targetUser = await users.findOne({ _id: new ObjectId(userId) })
      if (!targetUser) {
        return res.status(404).json({ message: '用户不存在' })
      }

      // 防止管理员操作自己
      if (targetUser._id.toString() === adminUser._id.toString()) {
        return res.status(400).json({ 
          message: '不能操作自己的账户',
          code: 'CANNOT_MODIFY_SELF'
        })
      }

      let updateData = {}
      let actionMessage = ''

      switch (action) {
        case 'disable':
          updateData = { isDisabled: true }
          actionMessage = '用户已禁用'
          break
        case 'enable':
          updateData = { isDisabled: false }
          actionMessage = '用户已启用'
          break
        case 'verify_email':
          updateData = { isEmailVerified: true }
          actionMessage = '邮箱已验证'
          break
        case 'unverify_email':
          updateData = { isEmailVerified: false }
          actionMessage = '邮箱验证已取消'
          break
        case 'make_admin':
          if (targetUser.role === 'admin') {
            return res.status(400).json({ message: '用户已经是管理员' })
          }
          updateData = { role: 'admin' }
          actionMessage = '用户已设为管理员'
          break
        case 'remove_admin':
          if (targetUser.role !== 'admin') {
            return res.status(400).json({ message: '用户不是管理员' })
          }
          updateData = { role: 'user' }
          actionMessage = '已移除管理员权限'
          break
        default:
          return res.status(400).json({ message: '无效的操作' })
      }

      // 更新用户
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      )

      // 记录管理员操作日志
      await users.updateOne(
        { _id: adminUser._id },
        {
          $push: {
            adminLogs: {
              action: 'modify_user',
              targetUserId: userId,
              targetUsername: targetUser.username,
              operation: action,
              timestamp: new Date(),
              ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
            }
          }
        }
      )

      return res.status(200).json({
        success: true,
        message: actionMessage
      })
    }

    if (req.method === 'DELETE') {
      // 删除用户
      const { userId } = req.body

      if (!userId || !ObjectId.isValid(userId)) {
        return res.status(400).json({ message: '无效的用户ID' })
      }

      const targetUser = await users.findOne({ _id: new ObjectId(userId) })
      if (!targetUser) {
        return res.status(404).json({ message: '用户不存在' })
      }

      // 防止管理员删除自己
      if (targetUser._id.toString() === adminUser._id.toString()) {
        return res.status(400).json({ 
          message: '不能删除自己的账户',
          code: 'CANNOT_DELETE_SELF'
        })
      }

      // 防止删除其他管理员
      if (targetUser.role === 'admin') {
        return res.status(400).json({ 
          message: '不能删除管理员账户',
          code: 'CANNOT_DELETE_ADMIN'
        })
      }

      // 删除用户
      await users.deleteOne({ _id: new ObjectId(userId) })

      // 记录管理员操作日志
      await users.updateOne(
        { _id: adminUser._id },
        {
          $push: {
            adminLogs: {
              action: 'delete_user',
              targetUserId: userId,
              targetUsername: targetUser.username,
              targetEmail: targetUser.email,
              timestamp: new Date(),
              ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
            }
          }
        }
      )

      return res.status(200).json({
        success: true,
        message: '用户已删除'
      })
    }

    return res.status(405).json({ message: '方法不允许' })

  } catch (error) {
    console.error('管理员用户操作错误:', error)
    res.status(500).json({ 
      message: '操作失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 