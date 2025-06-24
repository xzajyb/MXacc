import { connectToDatabase } from '../_lib/mongodb.js'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  // 启用CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // 验证JWT token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供有效的认证token' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key')
    const userId = decoded.userId

    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    if (req.method === 'GET') {
      // 获取用户设置
      const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { settings: 1 } }
      )

      if (!user) {
        return res.status(404).json({ message: '用户不存在' })
      }

      // 返回默认设置或用户自定义设置
      const defaultSettings = {
        theme: 'system',
        notifications: {
          email: true,
          browser: true,
          security: true,
          marketing: false
        },
        privacy: {
          profileVisible: true,
          activityVisible: false,
          allowDataCollection: true
        },
        language: 'zh-CN',
        timezone: 'Asia/Shanghai'
      }

      return res.status(200).json({
        success: true,
        settings: user.settings || defaultSettings
      })

    } else if (req.method === 'PUT') {
      // 更新用户设置
      const { settings } = req.body

      if (!settings) {
        return res.status(400).json({ message: '设置数据不能为空' })
      }

      // 验证设置数据结构
      const allowedThemes = ['light', 'dark', 'system']
      if (settings.theme && !allowedThemes.includes(settings.theme)) {
        return res.status(400).json({ message: '无效的主题设置' })
      }

      // 更新用户设置
      const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            settings: settings,
            updatedAt: new Date()
          }
        }
      )

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: '用户不存在' })
      }

      return res.status(200).json({
        success: true,
        message: '设置保存成功'
      })

    } else {
      res.setHeader('Allow', ['GET', 'PUT'])
      return res.status(405).json({ message: '不支持的请求方法' })
    }

  } catch (error) {
    console.error('用户设置API错误:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的认证token' })
    }
    
    return res.status(500).json({ 
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 