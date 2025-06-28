import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Send, 
  Search, 
  X, 
  ArrowLeft,
  MoreHorizontal,
  Trash2
} from 'lucide-react'

interface Message {
  id: string
  content: string
  messageType: string
  sender: {
    id: string
    username: string
    nickname: string
    avatar: string
  }
  readAt?: string
  createdAt: string
}

interface Conversation {
  id: string
  otherUser: {
    id: string
    username: string
    nickname: string
    avatar: string
  }
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  createdAt: string
}

interface MessageSystemProps {
  onClose: () => void
}

const MessageSystem: React.FC<MessageSystemProps> = ({ onClose }) => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  
  const [activeView, setActiveView] = useState<'conversations' | 'chat'>('conversations')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // 获取对话列表
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
      }
    } catch (error) {
      console.error('获取对话列表失败:', error)
      showError('获取对话列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取对话消息
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
        // 标记消息为已读
        markAsRead(conversationId)
      }
    } catch (error) {
      console.error('获取消息失败:', error)
      showError('获取消息失败')
    }
  }

  // 发送消息
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send',
          recipientId: currentConversation.otherUser.id,
          content: newMessage.trim()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, {
          id: data.data.messageId,
          content: data.data.content,
          messageType: 'text',
          sender: data.data.sender,
          createdAt: data.data.createdAt
        }])
        setNewMessage('')
        // 刷新对话列表
        fetchConversations()
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      showError('发送消息失败')
    }
  }

  // 标记已读
  const markAsRead = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/social/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'mark-read',
          conversationId
        })
      })
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  // 打开对话
  const openConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation)
    setActiveView('chat')
    fetchMessages(conversation.id)
  }

  // 返回对话列表
  const backToConversations = () => {
    setActiveView('conversations')
    setCurrentConversation(null)
    setMessages([])
    fetchConversations() // 刷新对话列表
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-96 flex flex-col"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {activeView === 'chat' && (
              <button
                onClick={backToConversations}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {activeView === 'conversations' ? '私信' : currentConversation?.otherUser.nickname}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {activeView === 'conversations' ? (
            // 对话列表视图
            <div className="flex-1 flex flex-col">
              {/* 搜索框 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="搜索对话..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 对话列表 */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                    暂无对话
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => openConversation(conversation)}
                      className="flex items-center space-x-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                        {conversation.otherUser.avatar ? (
                          <img src={conversation.otherUser.avatar} alt={conversation.otherUser.nickname} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold">{conversation.otherUser.nickname.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">{conversation.otherUser.nickname}</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{conversation.lastMessage}</p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 ml-2">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            // 聊天视图
            <div className="flex-1 flex flex-col">
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      message.sender.id === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender.id === user?.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 输入区域 */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="输入消息..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={1000}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default MessageSystem 