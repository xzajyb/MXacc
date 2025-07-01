import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Heart,
  MessageCircle,
  Share,
  Search,
  Send,
  MessageSquare,
  UserPlus,
  UserMinus,
  Trash2,
  Image as ImageIcon,
  Plus,
  Reply,
  User as UserIcon,
  MapPin,
  Calendar,
  X,
  AlertCircle,
  Shield,
  Lock,
  MoreHorizontal,
  Clock,
  Upload
} from 'lucide-react'
import MessagingModal from '../components/MessagingModal'
import UserProfile from '../components/UserProfile'
import BanNotice from '../components/BanNotice'
import ConfirmDialog from '../components/ConfirmDialog'
import CommentTree, { TreeComment } from '../components/CommentTree'
import { buildCommentTree, updateCommentInTree, removeCommentFromTree, addReplyToTree } from '../utils/commentUtils'
import { createPortal } from 'react-dom'
import axios from 'axios'

interface Post {
  id: string
  content: string
  images: string[]
  author: {
    id: string
    username: string
    nickname: string
    avatar: string
    role?: string
    titles?: {
      id: string
      name: string
      color: string
      description?: string
    }[]
  }
  likesCount: number
  commentsCount: number
  isLiked: boolean
  canDelete: boolean
  createdAt: string
  updatedAt: string
}

interface Comment {
  id: string
  content: string
  parentId?: string
  author: {
    id: string
    username: string
    nickname: string
    avatar: string
    role?: string
    titles?: {
      id: string
      name: string
      color: string
      description?: string
    }[]
  }
  replyTo?: {
    id: string
    username: string
    nickname: string
  }
  likesCount: number
  isLiked: boolean
  canDelete: boolean
  createdAt: string
  replies?: Comment[]
}

interface User {
  id: string
  username: string
  nickname: string
  avatar: string
  bio?: string
  location?: string
  isFollowing: boolean
  followersCount: number
  followingCount: number
  postsCount: number
  joinedAt: string
  role?: string
  titles?: {
    id: string
    name: string
    color: string
    description?: string
  }[]
}

interface SocialPageProps {
  embedded?: boolean
  onUnreadCountChange?: (count: number) => void
}

