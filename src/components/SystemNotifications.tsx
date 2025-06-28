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
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  // 打开时获取消息
  useEffect(() => {
    if (isOpen && user) {
      fetchMessages()
      fetchUnreadCount()
    }
  }, [isOpen, user])

  if (!user) return null

  return (
    <>
      {/* 铃铛图标 */}
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="系统通知"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
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
              <div className="overflow-y-auto max-h-[60vh]">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">加载中...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">暂无系统通知</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          !message.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className={`border-l-4 pl-4 ${getPriorityColor(message.priority)}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              {getMessageIcon(message.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className={`text-sm font-medium ${
                                    !message.isRead 
                                      ? 'text-gray-900 dark:text-white' 
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {message.title}
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTime(message.createdAt)}
                                    </span>
                                    {!message.isRead ? (
                                      <button
                                        onClick={() => markAsRead(message.id)}
                                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                        title="标记为已读"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <CheckCheck className="w-4 h-4 text-green-600" />
                                    )}
                                  </div>
                                </div>
                                <p className={`text-sm whitespace-pre-wrap ${
                                  !message.isRead 
                                    ? 'text-gray-800 dark:text-gray-200' 
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {message.content}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    发布者：{message.author.nickname}
                                  </span>
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
                            </div>
                          </div>
                        </div>
                      </div>
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