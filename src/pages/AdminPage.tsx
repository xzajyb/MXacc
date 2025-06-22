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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h1>
          <p className="text-gray-600">您需要管理员权限才能访问此页面</p>
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
    const templateMap: { [key: string]: string } = {
      'system_notification': `
        <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 30px; text-align: center;">
            <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">MXacc</div>
            <div style="color: rgba(255,255,255,0.9); font-size: 16px;">梦锡工作室</div>
          </div>
          <div style="padding: 40px 30px;">
            <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">${data.title || '系统通知'}</h1>
            <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">${data.content || '这是一条系统通知消息。'}</p>
            ${data.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${data.actionUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${data.actionText || '查看详情'}</a></div>` : ''}
          </div>
          <div style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">此邮件由梦锡工作室系统自动发送</p>
          </div>
        </div>
      `,
      'security_alert': `
        <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">
          <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 40px 30px; text-align: center;">
            <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">🚨 安全提醒</div>
            <div style="color: rgba(255,255,255,0.9); font-size: 16px;">梦锡工作室安全中心</div>
          </div>
          <div style="padding: 40px 30px;">
            <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">${data.title || '安全警告'}</h1>
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="color: #991b1b; margin: 0; font-weight: 500;">重要提醒</p>
            </div>
            <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">${data.content || '检测到您的账户存在安全风险，请及时处理。'}</p>
            ${data.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${data.actionUrl}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${data.actionText || '立即处理'}</a></div>` : ''}
          </div>
        </div>
      `,
      'welcome': `
        <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">
          <div style="background: linear-gradient(135deg, #059669, #047857); padding: 40px 30px; text-align: center;">
            <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">🎉 欢迎加入</div>
            <div style="color: rgba(255,255,255,0.9); font-size: 16px;">梦锡工作室</div>
          </div>
          <div style="padding: 40px 30px;">
            <h1 style="color: #047857; font-size: 24px; margin-bottom: 20px;">${data.title || '欢迎使用MXacc'}</h1>
            <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">${data.content || '感谢您注册梦锡账号！我们为您提供安全、便捷的账户管理服务。'}</p>
            ${data.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${data.actionUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${data.actionText || '开始使用'}</a></div>` : ''}
          </div>
        </div>
      `,
      'custom': `
        <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 30px; text-align: center;">
            <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">MXacc</div>
            <div style="color: rgba(255,255,255,0.9); font-size: 16px;">梦锡工作室</div>
          </div>
          <div style="padding: 40px 30px;">
            <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">${data.title || '自定义邮件标题'}</h1>
            <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">${data.content || '这里是自定义邮件内容，您可以根据需要填写具体信息。'}</p>
            ${data.actionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${data.actionUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${data.actionText || '点击这里'}</a></div>` : ''}
          </div>
          <div style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">此邮件由梦锡工作室发送</p>
          </div>
        </div>
      `
    }
    return templateMap[templateId] || templateMap['custom']
  }

  // 导航菜单项
  const navigationItems = [
    {
      id: 'email',
      label: '邮件发送',
      icon: Mail,
      description: '发送系统邮件'
    },
    {
      id: 'users',
      label: '用户管理',
      icon: Users,
      description: '管理用户账户'
    }
  ]

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        {/* 移动端遮罩 */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 左侧导航栏 */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* 头部 */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">管理控制台</h1>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 用户信息 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">系统管理员</p>
              </div>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id as 'email' | 'users')
                        setSidebarOpen(false) // 移动端点击后关闭侧边栏
                      }}
                      className={`
                        w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors
                        ${activeTab === item.id 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className={`h-5 w-5 mr-3 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        {/* 右侧主内容区 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 顶部栏 */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 mr-3"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeTab === 'email' ? '邮件发送' : '用户管理'}
                </h2>
                <p className="text-sm text-gray-600">
                  {activeTab === 'email' ? '发送系统邮件给用户' : '管理系统用户账户'}
                </p>
              </div>
            </div>
          </div>

          {/* 主内容 */}
          <div className="flex-1 p-6 overflow-auto">
            {/* 邮件发送内容 */}
            {activeTab === 'email' && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border p-6">
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
                              <button 
                                onClick={() => setShowTemplatePreview(true)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                预览模板
                              </button>
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
    </>
  )
}

export default AdminPage 