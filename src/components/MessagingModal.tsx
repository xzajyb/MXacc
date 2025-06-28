import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle } from 'lucide-react'

interface User {
  id: string
  username: string
  nickname: string
  avatar: string
}

interface Message {
  id: string
  content: string
  sender: User
  isOwnMessage: boolean
  createdAt: string
}

interface Conversation {
  id: string
  otherUser: User
  lastMessage: {
    content: string
    createdAt: string
  } | null
  unreadCount: number
}

interface MessagingModalProps {
  isOpen: boolean
  onClose: () => void
  targetUser?: User | null
}

const MessagingModal: React.FC<MessagingModalProps> = ({ isOpen, onClose, targetUser }) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // 获取会话列表
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/messaging?action=conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setConversations(data.data.conversations)
      }
    } catch (error) {
      console.error('获取会话列表失败:', error)
    }
  }

  // 获取消息列表
  const fetchMessages = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/messaging?action=messages&conversationId=${conversationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.data.messages)
      }
    } catch (error) {
      console.error('获取消息失败:', error)
    }
  }

  // 发送消息
  const sendMessage = async () => {
    if (!newMessage.trim()) {
      alert('请输入消息内容')
      return
    }

    // 检查是否有目标用户或选中的会话
    if (!targetUser && !selectedConversation) {
      alert('请选择一个用户或会话')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      console.log('发送消息 - 调试信息:', {
        hasTargetUser: !!targetUser,
        targetUserId: targetUser?.id,
        hasSelectedConversation: !!selectedConversation,
        selectedConversation,
        messageContent: newMessage.trim()
      })
      
      // 准备请求数据
      const requestData: any = {
        action: 'send-message',
        content: newMessage.trim()
      }
      
      // 根据情况添加接收者ID或会话ID
      if (targetUser && !selectedConversation) {
        requestData.receiverId = targetUser.id
        console.log('新会话，发送给用户:', targetUser.id)
      } else if (selectedConversation && !selectedConversation.startsWith('temp-')) {
        requestData.conversationId = selectedConversation
        console.log('现有会话，会话ID:', selectedConversation)
      } else if (targetUser) {
        // 临时会话，使用receiverId
        requestData.receiverId = targetUser.id
        console.log('临时会话，发送给用户:', targetUser.id)
      }
      
      console.log('发送请求数据:', requestData)
      
      const response = await fetch('/api/social/messaging', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      console.log('API响应:', data)

      if (response.ok && data.success) {
        // 成功发送消息
        setMessages(prev => [...prev, {
          id: data.data.id || Date.now().toString(),
          content: newMessage.trim(),
          sender: { 
            id: '', 
            username: '', 
            nickname: '我', 
            avatar: '' 
          },
          isOwnMessage: true,
          createdAt: data.data.createdAt || new Date().toISOString()
        }])
        
        setNewMessage('')
        
        // 如果创建了新会话，更新选中的会话
        if (data.data.conversationId && selectedConversation?.startsWith('temp-')) {
          setSelectedConversation(data.data.conversationId)
        }
        
        // 刷新会话列表
        await fetchConversations()
        
      } else {
        console.error('发送消息失败:', data)
        alert(`发送失败: ${data.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('发送消息异常:', error)
      alert('发送消息时发生网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchConversations()
      // 如果有目标用户，自动添加到会话列表或选中现有会话
      if (targetUser) {
        // 检查是否已存在会话
        const existingConv = conversations.find(conv => conv.otherUser.id === targetUser.id)
        if (existingConv) {
          setSelectedConversation(existingConv.id)
        } else {
          // 创建临时会话条目显示
          const tempConversation: Conversation = {
            id: `temp-${targetUser.id}`,
            otherUser: targetUser,
            lastMessage: null,
            unreadCount: 0
          }
          setConversations(prev => [tempConversation, ...prev])
          setSelectedConversation(tempConversation.id)
          setMessages([]) // 清空消息列表准备新会话
        }
      }
    }
  }, [isOpen, targetUser])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl h-96 flex"
      >
        {/* 会话列表 */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-600">
          <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">私信</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-y-auto h-80">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 ${
                  selectedConversation === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                    {conversation.otherUser.avatar ? (
                      <img src={conversation.otherUser.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {conversation.otherUser.nickname.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.otherUser.nickname}
                    </p>
                    {conversation.lastMessage && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 flex flex-col">
          {selectedConversation || targetUser ? (
            <>
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        message.isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 输入区域 */}
              <div className="border-t border-gray-200 dark:border-gray-600 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="输入消息..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">选择一个会话开始聊天</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default MessagingModal 