const clientPromise = require('./mongodb')
const { ObjectId } = require('mongodb')

/**
 * 自动发布系统消息
 * @param {string} title - 消息标题
 * @param {string} content - 消息内容  
 * @param {string} type - 消息类型: 'info' | 'warning' | 'success' | 'error'
 * @param {string} priority - 优先级: 'low' | 'normal' | 'high' | 'urgent'
 * @param {string} authorName - 发布者名称（默认为"系统"）
 * @param {boolean} autoRead - 是否自动标记已读（默认为true）
 * @returns {Promise<Object>} 发布结果
 */
async function publishSystemMessage(title, content, type = 'info', priority = 'normal', authorName = '系统', autoRead = true) {
  try {
    console.log('📢 准备自动发布系统消息:', { title, type, priority })
    
    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const systemMessages = db.collection('system_messages')
    
    // 验证参数
    const validTypes = ['info', 'warning', 'success', 'error']
    const validPriorities = ['low', 'normal', 'high', 'urgent']
    
    if (!validTypes.includes(type)) {
      throw new Error(`无效的消息类型: ${type}`)
    }
    
    if (!validPriorities.includes(priority)) {
      throw new Error(`无效的优先级: ${priority}`)
    }
    
    if (!title || !content) {
      throw new Error('标题和内容不能为空')
    }
    
    if (title.length > 100) {
      throw new Error('标题不能超过100个字符')
    }
    
    if (content.length > 2000) {
      throw new Error('内容不能超过2000个字符')
    }
    
    // 创建系统消息
    const newMessage = {
      title: title.trim(),
      content: content.trim(),
      type,
      priority,
      autoRead, // 是否自动标记已读
      authorId: null, // 系统消息没有具体的作者ID
      authorName,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // 插入到数据库
    const result = await systemMessages.insertOne(newMessage)
    
    console.log('✅ 系统消息自动发布成功:', {
      id: result.insertedId,
      title,
      type,
      priority
    })
    
    return {
      success: true,
      messageId: result.insertedId,
      message: '系统消息发布成功'
    }
    
  } catch (error) {
    console.error('❌ 自动发布系统消息失败:', error)
    return {
      success: false,
      error: error.message,
      message: '系统消息发布失败'
    }
  }
}

/**
 * 发布用户注册欢迎消息
 * @param {string} username - 用户名
 * @param {boolean} isFirstUser - 是否为第一个用户（管理员）
 */
async function publishWelcomeMessage(username, isFirstUser = false) {
  const title = isFirstUser ? 
    `🎉 欢迎管理员 ${username} 加入！` : 
    `🎉 欢迎新用户 ${username} 加入！`
    
  const content = isFirstUser ? 
    `恭喜 ${username}！您是本系统的第一位用户，已自动获得管理员权限。感谢您选择我们的服务，请开始您的管理之旅！` :
    `欢迎 ${username} 加入我们的平台！请验证您的邮箱以享受完整的功能体验。如有任何疑问，请随时联系我们的客服团队。`
    
  return await publishSystemMessage(
    title,
    content,
    'success',
    isFirstUser ? 'high' : 'normal'
  )
}

/**
 * 发布邮箱验证成功消息
 * @param {string} username - 用户名
 */
async function publishEmailVerifiedMessage(username) {
  const title = `✅ 用户 ${username} 完成邮箱验证`
  const content = `恭喜 ${username}！您已成功验证邮箱地址，现在可以使用所有功能了。感谢您的配合，祝您使用愉快！`
  
  return await publishSystemMessage(
    title,
    content,
    'success',
    'normal'
  )
}

/**
 * 发布系统维护消息
 * @param {string} title - 维护标题
 * @param {string} content - 维护内容
 * @param {string} priority - 优先级
 */
async function publishMaintenanceMessage(title, content, priority = 'high') {
  return await publishSystemMessage(
    title,
    content,
    'warning',
    priority
  )
}

/**
 * 发布安全警报消息
 * @param {string} title - 警报标题
 * @param {string} content - 警报内容
 * @param {string} priority - 优先级
 */
async function publishSecurityAlert(title, content, priority = 'urgent') {
  return await publishSystemMessage(
    title,
    content,
    'error',
    priority
  )
}

module.exports = {
  publishSystemMessage,
  publishWelcomeMessage,
  publishEmailVerifiedMessage,
  publishMaintenanceMessage,
  publishSecurityAlert
} 