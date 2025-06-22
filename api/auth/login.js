const clientPromise = require('../_lib/mongodb')
const { comparePassword, generateToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允许' })
  }

  try {
    const { email, password } = req.body

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ message: '请填写邮箱和密码' })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    // 查找用户
    const user = await users.findOne({
      $or: [{ email }, { username: email }]
    })

    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' })
    }

    // 验证密码
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: '邮箱或密码错误' })
    }

    // 更新最后登录时间
    await users.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    )

    // 生成token
    const token = generateToken(user._id)

    res.status(200).json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        profile: user.profile || { displayName: user.username, avatar: null }
      }
    })

  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 