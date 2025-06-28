import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

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
}

const MessagingModal: React.FC<MessagingModalProps> = ({ 
  isOpen, 
  targetUser, 
  onClose 
}) => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
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
      }
    } catch (error) {
      console.error('获取会话列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取特定会话的消息
  const fetchMessages = async (conversationId?: string, otherUserId?: string) => {
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
      }
    } catch (error) {
      console.error('获取消息失败:', error)
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
        
        // 刷新消息列表
        if (targetUser) {
          // 通过主页私信时，获取与目标用户的消息
          await fetchMessages(undefined, targetUser.id)
        } else if (selectedConversation) {
          // 通过会话列表时，获取该会话的消息
          await fetchMessages(selectedConversation.id)
        }
        
        // 刷新会话列表
        await fetchConversations()
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
      if (targetUser) {
        // 通过主页私信：直接获取与目标用户的消息，不显示会话列表
        console.log('通过主页私信模式，目标用户:', targetUser.nickname)
        fetchMessages(undefined, targetUser.id)
      } else {
        // 通过私信选项卡：显示会话列表
        console.log('通过私信选项卡模式，获取会话列表')
        fetchConversations()
      }
    }
  }, [isOpen, targetUser])

  // 当选择会话时获取消息
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return date.toLocaleDateString('zh-CN', { 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const showConversationsList = !targetUser // 只有不是通过主页私信时才显示会话列表

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[600px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {targetUser ? `与 ${targetUser.nickname} 的对话` : '私信'}
              </h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                          onClick={() => setSelectedConversation(conv)}
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
                    </div>

                    {/* 消息列表 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                          <p>暂无消息，开始聊天吧～</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
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
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* 消息输入框 */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-600">
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
      )}
    </AnimatePresence>
  )
}

export default MessagingModal 