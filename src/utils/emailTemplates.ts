// 邮件模板数据接口
export interface EmailTemplateData {
  title: string
  content: string
  actionUrl: string
  actionText: string
  recipientName: string
  companyName: string
  contactEmail: string
  websiteUrl: string
  date: string
  additionalInfo: string
  urgencyLevel: 'normal' | 'high' | 'urgent'
}

// 预定义模板列表
export const emailTemplates = [
  {
    id: 'system_notification',
    name: '系统通知',
    subject: '系统通知 - 梦锡工作室',
    description: '适用于系统升级、功能更新等一般性通知'
  },
  {
    id: 'security_alert',
    name: '安全警报',
    subject: '重要安全提醒 - 梦锡工作室',
    description: '适用于安全问题、异常登录等安全相关通知'
  },
  {
    id: 'welcome',
    name: '欢迎邮件',
    subject: '欢迎加入梦锡工作室！',
    description: '适用于新用户注册、账户激活等欢迎场景'
  },
  {
    id: 'maintenance',
    name: '维护通知',
    subject: '系统维护通知 - 梦锡工作室',
    description: '适用于系统维护、服务暂停等维护相关通知'
  },
  {
    id: 'custom',
    name: '自定义模板',
    subject: '来自梦锡工作室的消息',
    description: '灵活的自定义模板，适用于各种场景'
  }
]

