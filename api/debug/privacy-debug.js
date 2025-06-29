const clientPromise = require('../_lib/mongodb')
const { verifyToken } = require('../_lib/auth')
const { ObjectId } = require('mongodb')

// 获取用户信息
async function getUserById(users, userId) {
  return await users.findOne(
    { _id: new ObjectId(userId) },
    { 
      projection: { 
        username: 1, 
        email: 1, 
        'profile.nickname': 1,
        'profile.avatar': 1,
        role: 1,
        isEmailVerified: 1,
        settings: 1,  // 获取完整的settings
        createdAt: 1,
        updatedAt: 1
      } 
    }
  )
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
    console.log('=== Privacy Debug API ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)

    // 验证用户身份
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '需要登录' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Token无效' })
    }

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')

    if (req.method === 'GET') {
      const { action, targetUserId } = req.query
      
      if (action === 'check-user-data') {
        const userIdToCheck = targetUserId || decoded.userId
        
        // 获取用户完整数据
        const user = await getUserById(users, userIdToCheck)
        
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: '用户不存在' 
          })
        }

        // 模拟隐私检查逻辑
        const isOwnProfile = user._id.toString() === decoded.userId
        const privacySettings = user.settings?.privacy
        
        // 详细的隐私检查结果
        const privacyChecks = {
          profileVisible: {
            rawValue: privacySettings?.profileVisible,
            checkResult: privacySettings?.profileVisible !== false,
            explanation: `profileVisible = ${privacySettings?.profileVisible}, !== false = ${privacySettings?.profileVisible !== false}`
          },
          showFollowers: {
            rawValue: privacySettings?.showFollowers,
            checkResult: privacySettings?.showFollowers !== false,
            explanation: `showFollowers = ${privacySettings?.showFollowers}, !== false = ${privacySettings?.showFollowers !== false}`
          },
          showFollowing: {
            rawValue: privacySettings?.showFollowing,
            checkResult: privacySettings?.showFollowing !== false,
            explanation: `showFollowing = ${privacySettings?.showFollowing}, !== false = ${privacySettings?.showFollowing !== false}`
          }
        }

        // 权限检查结果
        const accessChecks = {
          canViewProfile: isOwnProfile || privacyChecks.profileVisible.checkResult,
          canViewFollowers: isOwnProfile || privacyChecks.showFollowers.checkResult,
          canViewFollowing: isOwnProfile || privacyChecks.showFollowing.checkResult
        }

        return res.status(200).json({
          success: true,
          data: {
            userId: user._id,
            username: user.username,
            email: user.email,
            isOwnProfile: isOwnProfile,
            currentUserId: decoded.userId,
            
            // 完整的设置数据
            fullSettings: user.settings,
            
            // 隐私设置详情
            privacySettings: privacySettings,
            
            // 详细的检查结果
            privacyChecks: privacyChecks,
            
            // 最终权限结果
            accessChecks: accessChecks,
            
            // 元数据
            metadata: {
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              hasSettings: !!user.settings,
              hasPrivacySettings: !!privacySettings,
              settingsKeys: user.settings ? Object.keys(user.settings) : [],
              privacyKeys: privacySettings ? Object.keys(privacySettings) : []
            }
          }
        })
      }

      if (action === 'test-api-calls') {
        const userIdToTest = targetUserId || decoded.userId
        
        // 测试各个API的隐私检查
        const testResults = {
          timestamp: new Date().toISOString(),
          testUserId: userIdToTest,
          currentUserId: decoded.userId,
          tests: {}
        }

        try {
          // 测试用户资料API
          const userProfileTest = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/social/messaging?action=user-profile&userId=${userIdToTest}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => null)

          if (userProfileTest) {
            testResults.tests.userProfile = {
              status: userProfileTest.status,
              success: userProfileTest.ok,
              url: userProfileTest.url
            }
          }

          // 测试粉丝列表API
          const followersTest = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/social/messaging?action=followers&userId=${userIdToTest}&page=1&limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => null)

          if (followersTest) {
            testResults.tests.followers = {
              status: followersTest.status,
              success: followersTest.ok,
              url: followersTest.url
            }
          }

          // 测试关注列表API
          const followingTest = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/social/messaging?action=following&userId=${userIdToTest}&page=1&limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => null)

          if (followingTest) {
            testResults.tests.following = {
              status: followingTest.status,
              success: followingTest.ok,
              url: followingTest.url
            }
          }

        } catch (error) {
          testResults.error = error.message
        }

        return res.status(200).json({
          success: true,
          data: testResults
        })
      }

      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      })
    }

    if (req.method === 'POST') {
      const { action, testSettings } = req.body

      if (action === 'simulate-privacy-check') {
        // 模拟隐私检查，不实际修改数据
        const user = await getUserById(users, decoded.userId)
        
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: '用户不存在' 
          })
        }

        // 使用测试设置进行模拟
        const simulatedPrivacy = testSettings || user.settings?.privacy || {}
        
        const simulationResults = {
          originalSettings: user.settings?.privacy,
          testSettings: simulatedPrivacy,
          checks: {
            profileVisible: {
              value: simulatedPrivacy.profileVisible,
              result: simulatedPrivacy.profileVisible !== false,
              wouldAllow: simulatedPrivacy.profileVisible !== false
            },
            showFollowers: {
              value: simulatedPrivacy.showFollowers,
              result: simulatedPrivacy.showFollowers !== false,
              wouldAllow: simulatedPrivacy.showFollowers !== false
            },
            showFollowing: {
              value: simulatedPrivacy.showFollowing,
              result: simulatedPrivacy.showFollowing !== false,
              wouldAllow: simulatedPrivacy.showFollowing !== false
            }
          }
        }

        return res.status(200).json({
          success: true,
          data: simulationResults
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
    console.error('Privacy Debug API Error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
} 