import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  MessageCircle, 
  FileText, 
  Activity, 
  Search, 
  Send, 
  Heart, 
  Share2, 
  MessageSquare,
  UserPlus,
  UserMinus,
  Check,
  X,
  MoreHorizontal,
  Edit3,
  Trash2,
  Clock,
  Eye,
  Globe,
  Lock
} from 'lucide-react'

interface SocialPageProps {
  embedded?: boolean
}

interface User {
  id: string
  username: string
  email: string
  profile?: {
    nickname?: string
    avatar?: string
    bio?: string
  }
  isOnline?: boolean
  lastSeen?: string
}

interface Post {
  id: string
  user: User
  content: string
  createdAt: string
  likes: number
  comments: number
  shares: number
  isLiked?: boolean
  visibility: 'public' | 'friends' | 'private'
}

interface Message {
  id: string
  from: User
  to: User
  content: string
  createdAt: string
  isRead: boolean
}

interface FriendRequest {
  id: string
  from: User
  to: User
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

type SocialView = 'overview' | 'friends' | 'messages' | 'posts' | 'activities'

const SocialPage: React.FC<SocialPageProps> = ({ embedded = false }) => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { showSuccess, showError } = useToast()
  const [activeView, setActiveView] = useState<SocialView>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [postVisibility, setPostVisibility] = useState<'public' | 'friends' | 'private'>('public')
  
  // Mock data - 在实际应用中这些应该从API获取
  const [friends] = useState<User[]>([
    {
      id: '1',
      username: 'alice',
      email: 'alice@example.com',
      profile: { nickname: '爱丽丝', avatar: '', bio: '喜欢摄影和旅行' },
      isOnline: true
    },
    {
      id: '2',
      username: 'bob',
      email: 'bob@example.com',
      profile: { nickname: '鲍勃', avatar: '', bio: '软件开发工程师' },
      isOnline: false,
      lastSeen: '2024-01-15T10:30:00Z'
    }
  ])

  const [posts] = useState<Post[]>([
    {
      id: '1',
      user: friends[0],
      content: '今天天气真好，出去散步了！',
      createdAt: '2024-01-15T14:30:00Z',
      likes: 5,
      comments: 2,
      shares: 1,
      isLiked: false,
      visibility: 'public'
    },
    {
      id: '2',
      user: friends[1],
      content: '刚完成了一个新项目，很有成就感！',
      createdAt: '2024-01-15T12:15:00Z',
      likes: 8,
      comments: 3,
      shares: 2,
      isLiked: true,
      visibility: 'friends'
    }
  ])

  const [messages] = useState<Message[]>([
    {
      id: '1',
      from: friends[0],
      to: user!,
      content: '你好！最近怎么样？',
      createdAt: '2024-01-15T15:30:00Z',
      isRead: false
    }
  ])

  const [friendRequests] = useState<FriendRequest[]>([
    {
      id: '1',
      from: { id: '3', username: 'charlie', email: 'charlie@example.com', profile: { nickname: '查理' } },
      to: user!,
      status: 'pending',
      createdAt: '2024-01-15T09:00:00Z'
    }
  ])

  const socialFeatures = [
    {
      id: 'friends',
      title: t.social.friends,
      description: t.social.friendsDesc,
      icon: Users,
      color: 'blue',
      count: friends.length
    },
    {
      id: 'messages',
      title: t.social.messages,
      description: t.social.messagesDesc,
      icon: MessageCircle,
      color: 'green',
      count: messages.filter(m => !m.isRead).length
    },
    {
      id: 'posts',
      title: t.social.posts,
      description: t.social.postsDesc,
      icon: FileText,
      color: 'purple',
      count: posts.length
    },
    {
      id: 'activities',
      title: t.social.activities,
      description: t.social.activitiesDesc,
      icon: Activity,
      color: 'orange',
      count: 12
    }
  ]

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return
    
