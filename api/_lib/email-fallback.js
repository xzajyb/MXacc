// 邮件发送Fallback服务
// 当统一邮件服务失败时使用直接发送

const { sendVerificationEmail, sendWelcomeEmail } = require('./luckycola-email')

// 确保fetch可用（Node.js 18+原生支持，旧版本需要polyfill）
const fetch = globalThis.fetch || require('node-fetch')

// Fallback邮件发送函数
async function sendEmailWithFallback(type, to, data) {
  console.log(`📧 尝试使用统一邮件服务发送: ${type} -> ${to}`)
  
  try {
    // 首先尝试统一邮件服务
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   process.env.BASE_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/services/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        to,
        data
      })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ 统一邮件服务发送成功')
      return { success: true, method: 'service', code: result.code }
    } else {
      throw new Error(result.message || '邮件服务调用失败')
    }
    
  } catch (serviceError) {
    console.warn('⚠️ 统一邮件服务失败，使用直接发送:', serviceError.message)
    
    try {
      // Fallback到直接发送
      let result
      
      switch (type) {
        case 'verification':
          result = await sendVerificationEmail(to, data.code, data.username)
          break
          
        case 'welcome':
          result = await sendWelcomeEmail(to, data.username)
          break
          
        case 'password_reset':
          // 需要导入密码重置邮件函数
          console.warn('❌ 密码重置邮件直接发送暂不支持，请使用统一邮件服务')
          throw new Error('密码重置邮件需要统一邮件服务')
          
        case 'password_reset_notification':
        case 'password_change_notification':
          console.warn('❌ 安全通知邮件直接发送暂不支持，请使用统一邮件服务')
          throw new Error('安全通知邮件需要统一邮件服务')
          
        default:
          throw new Error(`不支持的邮件类型: ${type}`)
      }
      
      console.log('✅ 直接邮件发送成功')
      return { success: true, method: 'direct', result }
      
    } catch (directError) {
      console.error('❌ 直接邮件发送也失败:', directError.message)
      throw new Error(`邮件发送完全失败: 服务失败(${serviceError.message}), 直接发送失败(${directError.message})`)
    }
  }
}

module.exports = {
  sendEmailWithFallback
} 