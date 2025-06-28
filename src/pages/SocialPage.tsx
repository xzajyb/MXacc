import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useLanguage } from '../contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Image as ImageIcon, 
  Users, 
  Search,
  UserPlus,
  UserMinus,
  MoreHorizontal,
  Edit3,
  Trash2,
  X,
  Plus
} from 'lucide-react'

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
  createdAt: string
  updatedAt: string
}

interface Comment {
  id: string
  content: string
  author: {
    id: string
    username: string
    nickname: string
    avatar: string
  }
  createdAt: string
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
}

const SocialPage: React.FC<SocialPageProps> = ({ embedded = false }) => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const { t, formatDate } = useLanguage()
  
  const [activeTab, setActiveTab] = useState<'feed' | 'following' | 'explore'>('feed')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [commentContent, setCommentContent] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  // 获取帖子列表
  const fetchPosts = async (type: 'feed' | 'following' = 'feed') => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/posts?type=${type}`, {
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

    try {
      setIsPosting(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create',
          content: newPostContent.trim()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setPosts(prev => [data.data, ...prev])
        setNewPostContent('')
        showSuccess('帖子发布成功')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || '发布失败')
      }
    } catch (error) {
      console.error('发布帖子失败:', error)
      showError(error.message || '发布帖子失败')
    } finally {
      setIsPosting(false)
    }
  }

  // 点赞/取消点赞
  const handleLike = async (postId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'like',
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

  // 获取评论
  const fetchComments = async (postId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/comments?postId=${postId}`, {
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
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'comment',
          postId,
          commentContent: content.trim()
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
        showSuccess('评论发布成功')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || '评论失败')
      }
    } catch (error) {
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
      showError('搜索失败')
    }
  }

  // 关注/取消关注用户
  const handleFollow = async (userId: string, isFollowing: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/users', {
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
    } catch (error) {
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
              onClick={() => setActiveTab('following')}
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
                showSearch
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              发现用户
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
                  {searchResults.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {searchResults.map((searchUser) => (
                        <div key={searchUser.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
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
                          <button
                            onClick={() => handleFollow(searchUser.id, searchUser.isFollowing)}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${
                              searchUser.isFollowing
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {searchUser.isFollowing ? (
                              <>
                                <UserMinus className="w-4 h-4 inline mr-1" />
                                取消关注
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 inline mr-1" />
                                关注
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 发布帖子 */}
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
                placeholder="分享你的想法..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                    <ImageIcon className="w-5 h-5" />
                  </button>
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
            </div>
          </div>
        </div>

        {/* 帖子列表 */}
        <div className="space-y-6">
          {loading ? (
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
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                      {post.author.avatar ? (
                        <img src={post.author.avatar} alt={post.author.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-bold">{post.author.nickname.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{post.author.nickname}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(post.createdAt, 'datetime')}</p>
                    </div>
                  </div>
                  {post.author.id === user?.id && (
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <MoreHorizontal className="w-5 h-5" />
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
                    <div className="grid grid-cols-2 gap-2">
                      {post.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`帖子图片 ${index + 1}`}
                          className="rounded-lg object-cover w-full h-48"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 帖子操作 */}
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="flex space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${
                        post.isLiked 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likesCount}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.commentsCount}</span>
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
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                        {/* 评论输入 */}
                        <div className="flex space-x-3 mb-4">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                            {user?.profile?.avatar ? (
                              <img src={user.profile.avatar} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-xs text-white font-bold">{user?.username?.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex space-x-2">
                            <input
                              type="text"
                              placeholder="写评论..."
                              value={commentContent[post.id] || ''}
                              onChange={(e) => setCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              maxLength={500}
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

                        {/* 评论列表 */}
                        <div className="space-y-3">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex space-x-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                                {comment.author.avatar ? (
                                  <img src={comment.author.avatar} alt={comment.author.nickname} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                    <span className="text-xs text-white font-bold">{comment.author.nickname.charAt(0).toUpperCase()}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-sm text-gray-900 dark:text-white">{comment.author.nickname}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.createdAt, 'datetime')}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default SocialPage 