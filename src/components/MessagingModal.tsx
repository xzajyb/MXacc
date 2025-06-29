import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, User, RotateCcw, MoreHorizontal, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import ConfirmDialog from './ConfirmDialog'

interface User {
  id: string
  username: string
  nickname: string
  avatar: string
}

interface Message {
  id: string
  content: string
  senderId: string
  recipientId: string
  createdAt: string
  isRead: boolean
  isSystemMessage?: boolean
  sender?: {
    id: string
    username: string
    nickname: string
    avatar: string
  } | null
}

interface Conversation {
  id: string
  otherUser: User
  lastMessage?: Message
  unreadCount: number
}

interface MessagingModalProps {
  isOpen: boolean
  targetUser: User | null
  onClose: () => void
  onUnreadCountChange?: () => void // 新增：未读计数变化回调
}

const MessagingModal: React.FC<MessagingModalProps> = ({ 
  isOpen, 
  targetUser, 
  onClose,
  onUnreadCountChange
}) => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showDeleteHistoryDialog, setShowDeleteHistoryDialog] = useState(false)
  const [deletingChatHistory, setDeletingChatHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 获取会话列表
  const fetchConversations = async () => {
    if (!isOpen) return
    
    setLoading(true)
    try {
      console.log('获取会话列表...')
      const response = await fetch('/api/social/messaging', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log('会话列表响应:', data)
      
      if (data.success) {
        setConversations(data.data.conversations)
        console.log('设置会话列表:', data.data.conversations.length, '个会话')
        // 会话列表加载完成后标记为已初始化
        if (!hasInitiallyLoaded) {
          setHasInitiallyLoaded(true)
        }
      }
    } catch (error) {
      console.error('获取会话列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取特定会话的消息
  const fetchMessages = async (conversationId?: string, otherUserId?: string, showLoading: boolean = true) => {
    // 只在第一次加载或明确要求时显示加载动画
    const shouldShowLoading = showLoading && !hasInitiallyLoaded
    
    if (shouldShowLoading) {
      setMessagesLoading(true)
    }
    
    try {
      let url = '/api/social/messaging'
      const params = new URLSearchParams()
      
      if (conversationId) {
        params.append('conversationId', conversationId)
      } else if (otherUserId) {
        params.append('otherUserId', otherUserId)
      } else {
        return
      }
      
      url += '?' + params.toString()
      console.log('获取消息，URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log('消息响应:', data)
      
      if (data.success) {
        setMessages(data.data.messages || [])
        setTimeout(scrollToBottom, 100)
        // 标记已完成初始加载
        if (!hasInitiallyLoaded) {
          setHasInitiallyLoaded(true)
        }
        
        // 获取消息后立即刷新会话列表和未读计数（因为后端已将消息标记为已读）
        await fetchConversations()
        // 立即通知父组件未读计数已变化
        if (onUnreadCountChange) {
          onUnreadCountChange()
        }
      }
    } catch (error) {
      console.error('获取消息失败:', error)
    } finally {
      if (shouldShowLoading) {
        setMessagesLoading(false)
      }
    }
  }

  // 发送消息
  const sendMessage = async () => {
    if (!newMessage.trim()) return
    
    // 确定接收者ID
    let recipientId = ''
    let conversationId = ''
    
    if (targetUser) {
      // 通过主页私信
      recipientId = targetUser.id
      console.log('通过主页私信给用户:', targetUser.nickname, '(ID:', recipientId, ')')
    } else if (selectedConversation) {
      // 通过会话列表私信
      recipientId = selectedConversation.otherUser.id
      conversationId = selectedConversation.id
      console.log('通过会话列表私信给用户:', selectedConversation.otherUser.nickname, '(ID:', recipientId, ')')
    } else {
      showError('无法确定接收者')
      return
    }

    if (!recipientId) {
      showError('接收者ID不能为空')
      return
    }

    setSendingMessage(true)
    try {
      console.log('发送消息请求:', {
        recipientId,
        content: newMessage.trim(),
        conversationId: conversationId || undefined
      })

      const response = await fetch('/api/social/messaging', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId,
          content: newMessage.trim(),
          ...(conversationId && { conversationId })
        })
      })

      const data = await response.json()
      console.log('发送消息响应:', data)

      if (data.success) {
        setNewMessage('')
        showSuccess('消息发送成功')
        
        // 刷新消息列表 - 不显示加载动画
        if (targetUser) {
          await fetchMessages(undefined, targetUser.id, false)
        } else if (selectedConversation) {
          await fetchMessages(selectedConversation.id, undefined, false)
        }
        
        // 刷新会话列表和未读计数
        await fetchConversations()
        if (onUnreadCountChange) {
          onUnreadCountChange()
        }
      } else {
        showError(data.message || '发送失败')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      showError('发送失败')
    } finally {
      setSendingMessage(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    if (isOpen) {
      // 重置加载状态，这样每次打开聊天都会显示第一次加载动画
      setHasInitiallyLoaded(false)
      
      if (targetUser) {
        // 通过主页私信：直接获取与目标用户的消息，不显示会话列表
        console.log('通过主页私信模式，目标用户:', targetUser.nickname)
        fetchMessages(undefined, targetUser.id, true) // 第一次加载显示动画
      } else {
        // 通过私信选项卡：显示会话列表
        console.log('通过私信选项卡模式，获取会话列表')
        fetchConversations()
      }
    }
  }, [isOpen, targetUser])

  // 当选择会话时获取消息 - 不显示加载动画，因为已经初始化过了
  useEffect(() => {
    if (selectedConversation && hasInitiallyLoaded) {
      fetchMessages(selectedConversation.id, undefined, false) // 切换会话不显示动画
    } else if (selectedConversation && !hasInitiallyLoaded) {
      fetchMessages(selectedConversation.id, undefined, true) // 第一次选择会话显示动画
    }
  }, [selectedConversation])

  // 组件关闭时清理状态
  useEffect(() => {
    if (!isOpen) {
      setMessages([])
      setSelectedConversation(null)
      setHasInitiallyLoaded(false)
      setMessagesLoading(false)
      setShowMoreMenu(false)
    }
  }, [isOpen])

  // 点击外部关闭更多菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreMenu) {
        setShowMoreMenu(false)
      }
    }

    if (showMoreMenu) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showMoreMenu])

  // 格式化时间 - 智能显示
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    const diffInHours = diffInMinutes / 60
    const diffInDays = diffInHours / 24
    const diffInYears = diffInDays / 365
    
    // 24小时内显示时间
    if (diffInHours < 24) {
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
    // 一年内显示月日和时间
    else if (diffInYears < 1) {
      return date.toLocaleDateString('zh-CN', { 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    // 超过一年显示年月日和时间
    else {
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // 检查消息是否可以撤回（3分钟内）
  const canRecallMessage = (createdAt: string, senderId: string, isSystemMessage?: boolean) => {
    if (isSystemMessage || senderId === 'SYSTEM') return false // 系统消息不能撤回
    if (senderId !== user?.id) return false
    const messageTime = new Date(createdAt).getTime()
    const now = new Date().getTime()
    const diffInMinutes = (now - messageTime) / (1000 * 60)
    return diffInMinutes <= 3
  }

  // 撤回消息
  const recallMessage = async (messageId: string) => {
    try {
      // 先显示撤回中的提示
      showSuccess('正在撤回消息...')
      
      const response = await fetch('/api/social/messaging', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'recall-message',
          messageId
        })
      })

      const data = await response.json()
      if (data.success) {
        showSuccess('✅ 消息撤回成功！已从聊天记录中移除')
        // 刷新消息列表 - 不显示加载动画
        if (targetUser) {
          await fetchMessages(undefined, targetUser.id, false)
        } else if (selectedConversation) {
          await fetchMessages(selectedConversation.id, undefined, false)
        }
        
        // 立即刷新会话列表和未读计数
        await fetchConversations()
        if (onUnreadCountChange) {
          onUnreadCountChange()
        }
      } else {
        showError(data.message || '❌ 撤回失败，请稍后重试')
      }
    } catch (error) {
      console.error('撤回消息失败:', error)
      showError('❌ 网络错误，撤回失败')
    }
  }

  // 显示删除聊天记录确认对话框
  const showDeleteChatHistoryDialog = () => {
    setShowDeleteHistoryDialog(true)
    setShowMoreMenu(false)
  }

  // 删除聊天记录
  const deleteChatHistory = async () => {
    setDeletingChatHistory(true)
    
    try {
      let conversationId: string | undefined
      
      if (selectedConversation) {
        // 通过会话列表打开的聊天
        conversationId = selectedConversation.id
      } else if (targetUser) {
        // 通过主页私信打开的聊天，需要先查找或创建会话
        const response = await fetch(`/api/social/messaging?otherUserId=${targetUser.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          conversationId = data.data.conversationId
        } else {
          showError('无法获取会话信息')
          return
        }
      }

      if (!conversationId) {
        showError('暂无聊天记录可删除')
        return
      }

      const deleteResponse = await fetch('/api/social/messaging', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete-chat-history',
          conversationId
        })
      })
      
      if (deleteResponse.ok) {
        showSuccess('✅ 聊天记录已删除，对方的记录不受影响')
        // 清空消息列表
        setMessages([])
        // 刷新会话列表和未读计数
        await fetchConversations()
        if (onUnreadCountChange) {
          onUnreadCountChange()
        }
        // 关闭对话框
        setShowDeleteHistoryDialog(false)
      } else {
        const errorData = await deleteResponse.json()
        throw new Error(errorData.message || '删除失败')
      }
    } catch (error: any) {
      console.error('删除聊天记录失败:', error)
      showError(error.message || '删除聊天记录失败')
    } finally {
      setDeletingChatHistory(false)
    }
  }

  // 获取日期分隔符
  const getDateSeparator = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return '今天'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天'
    } else {
      const diffInYears = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365)
      if (diffInYears < 1) {
        return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
      } else {
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
      }
    }
  }

  // 检查是否需要显示日期分隔符
  const shouldShowDateSeparator = (currentMessage: Message, previousMessage: Message | null) => {
    if (!previousMessage) return true
    
    const currentDate = new Date(currentMessage.createdAt).toDateString()
    const previousDate = new Date(previousMessage.createdAt).toDateString()
    
    return currentDate !== previousDate
  }

  const showConversationsList = !targetUser // 只有不是通过主页私信时才显示会话列表

  return (
    <>
      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[600px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 标题栏 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {targetUser ? `与 ${targetUser.nickname} 的对话` : '私信'}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex h-[544px]">
                {/* 左侧会话列表 */}
                {showConversationsList && (
                  <div className="w-1/3 border-r border-gray-200 dark:border-gray-600 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">加载中...</p>
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="p-4 text-center">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">暂无会话</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-600">
                        {conversations.map((conv) => (
                          <div
                            key={conv.id}
                            className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              selectedConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                            onClick={async () => {
                              setSelectedConversation(conv)
                              // 选择会话后立即更新未读计数
                              setTimeout(async () => {
                                await fetchConversations()
                                if (onUnreadCountChange) {
                                  onUnreadCountChange()
                                }
                              }, 50) // 减少延时到50ms，更及时
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                                {conv.otherUser.avatar ? (
                                  <img src={conv.otherUser.avatar} alt={conv.otherUser.nickname} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">{conv.otherUser.nickname.charAt(0).toUpperCase()}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">{conv.otherUser.nickname}</h4>
                                  {conv.unreadCount > 0 && (
                                    <div className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {conv.lastMessage ? conv.lastMessage.content : '开始新对话'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 右侧消息区域 */}
                <div className={`${showConversationsList ? 'w-2/3' : 'w-full'} flex flex-col`}>
                  {(targetUser || selectedConversation) ? (
                    <>
                      {/* 消息头部 */}
                      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                              {(targetUser?.avatar || selectedConversation?.otherUser.avatar) ? (
                                <img 
                                  src={targetUser?.avatar || selectedConversation?.otherUser.avatar} 
                                  alt={targetUser?.nickname || selectedConversation?.otherUser.nickname} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {(targetUser?.nickname || selectedConversation?.otherUser.nickname || '').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {targetUser?.nickname || selectedConversation?.otherUser.nickname}
                            </h4>
                          </div>
                          
                          {/* 更多菜单 */}
                          <div className="relative">
                            <button
                              onClick={() => setShowMoreMenu(!showMoreMenu)}
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title="更多操作"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                            
                            {/* 下拉菜单 */}
                            {showMoreMenu && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                                <button
                                  onClick={showDeleteChatHistoryDialog}
                                  className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>删除聊天记录</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 消息列表 */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messagesLoading ? (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2">加载消息中...</p>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <p>暂无消息，开始聊天吧～</p>
                          </div>
                        ) : (
                          messages.map((message, index) => {
                            const previousMessage = index > 0 ? messages[index - 1] : null
                            const showDateSep = shouldShowDateSeparator(message, previousMessage)
                            
                            return (
                              <div key={message.id}>
                                {/* 日期分隔符 */}
                                {showDateSep && (
                                  <div className="flex justify-center my-4">
                                    <div className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                                      {getDateSeparator(message.createdAt)}
                                    </div>
                                  </div>
                                )}
                                
                                {/* 消息内容 */}
                                {message.isSystemMessage ? (
                                  // 系统消息样式
                                  <div className="flex justify-center">
                                    <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full max-w-xs text-center">
                                      <p>{message.content}</p>
                                    </div>
                                  </div>
                                ) : (
                                  // 普通消息样式
                                  <div className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className="relative group">
                                      <div
                                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                          message.senderId === user?.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                        }`}
                                      >
                                        <p className="text-sm">{message.content}</p>
                                        <p className={`text-xs mt-1 ${
                                          message.senderId === user?.id
                                            ? 'text-blue-100'
                                            : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                          {formatTime(message.createdAt)}
                                        </p>
                                      </div>
                                      
                                      {/* 撤回按钮 */}
                                      {canRecallMessage(message.createdAt, message.senderId, message.isSystemMessage) && (
                                        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                          <button
                                            onClick={() => recallMessage(message.id)}
                                            className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full w-7 h-7 flex items-center justify-center shadow-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200 hover:scale-110"
                                            title="撤回消息 (3分钟内可撤回)"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* 消息输入框 */}
                      <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                        {/* 合法聊天提示 */}
                        <div className="mb-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                              <span className="text-yellow-800 text-xs font-bold">!</span>
                            </div>
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                              <p className="font-medium mb-1">文明聊天提醒</p>
                              <p className="text-xs">
                                请遵守法律法规，文明聊天。不得发送违法、暴力、色情、诈骗等有害信息。
                                违规用户将承担相应法律责任。
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <input
                            type="text"
                            placeholder="输入消息..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !sendingMessage) {
                                sendMessage()
                              }
                            }}
                            disabled={sendingMessage}
                          />
                          <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || sendingMessage}
                            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {sendingMessage ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <User className="w-16 h-16 mx-auto mb-4" />
                        <p>选择一个会话开始聊天</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* 删除聊天记录确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteHistoryDialog}
        onClose={() => setShowDeleteHistoryDialog(false)}
        onConfirm={deleteChatHistory}
        title="删除聊天记录"
        confirmText="确认删除"
        cancelText="取消"
        type="danger"
        loading={deletingChatHistory}
        customContent={
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300">
              确定要删除与 <span className="font-medium text-gray-900 dark:text-white">
                {targetUser?.nickname || selectedConversation?.otherUser.nickname}
              </span> 的聊天记录吗？
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <span className="font-medium">注意：</span>此操作只会删除您这边的聊天记录，不会影响对方的记录。删除后无法恢复。
              </p>
            </div>
          </div>
        }
      />
    </>
  )
}

export default MessagingModal 