const SocialPage: React.FC<SocialPageProps> = ({ embedded = false, onUnreadCountChange }) => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const { t, formatDate } = useLanguage()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<'feed' | 'following' | 'profile' | 'messages'>('feed')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, TreeComment[]>>({})
  const [commentContent, setCommentContent] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<Record<string, { commentId: string, username: string } | undefined>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [showMessaging, setShowMessaging] = useState(false)
  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  
  // 确认对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'post' | 'comment'
    id: string
    postId?: string
  } | null>(null)
  
  // 删除会话对话框状态
  const [showDeleteConversationDialog, setShowDeleteConversationDialog] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<{
    id: string
    nickname: string
  } | null>(null)
  const [deletingConversation, setDeletingConversation] = useState(false)
  
  // 个人主页状态
  const [myProfile, setMyProfile] = useState<any>(null)
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileTab, setProfileTab] = useState<'posts' | 'followers' | 'following'>('posts')
  const [myFollowers, setMyFollowers] = useState<any[]>([])
  const [myFollowing, setMyFollowing] = useState<any[]>([])
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)
  const [userPrivacySettings, setUserPrivacySettings] = useState<any>(null)
  
  // 图片上传状态
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  
  // 私信状态
  const [conversations, setConversations] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  // 图片查看状态
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  
  // 搜索加载状态
  const [searchLoading, setSearchLoading] = useState(false)
  
  // 私信列表加载状态
  const [conversationsLoading, setConversationsLoading] = useState(false)
  
  // 封禁状态
  const [userBan, setUserBan] = useState<any>(null)
  
  // 申述相关状态
  const [showAppealModal, setShowAppealModal] = useState(false)
  const [appealReason, setAppealReason] = useState('')
  const [appealDescription, setAppealDescription] = useState('')
  const [submittingAppeal, setSubmittingAppeal] = useState(false)
  const [appealHistory, setAppealHistory] = useState<any[]>([])
  const [loadingAppealHistory, setLoadingAppealHistory] = useState(false)
  const [currentAppeal, setCurrentAppeal] = useState<any>(null)
  const [appealImages, setAppealImages] = useState<File[]>([])
  const [appealImagePreviews, setAppealImagePreviews] = useState<string[]>([])
  
  // 邮箱验证状态检查
  const isEmailVerified = user?.isEmailVerified || false
  
  // 检查社交功能可用性
  const isSocialFeatureEnabled = isEmailVerified && !userBan
  
  // 统一处理封禁错误响应
  const handleBanErrorResponse = async (errorData: any) => {
    if (errorData.ban) {
      // 直接使用响应中的封禁信息，格式化后设置
      const banData = errorData.ban
      const formattedBan = {
        reason: banData.reason,
        expiresAt: banData.expiresAt,
        isPermanent: !banData.expiresAt || banData.durationType === 'permanent',
        banId: banData._id || banData.banId || banData.id || 'unknown'
      }
      setUserBan(formattedBan)
      return true
    }
    return false
  }

  // 当未读消息数量变化时，通知外部组件
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount)
    }
  }, [unreadCount, onUnreadCountChange])

  // 静默检查封禁状态（不显示加载状态）
  useEffect(() => {
    if (user?.id) {
      checkBanStatusSilently()
    }
  }, [user?.id])

  // 定期刷新未读消息数量
  useEffect(() => {
    if (isSocialFeatureEnabled) {
      // 立即获取一次
      fetchUnreadCount()
      
      // 每30秒刷新一次未读数量
      const interval = setInterval(fetchUnreadCount, 10000) // 改为10秒更新一次
      return () => clearInterval(interval)
    }
  }, [isSocialFeatureEnabled])

  // 静默检查用户封禁状态
  const checkBanStatusSilently = async () => {
    if (!user?.id) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/social/content?action=ban-management&subAction=check', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success && response.data.data.isBanned) {
        const banData = response.data.data.ban
        // 转换数据格式以匹配BanNotice组件期望的格式
        const formattedBan = {
          reason: banData.reason,
          expiresAt: banData.expiresAt,
          isPermanent: !banData.expiresAt || banData.durationType === 'permanent',
          banId: banData._id || banData.banId || banData.id
        }
        setUserBan(formattedBan)
      } else {
        setUserBan(null)
      }
    } catch (error) {
      console.error('检查封禁状态失败:', error)
      setUserBan(null)
    }
  }

  // 获取申述历史
  const fetchAppealHistory = async () => {
    if (!userBan?.banId) return
    
    setLoadingAppealHistory(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/social/content?action=ban-management&subAction=my-appeals', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        const allAppeals = response.data.data.appeals || []
        
        // 只保留与当前封禁相关的申述记录
        const currentBanAppeals = allAppeals.filter((appeal: any) => 
          appeal.banId === userBan.banId
        )
        setAppealHistory(currentBanAppeals)
        
        // 查找当前待处理的申述
        const pendingAppeal = currentBanAppeals.find((appeal: any) => 
          appeal.status === 'pending'
        )
        setCurrentAppeal(pendingAppeal || null)
      }
    } catch (error) {
      console.error('获取申述历史失败:', error)
    } finally {
      setLoadingAppealHistory(false)
    }
  }

  // 申述图片选择处理
  const handleAppealImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // 限制最多3张图片
    if (appealImages.length + files.length > 3) {
      showError('最多只能上传3张图片')
      return
    }
    
    // 验证文件类型和大小
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        showError(`文件 ${file.name} 不是有效的图片格式`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB限制
        showError(`文件 ${file.name} 超过5MB大小限制`)
        return false
      }
      return true
    })
    
    // 读取图片并生成预览
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setAppealImagePreviews(prev => [...prev, result])
      }
      reader.readAsDataURL(file)
    })
    
    setAppealImages(prev => [...prev, ...validFiles])
  }

  // 移除申述图片
  const removeAppealImage = (index: number) => {
    setAppealImages(prev => prev.filter((_, i) => i !== index))
    setAppealImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // 提交申述
  const handleSubmitAppeal = async () => {
    if (!appealReason.trim()) {
      showError('请填写申述原因')
      return
    }

    if (!userBan?.banId) {
      showError('封禁信息错误，无法提交申述')
      return
    }

    setSubmittingAppeal(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/social/content', {
        action: 'submit-appeal',
        banId: userBan.banId,
        reason: appealReason.trim(),
        description: appealDescription.trim(),
        images: appealImagePreviews // 发送base64图片数据
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      showSuccess('申述已提交，我们会尽快处理，请查看系统通知获取更新')
      setAppealReason('')
      setAppealDescription('')
      setAppealImages([])
      setAppealImagePreviews([])
      
      // 重新获取申述历史
      await fetchAppealHistory()
    } catch (error: any) {
      console.error('提交申述失败:', error)
      showError(error.response?.data?.message || '提交申述失败')
    } finally {
      setSubmittingAppeal(false)
    }
  }

  // 打开申述弹窗时获取申述历史
  const handleOpenAppealModal = () => {
    setShowAppealModal(true)
    fetchAppealHistory()
  }

  // 关闭申述弹窗时清理状态
  const handleCloseAppealModal = () => {
    setShowAppealModal(false)
    setAppealReason('')
    setAppealDescription('')
    setAppealImages([])
    setAppealImagePreviews([])
  }

  // 获取未读消息数量
  const fetchUnreadCount = async () => {
    if (!isSocialFeatureEnabled) {
      console.log('📊 fetchUnreadCount: 社交功能未启用，跳过')
      return
    }

    try {
      console.log('📊 fetchUnreadCount: 开始获取未读计数')
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/messaging?action=conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const conversationsData = data.data.conversations
        const totalUnread = conversationsData.reduce((total: number, conv: any) => total + conv.unreadCount, 0)
        console.log('📊 fetchUnreadCount: 会话数量=', conversationsData.length, '总未读数=', totalUnread)
        setUnreadCount(totalUnread)
        // 更新会话列表，确保每个会话的未读计数也被更新
        setConversations(conversationsData)
      } else {
        console.log('📊 fetchUnreadCount: API响应失败，状态码=', response.status)
      }
    } catch (error) {
      console.error('📊 fetchUnreadCount: 获取未读消息数量失败:', error)
    }
  }

  // 获取帖子列表
  const fetchPosts = async (type: 'feed' | 'following' = 'feed', page: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/content?action=posts&type=${type}&page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (append) {
          setPosts(prev => [...prev, ...data.data.posts])
        } else {
          setPosts(data.data.posts)
        }
        // 检查是否还有更多帖子可加载
        setHasMorePosts(data.data.posts.length === 10)
        setCurrentPage(page)
      } else {
        throw new Error('获取帖子失败')
      }
    } catch (error) {
      console.error('获取帖子失败:', error)
      showError('获取帖子失败')
    } finally {
      setLoading(false)
    }
  }

  // 发布新帖子
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      showError('请输入帖子内容')
      return
    }

    // 优先检查封禁状态
    if (userBan) {
      showError('您已被封禁，无法使用社交功能')
      return
    }

    if (!isEmailVerified) {
      showError('请先验证邮箱后再使用社交功能')
      return
    }

    try {
      setIsPosting(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create-post',
          content: newPostContent.trim(),
          images: imagePreviewUrls // 直接使用base64字符串
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setPosts(prev => [data.data, ...prev])
        setNewPostContent('')
        // 清空图片选择
        setSelectedImages([])
        setImagePreviewUrls([])
        showSuccess('帖子发布成功')
      } else {
        const errorData = await response.json()
        
        // 检查是否是发帖频率限制错误
        if (response.status === 429) {
          showError(errorData.message || '发帖过于频繁，请稍后再试')
          return
        }
        
        // 检查是否是封禁错误
        const isBanError = await handleBanErrorResponse(errorData)
        if (isBanError) {
          showError('您已被封禁，无法使用社交功能。请查看封禁详情。')
        } else {
          throw new Error(errorData.message || '发布失败')
        }
      }
    } catch (error: any) {
      console.error('发布帖子失败:', error)
      if (!error.message?.includes('封禁')) {
        showError(error.message || '发布帖子失败')
      }
    } finally {
      setIsPosting(false)
    }
  }

  // 点赞/取消点赞帖子
  const handleLike = async (postId: string) => {
    // 优先检查封禁状态
    if (userBan) {
      showError('您已被封禁，无法使用社交功能')
      return
    }

    if (!isEmailVerified) {
      showError('请先验证邮箱后再使用社交功能')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'toggle-like',
          type: 'post',
          postId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, isLiked: data.data.isLiked, likesCount: data.data.likesCount }
            : post
        ))
      } else {
        const errorData = await response.json()
        // 检查是否是封禁错误
        const isBanError = await handleBanErrorResponse(errorData)
        if (isBanError) {
          showError('您已被封禁，无法使用社交功能。请查看封禁详情。')
        } else {
          throw new Error(errorData.message || '操作失败')
        }
      }
    } catch (error: any) {
      console.error('点赞操作失败:', error)
      if (!error.message?.includes('封禁')) {
        showError(error.message || '操作失败')
      }
    }
  }

  // 点赞/取消点赞评论
  const handleCommentLike = async (commentId: string) => {
    // 优先检查封禁状态
    if (userBan) {
      showError('您已被封禁，无法使用社交功能')
      return
    }

    if (!isEmailVerified) {
      showError('请先验证邮箱后再使用社交功能')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'toggle-like',
          type: 'comment',
          commentId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // 在树状结构中更新评论
        const postId = Object.keys(showComments).find(id => showComments[id])
        if (postId) {
          setComments(prev => ({
            ...prev,
            [postId]: updateCommentInTree(prev[postId] || [], commentId, comment => ({
              ...comment,
              isLiked: data.data.isLiked,
              likesCount: data.data.likesCount
            }))
          }))
        }
      } else {
        const errorData = await response.json()
        // 检查是否是封禁错误
        const isBanError = await handleBanErrorResponse(errorData)
        if (isBanError) {
          showError('您已被封禁，无法使用社交功能。请查看封禁详情。')
        } else {
          throw new Error(errorData.message || '操作失败')
        }
      }
    } catch (error: any) {
      console.error('评论点赞失败:', error)
      if (!error.message?.includes('封禁')) {
        showError(error.message || '操作失败')
      }
    }
  }

  // 删除评论
  const handleCommentDelete = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token')
      const postId = Object.keys(showComments).find(id => showComments[id])
      
      if (!postId) {
        showError('无法找到对应的帖子')
        return
      }

      // 先立即从界面中移除评论（乐观更新）
      setComments(prev => ({
        ...prev,
        [postId]: removeCommentFromTree(prev[postId] || [], commentId)
      }))

      const response = await fetch(`/api/social/content?action=comment&id=${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        // 重新获取准确的评论计数（因为删除评论可能包含子评论）
        const countResponse = await fetch(`/api/social/content?action=comments&postId=${postId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (countResponse.ok) {
          const countData = await countResponse.json()
          const newCommentsCount = countData.data.stats.totalComments
          
          // 更新帖子的评论计数
          setPosts(prev => prev.map(post => 
            post.id === postId 
              ? { ...post, commentsCount: newCommentsCount }
              : post
          ))
          setMyPosts(prev => prev.map(post => 
            post.id === postId 
              ? { ...post, commentsCount: newCommentsCount }
              : post
          ))

          // 同时更新评论树结构，确保与服务器数据一致
          if (countData.data.comments) {
            const treeComments = buildCommentTree(countData.data.comments)
            setComments(prev => ({ ...prev, [postId]: treeComments }))
          }
        }
        showSuccess('评论删除成功')
      } else if (response.status === 404) {
        // 404错误表示评论不存在，已经从界面删除了，不需要恢复
        // 重新获取评论数据确保界面一致性
        await fetchComments(postId)
        showSuccess('评论已被删除（可能已在其他地方删除）')
      } else {
        // 其他错误，恢复评论显示
        await fetchComments(postId)
        const errorData = await response.json()
        throw new Error(errorData.message || '删除失败')
      }
    } catch (error: any) {
      console.error('删除评论失败:', error)
      showError(error.message || '删除失败')
      // 如果出错，重新获取评论确保数据一致性
      // 但如果是404错误（评论不存在），则不需要恢复
      const postId = Object.keys(showComments).find(id => showComments[id])
      if (postId && !error.message?.includes('已被删除')) {
        await fetchComments(postId)
      }
    }
  }

  // 显示删除确认对话框
  const showDeleteConfirmDialog = (type: 'post' | 'comment', id: string, postId?: string) => {
    setDeleteTarget({ type, id, postId })
    setShowDeleteConfirm(true)
  }

  // 执行删除操作
  const executeDelete = async () => {
    if (!deleteTarget) return

    try {
      const token = localStorage.getItem('token')
      const { type, id, postId } = deleteTarget
      
      const response = await fetch(`/api/social/content?action=${type}&id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        if (type === 'post') {
          // 成功删除，从页面移除
          setPosts(prev => prev.filter(post => post.id !== id))
          setMyPosts(prev => prev.filter(post => post.id !== id))
          showSuccess('帖子删除成功')
        } else {
          // 删除评论 - 这个函数已被新的handleCommentDelete替代
          // 但为了兼容性保留简单逻辑
          showSuccess('评论删除成功')
        }
      } else if (response.status === 404) {
        // 404错误表示帖子/评论不存在，从页面移除
        if (type === 'post') {
          setPosts(prev => prev.filter(post => post.id !== id))
          setMyPosts(prev => prev.filter(post => post.id !== id))
          showSuccess('帖子已被删除（可能已在其他地方删除）')
        } else {
          showSuccess('评论已被删除（可能已在其他地方删除）')
        }
      } else {
        // 其他错误，显示错误信息但不删除
        const errorData = await response.json()
        throw new Error(errorData.message || '删除失败')
      }
    } catch (error: any) {
      console.error('删除失败:', error)
      showError(error.message || '删除失败')
    } finally {
      setShowDeleteConfirm(false)
      setDeleteTarget(null)
    }
  }

  // 取消删除
  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeleteTarget(null)
  }

  // 获取评论
  const fetchComments = async (postId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/content?action=comments&postId=${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // 将平展的评论转换为树状结构
        const treeComments = buildCommentTree(data.data.comments)
        setComments(prev => ({ ...prev, [postId]: treeComments }))
      }
    } catch (error) {
      console.error('获取评论失败:', error)
    }
  }

  // 发布评论
  const handleComment = async (postId: string) => {
    const content = commentContent[postId]
    if (!content || !content.trim()) {
      showError('请输入评论内容')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const reply = replyingTo[postId]
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create-comment',
          postId,
          content: content.trim(),
          parentId: reply?.commentId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const newComment = data.data.comment
        
        if (reply?.commentId) {
          // 如果是回复，添加到对应的父评论下
          setComments(prev => ({
            ...prev,
            [postId]: addReplyToTree(prev[postId] || [], reply.commentId, newComment)
          }))
        } else {
          // 如果是根评论，添加到根级别
          const treeComment: TreeComment = {
            ...newComment,
            children: [],
            level: 1,
            isExpanded: true
          }
          setComments(prev => ({
            ...prev,
            [postId]: [treeComment, ...(prev[postId] || [])]
          }))
        }
        
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, commentsCount: data.data.commentsCount }
            : post
        ))
        setCommentContent(prev => ({ ...prev, [postId]: '' }))
        const { [postId]: _, ...restReplyingTo } = replyingTo
        setReplyingTo(restReplyingTo)
        showSuccess('评论发布成功')
      } else {
        const errorData = await response.json()
        // 检查是否是封禁错误
        const isBanError = await handleBanErrorResponse(errorData)
        if (isBanError) {
          showError('您已被封禁，无法使用社交功能。请查看封禁详情。')
        } else {
          throw new Error(errorData.message || '评论失败')
        }
      }
    } catch (error: any) {
      console.error('发布评论失败:', error)
      if (!error.message?.includes('封禁')) {
        showError(error.message || '发布评论失败')
      }
    }
  }

  // 处理二级评论的回复
  const handleCommentReply = async (parentId: string, content: string, replyTo?: { id: string; username: string; nickname: string }) => {
    // 找到当前正在显示评论的帖子ID
    const postId = Object.keys(showComments).find(id => showComments[id])
    if (!postId) {
      showError('无法找到对应的帖子')
      return
    }

    // 检查是否是回复二级评论
    const currentComments = comments[postId] || []
    let targetParentId = parentId
    let finalReplyTo = replyTo

    // 查找被回复的评论
    const findComment = (commentList: TreeComment[], commentId: string): TreeComment | null => {
      for (const comment of commentList) {
        if (comment.id === commentId) return comment
        if (comment.children.length > 0) {
          const found = findComment(comment.children, commentId)
          if (found) return found
        }
      }
      return null
    }

    const targetComment = findComment(currentComments, parentId)
    
    // 如果回复的是二级评论，改为回复其父评论，但在内容中显示被回复人
    if (targetComment && targetComment.level === 2) {
      // 找到父评论ID
      for (const rootComment of currentComments) {
        const childFound = rootComment.children.find(child => child.id === parentId)
        if (childFound) {
          targetParentId = rootComment.id
          finalReplyTo = {
            id: targetComment.author.id,
            username: targetComment.author.username,
            nickname: targetComment.author.nickname
          }
          break
        }
      }
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create-comment',
          postId,
          content: content.trim(),
          parentId: targetParentId,
          replyTo: finalReplyTo ? {
            userId: finalReplyTo.id,
            username: finalReplyTo.username,
            nickname: finalReplyTo.nickname
          } : undefined
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const newComment = data.data.comment
        
        // 添加到树状结构中
        setComments(prev => ({
          ...prev,
          [postId]: addReplyToTree(prev[postId] || [], targetParentId, newComment)
        }))
        
        // 更新帖子的评论计数 - 使用后端返回的准确计数
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, commentsCount: data.data.commentsCount }
            : post
        ))
        
        showSuccess('回复发布成功')
      } else {
        const errorData = await response.json()
        // 检查是否是封禁错误
        const isBanError = await handleBanErrorResponse(errorData)
        if (isBanError) {
          showError('您已被封禁，无法使用社交功能。请查看封禁详情。')
          return
        } else {
          throw new Error(errorData.message || '回复失败')
        }
      }
    } catch (error: any) {
      console.error('发布回复失败:', error)
      if (!error.message?.includes('封禁')) {
        throw error
      }
    }
  }

  // 搜索用户
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    // 优先检查封禁状态
    if (userBan) {
      showError('您已被封禁，无法使用社交功能')
      return
    }

    if (!isEmailVerified) {
      showError('请先验证邮箱后再使用社交功能')
      return
    }

    try {
      setSearchLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/messaging?action=search-users&search=${encodeURIComponent(searchQuery.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.data.users)
      }
    } catch (error) {
      console.error('搜索用户失败:', error)
      showError('搜索失败')
    } finally {
      setSearchLoading(false)
    }
  }

  // 关注/取消关注用户
  const handleFollow = async (userId: string, isFollowing: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/messaging', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: isFollowing ? 'unfollow' : 'follow',
          userId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: data.data.isFollowing, followersCount: data.data.followersCount }
            : user
        ))
        showSuccess(data.message)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || '操作失败')
      }
    } catch (error: any) {
      console.error('关注操作失败:', error)
      showError(error.message || '操作失败')
    }
  }

  // 显示/隐藏评论
  const toggleComments = (postId: string) => {
    setShowComments(prev => {
      const newState = { ...prev, [postId]: !prev[postId] }
      if (newState[postId] && !comments[postId]) {
        fetchComments(postId)
      }
      return newState
    })
  }

  // 回复评论
  const handleReply = (postId: string, commentId: string, username: string) => {
    setReplyingTo(prev => ({ ...prev, [postId]: { commentId, username } }))
    setCommentContent(prev => ({ ...prev, [postId]: `@${username} ` }))
  }

  // 查看用户资料
  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId)
    setShowUserProfile(true)
  }

  // 发送私信
  const handleMessage = (user: User) => {
    setTargetUser(user)
    setShowMessaging(true)
  }

  // 切换到个人资料选项栏
  const handleGoToProfile = () => {
    setActiveTab('profile')
    if (!myProfile) {
      fetchMyProfile()
    }
  }
  
  // 获取我的个人资料
  const fetchMyProfile = async () => {
    try {
      setProfileLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/messaging?action=user-profile&userId=${user?.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMyProfile(data.data)
      }
      
      // 获取我的帖子
      const postsResponse = await fetch(`/api/social/content?action=posts&type=user&userId=${user?.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        setMyPosts(postsData.data.posts)
      }

      // 获取隐私设置
      await fetchUserPrivacySettings()
    } catch (error) {
      console.error('获取个人资料失败:', error)
      showError('获取个人资料失败')
    } finally {
      setProfileLoading(false)
    }
  }
  
  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + selectedImages.length > 4) {
      showError('最多只能选择4张图片')
      return
    }
    
    // 处理文件为base64
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB限制
        showError('图片大小不能超过5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setSelectedImages(prev => [...prev, file])
        setImagePreviewUrls(prev => [...prev, base64])
      }
      reader.readAsDataURL(file)
    })
  }
  
  // 移除图片
  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newUrls = imagePreviewUrls.filter((_, i) => i !== index)
    setSelectedImages(newImages)
    setImagePreviewUrls(newUrls)
  }

  // 获取用户隐私设置
  const fetchUserPrivacySettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/user-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserPrivacySettings(data.settings?.privacy || null)
      }
    } catch (error) {
      console.error('获取隐私设置失败:', error)
    }
  }

  // 获取我的粉丝列表
  const fetchMyFollowers = async () => {
    if (!user?.id) return

    try {
      setFollowersLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/messaging?action=followers&userId=${user.id}&page=1&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMyFollowers(data.data.followers)
      }
    } catch (error) {
      console.error('获取粉丝列表失败:', error)
      showError('获取粉丝列表失败')
    } finally {
      setFollowersLoading(false)
    }
  }

  // 获取我的关注列表
  const fetchMyFollowing = async () => {
    if (!user?.id) return

    try {
      setFollowingLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/messaging?action=following&userId=${user.id}&page=1&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMyFollowing(data.data.following)
      }
    } catch (error) {
      console.error('获取关注列表失败:', error)
      showError('获取关注列表失败')
    } finally {
      setFollowingLoading(false)
    }
  }

  // 关注/取消关注用户（在粉丝关注列表中）
  const handleFollowUserInList = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/messaging', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: isCurrentlyFollowing ? 'unfollow' : 'follow',
          userId: targetUserId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // 更新粉丝列表中的关注状态
        setMyFollowers(prev => prev.map(follower => 
          follower.id === targetUserId 
            ? { ...follower, isFollowing: data.data.isFollowing }
            : follower
        ))
        
        // 更新关注列表中的关注状态
        setMyFollowing(prev => prev.map(following => 
          following.id === targetUserId 
            ? { ...following, isFollowing: data.data.isFollowing }
            : following
        ))
        
        showSuccess(data.message)
      }
    } catch (error) {
      console.error('关注操作失败:', error)
      showError('操作失败')
    }
  }

  // 获取会话列表
  const fetchConversations = async () => {
    // 优先检查封禁状态
    if (userBan) {
      showError('您已被封禁，无法使用社交功能')
      return
    }

    if (!isEmailVerified) {
      showError('请先验证邮箱后再使用社交功能')
      return
    }

    try {
      setConversationsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/messaging?action=conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setConversations(data.data.conversations)
        // 计算未读消息数
        const unread = data.data.conversations.reduce((total: number, conv: any) => total + conv.unreadCount, 0)
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('获取会话列表失败:', error)
    } finally {
      setConversationsLoading(false)
    }
  }

  // 显示删除会话确认对话框
  const handleDeleteConversation = (conversationId: string, nickname: string) => {
    setConversationToDelete({ id: conversationId, nickname })
    setShowDeleteConversationDialog(true)
  }

  // 执行删除会话（从私信列表中隐藏）
  const executeDeleteConversation = async () => {
    if (!conversationToDelete) return

    setDeletingConversation(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/messaging', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'hide-conversation',
          conversationId: conversationToDelete.id
        })
      })
      
      if (response.ok) {
        // 从会话列表中移除
        setConversations(prev => prev.filter(conv => conv.id !== conversationToDelete.id))
        showSuccess('✅ 私信会话已删除，聊天记录已保留')
        // 立即刷新未读计数
        await fetchUnreadCount()
        // 关闭对话框
        setShowDeleteConversationDialog(false)
        setConversationToDelete(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || '删除失败')
      }
    } catch (error: any) {
      console.error('删除会话失败:', error)
      showError(error.message || '删除会话失败')
    } finally {
      setDeletingConversation(false)
    }
  }

  // 分享帖子
  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: `${post.author.nickname}的动态`,
        text: post.content,
        url: window.location.href
      }).catch(console.error)
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href).then(() => {
        showSuccess('链接已复制到剪贴板')
      }).catch(() => {
        showError('分享失败')
      })
    }
  }

  // 打开图片查看
  const openImageModal = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
    setShowImageModal(true)
  }

  useEffect(() => {
    fetchPosts(activeTab === 'following' ? 'following' : 'feed')
  }, [activeTab])

  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(handleSearch, 500)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  // 当切换个人主页标签时加载相应数据
  useEffect(() => {
    if (activeTab === 'profile' && profileTab === 'followers') {
      fetchMyFollowers()
    } else if (activeTab === 'profile' && profileTab === 'following') {
      fetchMyFollowing()
    }
  }, [profileTab, activeTab, user?.id])

  // 当进入个人主页标签时获取基本信息
  useEffect(() => {
    if (activeTab === 'profile') {
      fetchMyProfile()
    }
  }, [activeTab, user?.id])

  const containerClass = embedded 
    ? "space-y-6" 
    : "min-h-screen bg-gray-50 dark:bg-gray-900 p-6"

  return (
    <div className={containerClass}>
      {/* 页面标题 */}
      {!embedded && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            社交中心
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            与朋友分享动态，发现有趣的内容
          </p>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* 封禁通知横幅 */}
        {userBan && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-red-800 dark:text-red-200 font-semibold">账户已被封禁</h3>
                  <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                    封禁原因：{userBan.reason}
                  </p>
                  {!userBan.isPermanent && userBan.expiresAt && (
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      到期时间：{new Date(userBan.expiresAt).toLocaleString('zh-CN')}
                    </p>
                  )}
                  {userBan.isPermanent && (
                    <p className="text-red-600 dark:text-red-400 text-sm">永久封禁</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleOpenAppealModal}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                申述封禁
              </button>
            </div>
          </div>
        )}

        {/* 顶部导航和搜索 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          {/* 标签导航 */}
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'feed'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              动态广场
            </button>
            <button
              onClick={() => {
                setActiveTab('following')
                fetchPosts('following')
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'following'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              关注动态
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !isSocialFeatureEnabled 
                  ? 'text-gray-400 cursor-not-allowed'
                  : showSearch
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
              disabled={!isSocialFeatureEnabled}
              title={userBan ? '账户已被封禁，无法使用社交功能' : !isEmailVerified ? '请先验证邮箱后使用社交功能' : ''}
            >
              <Search className="w-4 h-4 inline mr-2" />
              发现用户
            </button>
            <button
              onClick={() => handleGoToProfile()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !isSocialFeatureEnabled 
                  ? 'text-gray-400 cursor-not-allowed'
                  : activeTab === 'profile'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
              disabled={!isSocialFeatureEnabled}
              title={userBan ? '账户已被封禁，无法使用社交功能' : !isEmailVerified ? '请先验证邮箱后使用社交功能' : ''}
            >
              <UserIcon className="w-4 h-4 inline mr-2" />
              我的主页
            </button>
            <button
                          onClick={async () => {
              if (!isSocialFeatureEnabled) {
                showError(userBan ? '账户已被封禁，无法使用社交功能' : '请先验证邮箱后再使用社交功能')
                return
              }
              setActiveTab('messages')
              if (conversations.length === 0) {
                fetchConversations()
              }
              // 切换到私信选项卡时立即更新未读计数
              await fetchUnreadCount()
            }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                !isSocialFeatureEnabled 
                  ? 'text-gray-400 cursor-not-allowed'
                  : activeTab === 'messages'
                  ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
              disabled={!isSocialFeatureEnabled}
              title={userBan ? '账户已被封禁，无法使用社交功能' : !isEmailVerified ? '请先验证邮箱后使用社交功能' : ''}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              私信
              {unreadCount > 0 && isSocialFeatureEnabled && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* 搜索框 */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="搜索用户..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* 搜索结果 */}
                  {searchLoading ? (
                    <div className="mt-4 text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">搜索中...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {searchResults.map((searchUser) => (
                        <div key={searchUser.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleViewProfile(searchUser.id)}>
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                              {searchUser.avatar ? (
                                <img src={searchUser.avatar} alt={searchUser.nickname} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                  <span className="text-white font-bold">{searchUser.nickname.charAt(0).toUpperCase()}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{searchUser.nickname}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">@{searchUser.username}</p>
                              {searchUser.bio && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{searchUser.bio}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleMessage(searchUser)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            >
                              私信
                            </button>
                            <button
                              onClick={() => handleFollow(searchUser.id, searchUser.isFollowing)}
                              className={`px-3 py-1 rounded-md font-medium transition-colors text-sm ${
                                searchUser.isFollowing
                                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {searchUser.isFollowing ? (
                                <>
                                  <UserMinus className="w-3 h-3 inline mr-1" />
                                  取消关注
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3 h-3 inline mr-1" />
                                  关注
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.trim() && !searchLoading ? (
                    <div className="mt-4 text-center py-4">
                      <p className="text-gray-500 dark:text-gray-400 text-sm">没有找到相关用户</p>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 发布帖子 */}
        {!isSocialFeatureEnabled && !userBan && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-yellow-800 dark:text-yellow-200">
                请先验证邮箱后再使用社交功能。
              </p>
            </div>
          </div>
        )}
        
        {isSocialFeatureEnabled && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex space-x-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                {user?.profile?.avatar ? (
                  <img src={user.profile.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold">{user?.username?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  placeholder="有什么想分享的吗？"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                
                {/* 图片预览 */}
                {imagePreviewUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 max-w-md">
                    {imagePreviewUrls.map((image, index) => (
                      <div key={index} className="relative aspect-square w-full max-w-32">
                        <img
                          src={image}
                          alt={`预览 ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
                      <ImageIcon className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() && imagePreviewUrls.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    发布
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 帖子列表 */}
        <div className="space-y-6">
          {activeTab === 'messages' ? (
            // 私信内容
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">我的私信</h3>
              {conversationsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">加载私信列表...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">暂无私信</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    通过搜索用户功能找到朋友开始聊天吧
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {/* 点击区域 - 打开聊天 */}
                      <div 
                        className="flex items-center space-x-3 flex-1 cursor-pointer"
                        onClick={() => {
                                            setTargetUser({
                    id: conv.otherUser.id,
                    username: conv.otherUser.username,
                    nickname: conv.otherUser.nickname,
                    avatar: conv.otherUser.avatar,
                    bio: '',
                    location: '',
                    isFollowing: false,
                    followersCount: 0,
                    followingCount: 0,
                    postsCount: 0,
                    joinedAt: ''
                  })
                  setShowMessaging(true)
                  // 打开私信对话后稍微延迟更新未读计数，给消息标记已读的时间
                  setTimeout(async () => {
                    await fetchUnreadCount()
                  }, 100)
                        }}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                          {conv.otherUser.avatar ? (
                            <img src={conv.otherUser.avatar} alt={conv.otherUser.nickname} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-bold">{conv.otherUser.nickname.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">{conv.otherUser.nickname}</h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {conv.lastMessage ? formatDate(conv.lastMessage.createdAt, 'datetime') : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {conv.lastMessage ? conv.lastMessage.content : '开始新对话'}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </div>
                        )}
                      </div>
                      
                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation() // 阻止事件冒泡
                          handleDeleteConversation(conv.id, conv.otherUser.nickname)
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="删除会话"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'profile' ? (
            // 个人主页内容
            profileLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">加载中...</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* 个人资料头部 */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-start space-x-4">
                    {/* 头像 */}
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                      {user?.profile?.avatar ? (
                        <img src={user.profile.avatar} alt={user?.profile?.nickname || user?.username || ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {(user?.profile?.nickname || user?.username || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 用户信息 */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user?.profile?.nickname || user?.username}</h3>
                        {/* 管理员标签 */}
                        {user?.role === 'admin' && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                            <Shield className="w-3 h-3 mr-1" />
                            管理员
                          </div>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">@{user?.username}</p>
                      
                      {user?.profile?.bio && (
                        <p className="text-gray-700 dark:text-gray-300 mt-2">{user.profile.bio}</p>
                      )}

                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        {user?.profile?.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{user.profile.location}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>加入于 {user?.createdAt ? formatDate(user.createdAt, 'date') : '未知'}</span>
                        </div>
                      </div>

                      {/* 统计信息 */}
                      <div className="flex space-x-6 mt-4">
                        <div className="text-center">
                          <div className="font-bold text-gray-900 dark:text-white">{myPosts.length}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">帖子</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-gray-900 dark:text-white">{myProfile?.followersCount || 0}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">粉丝</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-gray-900 dark:text-white">{myProfile?.followingCount || 0}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">关注</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 标签导航 */}
                <div className="border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                  <div className="flex space-x-8 px-6">
                    <button
                      onClick={() => setProfileTab('posts')}
                      className={`py-3 border-b-2 transition-colors ${
                        profileTab === 'posts'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      帖子 ({myPosts.length})
                    </button>
                    
                    {/* 粉丝标签 */}
                    <button
                      onClick={() => setProfileTab('followers')}
                      className={`flex items-center space-x-1 py-3 border-b-2 transition-colors ${
                        profileTab === 'followers'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <span>粉丝 ({myProfile?.followersCount || 0})</span>
                      {/* 设置了不可见时显示锁图标 */}
                      {userPrivacySettings?.showFollowers === false && (
                        <span title="粉丝列表已设为私有">
                          <Lock className="w-3 h-3 text-orange-500" />
                        </span>
                      )}
                    </button>
                    
                    {/* 关注标签 */}
                    <button
                      onClick={() => setProfileTab('following')}
                      className={`flex items-center space-x-1 py-3 border-b-2 transition-colors ${
                        profileTab === 'following'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <span>关注 ({myProfile?.followingCount || 0})</span>
                      {/* 设置了不可见时显示锁图标 */}
                      {userPrivacySettings?.showFollowing === false && (
                        <span title="关注列表已设为私有">
                          <Lock className="w-3 h-3 text-orange-500" />
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 内容区域 */}
                <div className="p-6">
                  {/* 帖子列表 */}
                  {profileTab === 'posts' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">我的帖子</h4>
                      {myPosts.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">暂无帖子</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {myPosts.map((post) => (
                            <div key={post.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                              {/* 帖子头部 */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                                    {post.author.avatar ? (
                                      <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                        {post.author.nickname.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="cursor-pointer" onClick={() => handleViewProfile(post.author.id)}>
                                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2 flex-wrap">
                                      <span>{post.author.nickname}</span>
                                      {/* 管理员标签 */}
                                      {post.author.role === 'admin' && (
                                        <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                          <Shield className="w-2.5 h-2.5 mr-1" />
                                          管理员
                                        </div>
                                      )}
                                      {/* 用户头衔 */}
                                      {post.author.titles && post.author.titles.length > 0 && post.author.titles.map(title => (
                                        <div 
                                          key={title.id}
                                          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                                          style={{ 
                                            backgroundColor: `${title.color}20`,
                                            color: title.color
                                          }}
                                          title={title.description || title.name}
                                        >
                                          {title.name}
                                        </div>
                                      ))}
                                    </h4>
                                  </div>
                                </div>
                                {post.canDelete && (
                                  <button
                                    onClick={() => showDeleteConfirmDialog('post', post.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              {/* 帖子内容 */}
                              <p className="text-gray-900 dark:text-white mb-3 whitespace-pre-wrap">{post.content}</p>

                              {/* 帖子图片 */}
                              {post.images && post.images.length > 0 && (
                                <div className="mb-4">
                                  <div className="grid grid-cols-3 gap-2 max-w-md">
                                    {post.images.map((image, index) => (
                                      <div key={index} className="aspect-square w-full max-w-32">
                                        <img
                                          src={image}
                                          alt={`帖子图片 ${index + 1}`}
                                          className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => openImageModal(image)}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 帖子操作 */}
                              <div className="flex items-center space-x-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <button
                                  onClick={() => handleLike(post.id)}
                                  className={`flex items-center space-x-2 transition-colors ${
                                    post.isLiked 
                                      ? 'text-red-600 dark:text-red-400' 
                                      : 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400'
                                  }`}
                                >
                                  <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                                  <span>{post.likesCount}</span>
                                </button>
                                <button
                                  onClick={() => toggleComments(post.id)}
                                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                                >
                                  <MessageCircle className="w-5 h-5" />
                                  <span>{post.commentsCount}</span>
                                </button>
                                <button
                                  onClick={() => handleShare(post)}
                                  className="flex items-center space-x-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                                >
                                  <Share className="w-5 h-5" />
                                  <span>分享</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 粉丝列表 */}
                  {profileTab === 'followers' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">我的粉丝</h4>
                      {followersLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-500 dark:text-gray-400 mt-2">加载粉丝列表...</p>
                        </div>
                      ) : myFollowers.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">暂无粉丝</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {myFollowers.map((follower) => (
                            <div key={follower.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                    {follower.avatar ? (
                                      <img src={follower.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                        {follower.nickname.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-medium text-gray-900 dark:text-white">{follower.nickname}</h4>
                                      {follower.role === 'admin' && (
                                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                          <Shield className="w-3 h-3 mr-1" />
                                          管理员
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">@{follower.username}</p>
                                    {follower.bio && (
                                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{follower.bio}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">关注于 {formatDate(follower.followedAt, 'date')}</p>
                                  </div>
                                </div>
                                {/* 关注按钮 - 不显示自己 */}
                                {follower.id !== user?.id && (
                                  <button
                                    onClick={() => handleFollowUserInList(follower.id, follower.isFollowing)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                      follower.isFollowing
                                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                  >
                                    {follower.isFollowing ? '取消关注' : '关注'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 关注列表 */}
                  {profileTab === 'following' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">我的关注</h4>
                      {followingLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-500 dark:text-gray-400 mt-2">加载关注列表...</p>
                        </div>
                      ) : myFollowing.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">暂无关注</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {myFollowing.map((followingUser) => (
                            <div key={followingUser.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                    {followingUser.avatar ? (
                                      <img src={followingUser.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                        {followingUser.nickname.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-medium text-gray-900 dark:text-white">{followingUser.nickname}</h4>
                                      {followingUser.role === 'admin' && (
                                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                          <Shield className="w-3 h-3 mr-1" />
                                          管理员
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">@{followingUser.username}</p>
                                    {followingUser.bio && (
                                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{followingUser.bio}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">关注于 {formatDate(followingUser.followedAt, 'date')}</p>
                                  </div>
                                </div>
                                {/* 关注按钮 - 不显示自己 */}
                                {followingUser.id !== user?.id && (
                                  <button
                                    onClick={() => handleFollowUserInList(followingUser.id, followingUser.isFollowing)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                      followingUser.isFollowing
                                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                  >
                                    {followingUser.isFollowing ? '取消关注' : '关注'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            // 正常的帖子列表
            loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">加载中...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  暂无动态
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab === 'following' ? '关注一些用户来查看他们的动态' : '成为第一个发布动态的用户'}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  {/* 帖子头部 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 cursor-pointer"
                        onClick={() => handleViewProfile(post.author.id)}
                      >
                        {post.author.avatar ? (
                          <img src={post.author.avatar} alt={post.author.nickname} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold">{post.author.nickname.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="cursor-pointer" onClick={() => handleViewProfile(post.author.id)}>
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2 flex-wrap">
                          <span>{post.author.nickname}</span>
                          {/* 管理员标签 */}
                          {post.author.role === 'admin' && (
                            <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                              <Shield className="w-2.5 h-2.5 mr-1" />
                              管理员
                            </div>
                          )}
                          {/* 用户头衔 */}
                          {post.author.titles && post.author.titles.length > 0 && post.author.titles.map(title => (
                            <div 
                              key={title.id}
                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${title.color}20`,
                                color: title.color
                              }}
                              title={title.description || title.name}
                            >
                              {title.name}
                            </div>
                          ))}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(post.createdAt, 'datetime')}</p>
                      </div>
                    </div>
                    {post.canDelete && (
                      <button 
                        onClick={() => showDeleteConfirmDialog('post', post.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="删除帖子"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 帖子内容 */}
                  <div className="mb-4">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* 帖子图片 */}
                  {post.images && post.images.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-3 gap-2 max-w-md">
                        {post.images.map((image, index) => (
                          <div key={index} className="aspect-square w-full max-w-32">
                            <img
                              src={image}
                              alt={`帖子图片 ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openImageModal(image)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 帖子操作 */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-2 transition-colors ${
                          post.isLiked 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span>{post.likesCount}</span>
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.commentsCount}</span>
                      </button>
                      <button
                        onClick={() => handleShare(post)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                      >
                        <Share className="w-5 h-5" />
                        <span>分享</span>
                      </button>
                    </div>
                  </div>

                  {/* 评论区域 */}
                  <AnimatePresence>
                    {showComments[post.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-4">
                          {/* 评论输入框 */}
                          <div className="flex space-x-3 mb-4">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                              {user?.profile?.avatar ? (
                                <img src={user.profile.avatar} alt={user.username} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">{user?.username?.charAt(0).toUpperCase()}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              {replyingTo[post.id] && (
                                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                                  <span className="text-blue-600 dark:text-blue-400">
                                    回复 @{replyingTo[post.id]?.username}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const { [post.id]: _, ...rest } = replyingTo
                                      setReplyingTo(rest)
                                      setCommentContent(prev => ({ ...prev, [post.id]: '' }))
                                    }}
                                    className="ml-2 text-gray-500 hover:text-red-600"
                                  >
                                    取消
                                  </button>
                                </div>
                              )}
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  placeholder="写评论..."
                                  value={commentContent[post.id] || ''}
                                  onChange={(e) => setCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleComment(post.id)
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleComment(post.id)}
                                  disabled={!commentContent[post.id]?.trim()}
                                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 评论列表 */}
                          {comments[post.id] && comments[post.id].length > 0 && (
                            <CommentTree
                              comments={comments[post.id]}
                              postId={post.id}
                              currentUserId={user?.id || ''}
                              currentUserAvatar={user?.profile?.avatar}
                              onCommentLike={handleCommentLike}
                              onCommentDelete={handleCommentDelete}
                              onCommentReply={handleCommentReply}
                              onViewProfile={handleViewProfile}
                              maxDepth={5}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )
          )}
          
          {/* 加载更多按钮 */}
          {!loading && hasMorePosts && activeTab !== 'profile' && (activeTab === 'feed' || activeTab === 'following') && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchPosts(activeTab === 'feed' ? 'feed' : 'following', currentPage + 1, true)}
                className="px-6 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
              >
                加载更多
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 私信模态框 */}
                    <MessagingModal
        isOpen={showMessaging}
        targetUser={targetUser}
        onClose={async () => {
          setShowMessaging(false)
          setTargetUser(null)
          // 关闭私信时立即刷新未读计数
          await fetchUnreadCount()
        }}
        onUnreadCountChange={fetchUnreadCount}
      />

      {/* 用户资料模态框 */}
      <UserProfile
        isOpen={showUserProfile}
        userId={selectedUserId}
        onClose={() => {
          setShowUserProfile(false)
          setSelectedUserId(null)
        }}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="确认删除"
        message={`确定要删除这条${deleteTarget?.type === 'post' ? '帖子' : '评论'}吗？`}
        confirmText="删除"
        type="danger"
        onConfirm={executeDelete}
        onClose={cancelDelete}
      />

      {/* 删除会话确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteConversationDialog}
        onClose={() => setShowDeleteConversationDialog(false)}
        onConfirm={executeDeleteConversation}
        title="删除私信会话"
        confirmText="确认删除"
        cancelText="取消"
        type="warning"
        loading={deletingConversation}
        customContent={
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300">
              确定要删除与 <span className="font-medium text-gray-900 dark:text-white">
                {conversationToDelete?.nickname}
              </span> 的私信会话吗？
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">说明：</span>聊天记录不会被删除，当对方再次发送消息或您通过主页发送消息时会重新显示。
              </p>
            </div>
          </div>
        }
      />

      {/* 申述模态框 */}
      {showAppealModal && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4"
          onClick={handleCloseAppealModal}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* 头部 */}
            <div className="bg-blue-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-6 h-6" />
                  <h2 className="text-xl font-bold">申述封禁</h2>
                </div>
                <button
                  onClick={handleCloseAppealModal}
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {loadingAppealHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">加载申述信息...</p>
                </div>
              ) : (
                <>
                  {/* 封禁信息 */}
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                      当前封禁信息
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">封禁原因：</span>
                        <span className="text-gray-900 dark:text-white">{userBan?.reason}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">封禁类型：</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          userBan?.isPermanent
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {userBan?.isPermanent ? '永久封禁' : '临时封禁'}
                        </span>
                      </div>
                      {!userBan?.isPermanent && userBan?.expiresAt && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">到期时间：</span>
                          <span className="text-gray-900 dark:text-white">{new Date(userBan.expiresAt).toLocaleString('zh-CN')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 当前申述状态 */}
                  {currentAppeal ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                        当前申述状态
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">申述状态：</span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded text-xs font-medium">
                            待处理
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">申述原因：</span>
                          <span className="text-gray-900 dark:text-white">{currentAppeal.reason}</span>
                        </div>
                        {currentAppeal.description && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">详细说明：</span>
                            <p className="text-gray-900 dark:text-white mt-1">{currentAppeal.description}</p>
                          </div>
                        )}
                        {currentAppeal.images && currentAppeal.images.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">申述图片：</span>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {currentAppeal.images.map((image: string, index: number) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`申述图片 ${index + 1}`}
                                  className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => openImageModal(image)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">提交时间：</span>
                          <span className="text-gray-900 dark:text-white">{new Date(currentAppeal.submittedAt || currentAppeal.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          您的申述已提交，管理员正在处理中。在处理完成前，您无法提交新的申述。
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* 申述表单 */
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <Send className="w-5 h-5 mr-2 text-green-600" />
                        提交新申述
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          申述原因 *
                        </label>
                        <textarea
                          value={appealReason}
                          onChange={(e) => setAppealReason(e.target.value)}
                          placeholder="请简要说明您认为封禁错误的原因..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          详细说明（可选）
                        </label>
                        <textarea
                          value={appealDescription}
                          onChange={(e) => setAppealDescription(e.target.value)}
                          placeholder="可以提供更详细的说明、证据或其他相关信息..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* 申述图片上传 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          证据图片（可选，最多3张）
                        </label>
                        <div className="space-y-3">
                          {/* 图片上传按钮 */}
                          {appealImages.length < 3 && (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleAppealImageSelect}
                                className="hidden"
                              />
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                                <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
                                  <Upload className="w-5 h-5" />
                                  <span className="text-sm">
                                    点击上传图片证据（{appealImages.length}/3）
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-1">
                                  支持 JPG、PNG 格式，单个文件不超过5MB
                                </p>
                              </div>
                            </label>
                          )}

                          {/* 图片预览 */}
                          {appealImagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {appealImagePreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={preview}
                                    alt={`申述图片 ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                  />
                                  <button
                                    onClick={() => removeAppealImage(index)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          可以上传聊天截图、相关证据等图片来支持您的申述
                        </p>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={handleSubmitAppeal}
                          disabled={submittingAppeal || !appealReason.trim()}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {submittingAppeal ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              提交中...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              提交申述
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCloseAppealModal}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 申述历史 */}
                  {appealHistory.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-gray-600" />
                        申述历史
                      </h3>
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {appealHistory.map((appeal: any) => (
                          <div key={appeal._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                申述 #{appeal._id.slice(-6)}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                appeal.status === 'pending'
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                  : appeal.status === 'approved'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {appeal.status === 'pending' ? '待处理' : 
                                 appeal.status === 'approved' ? '已通过' : '已驳回'}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-300">申述原因：</span>
                                <span className="text-gray-900 dark:text-white">{appeal.reason}</span>
                              </div>
                              {appeal.description && (
                                <div>
                                  <span className="font-medium text-gray-600 dark:text-gray-300">详细说明：</span>
                                  <p className="text-gray-900 dark:text-white">{appeal.description}</p>
                                </div>
                              )}
                              {appeal.images && appeal.images.length > 0 && (
                                <div>
                                  <span className="font-medium text-gray-600 dark:text-gray-300">申述图片：</span>
                                  <div className="grid grid-cols-3 gap-2 mt-2">
                                    {appeal.images.map((image: string, index: number) => (
                                      <img
                                        key={index}
                                        src={image}
                                        alt={`申述图片 ${index + 1}`}
                                        className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => openImageModal(image)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                                                    <div>
                        <span className="font-medium text-gray-600 dark:text-gray-300">提交时间：</span>
                        <span className="text-gray-900 dark:text-white">{new Date(appeal.submittedAt || appeal.createdAt).toLocaleString('zh-CN')}</span>
                      </div>
                              {appeal.processedAt && (
                                <div>
                                  <span className="font-medium text-gray-600 dark:text-gray-300">处理时间：</span>
                                  <span className="text-gray-900 dark:text-white">{new Date(appeal.processedAt).toLocaleString('zh-CN')}</span>
                                </div>
                              )}
                              {appeal.adminReply && (
                                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
                                  <span className="font-medium text-blue-800 dark:text-blue-200">管理员回复：</span>
                                  <p className="text-blue-900 dark:text-blue-100 mt-1">{appeal.adminReply}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 注意事项 */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-400 mb-2">重要提醒</h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• 请确保申述理由真实有效，虚假申述可能导致更严厉的处罚</li>
                      <li>• 管理员会在收到申述后尽快处理，请耐心等待</li>
                      <li>• 如果申述被驳回，您可以在处理结果后重新提交申述</li>
                      <li>• 每次只能有一个待处理的申述</li>
                    </ul>
                  </div>
                </>
              )}
                         </div>
           </div>
         </div>,
         document.body
       )}

      {/* 图片查看模态框 */}
      {showImageModal && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 模态框头部 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">查看图片</h2>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* 图片内容 */}
              <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
                <img
                  src={selectedImageUrl}
                  alt="查看图片"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

export default SocialPage 