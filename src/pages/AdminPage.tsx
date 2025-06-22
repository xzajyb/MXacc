import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Shield, Mail, Users, Send, AlertTriangle, CheckCircle, XCircle, Loader, Menu, X } from 'lucide-react'
import axios from 'axios'

interface User {
  _id: string
  username: string
  email: string
  isEmailVerified: boolean
  role: string
  createdAt: string
  lastLoginAt?: string
  isDisabled?: boolean
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
}

interface UserStats {
  total: number
  verified: number
  unverified: number
  admins: number
  disabled: number
}

const AdminPage: React.FC = () => {
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState<'email' | 'users'>('email')
  
  // 邮件相关状态
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [recipients, setRecipients] = useState<'all' | 'selected' | 'email'>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [customEmails, setCustomEmails] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailData, setEmailData] = useState({
    title: '',
    content: '',
    actionUrl: '',
    actionText: ''
  })
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailResults, setEmailResults] = useState<any>(null)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)

  // 用户管理相关状态
  const [users, setUsers] = useState<User[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    verified: 0,
    unverified: 0,
    admins: 0,
    disabled: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerified, setFilterVerified] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // 检查管理员权限
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">访问被拒绝</h1>
          <p className="text-gray-600 dark:text-gray-400">您需要管理员权限才能访问此页面</p>
        </div>
      </div>
    )
  }

  // 加载邮件模板
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await axios.get('/api/admin/send-email', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setTemplates(response.data.templates)
      } catch (error) {
        console.error('加载邮件模板失败:', error)
      }
    }
    if (token) {
      loadTemplates()
    }
  }, [token])

  // 加载用户列表
  const loadUsers = async () => {
    if (!token) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        verified: filterVerified,
        role: filterRole
      })

      const response = await axios.get(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setUsers(response.data.data.users)
      setUserStats(response.data.data.stats)
    } catch (error) {
      console.error('加载用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'users' && token) {
      loadUsers()
    }
  }, [activeTab, currentPage, token])

  // 搜索用户
  const handleSearch = () => {
    setCurrentPage(1)
    loadUsers()
  }

  // 发送邮件
  const handleSendEmail = async () => {
    if (!selectedTemplate) {
      alert('请选择邮件模板')
      return
    }

    if (recipients === 'selected' && selectedUsers.length === 0) {
      alert('请选择收件人')
      return
    }

    if (recipients === 'email' && !customEmails.trim()) {
      alert('请输入邮箱地址')
      return
    }

    setSendingEmail(true)
    setEmailResults(null)

    try {
      const payload: any = {
        recipients,
        template: selectedTemplate,
        subject: emailSubject,
        data: emailData
      }

      if (recipients === 'selected') {
        payload.userIds = selectedUsers
      } else if (recipients === 'email') {
        payload.customEmails = customEmails.split('\n').filter(email => email.trim())
      }

      const response = await axios.post('/api/admin/send-email', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setEmailResults(response.data.results)
      alert(response.data.message)
    } catch (error: any) {
      console.error('发送邮件失败:', error)
      alert(error.response?.data?.message || '发送邮件失败')
    } finally {
      setSendingEmail(false)
    }
  }

  // 用户操作
  const handleUserAction = async (userId: string, action: string) => {
    try {
      await axios.put('/api/admin/users', {
        userId,
        action
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      alert('操作成功')
      loadUsers()
    } catch (error: any) {
      console.error('用户操作失败:', error)
      alert(error.response?.data?.message || '操作失败')
    }
  }

  // 获取模板预览HTML
  const getTemplatePreview = (templateId: string, data: any) => {
    // 确保数据有默认值
    const safeData = {
      title: data.title || '点击左侧输入邮件标题...',
      content: data.content || '点击左侧输入邮件内容...',
      actionUrl: data.actionUrl || '',
      actionText: data.actionText || '点击这里'
    }

    const templateMap: { [key: string]: string } = {
      'system_notification': `
        <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 30px; text-align: center;">
            <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">MXacc</div>
            <div style="color: rgba(255,255,255,0.9); font-size: 16px;">梦锡工作室</div>
          </div>
          <div style="padding: 40px 30px;">
            <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px; ${!data.title ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.title}</h1>
            <p style="color: #4b5563; line-height: 1.6; margin: 20px 0; ${!data.content ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.content}</p>
            ${safeData.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${safeData.actionUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${safeData.actionText}</a></div>` : '<div style="text-align: center; margin: 30px 0; color: #9ca3af; font-style: italic;">[按钮链接为空时不显示]</div>'}
          </div>
          <div style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">此邮件由梦锡工作室系统自动发送</p>
          </div>
        </div>
      `,
      'security_alert': `
        <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 40px 30px; text-align: center;">
            <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">🚨 安全提醒</div>
            <div style="color: rgba(255,255,255,0.9); font-size: 16px;">梦锡工作室安全中心</div>
          </div>
          <div style="padding: 40px 30px;">
            <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 20px; ${!data.title ? 'color: #fca5a5; font-style: italic;' : ''}">${safeData.title}</h1>
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="color: #991b1b; margin: 0; font-weight: 500;">重要提醒</p>
            </div>
            <p style="color: #4b5563; line-height: 1.6; margin: 20px 0; ${!data.content ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.content}</p>
            ${safeData.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${safeData.actionUrl}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${safeData.actionText}</a></div>` : '<div style="text-align: center; margin: 30px 0; color: #9ca3af; font-style: italic;">[按钮链接为空时不显示]</div>'}
          </div>
        </div>
      `,
      'welcome': `
        <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #059669, #047857); padding: 40px 30px; text-align: center;">
            <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">🎉 欢迎加入</div>
            <div style="color: rgba(255,255,255,0.9); font-size: 16px;">梦锡工作室</div>
          </div>
          <div style="padding: 40px 30px;">
            <h1 style="color: #047857; font-size: 24px; margin-bottom: 20px; ${!data.title ? 'color: #a7f3d0; font-style: italic;' : ''}">${safeData.title}</h1>
            <p style="color: #4b5563; line-height: 1.6; margin: 20px 0; ${!data.content ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.content}</p>
            ${safeData.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${safeData.actionUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${safeData.actionText}</a></div>` : '<div style="text-align: center; margin: 30px 0; color: #9ca3af; font-style: italic;">[按钮链接为空时不显示]</div>'}
          </div>
        </div>
      `,
      'custom': `
        <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 30px; text-align: center;">
            <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">MXacc</div>
            <div style="color: rgba(255,255,255,0.9); font-size: 16px;">梦锡工作室</div>
          </div>
          <div style="padding: 40px 30px;">
            <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px; ${!data.title ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.title}</h1>
            <p style="color: #4b5563; line-height: 1.6; margin: 20px 0; ${!data.content ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.content}</p>
            ${safeData.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${safeData.actionUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${safeData.actionText}</a></div>` : '<div style="text-align: center; margin: 30px 0; color: #9ca3af; font-style: italic;">[按钮链接为空时不显示]</div>'}
          </div>
          <div style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">此邮件由梦锡工作室发送</p>
          </div>
        </div>
      `
    }
    return templateMap[templateId] || templateMap['custom']
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              管理员控制台
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">系统管理和邮件发送功能</p>
          </div>

          {/* 选项卡导航 */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('email')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'email'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Mail className="h-5 w-5 inline mr-2" />
                  邮件发送
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'users'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Users className="h-5 w-5 inline mr-2" />
                  用户管理
                </button>
              </nav>
            </div>
          </div>

          {/* 主内容 */}
          <div className="overflow-auto">
            {/* 邮件发送内容 */}
            {activeTab === 'email' && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">发送邮件</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 左侧：邮件配置 */}
                    <div className="space-y-6">
                      {/* 选择模板 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          邮件模板
                        </label>
                        <select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">请选择邮件模板</option>
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name} - {template.subject}
                            </option>
                          ))}
                        </select>
                        {selectedTemplate && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-md">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-blue-700">
                                已选择：{templates.find(t => t.id === selectedTemplate)?.name}
                              </p>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => setShowTemplatePreview(true)}
                                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  预览模板
                                </button>
                              </div>
                            </div>
                            
                            {/* 实时预览区域 */}
                            <div className="mt-4 border border-blue-200 rounded-lg overflow-hidden">
                              <div className="bg-blue-100 px-3 py-2 text-sm font-medium text-blue-800">
                                实时预览（输入内容会实时更新）
                              </div>
                              <div className="p-4 bg-white max-h-96 overflow-y-auto">
                                <div 
                                  className="text-sm"
                                  dangerouslySetInnerHTML={{
                                    __html: getTemplatePreview(selectedTemplate, emailData)
                                  }} 
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 自定义主题 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          自定义主题（可选）
                        </label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="留空使用默认主题"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* 选择收件人 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          收件人
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="recipients"
                              value="all"
                              checked={recipients === 'all'}
                              onChange={(e) => setRecipients(e.target.value as any)}
                              className="mr-2"
                            />
                            发送给所有已验证用户
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="recipients"
                              value="selected"
                              checked={recipients === 'selected'}
                              onChange={(e) => setRecipients(e.target.value as any)}
                              className="mr-2"
                            />
                            发送给选中用户
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="recipients"
                              value="email"
                              checked={recipients === 'email'}
                              onChange={(e) => setRecipients(e.target.value as any)}
                              className="mr-2"
                            />
                            发送给指定邮箱
                          </label>
                        </div>
                      </div>

                      {/* 自定义邮箱输入 */}
                      {recipients === 'email' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            邮箱地址（每行一个）
                          </label>
                          <textarea
                            value={customEmails}
                            onChange={(e) => setCustomEmails(e.target.value)}
                            placeholder="example1@email.com&#10;example2@email.com"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* 右侧：邮件内容 */}
                    <div className="space-y-6">
                      {/* 邮件数据 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          邮件标题（用于自定义模板）
                        </label>
                        <input
                          type="text"
                          value={emailData.title}
                          onChange={(e) => setEmailData({...emailData, title: e.target.value})}
                          placeholder="邮件标题"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          邮件内容
                        </label>
                        <textarea
                          value={emailData.content}
                          onChange={(e) => setEmailData({...emailData, content: e.target.value})}
                          placeholder="邮件正文内容"
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          按钮链接（可选）
                        </label>
                        <input
                          type="url"
                          value={emailData.actionUrl}
                          onChange={(e) => setEmailData({...emailData, actionUrl: e.target.value})}
                          placeholder="https://example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          按钮文字（可选）
                        </label>
                        <input
                          type="text"
                          value={emailData.actionText}
                          onChange={(e) => setEmailData({...emailData, actionText: e.target.value})}
                          placeholder="查看详情"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* 发送按钮 */}
                      <button
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {sendingEmail ? (
                          <>
                            <Loader className="h-5 w-5 animate-spin mr-2" />
                            发送中...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5 mr-2" />
                            发送邮件
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 发送结果 */}
                  {emailResults && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">发送结果</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          成功: {emailResults.success}
                        </div>
                        <div className="flex items-center">
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          失败: {emailResults.failed}
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-blue-500 mr-1" />
                          总计: {emailResults.total}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 用户管理内容 */}
            {activeTab === 'users' && (
              <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border">
                  <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">用户管理</h2>
                  
                  {/* 用户统计 */}
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">用户统计</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{userStats.total}</div>
                        <div className="text-sm text-blue-600">总用户</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{userStats.verified}</div>
                        <div className="text-sm text-green-600">已验证</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{userStats.unverified}</div>
                        <div className="text-sm text-yellow-600">未验证</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{userStats.admins}</div>
                        <div className="text-sm text-purple-600">管理员</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{userStats.disabled}</div>
                        <div className="text-sm text-red-600">已禁用</div>
                      </div>
                    </div>
                  </div>

                  {/* 搜索和过滤 */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        type="text"
                        placeholder="搜索用户名或邮箱"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={filterVerified}
                        onChange={(e) => setFilterVerified(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">所有验证状态</option>
                        <option value="true">已验证</option>
                        <option value="false">未验证</option>
                      </select>
                      <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">所有角色</option>
                        <option value="user">普通用户</option>
                        <option value="admin">管理员</option>
                      </select>
                      <button
                        onClick={handleSearch}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        搜索
                      </button>
                    </div>
                  </div>

                  {/* 用户列表 */}
                  <div className="overflow-x-auto">
                    {loading ? (
                      <div className="p-8 text-center">
                        <Loader className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                        <p className="mt-2 text-gray-600">加载中...</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {recipients === 'selected' && (
                                <input
                                  type="checkbox"
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUsers(users.map(u => u._id))
                                    } else {
                                      setSelectedUsers([])
                                    }
                                  }}
                                  className="mr-2"
                                />
                              )}
                              用户信息
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              状态
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              注册时间
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              操作
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((userItem) => (
                            <tr key={userItem._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {recipients === 'selected' && (
                                    <input
                                      type="checkbox"
                                      checked={selectedUsers.includes(userItem._id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedUsers([...selectedUsers, userItem._id])
                                        } else {
                                          setSelectedUsers(selectedUsers.filter(id => id !== userItem._id))
                                        }
                                      }}
                                      className="mr-3"
                                    />
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {userItem.username}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {userItem.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col space-y-1">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    userItem.isEmailVerified
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {userItem.isEmailVerified ? '已验证' : '未验证'}
                                  </span>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    userItem.role === 'admin'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {userItem.role === 'admin' ? '管理员' : '用户'}
                                  </span>
                                  {userItem.isDisabled && (
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                      已禁用
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(userItem.createdAt).toLocaleDateString('zh-CN')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                {!userItem.isDisabled ? (
                                  <button
                                    onClick={() => handleUserAction(userItem._id, 'disable')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    禁用
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUserAction(userItem._id, 'enable')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    启用
                                  </button>
                                )}
                                {!userItem.isEmailVerified && (
                                  <button
                                    onClick={() => handleUserAction(userItem._id, 'verify_email')}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    验证邮箱
                                  </button>
                                )}
                                {userItem.role !== 'admin' && (
                                  <button
                                    onClick={() => handleUserAction(userItem._id, 'make_admin')}
                                    className="text-purple-600 hover:text-purple-900"
                                  >
                                    设为管理员
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 模板预览模态框 */}
        {showTemplatePreview && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    邮件模板预览 - {templates.find(t => t.id === selectedTemplate)?.name}
                  </h3>
                  <button
                    onClick={() => setShowTemplatePreview(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div dangerouslySetInnerHTML={{
                    __html: getTemplatePreview(selectedTemplate, emailData)
                  }} />
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>说明：</strong>这是模板的预览效果，实际邮件会根据您填写的内容进行替换。</p>
                  <p className="mt-1">模板变量：标题、内容、按钮链接、按钮文字等会被实际数据替换。</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AdminPage 