// 获取模板预览HTML
export const getTemplatePreview = (templateId: string, data: Partial<EmailTemplateData>) => {
  // 确保数据有默认值
  const safeData = {
    title: data.title || '点击右侧输入邮件标题...',
    content: data.content || '点击右侧输入邮件内容...',
    actionUrl: data.actionUrl || '',
    actionText: data.actionText || '立即查看',
    recipientName: data.recipientName || '尊敬的用户',
    companyName: data.companyName || '梦锡工作室',
    contactEmail: data.contactEmail || 'support@mxstudio.com',
    websiteUrl: data.websiteUrl || 'https://mxstudio.com',
    date: data.date || new Date().toLocaleDateString('zh-CN'),
    additionalInfo: data.additionalInfo || '',
    urgencyLevel: data.urgencyLevel || 'normal'
  }

  const templateMap: { [key: string]: string } = {
    'system_notification': `
      <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 30px; text-align: center;">
          <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">${safeData.companyName}</div>
          <div style="color: rgba(255,255,255,0.9); font-size: 16px;">系统通知</div>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px;">亲爱的 ${safeData.recipientName}，</p>
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px; ${!data.title ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.title}</h1>
          <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 6px 6px 0;">
            <p style="color: #4b5563; line-height: 1.6; margin: 0; ${!data.content ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.content}</p>
          </div>
          ${safeData.additionalInfo ? `<div style="background: #fffbeb; border: 1px solid #fed7aa; padding: 15px; border-radius: 6px; margin: 20px 0;"><p style="color: #92400e; margin: 0; font-size: 14px;"><strong>补充信息：</strong> ${safeData.additionalInfo}</p></div>` : ''}
          ${safeData.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${safeData.actionUrl}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">${safeData.actionText}</a></div>` : ''}
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
              如有任何疑问，请联系我们的技术支持团队：<br>
              [邮箱] ${safeData.contactEmail}<br>
              [网站] ${safeData.websiteUrl}
            </p>
          </div>
        </div>
        <div style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">此邮件由 ${safeData.companyName} 系统自动发送 | 发送时间：${safeData.date}</p>
          <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">请勿直接回复此邮件，如需帮助请通过官方渠道联系我们</p>
        </div>
      </div>
    `,
    'security_alert': `
      <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 40px 30px; text-align: center;">
          <div style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px;">[安全] 安全警报</div>
          <div style="color: rgba(255,255,255,0.9); font-size: 16px;">${safeData.companyName} 安全中心</div>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px;">亲爱的 ${safeData.recipientName}，</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <span style="color: #dc2626; font-size: 18px; margin-right: 8px;">⚠️</span>
              <h2 style="color: #dc2626; font-size: 16px; font-weight: 600; margin: 0;">
                ${safeData.urgencyLevel === 'urgent' ? '紧急安全警报' : safeData.urgencyLevel === 'high' ? '高级安全警报' : '安全提醒'}
              </h2>
            </div>
            <h1 style="color: #991b1b; font-size: 22px; margin-bottom: 15px; ${!data.title ? 'color: #fca5a5; font-style: italic;' : ''}">${safeData.title}</h1>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #4b5563; line-height: 1.6; margin: 0; ${!data.content ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.content}</p>
          </div>
          ${safeData.additionalInfo ? `<div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 6px 6px 0; margin: 20px 0;"><p style="color: #92400e; margin: 0; font-size: 14px;"><strong>重要提示：</strong> ${safeData.additionalInfo}</p></div>` : ''}
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #047857; font-size: 16px; margin: 0 0 10px 0;">🔒 建议采取的安全措施：</h3>
            <ul style="color: #065f46; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>立即更改您的账户密码</li>
              <li>检查账户的登录历史记录</li>
              <li>启用双重身份验证（如未启用）</li>
              <li>检查账户绑定的邮箱和手机号</li>
            </ul>
          </div>
          ${safeData.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${safeData.actionUrl}" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);">${safeData.actionText}</a></div>` : ''}
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
              <strong>紧急联系方式：</strong><br>
              📧 安全邮箱：<a href="mailto:${safeData.contactEmail}" style="color: #dc2626; text-decoration: none;">${safeData.contactEmail}</a><br>
              🌐 安全中心：<a href="${safeData.websiteUrl}/security" style="color: #dc2626; text-decoration: none;">${safeData.websiteUrl}/security</a>
            </p>
          </div>
        </div>
        <div style="background: #fef2f2; padding: 25px 30px; text-align: center; border-top: 1px solid #fecaca;">
          <p style="color: #7f1d1d; font-size: 12px; margin: 0;">此安全警报由 ${safeData.companyName} 安全系统发送 | ${safeData.date}</p>
          <p style="color: #991b1b; font-size: 11px; margin: 8px 0 0 0;">如果您未进行相关操作，请立即联系我们的安全团队</p>
        </div>
      </div>
    `,
    'welcome': `
      <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #059669, #047857); padding: 40px 30px; text-align: center;">
          <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">[欢迎] 欢迎加入我们！</div>
          <div style="color: rgba(255,255,255,0.9); font-size: 16px;">${safeData.companyName}</div>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">亲爱的 ${safeData.recipientName}，</p>
          <h1 style="color: #047857; font-size: 24px; margin-bottom: 20px; ${!data.title ? 'color: #a7f3d0; font-style: italic;' : ''}">${safeData.title}</h1>
          <div style="background: #f0fdfa; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 6px 6px 0;">
            <p style="color: #065f46; line-height: 1.6; margin: 0; ${!data.content ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.content}</p>
          </div>
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">[指南] 快速开始指南：</h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; align-items: center; padding: 10px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                <span style="color: #10b981; font-size: 18px; margin-right: 12px;">✓</span>
                <span style="color: #374151; font-size: 14px;">完善您的个人资料信息</span>
              </div>
              <div style="display: flex; align-items: center; padding: 10px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                <span style="color: #10b981; font-size: 18px; margin-right: 12px;">✓</span>
                <span style="color: #374151; font-size: 14px;">验证您的邮箱地址</span>
              </div>
              <div style="display: flex; align-items: center; padding: 10px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                <span style="color: #10b981; font-size: 18px; margin-right: 12px;">✓</span>
                <span style="color: #374151; font-size: 14px;">设置安全的密码和双重验证</span>
              </div>
              <div style="display: flex; align-items: center; padding: 10px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                <span style="color: #10b981; font-size: 18px; margin-right: 12px;">✓</span>
                <span style="color: #374151; font-size: 14px;">探索我们的功能和服务</span>
              </div>
            </div>
          </div>
          ${safeData.additionalInfo ? `<div style="background: #fffbeb; border: 1px solid #fed7aa; padding: 15px; border-radius: 6px; margin: 20px 0;"><p style="color: #92400e; margin: 0; font-size: 14px;"><strong>特别提醒：</strong> ${safeData.additionalInfo}</p></div>` : ''}
          ${safeData.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${safeData.actionUrl}" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3);">${safeData.actionText}</a></div>` : ''}
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
              需要帮助？我们随时为您服务：<br>
              [邮箱] 客服邮箱：${safeData.contactEmail}<br>
              [帮助] 帮助中心：${safeData.websiteUrl}/help<br>
              [指南] 用户指南：${safeData.websiteUrl}/guide
            </p>
          </div>
        </div>
        <div style="background: #f0fdfa; padding: 25px 30px; text-align: center; border-top: 1px solid #a7f3d0;">
          <p style="color: #065f46; font-size: 12px; margin: 0;">欢迎邮件来自 ${safeData.companyName} | 注册时间：${safeData.date}</p>
          <p style="color: #047857; font-size: 11px; margin: 8px 0 0 0;">感谢您选择我们，期待与您一起创造美好的体验！</p>
        </div>
      </div>
    `,
    'maintenance': `
      <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 30px; text-align: center;">
          <div style="color: white; font-size: 40px; margin-bottom: 15px;">🔧</div>
          <div style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px;">系统维护通知</div>
          <div style="color: rgba(255,255,255,0.9); font-size: 16px;">${safeData.companyName} 技术团队</div>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px;">亲爱的 ${safeData.recipientName}，</p>
          <h1 style="color: #d97706; font-size: 24px; margin-bottom: 20px; ${!data.title ? 'color: #fcd34d; font-style: italic;' : ''}">${safeData.title}</h1>
          <div style="background: #fffbeb; border: 1px solid #fed7aa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <span style="color: #f59e0b; font-size: 18px; margin-right: 8px;">ℹ️</span>
              <h3 style="color: #92400e; font-size: 16px; margin: 0;">维护详情</h3>
            </div>
            <p style="color: #92400e; line-height: 1.6; margin: 0; ${!data.content ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.content}</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">⏰ 维护安排：</h3>
            <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="color: #374151; margin: 0; line-height: 1.6;">
                <strong>维护时间：</strong> ${safeData.date}<br>
                <strong>预计时长：</strong> ${safeData.additionalInfo || '2-4小时'}<br>
                <strong>影响范围：</strong> 所有在线服务可能暂时不可用
              </p>
            </div>
          </div>
          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; font-size: 16px; margin: 0 0 10px 0;">📋 维护期间注意事项：</h3>
            <ul style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>请提前保存您的工作进度</li>
              <li>避免在维护期间进行重要操作</li>
              <li>维护完成后请刷新页面</li>
              <li>如遇问题请联系技术支持</li>
            </ul>
          </div>
          ${safeData.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${safeData.actionUrl}" style="background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">${safeData.actionText}</a></div>` : ''}
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
              维护期间如需紧急支持：<br>
              📧 技术支持：<a href="mailto:${safeData.contactEmail}" style="color: #f59e0b; text-decoration: none;">${safeData.contactEmail}</a><br>
              🌐 状态页面：<a href="${safeData.websiteUrl}/status" style="color: #f59e0b; text-decoration: none;">${safeData.websiteUrl}/status</a>
            </p>
          </div>
        </div>
        <div style="background: #fffbeb; padding: 25px 30px; text-align: center; border-top: 1px solid #fed7aa;">
          <p style="color: #92400e; font-size: 12px; margin: 0;">维护通知来自 ${safeData.companyName} 技术团队 | 发送时间：${safeData.date}</p>
          <p style="color: #78350f; font-size: 11px; margin: 8px 0 0 0;">感谢您的理解与配合，我们会尽快完成维护工作</p>
        </div>
      </div>
    `,
    'custom': `
      <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 30px; text-align: center;">
          <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">${safeData.companyName}</div>
          <div style="color: rgba(255,255,255,0.9); font-size: 16px;">自定义邮件</div>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px;">亲爱的 ${safeData.recipientName}，</p>
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px; ${!data.title ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.title}</h1>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #4b5563; line-height: 1.6; margin: 0; ${!data.content ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.content}</p>
          </div>
          ${safeData.additionalInfo ? `<div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 6px 6px 0; margin: 20px 0;"><p style="color: #92400e; margin: 0; font-size: 14px;"><strong>补充说明：</strong> ${safeData.additionalInfo}</p></div>` : ''}
          ${safeData.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${safeData.actionUrl}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">${safeData.actionText}</a></div>` : ''}
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
              如有任何疑问，请联系我们：<br>
              📧 邮箱：<a href="mailto:${safeData.contactEmail}" style="color: #3b82f6; text-decoration: none;">${safeData.contactEmail}</a><br>
              🌐 网站：<a href="${safeData.websiteUrl}" style="color: #3b82f6; text-decoration: none;">${safeData.websiteUrl}</a>
            </p>
          </div>
        </div>
        <div style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">此邮件由 ${safeData.companyName} 发送 | 发送时间：${safeData.date}</p>
          <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">这是一封自动生成的邮件，请勿直接回复</p>
        </div>
      </div>
    `
  }
  return templateMap[templateId] || templateMap['custom']
} 