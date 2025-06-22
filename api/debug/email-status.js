// 邮箱服务状态检测API
// 用于调试LuckyCola邮件API配置和连接状态

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' })
  }

  try {
    const status = {
      timestamp: new Date().toISOString(),
      environment: 'vercel',
      emailService: 'LuckyCola API',
      configuration: {},
      connectivity: {},
      errors: []
    }

    // 检查环境变量配置
    console.log('检查环境变量配置...')
    
    const requiredEnvVars = [
      'LUCKYCOLA_API_KEY',
      'LUCKYCOLA_SMTP_EMAIL', 
      'LUCKYCOLA_SMTP_CODE',
      'LUCKYCOLA_SMTP_TYPE'
    ]

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar]
      if (value) {
        status.configuration[envVar] = {
          configured: true,
          length: value.length,
          preview: envVar.includes('CODE') || envVar.includes('KEY') 
            ? '***隐藏***' 
            : value.substring(0, 3) + '***'
        }
      } else {
        status.configuration[envVar] = {
          configured: false,
          error: '环境变量未设置'
        }
        status.errors.push(`缺少环境变量: ${envVar}`)
      }
    }

    // 测试LuckyCola API连通性
    console.log('测试LuckyCola API连通性...')
    
    try {
      const apiUrl = 'https://luckycola.com.cn/tools/customMail'
      
      // 发送测试请求（使用无效数据测试连通性）
      const testResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MXacc-Debug/1.0'
        },
        body: JSON.stringify({
          ColaKey: 'test',
          tomail: 'test@test.com',
          fromTitle: 'Test',
          subject: 'Test',
          content: 'Test',
          isTextContent: true,
          smtpCode: 'test',
          smtpEmail: 'test@test.com',
          smtpCodeType: 'qq'
        }),
        // 设置5秒超时
        signal: AbortSignal.timeout(5000)
      })

      status.connectivity.apiUrl = apiUrl
      status.connectivity.responseStatus = testResponse.status
      status.connectivity.accessible = true
      
      const responseText = await testResponse.text()
      status.connectivity.responsePreview = responseText.substring(0, 200)
      
    } catch (connectError) {
      status.connectivity.accessible = false
      status.connectivity.error = connectError.message
      status.errors.push(`API连通性测试失败: ${connectError.message}`)
    }

    // 测试邮件发送功能已关闭
    // 仅提供配置状态检查，不允许直接发送测试邮件
    if (req.query.sendTest === 'true') {
      status.testEmail = {
        sent: false,
        error: '测试邮件发送功能已关闭，仅允许通过邮箱验证流程发送邮件',
        message: '如需测试邮件功能，请通过正常的邮箱验证流程'
      }
    }

    // 返回状态报告
    const responseStatus = status.errors.length > 0 ? 500 : 200
    
    res.status(responseStatus).json({
      success: status.errors.length === 0,
      message: status.errors.length === 0 ? '邮箱服务状态正常' : '发现配置问题',
      status,
      recommendations: generateRecommendations(status),
      debugInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    })

  } catch (error) {
    console.error('邮箱状态检测失败:', error)
    
    res.status(500).json({
      success: false,
      message: '邮箱状态检测失败',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// 生成修复建议
function generateRecommendations(status) {
  const recommendations = []

  // 检查环境变量
  Object.entries(status.configuration).forEach(([key, config]) => {
    if (!config.configured) {
      recommendations.push({
        type: 'configuration',
        priority: 'high',
        message: `请在Vercel项目设置中添加环境变量: ${key}`,
        action: `前往 Vercel Dashboard → 项目设置 → Environment Variables 添加 ${key}`
      })
    }
  })

  // 检查API连通性
  if (!status.connectivity.accessible) {
    recommendations.push({
      type: 'connectivity',
      priority: 'high', 
      message: 'LuckyCola API连接失败，请检查网络或API状态',
      action: '检查 https://luckycola.com.cn 是否可访问，或联系API提供商'
    })
  }

  // 检查ColaKey
  const colaKeyConfig = status.configuration.LUCKYCOLA_API_KEY
  if (colaKeyConfig && colaKeyConfig.configured && colaKeyConfig.length < 20) {
    recommendations.push({
      type: 'configuration',
      priority: 'medium',
      message: 'ColaKey长度似乎不正确，请检查是否完整',
      action: '重新从 https://luckycola.com.cn 获取完整的ColaKey'
    })
  }

  // 通用建议
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'general',
      priority: 'low',
      message: '配置看起来正常，邮件发送将仅通过邮箱验证流程进行',
      action: '如需测试，请通过注册新用户或重新发送验证邮件的方式'
    })
  }

  return recommendations
} 