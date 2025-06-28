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
  AlertCircle
} from 'lucide-react'
import MessagingModal from '../components/MessagingModal'
import UserProfile from '../components/UserProfile'
import ConfirmDialog from '../components/ConfirmDialog'
import { createPortal } from 'react-dom'

interface Post {
  id: string
  content: string
  images: string[]
  author: {
    id: string
    username: string
    nickname: string
    avatar: string
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
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
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
  
  // 个人主页状态
  const [myProfile, setMyProfile] = useState<any>(null)
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [profileLoading, setProfileLoading] = useState(false)
  
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
  
  // 邮箱验证状态检查
  const isEmailVerified = user?.isEmailVerified || false
  
  // 检查社交功能可用性
  const isSocialFeatureEnabled = isEmailVerified
  
  // 当未读消息数量变化时，通知外部组件
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount)
    }
  }, [unreadCount, onUnreadCountChange])

  // 定期刷新未读消息数量
  useEffect(() => {
    if (isSocialFeatureEnabled) {
      // 立即获取一次
      fetchUnreadCount()
      
      // 每30秒刷新一次未读数量
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [isSocialFeatureEnabled])

  // 获取未读消息数量
  const fetchUnreadCount = async () => {
    if (!isSocialFeatureEnabled) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/messaging?action=conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const totalUnread = data.data.conversations.reduce((total: number, conv: any) => total + conv.unreadCount, 0)
        setUnreadCount(totalUnread)
      }
    } catch (error) {
      console.error('获取未读消息数量失败:', error)
    }
  }

  // 获取帖子列表
  const fetchPosts = async (type: 'feed' | 'following' = 'feed') => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/content?action=posts&type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPosts(data.data.posts)
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

    if (!isSocialFeatureEnabled) {
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
        throw new Error(errorData.message || '发布失败')
      }
    } catch (error: any) {
      console.error('发布帖子失败:', error)
      showError(error.message || '发布帖子失败')
    } finally {
      setIsPosting(false)
    }
  }

  // 点赞/取消点赞帖子
  const handleLike = async (postId: string) => {
    if (!isSocialFeatureEnabled) {
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
        throw new Error('操作失败')
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      showError('操作失败')
    }
  }

  // 点赞/取消点赞评论
  const handleCommentLike = async (commentId: string, postId: string) => {
    if (!isSocialFeatureEnabled) {
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
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId]?.map(comment => 
            comment.id === commentId 
              ? { ...comment, isLiked: data.data.isLiked, likesCount: data.data.likesCount }
              : comment
          ) || []
        }))
      }
    } catch (error) {
      console.error('评论点赞失败:', error)
      showError('操作失败')
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
          setPosts(prev => prev.filter(post => post.id !== id))
          showSuccess('帖子删除成功')
        } else {
          setComments(prev => ({
            ...prev,
            [postId!]: prev[postId!]?.filter(comment => comment.id !== id) || []
          }))
          setPosts(prev => prev.map(post => 
            post.id === postId 
              ? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) }
              : post
          ))
          showSuccess('评论删除成功')
        }
      } else {
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
        setComments(prev => ({ ...prev, [postId]: data.data.comments }))
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
        setComments(prev => ({
          ...prev,
          [postId]: [data.data.comment, ...(prev[postId] || [])]
        }))
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
        throw new Error(errorData.message || '评论失败')
      }
    } catch (error: any) {
      console.error('发布评论失败:', error)
      showError(error.message || '发布评论失败')
    }
  }

  // 搜索用户
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    if (!isSocialFeatureEnabled) {
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
    } catch (error) {
      console.error('获取个人资料失败:', error)
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

  // 组织评论为树状结构，但显示更简洁
  const organizeComments = (comments: Comment[]) => {
    const parentComments = comments.filter(comment => !comment.parentId)
    const childComments = comments.filter(comment => comment.parentId)
    
    return parentComments.map(parent => ({
      ...parent,
      replies: childComments.filter(child => child.parentId === parent.id)
    })).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  // 渲染评论 - 真正的树状结构
  const renderComment = (comment: Comment, postId: string, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-2 relative' : 'py-3'}`}>
      {/* 子评论连接线 */}
      {isReply && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600 -ml-4"></div>
      )}
      
      <div className={`flex space-x-3 ${isReply ? 'pl-4' : ''}`}>
        {/* 头像 */}
        <div 
          className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 cursor-pointer flex-shrink-0`}
          onClick={() => handleViewProfile(comment.author.id)}
        >
          {comment.author.avatar ? (
            <img src={comment.author.avatar} alt={comment.author.nickname} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className={`text-white font-bold ${isReply ? 'text-xs' : 'text-xs'}`}>
                {comment.author.nickname.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* 评论内容 */}
        <div className="flex-1 min-w-0">
          {/* 评论气泡 */}
          <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg ${isReply ? 'p-2' : 'p-3'}`}>
            {/* 用户信息行 */}
            <div className={`flex items-center space-x-2 ${isReply ? 'text-xs' : 'text-sm'} mb-1`}>
              <span 
                className="font-medium text-gray-900 dark:text-white cursor-pointer hover:underline"
                onClick={() => handleViewProfile(comment.author.id)}
              >
                {comment.author.nickname}
              </span>
              <span className="text-gray-500 dark:text-gray-400">·</span>
              <span className="text-gray-500 dark:text-gray-400">
                {formatDate(comment.createdAt, 'datetime')}
              </span>
              {comment.canDelete && (
                <>
                  <span className="text-gray-500 dark:text-gray-400">·</span>
                  <button 
                    onClick={() => showDeleteConfirmDialog('comment', comment.id, postId)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="删除评论"
                  >
                    <Trash2 className={`${isReply ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                  </button>
                </>
              )}
            </div>

            {/* 评论文本 */}
            <div>
              <p className={`text-gray-900 dark:text-white ${isReply ? 'text-xs' : 'text-sm'}`}>
                {comment.replyTo && (
                  <span className="text-blue-600 dark:text-blue-400 mr-1">
                    @{comment.replyTo.nickname}
                  </span>
                )}
                {comment.content}
              </p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className={`flex items-center space-x-4 mt-2 ${isReply ? 'text-xs' : 'text-xs'} text-gray-500 dark:text-gray-400`}>
            <button
              onClick={() => handleCommentLike(comment.id, postId)}
              className={`flex items-center space-x-1 transition-colors hover:text-red-600 ${
                comment.isLiked ? 'text-red-600' : ''
              }`}
            >
              <Heart className={`${isReply ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${comment.isLiked ? 'fill-current' : ''}`} />
              {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
            </button>
            
            {!isReply && (
              <button
                onClick={() => handleReply(postId, comment.id, comment.author.nickname)}
                className="flex items-center space-x-1 transition-colors hover:text-blue-600"
              >
                <Reply className="w-3 h-3" />
                <span>回复</span>
              </button>
            )}
            
            <button className="flex items-center space-x-1 transition-colors hover:text-green-600">
              <Share className={`${isReply ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
              <span>分享</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // 获取会话列表
  const fetchConversations = async () => {
    if (!isSocialFeatureEnabled) {
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
              title={!isSocialFeatureEnabled ? '请先验证邮箱后使用社交功能' : ''}
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
              title={!isSocialFeatureEnabled ? '请先验证邮箱后使用社交功能' : ''}
            >
              <UserIcon className="w-4 h-4 inline mr-2" />
              我的主页
            </button>
            <button
              onClick={() => {
                if (!isSocialFeatureEnabled) {
                  showError('请先验证邮箱后再使用社交功能')
                  return
                }
                setActiveTab('messages')
                if (conversations.length === 0) {
                  fetchConversations()
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                !isSocialFeatureEnabled 
                  ? 'text-gray-400 cursor-not-allowed'
                  : activeTab === 'messages'
                  ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
              disabled={!isSocialFeatureEnabled}
              title={!isSocialFeatureEnabled ? '请先验证邮箱后使用社交功能' : ''}
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
        {!isSocialFeatureEnabled && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-yellow-800 dark:text-yellow-200">
                请先验证邮箱后再使用社交功能。
                <button 
                  onClick={() => embedded ? setActiveTab('verify-email' as any) : navigate('/verify-email')}
                  className="text-yellow-600 dark:text-yellow-400 underline hover:text-yellow-700 dark:hover:text-yellow-300 ml-1"
                >
                  立即验证
                </button>
              </p>
            </div>
          </div>
        )}
        
        {isSocialFeatureEnabled && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex space-x-4">
              <div 
                className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0 cursor-pointer"
                onClick={() => handleGoToProfile()}
              >
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
                  placeholder="分享你的想法..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  maxLength={1000}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex space-x-2">
                    <label className="p-2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
                      <ImageIcon className="w-5 h-5" />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {newPostContent.length}/1000
                    </span>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim() || isPosting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {isPosting ? '发布中...' : '发布'}
                    </button>
                  </div>
                </div>
                
                {/* 图片预览 */}
                {imagePreviewUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square">
                        <img src={url} alt={`预览 ${index + 1}`} className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openImageModal(url)} />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    <div
                      key={conv.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
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
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user?.profile?.nickname || user?.username}</h3>
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

                {/* 我的帖子 */}
                <div className="p-6">
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
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">{post.author.nickname}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(post.createdAt, 'datetime')}</p>
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
                        <h4 className="font-medium text-gray-900 dark:text-white">{post.author.nickname}</h4>
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
                          <div className="space-y-1">
                            {comments[post.id] && organizeComments(comments[post.id]).map((comment) => (
                              <div key={comment.id}>
                                {renderComment(comment, post.id)}
                                {comment.replies && comment.replies.map((reply) => 
                                  renderComment(reply, post.id, true)
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )
          )}
        </div>
      </div>

      {/* 私信模态框 */}
      <MessagingModal
        isOpen={showMessaging}
        targetUser={targetUser}
        onClose={() => {
          setShowMessaging(false)
          setTargetUser(null)
        }}
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