    // 在实际应用中，这里会调用API创建新帖子
    showSuccess('动态发布成功！')
    setNewPostContent('')
  }

  const handleLikePost = (postId: string) => {
    // 在实际应用中，这里会调用API点赞/取消点赞
    showSuccess('已点赞')
  }

  const handleSendMessage = (toUserId: string, content: string) => {
    // 在实际应用中，这里会调用API发送消息
    showSuccess('消息发送成功')
  }

  const handleFriendRequest = (requestId: string, action: 'accept' | 'reject') => {
    // 在实际应用中，这里会调用API处理好友请求
    showSuccess(action === 'accept' ? '已接受好友请求' : '已拒绝好友请求')
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return date.toLocaleDateString('zh-CN')
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 功能卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {socialFeatures.map((feature) => {
          const Icon = feature.icon
          const colorClass = {
            blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
            green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
            purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
            orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
          }[feature.color]

          return (
            <motion.div
              key={feature.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-all"
              onClick={() => setActiveView(feature.id as SocialView)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {feature.count > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {feature.count}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
            </motion.div>
          )
        })}
      </div>

      {/* 最新动态 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">最新动态</h3>
        <div className="space-y-4">
          {posts.slice(0, 3).map((post) => (
            <div key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {post.user.profile?.nickname?.charAt(0) || post.user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {post.user.profile?.nickname || post.user.username}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(post.createdAt)}
                    </span>
                    <div className="flex items-center">
                      {post.visibility === 'public' && <Globe className="w-3 h-3 text-gray-400" />}
                      {post.visibility === 'friends' && <Users className="w-3 h-3 text-gray-400" />}
                      {post.visibility === 'private' && <Lock className="w-3 h-3 text-gray-400" />}
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{post.content}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                      <Heart className={`w-4 h-4 ${post.isLiked ? 'text-red-500 fill-current' : ''}`} />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>{post.shares}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 好友请求 */}
      {friendRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">好友请求</h3>
          <div className="space-y-3">
            {friendRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {request.from.profile?.nickname?.charAt(0) || request.from.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {request.from.profile?.nickname || request.from.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      想要添加您为好友
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFriendRequest(request.id, 'accept')}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFriendRequest(request.id, 'reject')}
                    className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderPosts = () => (
    <div className="space-y-6">
      {/* 发布新动态 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">发布动态</h3>
        <div className="space-y-4">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={t.social.postPlaceholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">可见性：</label>
              <select
                value={postVisibility}
                onChange={(e) => setPostVisibility(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="public">公开</option>
                <option value="friends">仅好友</option>
                <option value="private">私密</option>
              </select>
            </div>
            <button
              onClick={handleCreatePost}
              disabled={!newPostContent.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{t.social.sendPost}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 动态列表 */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {post.user.profile?.nickname?.charAt(0) || post.user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {post.user.profile?.nickname || post.user.username}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(post.createdAt)}
                    </span>
                    <div className="flex items-center">
                      {post.visibility === 'public' && <Globe className="w-3 h-3 text-gray-400" />}
                      {post.visibility === 'friends' && <Users className="w-3 h-3 text-gray-400" />}
                      {post.visibility === 'private' && <Lock className="w-3 h-3 text-gray-400" />}
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-6">
                <button 
                  onClick={() => handleLikePost(post.id)}
                  className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${post.isLiked ? 'text-red-500 fill-current' : ''}`} />
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                  <span>{post.comments}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span>{post.shares}</span>
                </button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Eye className="w-4 h-4" />
                <span>128 次查看</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>{t.social.noPosts}</p>
        </div>
      )}
    </div>
  )

  const renderFriends = () => (
    <div className="space-y-6">
      {/* 搜索框 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.social.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* 好友列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t.social.friendsList} ({friends.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <div key={friend.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {friend.profile?.nickname?.charAt(0) || friend.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-700 ${
                    friend.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {friend.profile?.nickname || friend.username}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {friend.isOnline ? t.social.online : `${t.social.lastSeen} ${formatTime(friend.lastSeen || '')}`}
                  </p>
                </div>
              </div>
              
              {friend.profile?.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {friend.profile.bio}
                </p>
              )}
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleSendMessage(friend.id, '你好！')}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4 inline mr-1" />
                  {t.social.sendMessage}
                </button>
                <button className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {friends.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{t.social.noFriends}</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderMessages = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.social.messages}</h3>
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {message.from.profile?.nickname?.charAt(0) || message.from.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-white">
                  {message.from.profile?.nickname || message.from.username}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatTime(message.createdAt)}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{message.content}</p>
              {!message.isRead && (
                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                  未读
                </span>
              )}
            </div>
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{t.social.noMessages}</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderActivities = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.social.activities}</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-gray-900 dark:text-white">爱丽丝点赞了您的动态</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">2小时前</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <MessageCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-gray-900 dark:text-white">鲍勃评论了您的动态</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">4小时前</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <UserPlus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <div>
            <p className="text-gray-900 dark:text-white">查理发送了好友请求</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">1天前</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeView) {
      case 'friends':
        return renderFriends()
      case 'messages':
        return renderMessages()
      case 'posts':
        return renderPosts()
      case 'activities':
        return renderActivities()
      default:
        return renderOverview()
    }
  }

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3
  }

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gray-50 dark:bg-gray-900"}>
      <div className={embedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* 页面标题 */}
        {!embedded && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              {t.social.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t.social.description}</p>
          </div>
        )}

        {/* 标签页导航 */}
        {activeView !== 'overview' && (
          <div className="mb-6">
            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'overview', label: '概览', icon: Activity },
                { id: 'friends', label: t.social.friends, icon: Users },
                { id: 'messages', label: t.social.messages, icon: MessageCircle },
                { id: 'posts', label: t.social.posts, icon: FileText },
                { id: 'activities', label: t.social.activities, icon: Activity }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id as SocialView)}
                    className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                      activeView === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SocialPage 