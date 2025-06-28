import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { 
  Bell, 
  X, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

interface SystemMessage {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  autoRead: boolean
  isRead: boolean
  createdAt: string
  author: {
    id: string
    nickname: string
  }
}

interface SystemNotificationsProps {
  className?: string
}

const SystemNotifications: React.FC<SystemNotificationsProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<SystemMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // 获取未读消息数量
  const fetchUnreadCount = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/system-messages?action=unread-count', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.data.unreadCount)
      }
    } catch (error) {
      console.error('获取未读消息数量失败:', error)
    }
  }

  // 获取消息列表
  const fetchMessages = async () => {
    if (!user) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/system-messages?action=list&page=1&limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.data.messages)
      }
    } catch (error) {
      console.error('获取消息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 标记消息为已读
  const markAsRead = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/system-messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'mark-read',
          messageId
        })
      })
      
      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        ))
        await fetchUnreadCount()
      }
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  // 标记所有消息为已读
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/system-messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'mark-all-read'
        })
      })
      
      if (response.ok) {
        setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })))
        setUnreadCount(0)
        showSuccess('所有消息已标记为已读')
      }
    } catch (error) {
      console.error('标记所有已读失败:', error)
      showError('操作失败')
    }
  }

  // 获取消息类型图标
  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10'
      case 'normal':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
      case 'low':
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10'
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10'
    }
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    const diffInHours = diffInMinutes / 60
    const diffInDays = diffInHours / 24

    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}分钟前`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  // 定期检查未读消息
  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 15000) // 改为15秒
      return () => clearInterval(interval)
    }
  }, [user])

  // 自动标记已读（针对autoRead=true的消息）
  const autoMarkAsRead = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/admin/system-messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'mark-read',
          messageId
        })
      })
    } catch (error) {
      console.error('自动标记已读失败:', error)
    }
  }

  // 打开时获取消息并自动标记已读
  useEffect(() => {
    if (isOpen && user) {
      fetchMessages()
      fetchUnreadCount()
      
      // 延迟自动标记未读的autoRead消息为已读
      setTimeout(() => {
        messages.forEach(message => {
          if (!message.isRead && message.autoRead) {
            autoMarkAsRead(message.id)
          }
        })
        // 延迟后重新获取消息状态
        setTimeout(() => {
          fetchMessages()
          fetchUnreadCount()
        }, 500)
      }, 1000)
    }
  }, [isOpen, user, messages.length])

  if (!user) return null

  return (
    <>
      {/* 铃铛图标 */}
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105"
          title="系统通知"
        >
          <Bell className={`w-5 h-5 transition-all duration-200 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 通知弹窗 */}
      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    系统通知
                  </h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount} 条未读
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      全部标记已读
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 消息列表 */}
              <div className="overflow-y-auto max-h-[60vh] bg-gray-50 dark:bg-gray-900">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="relative mx-auto w-16 h-16 mb-4">
                      <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">正在加载通知...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full flex items-center justify-center">
                      <Bell className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">暂无系统通知</h3>
                    <p className="text-gray-500 dark:text-gray-400">当有新的系统消息时，会在这里显示</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
                          !message.isRead 
                            ? 'bg-white dark:bg-gray-800 shadow-md ring-2 ring-blue-500/20' 
                            : 'bg-white/70 dark:bg-gray-800/70 shadow-sm'
                        }`}
                      >
                        {/* 顶部状态条 */}
                        <div className={`h-1 ${
                          message.priority === 'urgent' ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : message.priority === 'high' ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                          : message.priority === 'normal' ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`} />
                        
                        <div className="p-5">
                          <div className="flex items-start space-x-4">
                            {/* 消息图标 */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                              message.type === 'success' ? 'bg-green-100 dark:bg-green-900/20'
                              : message.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20'
                              : message.type === 'error' ? 'bg-red-100 dark:bg-red-900/20'
                              : 'bg-blue-100 dark:bg-blue-900/20'
                            }`}>
                              {getMessageIcon(message.type)}
                            </div>
                            
                            {/* 消息内容 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className={`text-base font-semibold leading-tight ${
                                  !message.isRead 
                                    ? 'text-gray-900 dark:text-white' 
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {message.title}
                                </h4>
                                
                                {/* 右侧状态 */}
                                <div className="flex items-center space-x-3 ml-4">
                                  {/* 自动确认标识 */}
                                  {message.autoRead && (
                                    <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                      <span>自动确认</span>
                                    </div>
                                  )}
                                  
                                  {/* 优先级标签 */}
                                  {message.priority !== 'normal' && (
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                      message.priority === 'urgent' 
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                        : message.priority === 'high'
                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                                    }`}>
                                      {message.priority === 'urgent' ? '🚨 紧急' : 
                                       message.priority === 'high' ? '⚡ 重要' : '📌 低优先级'}
                                    </span>
                                  )}
                                  
                                  {/* 已读状态 */}
                                  {!message.isRead ? (
                                    !message.autoRead && (
                                      <button
                                        onClick={() => markAsRead(message.id)}
                                        className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
                                        title="标记为已读"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>确认</span>
                                      </button>
                                    )
                                  ) : (
                                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400 text-xs bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                      <CheckCheck className="w-3 h-3" />
                                      <span>已读</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* 消息正文 */}
                              <p className={`text-sm leading-relaxed mb-3 ${
                                !message.isRead 
                                  ? 'text-gray-800 dark:text-gray-200' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {message.content}
                              </p>
                              
                              {/* 底部信息 */}
                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center space-x-3">
                                  <span className="flex items-center space-x-1">
                                    <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">S</span>
                                    </div>
                                    <span>{message.author.nickname}</span>
                                  </span>
                                  <span>•</span>
                                  <span>{formatTime(message.createdAt)}</span>
                                </div>
                                
                                {!message.isRead && (
                                  <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="font-medium">新消息</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default SystemNotifications 