import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useLanguage } from '../contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Search,
  ArrowLeft,
  MoreVertical,
  Circle,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react'

interface User {
  id: string
  username: string
  nickname: string
  avatar: string
  lastActive?: string
}

interface Message {
  id: string
  content: string
  senderId: string
  sender: User
  isRead: boolean
  createdAt: string
}

interface Conversation {
  id: string
  otherUser: User
  lastMessage: {
    content: string
    senderId: string
    createdAt: string
    isRead: boolean
  } | null
  unreadCount: number
  updatedAt: string
}

interface MessagesPanelProps {
  embedded?: boolean
}

const MessagesPanel: React.FC<MessagesPanelProps> = ({ embedded = false }) => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const { formatDate } = useLanguage()
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showSearch, setShowSearch] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 获取会话列表
  const fetchConversations = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/messages?action=conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setConversations(data.data.conversations)
      } else {
        throw new Error('获取会话列表失败')
      }
    } catch (error) {
      console.error('获取会话列表失败:', error)
      showError('获取会话列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取消息列表
  const fetchMessages = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/messages?action=messages&conversationId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.data.messages)
        setActiveConversation(conversationId)
      } else {
        throw new Error('获取消息失败')
      }
    } catch (error) {
      console.error('获取消息失败:', error)
      showError('获取消息失败')
    }
  }

  // 发送消息
  const sendMessage = async (recipientId?: string) => {
    if (!newMessage.trim()) return

    try {
      setSending(true)
      const token = localStorage.getItem('token')
      
      const body: any = {
        action: 'send',
        content: newMessage.trim()
      }

      if (activeConversation) {
        body.conversationId = activeConversation
      } else if (recipientId) {
        body.userId = recipientId
      } else {
        throw new Error('缺少收件人信息')
      }

      const response = await fetch('/api/social/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.data])
        setNewMessage('')
        
        if (!activeConversation) {
          setActiveConversation(data.data.conversationId)
        }
        
        // 更新会话列表
        fetchConversations()
        
        if (inputRef.current) {
          inputRef.current.focus()
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || '发送失败')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      showError(error.message || '发送消息失败')
    } finally {
      setSending(false)
    }
  }

  // 搜索用户
  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/users?action=search&search=${encodeURIComponent(searchQuery.trim())}`, {
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
    }
  }

  // 开始新对话
  const startNewConversation = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/messages?action=messages&userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.data.messages)
        setActiveConversation(data.data.conversationId)
        setShowSearch(false)
        setSearchQuery('')
        setSearchResults([])
      }
    } catch (error) {
      console.error('创建会话失败:', error)
      showError('创建会话失败')
    }
  }

  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(searchUsers, 500)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  useEffect(() => {
    fetchConversations()
  }, [])

  // 获取在线状态颜色
  const getOnlineStatus = (lastActive?: string) => {
    if (!lastActive) return 'bg-gray-400'
    
    const lastActiveTime = new Date(lastActive).getTime()
    const now = Date.now()
    const diffMinutes = (now - lastActiveTime) / (1000 * 60)
    
    if (diffMinutes < 5) return 'bg-green-500' // 在线
    if (diffMinutes < 30) return 'bg-yellow-500' // 离开
    return 'bg-gray-400' // 离线
  }

  // 格式化时间
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return formatDate(dateString, 'date')
    }
  }

  const containerClass = embedded 
    ? "h-full flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" 
    : "h-screen bg-gray-50 dark:bg-gray-900 p-6"

  return (
    <div className={containerClass}>
      {/* 左侧会话列表 */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              私信
            </h2>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Search className="w-5 h-5" />
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
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="搜索用户..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* 搜索结果 */}
                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto">
                    {searchResults.map((searchUser) => (
                      <div
                        key={searchUser.id}
                        onClick={() => startNewConversation(searchUser.id)}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                            {searchUser.avatar ? (
                              <img src={searchUser.avatar} alt={searchUser.nickname} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-xs text-white font-bold">{searchUser.nickname.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{searchUser.nickname}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{searchUser.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              暂无对话
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => fetchMessages(conversation.id)}
                className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  activeConversation === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                      {conversation.otherUser.avatar ? (
                        <img src={conversation.otherUser.avatar} alt={conversation.otherUser.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-bold">{conversation.otherUser.nickname.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    {/* 在线状态指示器 */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getOnlineStatus(conversation.otherUser.lastActive)}`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {conversation.otherUser.nickname}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {conversation.lastMessage && formatMessageTime(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {conversation.lastMessage ? conversation.lastMessage.content : '暂无消息'}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] text-center">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧聊天区域 */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* 聊天头部 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  {(() => {
                    const conversation = conversations.find(c => c.id === activeConversation)
                    if (!conversation) return null
                    
                    return (
                      <>
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                            {conversation.otherUser.avatar ? (
                              <img src={conversation.otherUser.avatar} alt={conversation.otherUser.nickname} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-bold">{conversation.otherUser.nickname.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getOnlineStatus(conversation.otherUser.lastActive)}`}></div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {conversation.otherUser.nickname}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{conversation.otherUser.username}
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>
                
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${message.senderId === user?.id ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-2xl px-4 py-2 ${
                      message.senderId === user?.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className={`flex items-center mt-1 space-x-1 ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMessageTime(message.createdAt)}
                      </span>
                      {message.senderId === user?.id && (
                        <div className="text-gray-500 dark:text-gray-400">
                          {message.isRead ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 消息输入框 */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
                    placeholder="输入消息..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={sending}
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* 空状态 */
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                选择一个对话
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                从左侧选择一个对话开始聊天，或搜索用户开始新对话
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessagesPanel 