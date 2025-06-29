import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, UserPlus, UserMinus, Calendar, MapPin, Link2, Heart, Trash2, MoreHorizontal, Shield, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useLanguage } from '../contexts/LanguageContext'
import MessagingModal from './MessagingModal'

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
  isOwnProfile: boolean
  role?: string
  canViewFollowers?: boolean
  canViewFollowing?: boolean
}

interface FollowUser {
  id: string
  username: string
  nickname: string
  avatar: string
  bio?: string
  role?: string
  isFollowing: boolean
  followedAt: string
}

interface Post {
  id: string
  content: string
  images: string[]
  author: {
    id: string
    username: string
    nickname: string
    avatar: string
    role?: string
  }
  likesCount: number
  commentsCount: number
  isLiked: boolean
  canDelete: boolean
  createdAt: string
}

interface UserProfileProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, userId }) => {
  const { user: currentUser } = useAuth()
  const { showSuccess, showError } = useToast()
  const { formatDate } = useLanguage()
  
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(false)
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)
  const [showMessaging, setShowMessaging] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts')
  const [userPrivacySettings, setUserPrivacySettings] = useState<any>(null)

  // 获取用户隐私设置（仅查看自己时）
  const fetchUserPrivacySettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/user-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserPrivacySettings(data.settings?.privacy || null)
      }
    } catch (error) {
      console.error('获取隐私设置失败:', error)
    }
  }

  // 获取用户信息
  const fetchUser = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/messaging?action=user-profile&userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.data)
        
        // 如果是查看自己的资料，获取隐私设置
        if (data.data.isOwnProfile) {
          fetchUserPrivacySettings()
        }
      } else if (response.status === 403) {
        const data = await response.json()
        showError(data.message || '该用户设置了隐私保护，无法查看个人资料')
        onClose() // 关闭模态框
      } else {
        showError('获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      showError('获取用户信息失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取用户帖子
  const fetchUserPosts = async () => {
    if (!userId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/content?action=posts&type=user&userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPosts(data.data.posts)
      }
    } catch (error) {
      console.error('获取用户帖子失败:', error)
    }
  }

  // 获取粉丝列表
  const fetchFollowers = async () => {
    if (!userId || !user?.canViewFollowers) return

    try {
      setFollowersLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/messaging?action=followers&userId=${userId}&page=1&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFollowers(data.data.followers)
      } else if (response.status === 403) {
        showError('该用户设置了不公开粉丝列表')
      }
    } catch (error) {
      console.error('获取粉丝列表失败:', error)
      showError('获取粉丝列表失败')
    } finally {
      setFollowersLoading(false)
    }
  }

  // 获取关注列表
  const fetchFollowing = async () => {
    if (!userId || !user?.canViewFollowing) return

    try {
      setFollowingLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/messaging?action=following&userId=${userId}&page=1&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFollowing(data.data.following)
      } else if (response.status === 403) {
        showError('该用户设置了不公开关注列表')
      }
    } catch (error) {
      console.error('获取关注列表失败:', error)
      showError('获取关注列表失败')
    } finally {
      setFollowingLoading(false)
    }
  }

  // 关注/取消关注
  const handleFollow = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/messaging', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: user.isFollowing ? 'unfollow' : 'follow',
          userId: user.id
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(prev => prev ? {
          ...prev,
          isFollowing: data.data.isFollowing,
          followersCount: data.data.followersCount
        } : null)
        showSuccess(data.message)
        
        // 如果当前正在查看粉丝列表，需要刷新
        if (activeTab === 'followers') {
          fetchFollowers()
        }
      }
    } catch (error) {
      console.error('关注操作失败:', error)
      showError('操作失败')
    }
  }

  // 关注/取消关注列表中的用户
  const handleFollowUser = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/social/messaging', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: isCurrentlyFollowing ? 'unfollow' : 'follow',
          userId: targetUserId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // 更新粉丝列表中的关注状态
        setFollowers(prev => prev.map(follower => 
          follower.id === targetUserId 
            ? { ...follower, isFollowing: data.data.isFollowing }
            : follower
        ))
        
        // 更新关注列表中的关注状态
        setFollowing(prev => prev.map(following => 
          following.id === targetUserId 
            ? { ...following, isFollowing: data.data.isFollowing }
            : following
        ))
        
        showSuccess(data.message)
      }
    } catch (error) {
      console.error('关注操作失败:', error)
      showError('操作失败')
    }
  }

  // 点赞帖子
  const handleLike = async (postId: string) => {
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
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      showError('操作失败')
    }
  }

  // 删除帖子
  const handleDeletePost = async (postId: string) => {
    if (!confirm('确定要删除这条帖子吗？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/content?action=post&id=${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        setPosts(prev => prev.filter(post => post.id !== postId))
        setUser(prev => prev ? { ...prev, postsCount: prev.postsCount - 1 } : null)
        showSuccess('帖子删除成功')
      }
    } catch (error) {
      console.error('删除帖子失败:', error)
      showError('删除失败')
    }
  }

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser()
      fetchUserPosts()
    }
  }, [isOpen, userId])

  // 当切换标签时加载相应数据
  useEffect(() => {
    if (user && activeTab === 'followers') {
      fetchFollowers()
    } else if (user && activeTab === 'following') {
      fetchFollowing()
    }
  }, [activeTab, user])

  if (!isOpen || !userId) return null

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl h-[90vh] overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">加载中...</p>
            </div>
          ) : user ? (
            <div className="flex flex-col h-full">
              {/* 用户信息头部 */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">个人主页</h2>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex items-start space-x-4">
                  {/* 头像 */}
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {user.nickname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 用户信息 */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.nickname}</h3>
                      {/* 管理员标签 */}
                      {user.role === 'admin' && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                          <Shield className="w-3 h-3 mr-1" />
                          管理员
                        </div>
                      )}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
                    
                    {user.bio && (
                      <p className="text-gray-700 dark:text-gray-300 mt-2">{user.bio}</p>
                    )}

                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                      {user.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{user.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>加入于 {formatDate(user.joinedAt, 'date')}</span>
                      </div>
                    </div>

                    {/* 统计信息 */}
                    <div className="flex space-x-6 mt-4">
                      <div className="text-center">
                        <div className="font-bold text-gray-900 dark:text-white">{user.postsCount}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">帖子</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900 dark:text-white">{user.followersCount}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">粉丝</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900 dark:text-white">{user.followingCount}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">关注</div>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  {!user.isOwnProfile && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowMessaging(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 inline mr-1" />
                        私信
                      </button>
                      <button
                        onClick={handleFollow}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          user.isFollowing
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {user.isFollowing ? (
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
                  )}
                </div>
              </div>

              {/* 标签导航 */}
              <div className="border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                <div className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`py-3 border-b-2 transition-colors ${
                      activeTab === 'posts'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    帖子 ({user.postsCount})
                  </button>
                  
                  {/* 粉丝标签 - 只有在允许查看时才显示 */}
                  {user.canViewFollowers && (
                    <button
                      onClick={() => setActiveTab('followers')}
                      className={`flex items-center space-x-1 py-3 border-b-2 transition-colors ${
                        activeTab === 'followers'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <span>粉丝 ({user.followersCount})</span>
                      {/* 在自己的资料中且设置了不可见时显示锁图标 */}
                      {user.isOwnProfile && userPrivacySettings?.showFollowers === false && (
                        <span title="粉丝列表已设为私有">
                          <Lock className="w-3 h-3 text-orange-500" />
                        </span>
                      )}
                    </button>
                  )}
                  
                  {/* 关注标签 - 只有在允许查看时才显示 */}
                  {user.canViewFollowing && (
                    <button
                      onClick={() => setActiveTab('following')}
                      className={`flex items-center space-x-1 py-3 border-b-2 transition-colors ${
                        activeTab === 'following'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <span>关注 ({user.followingCount})</span>
                      {/* 在自己的资料中且设置了不可见时显示锁图标 */}
                      {user.isOwnProfile && userPrivacySettings?.showFollowing === false && (
                        <span title="关注列表已设为私有">
                          <Lock className="w-3 h-3 text-orange-500" />
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* 内容区域 */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                {/* 帖子列表 */}
                {activeTab === 'posts' && (
                  <div className="space-y-4">
                    {posts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">暂无帖子</p>
                      </div>
                    ) : (
                      posts.map((post) => (
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
                                                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">{post.author.nickname}</p>
                                  {/* 管理员标签 */}
                                  {post.author.role === 'admin' && (
                                    <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                      <Shield className="w-2.5 h-2.5 mr-1" />
                                      管理员
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(post.createdAt, 'datetime')}</p>
                              </div>
                              </div>
                            </div>
                            {post.canDelete && (
                              <button
                                onClick={() => handleDeletePost(post.id)}
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
                            <div className="mb-3">
                              <div className="grid grid-cols-2 gap-2">
                                {post.images.map((image, index) => (
                                  <div key={index} className="aspect-square">
                                    <img
                                      src={image}
                                      alt=""
                                      className="w-full h-full object-cover rounded"
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
                              className={`flex items-center space-x-1 text-sm transition-colors ${
                                post.isLiked 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                              <span>{post.likesCount}</span>
                            </button>
                            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.commentsCount}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 粉丝列表 */}
                {activeTab === 'followers' && (
                  <div className="space-y-4">
                    {followersLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">加载粉丝列表...</p>
                      </div>
                    ) : followers.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">暂无粉丝</p>
                      </div>
                    ) : (
                      followers.map((follower) => (
                        <div key={follower.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                {follower.avatar ? (
                                  <img src={follower.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                    {follower.nickname.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white">{follower.nickname}</h4>
                                  {follower.role === 'admin' && (
                                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                      <Shield className="w-3 h-3 mr-1" />
                                      管理员
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">@{follower.username}</p>
                                {follower.bio && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{follower.bio}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">关注于 {formatDate(follower.followedAt, 'date')}</p>
                              </div>
                            </div>
                            {/* 关注按钮 - 不显示自己 */}
                            {follower.id !== currentUser?.id && (
                              <button
                                onClick={() => handleFollowUser(follower.id, follower.isFollowing)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                  follower.isFollowing
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {follower.isFollowing ? '取消关注' : '关注'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 关注列表 */}
                {activeTab === 'following' && (
                  <div className="space-y-4">
                    {followingLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">加载关注列表...</p>
                      </div>
                    ) : following.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">暂无关注</p>
                      </div>
                    ) : (
                      following.map((followingUser) => (
                        <div key={followingUser.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                {followingUser.avatar ? (
                                  <img src={followingUser.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                    {followingUser.nickname.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white">{followingUser.nickname}</h4>
                                  {followingUser.role === 'admin' && (
                                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                      <Shield className="w-3 h-3 mr-1" />
                                      管理员
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">@{followingUser.username}</p>
                                {followingUser.bio && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{followingUser.bio}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">关注于 {formatDate(followingUser.followedAt, 'date')}</p>
                              </div>
                            </div>
                            {/* 关注按钮 - 不显示自己 */}
                            {followingUser.id !== currentUser?.id && (
                              <button
                                onClick={() => handleFollowUser(followingUser.id, followingUser.isFollowing)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                  followingUser.isFollowing
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {followingUser.isFollowing ? '取消关注' : '关注'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">用户不存在</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* 私信模态框 */}
      <MessagingModal
        isOpen={showMessaging}
        onClose={() => setShowMessaging(false)}
        targetUser={user ? {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar
        } : null}
      />
    </>
  )

  return createPortal(modalContent, document.body)
}

export default UserProfile 