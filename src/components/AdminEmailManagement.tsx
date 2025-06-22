import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Send, Users, User, AtSign, AlertTriangle, CheckCircle, XCircle, Loader, Eye } from 'lucide-react'
import axios from 'axios'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  description: string
}

interface User {
  _id: string
  username: string
  email: string
  isEmailVerified: boolean
  role: string
}

interface EmailResult {
  email: string
  success: boolean
  error?: string
}

const AdminEmailManagement: React.FC = () => {
  const { token } = useAuth()
  
  // 邮件相关状态
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [recipients, setRecipients] = useState<'all' | 'selected' | 'email'>('all')
  const [users, setUsers] = useState<User[]>([])
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
  const [emailResults, setEmailResults] = useState<EmailResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

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
    loadTemplates()
  }, [token])

  // 加载用户列表（当选择收件人为"选中用户"时）
  const loadUsers = async () => {
    if (recipients !== 'selected') return
    
    setLoadingUsers(true)
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        search: searchTerm
      })

      const response = await axios.get(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setUsers(response.data.data.users)
    } catch (error) {
      console.error('加载用户列表失败:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [recipients, searchTerm, token])

  // 模板选择变化
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setEmailSubject(template.subject)
      // 根据模板类型设置默认数据
      if (templateId === 'system_notification') {
        setEmailData({
          title: '系统通知',
          content: '请在此输入通知内容...',
          actionUrl: '',
          actionText: ''
        })
      } else if (templateId === 'security_alert') {
        setEmailData({
          title: '安全提醒',
          content: '我们检测到您的账户存在异常活动，请立即检查您的账户安全设置。',
          actionUrl: '',
          actionText: '检查账户安全'
        })
      } else if (templateId === 'welcome') {
        setEmailData({
          title: '欢迎使用梦锡账号',
          content: '感谢您注册梦锡账号！我们很高兴为您提供服务。',
          actionUrl: '',
          actionText: '开始使用'
        })
      } else {
        setEmailData({
          title: '',
          content: '',
          actionUrl: '',
          actionText: ''
        })
      }
    }
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

    if (!emailData.title.trim() || !emailData.content.trim()) {
      alert('请填写邮件标题和内容')
      return
    }

    setSendingEmail(true)
    setEmailResults([])
    setShowResults(false)

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

      setEmailResults(response.data.results || [])
      setShowResults(true)
      alert(response.data.message)
    } catch (error: any) {
      console.error('发送邮件失败:', error)
      alert(error.response?.data?.message || '发送邮件失败')
    } finally {
      setSendingEmail(false)
    }
  }

  // 预览邮件模板
  const getTemplatePreview = () => {
    const template = templates.find(t => t.id === selectedTemplate)
    if (!template) return ''

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">${emailData.title || template.name}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">梦锡工作室官方邮件</p>
        </div>
        <div style="background: white; padding: 30px;">
          <p style="color: #333; line-height: 1.6;">${emailData.content || '邮件内容将在这里显示...'}</p>
          ${emailData.actionUrl && emailData.actionText ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${emailData.actionUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">${emailData.actionText}</a>
            </div>
          ` : ''}
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
          <p>此邮件由梦锡工作室 MXacc 系统发送</p>
        </div>
      </div>
    `
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-3">
        <Mail className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">邮件管理</h2>
          <p className="text-slate-600 dark:text-slate-400">向用户发送系统邮件和通知</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：邮件编写 */}
        <div className="space-y-6">
          {/* 模板选择 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">选择邮件模板</h3>
            <div className="space-y-3">
              {templates.map((template) => (
                <label key={template.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white">{template.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{template.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 收件人设置 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">收件人设置</h3>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="recipients"
                    value="all"
                    checked={recipients === 'all'}
                    onChange={(e) => setRecipients(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-slate-900 dark:text-white">所有用户</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="recipients"
                    value="selected"
                    checked={recipients === 'selected'}
                    onChange={(e) => setRecipients(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-slate-900 dark:text-white">选中用户</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="recipients"
                    value="email"
                    checked={recipients === 'email'}
                    onChange={(e) => setRecipients(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <AtSign className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-slate-900 dark:text-white">指定邮箱</span>
                  </div>
                </label>
              </div>

              {/* 选中用户界面 */}
              {recipients === 'selected' && (
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="搜索用户..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                    {loadingUsers ? (
                      <div className="p-4 text-center">
                        <Loader className="h-4 w-4 animate-spin mx-auto" />
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">加载用户列表...</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {users.map((user) => (
                          <label key={user._id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, user._id])
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user._id))
                                }
                              }}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">{user.username}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                            </div>
                          </label>
                        ))}
                        {users.length === 0 && (
                          <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                            没有找到用户
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedUsers.length > 0 && (
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      已选择 {selectedUsers.length} 个用户
                    </div>
                  )}
                </div>
              )}

              {/* 指定邮箱界面 */}
              {recipients === 'email' && (
                <div>
                  <textarea
                    placeholder="请输入邮箱地址，每行一个&#10;例如：&#10;user1@example.com&#10;user2@example.com"
                    value={customEmails}
                    onChange={(e) => setCustomEmails(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    单次最多可发送给100个邮箱
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 邮件内容 */}
          {selectedTemplate && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">邮件内容</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    邮件主题
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    邮件标题
                  </label>
                  <input
                    type="text"
                    value={emailData.title}
                    onChange={(e) => setEmailData({...emailData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    邮件内容
                  </label>
                  <textarea
                    value={emailData.content}
                    onChange={(e) => setEmailData({...emailData, content: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      操作按钮文字（可选）
                    </label>
                    <input
                      type="text"
                      value={emailData.actionText}
                      onChange={(e) => setEmailData({...emailData, actionText: e.target.value})}
                      placeholder="例如：查看详情"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      操作链接（可选）
                    </label>
                    <input
                      type="url"
                      value={emailData.actionUrl}
                      onChange={(e) => setEmailData({...emailData, actionUrl: e.target.value})}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 发送按钮 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || !selectedTemplate}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sendingEmail ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>发送中...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>发送邮件</span>
                </>
              )}
            </button>
            
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>• 发送间隔：每秒最多发送1封邮件</p>
              <p>• 单次限制：最多向100个收件人发送</p>
              <p>• 所有发送记录将被记录到系统日志</p>
            </div>
          </div>
        </div>

        {/* 右侧：预览和结果 */}
        <div className="space-y-6">
          {/* 邮件预览 */}
          {selectedTemplate && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2 mb-4">
                <Eye className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">邮件预览</h3>
              </div>
              
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div 
                  className="max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: getTemplatePreview() }}
                />
              </div>
            </div>
          )}

          {/* 发送结果 */}
          {showResults && emailResults.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">发送结果</h3>
              
              <div className="space-y-3">
                {emailResults.map((result, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {result.email}
                      </div>
                      {result.error && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <div className="space-x-4">
                    <span className="text-green-600 dark:text-green-400">
                      成功: {emailResults.filter(r => r.success).length}
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      失败: {emailResults.filter(r => !r.success).length}
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400">
                    总计: {emailResults.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 使用说明 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">使用说明</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• 系统通知：用于发送系统维护、更新等重要通知</li>
                  <li>• 安全提醒：用于发送账户安全相关的警告和提醒</li>
                  <li>• 欢迎邮件：用于向新用户发送欢迎和介绍信息</li>
                  <li>• 自定义邮件：可完全自定义内容的通用模板</li>
                  <li>• 所有邮件都会标注"梦锡工作室官方发送"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminEmailManagement 