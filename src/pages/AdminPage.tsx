import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Shield, Mail, Users, Send, AlertTriangle, CheckCircle, XCircle, Loader, Menu, X, MessageSquare, Bell, Info, AlertCircle, Trash2, User as UserIcon, Image as ImageIcon, Search, BookOpen } from 'lucide-react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'

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

interface AdminPageProps {
  embedded?: boolean
}

const AdminPage: React.FC<AdminPageProps> = ({ embedded = false }) => {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'email' | 'users' | 'messages' | 'bans' | 'titles' | 'partner-logos' | 'posts' | 'wiki'>('email')
  
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
    actionText: '',
    recipientName: '',
    companyName: '梦锡工作室',
    contactEmail: 'support@mxstudio.com',
    websiteUrl: 'https://mxstudio.com',
    date: new Date().toLocaleDateString('zh-CN'),
    additionalInfo: '',
    urgencyLevel: 'normal'
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

  // 系统消息相关状态
  const [messageTitle, setMessageTitle] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'success' | 'error'>('info')
  const [messagePriority, setMessagePriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [messageAutoRead, setMessageAutoRead] = useState(false)
  const [messageScope, setMessageScope] = useState<'global' | 'personal'>('global') // 消息范围：全局或个人专属
  const [targetUserId, setTargetUserId] = useState('') // 目标用户ID（个人专属消息）
  const [publishingMessage, setPublishingMessage] = useState(false)
  const [systemMessages, setSystemMessages] = useState<any[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  // 封禁管理相关状态
  const [banList, setBanList] = useState<any[]>([])
  const [appealsList, setAppealsList] = useState<any[]>([])
  const [banLoading, setBanLoading] = useState(false)
  const [appealLoading, setAppealLoading] = useState(false)
  const [selectedBanUser, setSelectedBanUser] = useState('')
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('')
  const [banDurationType, setBanDurationType] = useState<'hours' | 'days' | 'weeks' | 'months'>('days')
  const [banNotes, setBanNotes] = useState('')
  const [processingBan, setProcessingBan] = useState(false)
  const [banFilter, setBanFilter] = useState('all')
  const [appealFilter, setAppealFilter] = useState('all')
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showAppealDialog, setShowAppealDialog] = useState(false)
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null)
  const [appealResponse, setAppealResponse] = useState('')
  const [sendNotificationToUser, setSendNotificationToUser] = useState(true)
  const [sendBanNotification, setSendBanNotification] = useState(true) // 封禁时是否发送通知
  
  // 解封确认弹窗状态
  const [showUnbanDialog, setShowUnbanDialog] = useState(false)
  const [selectedUnbanUser, setSelectedUnbanUser] = useState<any>(null)
  const [processingUnban, setProcessingUnban] = useState(false)
  const [sendUnbanNotification, setSendUnbanNotification] = useState(true)

  // 头衔管理相关状态
  const [titlesList, setTitlesList] = useState<any[]>([])
  const [titlesLoading, setTitlesLoading] = useState(false)
  const [showCreateTitleDialog, setShowCreateTitleDialog] = useState(false)
  const [showEditTitleDialog, setShowEditTitleDialog] = useState(false)
  const [showAssignTitleDialog, setShowAssignTitleDialog] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState<any>(null)
  const [titleName, setTitleName] = useState('')
  const [titleColor, setTitleColor] = useState('#3B82F6')
  const [titleDescription, setTitleDescription] = useState('')
  const [processingTitle, setProcessingTitle] = useState(false)
  const [assigningTitle, setAssigningTitle] = useState(false)
  const [selectedUserForTitle, setSelectedUserForTitle] = useState('')
  const [selectedTitleForAssign, setSelectedTitleForAssign] = useState('')
  const [userTitles, setUserTitles] = useState<any[]>([])
  
  // 合作伙伴Logo相关状态
  const [partnerLogos, setPartnerLogos] = useState<{url: string, name: string}[]>([])
  const [partnerLogosEnabled, setPartnerLogosEnabled] = useState(true)
  const [newLogoUrl, setNewLogoUrl] = useState('')
  const [newLogoName, setNewLogoName] = useState('')
  const [updatingPartnerLogos, setUpdatingPartnerLogos] = useState(false)

  // 帖子管理相关状态
  const [postsList, setPostsList] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [postsPage, setPostsPage] = useState(1)
  const [postsTotalPages, setPostsTotalPages] = useState(1)
  const [postsSearchTerm, setPostsSearchTerm] = useState('')
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)

  // 预设颜色选项
  const presetColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Gray', value: '#6B7280' }
  ]

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
    } else if (activeTab === 'messages' && token) {
      loadSystemMessages()
      // 系统消息选项卡也需要加载用户列表，供个人专属消息选择器使用
      loadUsers()
    } else if (activeTab === 'bans' && token) {
      loadBanList()
      loadAppealsList()
      loadUsers() // 加载用户列表供封禁选择器使用
    } else if (activeTab === 'titles' && token) {
      loadTitles()
      loadUsers() // 加载用户列表供头衔分配使用
    } else if (activeTab === 'partner-logos' && token) {
      loadPartnerLogos()
    } else if (activeTab === 'posts' && token) {
      loadPosts()
    }
  }, [activeTab, currentPage, token, postsPage, postsSearchTerm])

  // 监听封禁和申述过滤器变化
  useEffect(() => {
    if (activeTab === 'bans' && token) {
      loadBanList()
    }
  }, [banFilter, token])

  useEffect(() => {
    if (activeTab === 'bans' && token) {
      loadAppealsList()
    }
  }, [appealFilter, token])

  // 搜索用户
  const handleSearch = () => {
    setCurrentPage(1)
    loadUsers()
  }

  // 发送邮件
  const handleSendEmail = async () => {
    if (!selectedTemplate) {
      showToast('请选择邮件模板', 'error')
      return
    }

    if (recipients === 'selected' && selectedUsers.length === 0) {
      showToast('请选择收件人', 'error')
      return
    }

    if (recipients === 'email' && !customEmails.trim()) {
      showToast('请输入邮箱地址', 'error')
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
      showToast(response.data.message, 'success')
    } catch (error: any) {
      console.error('发送邮件失败:', error)
      showToast(error.response?.data?.message || '发送邮件失败', 'error')
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
      
      showToast('操作成功', 'success')
      loadUsers()
    } catch (error: any) {
      console.error('用户操作失败:', error)
      showToast(error.response?.data?.message || '操作失败', 'error')
    }
  }

  // 加载系统消息列表
  const loadSystemMessages = async () => {
    if (!token) return
    
    setMessagesLoading(true)
    try {
      const response = await axios.get('/api/admin/system-messages?action=admin-list&page=1&limit=20', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSystemMessages(response.data.data.messages)
    } catch (error) {
      console.error('加载系统消息失败:', error)
      showToast('加载系统消息失败', 'error')
    } finally {
      setMessagesLoading(false)
    }
  }

  // 发布系统消息
  const handlePublishMessage = async () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      showToast('请填写完整的标题和内容', 'error')
      return
    }

    if (messageScope === 'personal' && !targetUserId) {
      showToast('请选择目标用户', 'error')
      return
    }

    setPublishingMessage(true)
    try {
      const payload: any = {
        action: 'create',
        title: messageTitle,
        content: messageContent,
        type: messageType,
        priority: messagePriority,
        autoRead: messageAutoRead
      }

      // 如果是个人专属消息，添加目标用户ID
      if (messageScope === 'personal') {
        payload.targetUserId = targetUserId
      }

      await axios.post('/api/admin/system-messages', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      showToast(
        messageScope === 'personal' 
          ? '个人专属消息发布成功' 
          : '全局系统消息发布成功', 
        'success'
      )
      setMessageTitle('')
      setMessageContent('')
      setMessageType('info')
      setMessagePriority('normal')
      setMessageAutoRead(false)
      setMessageScope('global')
      setTargetUserId('')
      loadSystemMessages()
    } catch (error: any) {
      console.error('发布系统消息失败:', error)
      showToast(error.response?.data?.message || '发布失败', 'error')
    } finally {
      setPublishingMessage(false)
    }
  }

  // 删除系统消息
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('确定要删除这条系统消息吗？')) {
      return
    }

    try {
      await axios.delete(`/api/admin/system-messages?id=${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('消息删除成功', 'success')
      loadSystemMessages()
    } catch (error: any) {
      console.error('删除消息失败:', error)
      showToast(error.response?.data?.message || '删除失败', 'error')
    }
  }

  // 加载封禁列表
  const loadBanList = async () => {
    if (!token) return
    
    setBanLoading(true)
    try {
      const response = await axios.get(`/api/social/content?action=ban-management&subAction=bans&status=${banFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBanList(response.data.data.bans)
    } catch (error: any) {
      console.error('加载封禁列表失败:', error)
      showToast(error.response?.data?.message || '加载封禁列表失败', 'error')
    } finally {
      setBanLoading(false)
    }
  }

  // 加载申述列表
  const loadAppealsList = async () => {
    if (!token) return
    
    setAppealLoading(true)
    try {
      const response = await axios.get(`/api/social/content?action=ban-management&subAction=appeals&status=${appealFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAppealsList(response.data.data.appeals)
    } catch (error: any) {
      console.error('加载申述列表失败:', error)
      showToast(error.response?.data?.message || '加载申述列表失败', 'error')
    } finally {
      setAppealLoading(false)
    }
  }

  // 加载头衔列表
  const loadTitles = async () => {
    if (!token) return
    
    setTitlesLoading(true)
    try {
      const response = await axios.get('/api/social/content?action=title-management&subAction=titles', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTitlesList(response.data.data.titles)
    } catch (error: any) {
      console.error('加载头衔列表失败:', error)
      showToast(error.response?.data?.message || '加载头衔列表失败', 'error')
    } finally {
      setTitlesLoading(false)
    }
  }

  // 创建头衔
  const handleCreateTitle = async () => {
    if (!titleName.trim() || !titleColor) {
      showToast('请填写头衔名称和选择颜色', 'error')
      return
    }

    setProcessingTitle(true)
    try {
      await axios.post('/api/social/content', {
        action: 'create-title',
        name: titleName.trim(),
        color: titleColor,
        description: titleDescription.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      showToast('头衔创建成功', 'success')
      setShowCreateTitleDialog(false)
      setTitleName('')
      setTitleColor('#3B82F6')
      setTitleDescription('')
      loadTitles()
    } catch (error: any) {
      console.error('创建头衔失败:', error)
      showToast(error.response?.data?.message || '创建头衔失败', 'error')
    } finally {
      setProcessingTitle(false)
    }
  }

  // 更新头衔
  const handleUpdateTitle = async () => {
    if (!selectedTitle || !titleName.trim() || !titleColor) {
      showToast('请填写完整信息', 'error')
      return
    }

    setProcessingTitle(true)
    try {
      await axios.put('/api/social/content', {
        action: 'update-title',
        titleId: selectedTitle._id,
        name: titleName.trim(),
        color: titleColor,
        description: titleDescription.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      showToast('头衔更新成功', 'success')
      setShowEditTitleDialog(false)
      setSelectedTitle(null)
      setTitleName('')
      setTitleColor('#3B82F6')
      setTitleDescription('')
      loadTitles()
    } catch (error: any) {
      console.error('更新头衔失败:', error)
      showToast(error.response?.data?.message || '更新头衔失败', 'error')
    } finally {
      setProcessingTitle(false)
    }
  }

  // 删除头衔
  const handleDeleteTitle = async (titleId: string) => {
    if (!confirm('确定要删除这个头衔吗？这将移除所有用户的该头衔。')) {
      return
    }

    try {
      await axios.delete(`/api/social/content?action=title&id=${titleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('头衔删除成功', 'success')
      loadTitles()
    } catch (error: any) {
      console.error('删除头衔失败:', error)
      showToast(error.response?.data?.message || '删除头衔失败', 'error')
    }
  }

  // 分配头衔给用户
  const handleAssignTitle = async () => {
    if (!selectedUserForTitle || !selectedTitleForAssign) {
      showToast('请选择用户和头衔', 'error')
      return
    }

    setAssigningTitle(true)
    try {
      await axios.post('/api/social/content', {
        action: 'assign-title',
        userId: selectedUserForTitle,
        titleId: selectedTitleForAssign
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      showToast('头衔分配成功', 'success')
      setShowAssignTitleDialog(false)
      setSelectedUserForTitle('')
      setSelectedTitleForAssign('')
      loadUserTitles(selectedUserForTitle) // 刷新用户头衔列表
    } catch (error: any) {
      console.error('分配头衔失败:', error)
      showToast(error.response?.data?.message || '分配头衔失败', 'error')
    } finally {
      setAssigningTitle(false)
    }
  }

  // 加载用户头衔列表
  const loadUserTitles = async (userId: string) => {
    if (!token || !userId) return
    
    try {
      const response = await axios.get(`/api/social/content?action=title-management&subAction=user-titles&userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUserTitles(response.data.data.userTitles)
    } catch (error: any) {
      console.error('加载用户头衔失败:', error)
    }
  }

  // 移除用户头衔
  const handleRemoveUserTitle = async (userId: string, titleId: string) => {
    if (!confirm('确定要移除该用户的头衔吗？')) {
      return
    }

    try {
      await axios.delete(`/api/social/content?action=user-title&userId=${userId}&titleId=${titleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('头衔移除成功', 'success')
      loadUserTitles(userId) // 刷新用户头衔列表
    } catch (error: any) {
      console.error('移除头衔失败:', error)
      showToast(error.response?.data?.message || '移除头衔失败', 'error')
    }
  }

  // 加载合作伙伴Logo设置
  const loadPartnerLogos = async () => {
    if (!token) return
    
    try {
      const response = await axios.get('/api/admin/users?action=partner-logos', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        const data = response.data.data
        setPartnerLogos(data.logos || [])
        setPartnerLogosEnabled(data.enabled !== undefined ? data.enabled : true)
      }
    } catch (error: any) {
      console.error('加载合作伙伴Logo设置失败:', error)
      showToast(error.response?.data?.message || '加载合作伙伴Logo设置失败', 'error')
    }
  }
  
  // 更新合作伙伴Logo设置
  const updatePartnerLogos = async () => {
    if (!token) return
    
    setUpdatingPartnerLogos(true)
    try {
      const response = await axios.put('/api/admin/users', {
        action: 'update-partner-logos',
        logos: partnerLogos,
        enabled: partnerLogosEnabled
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        showToast('合作伙伴Logo设置已更新', 'success')
      }
    } catch (error: any) {
      console.error('更新合作伙伴Logo设置失败:', error)
      showToast(error.response?.data?.message || '更新合作伙伴Logo设置失败', 'error')
    } finally {
      setUpdatingPartnerLogos(false)
    }
  }
  
  // 添加新Logo
  const addPartnerLogo = () => {
    if (!newLogoUrl || !newLogoName) {
      showToast('请填写Logo URL和名称', 'warning')
      return
    }
    
    setPartnerLogos([...partnerLogos, { url: newLogoUrl, name: newLogoName }])
    setNewLogoUrl('')
    setNewLogoName('')
  }
  
  // 删除Logo
  const removePartnerLogo = (index: number) => {
    const updatedLogos = [...partnerLogos]
    updatedLogos.splice(index, 1)
    setPartnerLogos(updatedLogos)
  }

  // 加载帖子列表
  const loadPosts = async () => {
    if (!token) return
    
    setPostsLoading(true)
    try {
      const params = new URLSearchParams({
        action: 'posts',
        page: postsPage.toString(),
        limit: '20',
        type: 'feed'
      })

      if (postsSearchTerm) {
        params.append('search', postsSearchTerm)
      }

      const response = await axios.get(`/api/social/content?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setPostsList(response.data.data.posts || [])
        setPostsTotalPages(response.data.data.pagination?.pages || 1)
      }
    } catch (error) {
      console.error('加载帖子列表失败:', error)
      showToast('加载帖子列表失败', 'error')
    } finally {
      setPostsLoading(false)
    }
  }

  // 处理帖子选择
  const handlePostSelect = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    )
  }

  // 全选/取消全选帖子
  const handleSelectAllPosts = () => {
    if (selectedPosts.length === postsList.length) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(postsList.map(post => post._id))
    }
  }

  // 批量删除帖子
  const handleBatchDeletePosts = async () => {
    if (selectedPosts.length === 0) {
      showToast('请先选择要删除的帖子', 'warning')
      return
    }

    setBatchDeleting(true)
    try {
      const response = await axios.delete('/api/social/content?action=batch-delete-posts', {
        headers: { Authorization: `Bearer ${token}` },
        data: { postIds: selectedPosts }
      })

      if (response.data.success) {
        showToast(response.data.message, 'success')
        setSelectedPosts([])
        setShowBatchDeleteDialog(false)
        loadPosts() // 重新加载帖子列表
      }
    } catch (error: any) {
      console.error('批量删除帖子失败:', error)
      showToast(error.response?.data?.message || '批量删除帖子失败', 'error')
    } finally {
      setBatchDeleting(false)
    }
  }

  // 搜索帖子
  const handlePostsSearch = () => {
    setPostsPage(1)
    loadPosts()
  }

  // 打开编辑头衔弹窗
  const openEditTitleDialog = (title: any) => {
    setSelectedTitle(title)
    setTitleName(title.name)
    setTitleColor(title.color)
    setTitleDescription(title.description || '')
    setShowEditTitleDialog(true)
  }

  // 封禁用户
  const handleBanUser = async () => {
    if (!selectedBanUser || !banReason.trim()) {
      showToast('请选择用户并填写封禁原因', 'error')
      return
    }

    setProcessingBan(true)
    try {
      const payload: any = {
        action: 'ban-user',
        userId: selectedBanUser,
        reason: banReason.trim(),
        notes: banNotes.trim()
      }

      if (banDuration && parseInt(banDuration) > 0) {
        payload.durationValue = parseInt(banDuration)
        payload.durationType = banDurationType
      } else {
        payload.durationType = 'permanent'
      }

      const response = await axios.post('/api/social/content', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // 发送封禁通知给被封禁用户（如果选择了）
      if (sendBanNotification && selectedBanUser) {
        try {
          const bannedUser = users.find(u => u._id === selectedBanUser)
          const durationText = banDuration && parseInt(banDuration) > 0 
            ? `${banDuration}${banDurationType === 'hours' ? '小时' : banDurationType === 'days' ? '天' : banDurationType === 'weeks' ? '周' : '个月'}` 
            : '永久'
          
          const notificationPayload = {
            action: 'create',
            title: '账户封禁通知',
            content: `您的账户已被管理员封禁。\n\n封禁原因：${banReason.trim()}\n封禁时长：${durationText}\n\n如对此有异议，您可以在登录后通过社交页面提交申述。我们会认真处理您的申述。`,
            type: 'warning',
            priority: 'high',
            autoRead: false,
            targetUserId: selectedBanUser
          }

          await axios.post('/api/admin/system-messages', notificationPayload, {
            headers: { Authorization: `Bearer ${token}` }
          })

          console.log('封禁通知已发送给用户')
        } catch (notificationError) {
          console.error('发送封禁通知失败:', notificationError)
          // 不阻断主流程，只是记录错误
        }
      }

      showToast('用户封禁成功', 'success')
      setShowBanDialog(false)
      setSelectedBanUser('')
      setBanReason('')
      setBanDuration('')
      setBanNotes('')
      setSendBanNotification(true) // 重置为默认值
      loadBanList()
    } catch (error: any) {
      console.error('封禁用户失败:', error)
      showToast(error.response?.data?.message || '封禁失败', 'error')
    } finally {
      setProcessingBan(false)
    }
  }

  // 打开解封确认弹窗
  const handleUnbanUser = (ban: any) => {
    setSelectedUnbanUser(ban)
    setShowUnbanDialog(true)
  }

  // 执行解封操作
  const executeUnban = async () => {
    if (!selectedUnbanUser) return

    setProcessingUnban(true)
    try {
      await axios.put('/api/social/content', {
        action: 'unban-user',
        banId: selectedUnbanUser._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // 发送解封通知给用户（如果选择了）
      if (sendUnbanNotification && selectedUnbanUser.userId) {
        try {
          const notificationPayload = {
            action: 'create',
            title: '封禁已解除',
            content: `您的账户封禁已被管理员解除，现在可以正常使用所有功能。\n\n原封禁原因：${selectedUnbanUser.reason}\n解除时间：${new Date().toLocaleString('zh-CN')}\n\n感谢您的耐心等待。如有任何疑问，请联系客服。`,
            type: 'success',
            priority: 'high',
            autoRead: false,
            targetUserId: selectedUnbanUser.userId
          }

          await axios.post('/api/admin/system-messages', notificationPayload, {
            headers: { Authorization: `Bearer ${token}` }
          })

          console.log('解封通知已发送给用户')
        } catch (notificationError) {
          console.error('发送解封通知失败:', notificationError)
          // 不阻断主流程
        }
      }

      showToast('封禁已解除', 'success')
      setShowUnbanDialog(false)
      setSelectedUnbanUser(null)
      setSendUnbanNotification(true) // 重置为默认值
      loadBanList()
    } catch (error: any) {
      console.error('解除封禁失败:', error)
      showToast(error.response?.data?.message || '解除封禁失败', 'error')
    } finally {
      setProcessingUnban(false)
    }
  }

  // 处理申述
  const handleAppeal = async (approved: boolean) => {
    if (!selectedAppeal) return

    try {
      await axios.put('/api/social/content', {
        action: 'process-appeal',
        appealId: selectedAppeal._id,
        decision: approved ? 'approved' : 'rejected',
        adminReply: appealResponse.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // 发送系统通知给用户（如果选择了）
      if (sendNotificationToUser && selectedAppeal.userId) {
        try {
          const notificationPayload = {
            action: 'create',
            title: approved ? '申述结果：申述已通过' : '申述结果：申述已驳回',
            content: approved 
              ? `您的申述已通过，封禁已解除。${appealResponse.trim() ? '\n\n管理员回复：' + appealResponse.trim() : ''}`
              : `您的申述已被驳回。${appealResponse.trim() ? '\n\n管理员回复：' + appealResponse.trim() : ''}`,
            type: approved ? 'success' : 'info',
            priority: 'high',
            autoRead: false,
            targetUserId: selectedAppeal.userId
          }

          await axios.post('/api/admin/system-messages', notificationPayload, {
            headers: { Authorization: `Bearer ${token}` }
          })

          console.log('申述结果通知已发送给用户')
        } catch (notificationError) {
          console.error('发送通知失败:', notificationError)
          // 不阻断主流程，只是记录错误
        }
      }

      showToast(approved ? '申述已通过，封禁已解除' : '申述已驳回', 'success')
      setShowAppealDialog(false)
      setSelectedAppeal(null)
      setAppealResponse('')
      setSendNotificationToUser(true) // 重置为默认值
      loadAppealsList()
      loadBanList()
    } catch (error: any) {
      console.error('处理申述失败:', error)
      showToast(error.response?.data?.message || '处理申述失败', 'error')
    }
  }

  // 获取模板预览HTML
  const getTemplatePreview = (templateId: string, data: any) => {
    // 确保数据有默认值
    const safeData = {
      title: data.title || '点击左侧输入邮件标题...',
      content: data.content || '点击左侧输入邮件内容...',
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
                📧 邮箱：<a href="mailto:${safeData.contactEmail}" style="color: #3b82f6; text-decoration: none;">${safeData.contactEmail}</a><br>
                🌐 网站：<a href="${safeData.websiteUrl}" style="color: #3b82f6; text-decoration: none;">${safeData.websiteUrl}</a>
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
            <div style="color: white; font-size: 32px; margin-bottom: 10px;">🛡️</div>
            <div style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px;">安全警报</div>
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
            <div style="color: white; font-size: 40px; margin-bottom: 15px;">🎉</div>
            <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">欢迎加入我们！</div>
            <div style="color: rgba(255,255,255,0.9); font-size: 16px;">${safeData.companyName}</div>
          </div>
          <div style="padding: 40px 30px;">
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">亲爱的 ${safeData.recipientName}，</p>
            <h1 style="color: #047857; font-size: 24px; margin-bottom: 20px; ${!data.title ? 'color: #a7f3d0; font-style: italic;' : ''}">${safeData.title}</h1>
            <div style="background: #f0fdfa; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 6px 6px 0;">
              <p style="color: #065f46; line-height: 1.6; margin: 0; ${!data.content ? 'color: #9ca3af; font-style: italic;' : ''}">${safeData.content}</p>
            </div>
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">🚀 快速开始指南：</h3>
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
                📧 客服邮箱：<a href="mailto:${safeData.contactEmail}" style="color: #059669; text-decoration: none;">${safeData.contactEmail}</a><br>
                🌐 帮助中心：<a href="${safeData.websiteUrl}/help" style="color: #059669; text-decoration: none;">${safeData.websiteUrl}/help</a><br>
                📖 用户指南：<a href="${safeData.websiteUrl}/guide" style="color: #059669; text-decoration: none;">${safeData.websiteUrl}/guide</a>
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

  return (
    <>
      <div className={embedded ? "space-y-6" : "min-h-screen bg-gray-50 dark:bg-gray-900"}>
        <div className={embedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
          {/* 页面标题 */}
          {!embedded && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                管理员控制台
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">系统管理和邮件发送功能</p>
            </div>
          )}

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
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'messages'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <MessageSquare className="h-5 w-5 inline mr-2" />
                  系统公告
                </button>
                <button
                  onClick={() => setActiveTab('bans')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'bans'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5 inline mr-2" />
                  封禁管理
                </button>
                <button
                  onClick={() => setActiveTab('titles')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'titles'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <UserIcon className="h-5 w-5 inline mr-2" />
                  头衔管理
                </button>
                <button
                  onClick={() => setActiveTab('partner-logos')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'partner-logos'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <ImageIcon className="h-5 w-5 inline mr-2" />
                  合作伙伴
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'posts'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Trash2 className="h-5 w-5 inline mr-2" />
                  帖子管理
                </button>
                <button
                  onClick={() => setActiveTab('wiki')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'wiki'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <BookOpen className="h-5 w-5 inline mr-2" />
                  Wiki管理
                </button>
              </nav>
            </div>
          </div>

          {/* 主内容 */}
          <div className="overflow-auto">
            {/* 邮件发送内容 */}
            {activeTab === 'email' && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">发送邮件</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 左侧：邮件配置 */}
                    <div className="space-y-6">
                      {/* 选择模板 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          邮件模板
                        </label>
                        <select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">请选择邮件模板</option>
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name} - {template.subject}
                            </option>
                          ))}
                        </select>
                        {selectedTemplate && (
                          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                已选择：{templates.find(t => t.id === selectedTemplate)?.name}
                              </p>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => setShowTemplatePreview(true)}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                >
                                  预览模板
                                </button>
                              </div>
                            </div>
                            
                            {/* 实时预览区域 */}
                            <div className="mt-4 border border-blue-200 dark:border-blue-700 rounded-lg overflow-hidden">
                              <div className="bg-blue-100 dark:bg-blue-900/40 px-3 py-2 text-sm font-medium text-blue-800 dark:text-blue-200">
                                实时预览（输入内容会实时更新）
                              </div>
                              <div className="p-4 bg-white dark:bg-gray-900 max-h-96 overflow-y-auto">
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          自定义主题（可选）
                        </label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="留空使用默认主题"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* 选择收件人 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          收件人
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center text-gray-700 dark:text-gray-300">
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
                          <label className="flex items-center text-gray-700 dark:text-gray-300">
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
                          <label className="flex items-center text-gray-700 dark:text-gray-300">
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
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            邮箱地址（每行一个）
                          </label>
                          <textarea
                            value={customEmails}
                            onChange={(e) => setCustomEmails(e.target.value)}
                            placeholder="example1@email.com&#10;example2@email.com"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* 右侧：邮件内容 */}
                    <div className="space-y-6">
                      {/* 基础内容 */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">📝 邮件基础内容</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              邮件标题 *
                            </label>
                            <input
                              type="text"
                              value={emailData.title}
                              onChange={(e) => setEmailData({...emailData, title: e.target.value})}
                              placeholder="例如：系统升级完成通知"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              邮件正文内容 *
                            </label>
                            <textarea
                              value={emailData.content}
                              onChange={(e) => setEmailData({...emailData, content: e.target.value})}
                              placeholder="请输入邮件的主要内容，描述具体的事件、通知或说明..."
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 个性化设置 */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">👤 个性化设置</h3>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              收件人称呼
                            </label>
                            <input
                              type="text"
                              value={emailData.recipientName}
                              onChange={(e) => setEmailData({...emailData, recipientName: e.target.value})}
                              placeholder="例如：尊敬的用户、亲爱的客户"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              公司/组织名称
                            </label>
                            <input
                              type="text"
                              value={emailData.companyName}
                              onChange={(e) => setEmailData({...emailData, companyName: e.target.value})}
                              placeholder="例如：梦锡工作室"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 联系信息 */}
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">📞 联系信息</h3>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              联系邮箱
                            </label>
                            <input
                              type="email"
                              value={emailData.contactEmail}
                              onChange={(e) => setEmailData({...emailData, contactEmail: e.target.value})}
                              placeholder="support@example.com"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              官方网站
                            </label>
                            <input
                              type="url"
                              value={emailData.websiteUrl}
                              onChange={(e) => setEmailData({...emailData, websiteUrl: e.target.value})}
                              placeholder="https://example.com"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 操作按钮设置 */}
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">🔗 操作按钮（可选）</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              按钮链接
                            </label>
                            <input
                              type="url"
                              value={emailData.actionUrl}
                              onChange={(e) => setEmailData({...emailData, actionUrl: e.target.value})}
                              placeholder="https://example.com/action"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              按钮文字
                            </label>
                            <input
                              type="text"
                              value={emailData.actionText}
                              onChange={(e) => setEmailData({...emailData, actionText: e.target.value})}
                              placeholder="立即查看、了解详情、立即操作"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 高级设置 */}
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">⚙️ 高级设置</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              紧急程度（安全警报模板生效）
                            </label>
                            <select
                              value={emailData.urgencyLevel}
                              onChange={(e) => setEmailData({...emailData, urgencyLevel: e.target.value as any})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="normal">普通</option>
                              <option value="high">高级</option>
                              <option value="urgent">紧急</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              补充信息（可选）
                            </label>
                            <textarea
                              value={emailData.additionalInfo}
                              onChange={(e) => setEmailData({...emailData, additionalInfo: e.target.value})}
                              placeholder="例如：维护时长、注意事项、重要提醒等补充信息..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              发送日期
                            </label>
                            <input
                              type="text"
                              value={emailData.date}
                              onChange={(e) => setEmailData({...emailData, date: e.target.value})}
                              placeholder="自动显示当前日期"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
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
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">发送结果</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-gray-900 dark:text-white">成功: {emailResults.success}</span>
                        </div>
                        <div className="flex items-center">
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-gray-900 dark:text-white">失败: {emailResults.failed}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-gray-900 dark:text-white">总计: {emailResults.total}</span>
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
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white p-6 border-b border-gray-200 dark:border-gray-700">用户管理</h2>
                  
                  {/* 用户统计 */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">用户统计</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userStats.total}</div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">总用户</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{userStats.verified}</div>
                        <div className="text-sm text-green-600 dark:text-green-400">已验证</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{userStats.unverified}</div>
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">未验证</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{userStats.admins}</div>
                        <div className="text-sm text-purple-600 dark:text-purple-400">管理员</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{userStats.disabled}</div>
                        <div className="text-sm text-red-600 dark:text-red-400">已禁用</div>
                      </div>
                    </div>
                  </div>

                  {/* 搜索和过滤 */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        type="text"
                        placeholder="搜索用户名或邮箱"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={filterVerified}
                        onChange={(e) => setFilterVerified(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">所有验证状态</option>
                        <option value="true">已验证</option>
                        <option value="false">未验证</option>
                      </select>
                      <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* 系统消息管理内容 */}
            {activeTab === 'messages' && (
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 左侧：发布系统消息 */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      发布系统公告
                    </h2>
                    
                    <div className="space-y-4">
                      {/* 消息标题 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          公告标题 *
                        </label>
                        <input
                          type="text"
                          value={messageTitle}
                          onChange={(e) => setMessageTitle(e.target.value)}
                          placeholder="例如：系统维护通知、新功能上线公告"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* 消息内容 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          公告内容 *
                        </label>
                        <textarea
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          placeholder="请输入详细的公告内容..."
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* 消息范围选择 */}
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          📢 消息范围
                        </label>
                        <div className="space-y-3">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              checked={messageScope === 'global'}
                              onChange={() => setMessageScope('global')}
                              className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">🌍 全局消息</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">所有用户都能看到这条消息</div>
                            </div>
                          </label>
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              checked={messageScope === 'personal'}
                              onChange={() => setMessageScope('personal')}
                              className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">👤 个人专属消息</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">只有指定用户能看到这条消息</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* 目标用户选择器（仅在个人专属消息时显示） */}
                      {messageScope === 'personal' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            选择目标用户 *
                          </label>
                          <select
                            value={targetUserId}
                            onChange={(e) => setTargetUserId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">请选择用户...</option>
                            {users.map((userItem) => (
                              <option key={userItem._id} value={userItem._id}>
                                {userItem.username} ({userItem.email}) 
                                {userItem.role === 'admin' ? ' [管理员]' : ''}
                                {!userItem.isEmailVerified ? ' [未验证]' : ''}
                              </option>
                            ))}
                          </select>
                          {targetUserId && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                ✅ 已选择：{users.find(u => u._id === targetUserId)?.username || '未知用户'}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 消息类型和优先级 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            消息类型
                          </label>
                          <select
                            value={messageType}
                            onChange={(e) => setMessageType(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="info">信息 ℹ️</option>
                            <option value="warning">警告 ⚠️</option>
                            <option value="success">成功 ✅</option>
                            <option value="error">错误 ❌</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            优先级
                          </label>
                          <select
                            value={messagePriority}
                            onChange={(e) => setMessagePriority(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="low">低优先级</option>
                            <option value="normal">普通</option>
                            <option value="high">重要</option>
                            <option value="urgent">紧急</option>
                          </select>
                        </div>
                      </div>

                      {/* 确认方式选择 */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          📋 确认方式
                        </label>
                        <div className="space-y-3">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              checked={!messageAutoRead}
                              onChange={() => setMessageAutoRead(false)}
                              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">🔒 手动确认</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">用户需要点击"确认"按钮来标记消息为已读</div>
                            </div>
                          </label>
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              checked={messageAutoRead}
                              onChange={() => setMessageAutoRead(true)}
                              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">⚡ 自动确认</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">用户看到消息后自动标记为已读，无需手动操作</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* 发布按钮 */}
                      <button
                        onClick={handlePublishMessage}
                        disabled={
                          publishingMessage || 
                          !messageTitle.trim() || 
                          !messageContent.trim() ||
                          (messageScope === 'personal' && !targetUserId)
                        }
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {publishingMessage ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin mr-2" />
                            发布中...
                          </>
                        ) : (
                          <>
                            <Bell className="w-5 h-5 mr-2" />
                            发布公告
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 右侧：消息列表 */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <Bell className="w-5 h-5 mr-2" />
                        已发布的公告
                      </h2>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                      {messagesLoading ? (
                        <div className="p-8 text-center">
                          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                          <p className="mt-2 text-gray-500 dark:text-gray-400">加载中...</p>
                        </div>
                      ) : systemMessages.length === 0 ? (
                        <div className="p-8 text-center">
                          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">暂无系统公告</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-600">
                          {systemMessages.map((message) => (
                            <div key={message.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    {message.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                                    {message.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                                    {message.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                    {message.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                                    
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {message.title}
                                    </h3>
                                   
                                    <div className="flex items-center space-x-2">
                                      {/* 消息范围标识 */}
                                      {message.isPersonal ? (
                                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
                                          👤 个人专属
                                        </span>
                                      ) : (
                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                          🌍 全局消息
                                        </span>
                                      )}
                                      
                                      {/* 自动确认标识 */}
                                      {message.autoRead && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                          ⚡ 自动确认
                                        </span>
                                      )}
                                      
                                      {message.priority !== 'normal' && (
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          message.priority === 'urgent' 
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                            : message.priority === 'high'
                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                        }`}>
                                          {message.priority === 'urgent' ? '紧急' : 
                                           message.priority === 'high' ? '重要' : '低优先级'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* 个人专属消息显示目标用户 */}
                                  {message.isPersonal && message.targetUser && (
                                    <div className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 dark:border-indigo-700">
                                      <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                        <span className="font-medium">发送给：</span>
                                        {message.targetUser.nickname} (@{message.targetUser.username})
                                        <span className="text-indigo-500 ml-1">({message.targetUser.email})</span>
                                      </p>
                                    </div>
                                  )}
                                  
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                    {message.content}
                                  </p>
                                  
                                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>
                                      发布时间: {new Date(message.createdAt).toLocaleString('zh-CN')}
                                    </span>
                                    <span>
                                      阅读率: {message.readRate}% ({message.readCount}/{message.totalUsers})
                                    </span>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="删除公告"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 封禁管理内容 */}
            {activeTab === 'bans' && (
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 左侧：封禁用户 */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                      封禁用户
                    </h2>
                    
                    <div className="space-y-4">
                      {/* 选择用户 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          选择用户 *
                        </label>
                        <select
                          value={selectedBanUser}
                          onChange={(e) => setSelectedBanUser(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">请选择要封禁的用户...</option>
                          {users.filter(u => u.role !== 'admin').map((userItem) => (
                            <option key={userItem._id} value={userItem._id}>
                              {userItem.username} ({userItem.email})
                              {!userItem.isEmailVerified ? ' [未验证]' : ''}
                              {userItem.isDisabled ? ' [已禁用]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 封禁原因 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          封禁原因 *
                        </label>
                        <textarea
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder="请详细说明封禁原因..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* 封禁时长 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          封禁时长
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            value={banDuration}
                            onChange={(e) => setBanDuration(e.target.value)}
                            placeholder="数量"
                            min="1"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <select
                            value={banDurationType}
                            onChange={(e) => setBanDurationType(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="hours">小时</option>
                            <option value="days">天</option>
                            <option value="weeks">周</option>
                            <option value="months">月</option>
                          </select>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          留空表示永久封禁
                        </p>
                      </div>

                      {/* 备注 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          管理员备注
                        </label>
                        <textarea
                          value={banNotes}
                          onChange={(e) => setBanNotes(e.target.value)}
                          placeholder="可选的内部备注..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* 系统通知选项 */}
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={sendBanNotification}
                            onChange={(e) => setSendBanNotification(e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            发送封禁通知给用户
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          选中后将向用户发送系统通知，告知封禁详情和申述方式
                        </p>
                      </div>

                      {/* 封禁按钮 */}
                      <button
                        onClick={handleBanUser}
                        disabled={processingBan || !selectedBanUser || !banReason.trim()}
                        className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {processingBan ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin mr-2" />
                            处理中...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            确认封禁
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 中间：封禁列表 */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          封禁列表
                        </h2>
                        <select
                          value={banFilter}
                          onChange={(e) => setBanFilter(e.target.value)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">全部状态</option>
                          <option value="active">活跃封禁</option>
                          <option value="revoked">已解除</option>
                        </select>
                      </div>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                      {banLoading ? (
                        <div className="p-8 text-center">
                          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                          <p className="mt-2 text-gray-500 dark:text-gray-400">加载中...</p>
                        </div>
                      ) : banList.length === 0 ? (
                        <div className="p-8 text-center">
                          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">暂无封禁记录</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-600">
                          {banList.map((ban) => (
                            <div key={ban._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {ban.user?.username || '未知用户'}
                                    </h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      ban.status === 'active'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                    }`}>
                                      {ban.status === 'active' ? '已封禁' : '已解除'}
                                    </span>
                                    {ban.expiresAt && (
                                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                        临时封禁
                                      </span>
                                    )}
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    <span className="font-medium">原因：</span>{ban.reason}
                                  </p>
                                  
                                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                    <div>
                                      封禁时间: {new Date(ban.createdAt).toLocaleString('zh-CN')}
                                    </div>
                                    {ban.expiresAt && (
                                      <div>
                                        到期时间: {new Date(ban.expiresAt).toLocaleString('zh-CN')}
                                      </div>
                                    )}
                                    {ban.notes && (
                                      <div>
                                        备注: {ban.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {ban.status === 'active' && (
                                  <button
                                    onClick={() => handleUnbanUser(ban)}
                                    className="ml-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                  >
                                    解封
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右侧：申述列表 */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                          <MessageSquare className="w-5 h-5 mr-2" />
                          申述管理
                        </h2>
                        <select
                          value={appealFilter}
                          onChange={(e) => setAppealFilter(e.target.value)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">全部申述</option>
                          <option value="pending">待处理</option>
                          <option value="approved">已通过</option>
                          <option value="rejected">已驳回</option>
                        </select>
                      </div>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                      {appealLoading ? (
                        <div className="p-8 text-center">
                          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                          <p className="mt-2 text-gray-500 dark:text-gray-400">加载中...</p>
                        </div>
                      ) : appealsList.length === 0 ? (
                        <div className="p-8 text-center">
                          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">暂无申述记录</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-600">
                          {appealsList.map((appeal) => (
                            <div key={appeal._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {appeal.user?.username || '未知用户'}
                                    </h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      appeal.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                        : appeal.status === 'approved'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    }`}>
                                      {appeal.status === 'pending' ? '待处理' : 
                                       appeal.status === 'approved' ? '已通过' : '已驳回'}
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    <span className="font-medium">申述原因：</span>{appeal.reason}
                                  </p>
                                  
                                  {appeal.details && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      <span className="font-medium">详细说明：</span>{appeal.details}
                                    </p>
                                  )}
                                  
                                  {appeal.images && appeal.images.length > 0 && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      <span className="font-medium">申述图片：</span>
                                      <span className="inline-flex items-center ml-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs">
                                        {appeal.images.length} 张图片
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    申述时间: {new Date(appeal.submittedAt || appeal.createdAt).toLocaleString('zh-CN')}
                                  </div>
                                  
                                  {appeal.adminResponse && (
                                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                                      <p className="text-xs text-blue-700 dark:text-blue-300">
                                        <span className="font-medium">管理员回复：</span>{appeal.adminResponse}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                {appeal.status === 'pending' && (
                                  <button
                                    onClick={() => {
                                      setSelectedAppeal(appeal)
                                      setShowAppealDialog(true)
                                    }}
                                    className="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  >
                                    处理
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 头衔管理内容 */}
            {activeTab === 'titles' && (
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 左侧：头衔列表 */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                          <UserIcon className="w-5 h-5 mr-2" />
                          头衔管理
                        </h2>
                        <button
                          onClick={() => setShowCreateTitleDialog(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          创建头衔
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                      {titlesLoading ? (
                        <div className="p-8 text-center">
                          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                          <p className="mt-2 text-gray-500 dark:text-gray-400">加载中...</p>
                        </div>
                      ) : titlesList.length === 0 ? (
                        <div className="p-8 text-center">
                          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">暂无头衔</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-600">
                          {titlesList.map((title) => (
                            <div key={title._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className="w-4 h-4 rounded-full border-2 border-gray-300"
                                    style={{ backgroundColor: title.color }}
                                  ></div>
                                  <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                      {title.name}
                                    </h3>
                                    {title.description && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {title.description}
                                      </p>
                                    )}
                                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      <span>颜色: {title.color}</span>
                                      <span>用户数: {title.userCount || 0}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openEditTitleDialog(title)}
                                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    编辑
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTitle(title._id)}
                                    className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                  >
                                    删除
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右侧：头衔分配 */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          头衔分配
                        </h2>
                        <button
                          onClick={() => setShowAssignTitleDialog(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          分配头衔
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            选择用户查看头衔
                          </label>
                          <select
                            value={selectedUserForTitle}
                            onChange={(e) => {
                              setSelectedUserForTitle(e.target.value)
                              if (e.target.value) {
                                loadUserTitles(e.target.value)
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">选择用户</option>
                            {users.map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.username} ({user.email})
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedUserForTitle && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              用户当前头衔
                            </h3>
                            {userTitles.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                该用户暂无头衔
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {userTitles.map((userTitle) => (
                                  <div
                                    key={userTitle._id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: userTitle.title?.color }}
                                      ></div>
                                      <div>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          {userTitle.title?.name}
                                        </span>
                                        {userTitle.title?.description && (
                                          <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {userTitle.title.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveUserTitle(userTitle.userId, userTitle.titleId)}
                                      className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                    >
                                      移除
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 创建头衔对话框 */}
                {showCreateTitleDialog && createPortal(
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            创建新头衔
                          </h3>
                          <button
                            onClick={() => {
                              setShowCreateTitleDialog(false)
                              setTitleName('')
                              setTitleColor('#3B82F6')
                              setTitleDescription('')
                            }}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            头衔名称 *
                          </label>
                          <input
                            type="text"
                            value={titleName}
                            onChange={(e) => setTitleName(e.target.value)}
                            placeholder="例如：活跃用户、贡献者"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            头衔颜色 *
                          </label>
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              {presetColors.map((preset) => (
                                <button
                                  key={preset.value}
                                  onClick={() => setTitleColor(preset.value)}
                                  className={`flex items-center space-x-2 p-2 rounded-md border-2 transition-colors ${
                                    titleColor === preset.value
                                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                  }`}
                                >
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: preset.value }}
                                  ></div>
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {preset.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={titleColor}
                                onChange={(e) => setTitleColor(e.target.value)}
                                className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                              />
                              <input
                                type="text"
                                value={titleColor}
                                onChange={(e) => setTitleColor(e.target.value)}
                                placeholder="#3B82F6"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            头衔描述
                          </label>
                          <textarea
                            value={titleDescription}
                            onChange={(e) => setTitleDescription(e.target.value)}
                            placeholder="描述这个头衔的含义和获得条件..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setShowCreateTitleDialog(false)
                              setTitleName('')
                              setTitleColor('#3B82F6')
                              setTitleDescription('')
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleCreateTitle}
                            disabled={processingTitle}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {processingTitle ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin mr-2" />
                                创建中...
                              </>
                            ) : (
                              '创建头衔'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

                {/* 编辑头衔对话框 */}
                {showEditTitleDialog && selectedTitle && createPortal(
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            编辑头衔
                          </h3>
                          <button
                            onClick={() => {
                              setShowEditTitleDialog(false)
                              setSelectedTitle(null)
                              setTitleName('')
                              setTitleColor('#3B82F6')
                              setTitleDescription('')
                            }}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            头衔名称 *
                          </label>
                          <input
                            type="text"
                            value={titleName}
                            onChange={(e) => setTitleName(e.target.value)}
                            placeholder="例如：活跃用户、贡献者"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            头衔颜色 *
                          </label>
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              {presetColors.map((preset) => (
                                <button
                                  key={preset.value}
                                  onClick={() => setTitleColor(preset.value)}
                                  className={`flex items-center space-x-2 p-2 rounded-md border-2 transition-colors ${
                                    titleColor === preset.value
                                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                  }`}
                                >
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: preset.value }}
                                  ></div>
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {preset.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={titleColor}
                                onChange={(e) => setTitleColor(e.target.value)}
                                className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                              />
                              <input
                                type="text"
                                value={titleColor}
                                onChange={(e) => setTitleColor(e.target.value)}
                                placeholder="#3B82F6"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            头衔描述
                          </label>
                          <textarea
                            value={titleDescription}
                            onChange={(e) => setTitleDescription(e.target.value)}
                            placeholder="描述这个头衔的含义和获得条件..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setShowEditTitleDialog(false)
                              setSelectedTitle(null)
                              setTitleName('')
                              setTitleColor('#3B82F6')
                              setTitleDescription('')
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleUpdateTitle}
                            disabled={processingTitle}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {processingTitle ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin mr-2" />
                                更新中...
                              </>
                            ) : (
                              '更新头衔'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

                {/* 分配头衔对话框 */}
                {showAssignTitleDialog && createPortal(
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            分配头衔
                          </h3>
                          <button
                            onClick={() => {
                              setShowAssignTitleDialog(false)
                              setSelectedUserForTitle('')
                              setSelectedTitleForAssign('')
                            }}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            选择用户 *
                          </label>
                          <select
                            value={selectedUserForTitle}
                            onChange={(e) => setSelectedUserForTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">选择用户</option>
                            {users.map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.username} ({user.email})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            选择头衔 *
                          </label>
                          <select
                            value={selectedTitleForAssign}
                            onChange={(e) => setSelectedTitleForAssign(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">选择头衔</option>
                            {titlesList.map((title) => (
                              <option key={title._id} value={title._id}>
                                {title.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedTitleForAssign && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ 
                                  backgroundColor: titlesList.find(t => t._id === selectedTitleForAssign)?.color 
                                }}
                              ></div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {titlesList.find(t => t._id === selectedTitleForAssign)?.name}
                              </span>
                            </div>
                            {titlesList.find(t => t._id === selectedTitleForAssign)?.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {titlesList.find(t => t._id === selectedTitleForAssign)?.description}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setShowAssignTitleDialog(false)
                              setSelectedUserForTitle('')
                              setSelectedTitleForAssign('')
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleAssignTitle}
                            disabled={assigningTitle}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {assigningTitle ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin mr-2" />
                                分配中...
                              </>
                            ) : (
                              '分配头衔'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            )}

            {/* 合作伙伴Logo管理内容 */}
            {activeTab === 'partner-logos' && (
              <div className="max-w-7xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <ImageIcon className="w-5 h-5 mr-2" />
                        合作伙伴Logo管理
                      </h2>
                      <div className="flex items-center space-x-2">
                        <label className="inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={partnerLogosEnabled}
                            onChange={(e) => setPartnerLogosEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                            {partnerLogosEnabled ? '已启用' : '已禁用'}
                          </span>
                        </label>
                        <button
                          onClick={updatePartnerLogos}
                          disabled={updatingPartnerLogos}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingPartnerLogos ? '保存中...' : '保存设置'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">关于合作伙伴Logo</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        合作伙伴Logo将显示在用户登录后的主页面Logo旁边。您可以添加1-2个合作伙伴的Logo，并可以随时启用或禁用此功能。
                      </p>
                    </div>

                    {/* 添加新Logo */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">添加新Logo</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL 或上传图片</label>
                          <div className="flex">
                            <input
                              type="text"
                              value={newLogoUrl}
                              onChange={(e) => setNewLogoUrl(e.target.value)}
                              placeholder="https://example.com/logo.png 或上传"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-md px-3 flex items-center justify-center">
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const reader = new FileReader()
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        setNewLogoUrl(event.target.result as string)
                                      }
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                }}
                              />
                              <ImageIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">合作伙伴名称</label>
                          <input
                            type="text"
                            value={newLogoName}
                            onChange={(e) => setNewLogoName(e.target.value)}
                            placeholder="合作伙伴名称"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={addPartnerLogo}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          添加Logo
                        </button>
                      </div>
                    </div>

                    {/* 现有Logo列表 */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">现有Logo列表</h3>
                      {partnerLogos.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 dark:text-gray-400">暂无合作伙伴Logo</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {partnerLogos.map((logo, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={logo.url} 
                                    alt={logo.name} 
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlLW9mZiI+PHBhdGggZD0iTTE4IDYgNiAxOCIvPjxwYXRoIGQ9Ik2IDE4VjhBMiAyIDAgMCAxIDggNmgxMGEyIDIgMCAwIDEgMiAydjEwYTIgMiAwIDAgMS0yIDJIOGEyIDIgMCAwIDEtMi0yeiIvPjxwYXRoIGQ9Ik0xMC41IDEyYTAuNSAwLjUgMCAxIDAgMC0xIDAuNSAwLjUgMCAwIDAgMCAxWiIvPjwvc3ZnPg=='
                                    }}
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">{logo.name}</h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{logo.url}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => removePartnerLogo(index)}
                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 预览 */}
                    <div className="mt-8">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">预览效果</h3>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                          <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
                          {partnerLogosEnabled && partnerLogos.map((logo, index) => (
                            <div key={index} className="h-10 px-2 border-l border-gray-200 dark:border-gray-600 flex items-center">
                              <img 
                                src={logo.url} 
                                alt={logo.name} 
                                className="max-h-8 max-w-[80px] object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlLW9mZiI+PHBhdGggZD0iTTE4IDYgNiAxOCIvPjxwYXRoIGQ9Ik2IDE4VjhBMiAyIDAgMCAxIDggNmgxMGEyIDIgMCAwIDEgMiAydjEwYTIgMiAwIDAgMS0yIDJIOGEyIDIgMCAwIDEtMi0yeiIvPjxwYXRoIGQ9Ik0xMC41IDEyYTAuNSAwLjUgMCAxIDAgMC0xIDAuNSAwLjUgMCAwIDAgMCAxWiIvPjwvc3ZnPg=='
                                }}
                              />
                            </div>
                          ))}
                          <div>
                            <h1 className="font-bold text-xl text-gray-900 dark:text-white">梦锡账号</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">统一管理</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 帖子管理内容 */}
            {activeTab === 'posts' && (
              <div className="max-w-7xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <Trash2 className="w-5 h-5 mr-2" />
                        帖子管理
                      </h2>
                      <div className="flex items-center space-x-4">
                        {/* 搜索框 */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="搜索帖子..."
                            value={postsSearchTerm}
                            onChange={(e) => setPostsSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handlePostsSearch()}
                            className="pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                        <button
                          onClick={handlePostsSearch}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          搜索
                        </button>
                        {selectedPosts.length > 0 && (
                          <button
                            onClick={() => setShowBatchDeleteDialog(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            批量删除 ({selectedPosts.length})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {postsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600 dark:text-gray-400">加载帖子列表...</span>
                      </div>
                    ) : postsList.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">暂无帖子</p>
                      </div>
                    ) : (
                      <>
                        {/* 全选控制 */}
                        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedPosts.length === postsList.length && postsList.length > 0}
                              onChange={handleSelectAllPosts}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              全选 ({selectedPosts.length}/{postsList.length})
                            </span>
                          </label>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            总计 {postsList.length} 个帖子
                          </div>
                        </div>

                        {/* 帖子列表 */}
                        <div className="space-y-4">
                          {postsList.map((post) => (
                            <div
                              key={post._id}
                              className={`p-4 border rounded-lg transition-colors ${
                                selectedPosts.includes(post._id)
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                            >
                              <div className="flex items-start space-x-4">
                                <input
                                  type="checkbox"
                                  checked={selectedPosts.includes(post._id)}
                                  onChange={() => handlePostSelect(post._id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {post.author?.username || '未知用户'}
                                        {post.author?.role === 'admin' && (
                                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                            管理员
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(post.createdAt).toLocaleString('zh-CN')}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                      <span>👍 {post.likesCount || 0}</span>
                                      <span>💬 {post.commentsCount || 0}</span>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3">
                                      {post.content}
                                    </p>
                                    {post.images && post.images.length > 0 && (
                                      <div className="mt-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          📷 {post.images.length} 张图片
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 分页控制 */}
                        {postsTotalPages > 1 && (
                          <div className="flex items-center justify-center space-x-2 mt-6">
                            <button
                              onClick={() => setPostsPage(Math.max(1, postsPage - 1))}
                              disabled={postsPage === 1}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              上一页
                            </button>
                            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                              第 {postsPage} 页，共 {postsTotalPages} 页
                            </span>
                            <button
                              onClick={() => setPostsPage(Math.min(postsTotalPages, postsPage + 1))}
                              disabled={postsPage === postsTotalPages}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              下一页
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 申述处理对话框 */}
        {showAppealDialog && selectedAppeal && createPortal(
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4"
            onClick={() => {
              setShowAppealDialog(false)
              setSelectedAppeal(null)
              setAppealResponse('')
              setSendNotificationToUser(true)
            }}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    处理申述 - {selectedAppeal.user?.username}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAppealDialog(false)
                      setSelectedAppeal(null)
                      setAppealResponse('')
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">申述信息</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">申述原因：</span>{selectedAppeal.reason}</p>
                    {selectedAppeal.details && (
                      <p><span className="font-medium">详细说明：</span>{selectedAppeal.details}</p>
                    )}
                    {selectedAppeal.images && selectedAppeal.images.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">申述图片：</p>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedAppeal.images.map((image: string, index: number) => (
                            <img
                              key={index}
                              src={image}
                              alt={`申述图片 ${index + 1}`}
                              className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(image, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <p><span className="font-medium">申述时间：</span>{new Date(selectedAppeal.submittedAt || selectedAppeal.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                </div>

                {selectedAppeal.ban && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">相关封禁信息</h4>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg space-y-2">
                      <p><span className="font-medium">封禁原因：</span>{selectedAppeal.ban.reason}</p>
                      <p><span className="font-medium">封禁时间：</span>{new Date(selectedAppeal.ban.createdAt).toLocaleString('zh-CN')}</p>
                      {selectedAppeal.ban.expiresAt && (
                        <p><span className="font-medium">到期时间：</span>{new Date(selectedAppeal.ban.expiresAt).toLocaleString('zh-CN')}</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    管理员回复
                  </label>
                  <textarea
                    value={appealResponse}
                    onChange={(e) => setAppealResponse(e.target.value)}
                    placeholder="请输入处理结果的说明..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 系统通知选项 */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={sendNotificationToUser}
                      onChange={(e) => setSendNotificationToUser(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      发送处理结果通知给用户
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    选中后将向用户发送系统通知，告知申述处理结果
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAppeal(true)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    通过申述并解封
                  </button>
                  <button
                    onClick={() => handleAppeal(false)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    驳回申述
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

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

        {/* 解封确认弹窗 */}
        {showUnbanDialog && selectedUnbanUser && createPortal(
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4"
            onClick={() => {
              setShowUnbanDialog(false)
              setSelectedUnbanUser(null)
              setSendUnbanNotification(true)
            }}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="bg-green-600 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">解除封禁</h2>
                      <p className="text-green-100 text-sm">管理员操作确认</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUnbanDialog(false)
                      setSelectedUnbanUser(null)
                      setSendUnbanNotification(true)
                    }}
                    className="text-green-100 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* 内容 */}
              <div className="p-6 space-y-6">
                {/* 用户信息 */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                     <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                     <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                     被封禁用户信息
                   </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">用户名：</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedUnbanUser.user?.username || '未知用户'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">封禁原因：</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right max-w-48 break-words">
                        {selectedUnbanUser.reason}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">封禁时间：</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedUnbanUser.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    {selectedUnbanUser.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">到期时间：</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(selectedUnbanUser.expiresAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    )}
                    {selectedUnbanUser.notes && (
                      <div className="col-span-2">
                        <span className="text-gray-600 dark:text-gray-400">管理员备注：</span>
                        <p className="font-medium text-gray-900 dark:text-white mt-1">
                          {selectedUnbanUser.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 确认信息 */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 dark:text-green-300 text-sm font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">解封操作说明</h4>
                      <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                        <li>• 用户将立即恢复所有功能权限</li>
                        <li>• 可以正常使用社交、私信等功能</li>
                        <li>• 封禁记录将标记为"已解除"状态</li>
                        <li>• 此操作无法撤销，请谨慎确认</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 系统通知选项 */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={sendUnbanNotification}
                      onChange={(e) => setSendUnbanNotification(e.target.checked)}
                      className="mt-1 rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        发送解封通知给用户
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        选中后将向用户发送系统通知，告知封禁已解除并可正常使用功能
                      </p>
                    </div>
                  </label>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowUnbanDialog(false)
                      setSelectedUnbanUser(null)
                      setSendUnbanNotification(true)
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    取消操作
                  </button>
                  <button
                    onClick={executeUnban}
                    disabled={processingUnban}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                  >
                    {processingUnban ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        解封中...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        确认解封
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
      
            {/* Wiki管理内容 */}
            {activeTab === 'wiki' && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <BookOpen className="w-6 h-6 mr-3 text-blue-600" />
                    Wiki文档管理
                  </h2>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          Wiki系统已集成
                        </h3>
                        <p className="text-blue-800 dark:text-blue-200 mb-4">
                          完整的Wiki文档管理系统已经集成到平台中，您可以通过导航菜单中的"Wiki文档"来管理知识库内容。
                        </p>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">📝 文档管理</h4>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• 创建和编辑Wiki文档</li>
                                <li>• 支持Markdown格式</li>
                                <li>• 文档分类管理</li>
                                <li>• 访问权限控制</li>
                              </ul>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">📂 内容导入</h4>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• 批量导入Markdown文档</li>
                                <li>• 屯人服Wiki内容移植</li>
                                <li>• 自动分类整理</li>
                                <li>• 历史版本管理</li>
                              </ul>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">🏷️ 分类管理</h4>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• 创建文档分类</li>
                                <li>• 自定义分类图标</li>
                                <li>• 分类排序管理</li>
                                <li>• 分类描述设置</li>
                              </ul>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">🔍 搜索浏览</h4>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• 全文搜索功能</li>
                                <li>• 分类筛选浏览</li>
                                <li>• 树状结构展示</li>
                                <li>• 快速访问入口</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                              🚀 屯人服Wiki导入说明
                            </h4>
                            <div className="text-sm text-green-700 dark:text-green-400 space-y-2">
                              <p>系统已经准备好了屯人服Wiki的完整内容，包括：</p>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <span>• 服务器介绍</span>
                                <span>• 加入指南</span>
                                <span>• 服务器规则</span>
                                <span>• 绑定系统</span>
                                <span>• 传送点系统</span>
                                <span>• 假人系统</span>
                                <span>• 枪械系统</span>
                                <span>• 指令大全</span>
                                <span>• 常见问题</span>
                              </div>
                              <p className="mt-2">
                                <strong>导入方法：</strong>访问导航菜单中的"Wiki文档" → "批量导入"，或使用命令行工具：
                                <code className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded text-xs ml-2">
                                  npm run import-wiki
                                </code>
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 mt-6">
                          <button
                            onClick={() => window.open('/wiki', '_blank')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>打开Wiki系统</span>
                          </button>
                          
                          <button
                            onClick={() => navigator.clipboard.writeText('npm run import-wiki')}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
                          >
                            <span>📋</span>
                            <span>复制导入命令</span>
                          </button>
                          
                          <a
                            href="https://wiki.506521.xyz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
                          >
                            <span>🔗</span>
                            <span>访问原Wiki</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
      
            {/* 批量删除确认对话框 */}
        {showBatchDeleteDialog && createPortal(
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4"
            onClick={() => setShowBatchDeleteDialog(false)}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    批量删除帖子
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  您确定要删除选中的 {selectedPosts.length} 个帖子吗？此操作不可撤销，同时会删除这些帖子的所有评论和点赞记录。
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowBatchDeleteDialog(false)}
                    disabled={batchDeleting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleBatchDeletePosts}
                    disabled={batchDeleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {batchDeleting && <Loader className="h-4 w-4 animate-spin" />}
                    <span>{batchDeleting ? '删除中...' : '确认删除'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>, 
          document.body
        )}
      </>
    )
  }

  export default AdminPage 