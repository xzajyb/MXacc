import clientPromise from '../_lib/mongodb.js'
import { hashPassword, generateToken } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允许' })
  }

  try {
    const { username, email, password } = req.body

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ message: '请填写所有必填字段' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密码至少需要6个字符' })
    }

    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    // 检查用户是否已存在
    const existingUser = await users.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用' 
      })
    }

    // 创建新用户
    const hashedPassword = await hashPassword(password)
    const newUser = {
      username,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      createdAt: new Date(),
      profile: {
        displayName: username,
        avatar: null
      }
    }

    const result = await users.insertOne(newUser)
    const token = generateToken(result.insertedId)

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: result.insertedId,
        username,
        email,
        isEmailVerified: false,
        profile: newUser.profile
      }
    })

  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 