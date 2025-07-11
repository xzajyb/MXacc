import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Save, X, Edit3, Coins } from 'lucide-react'
import AvatarUploader from '../components/AvatarUploader'

interface ProfilePageProps {
  embedded?: boolean
}

const ProfilePage: React.FC<ProfilePageProps> = ({ embedded = false }) => {
  const { user, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [pointsData, setPointsData] = useState<{
    balances: any[]
    transactions: any[]
  } | null>(null)
  const [pointsLoading, setPointsLoading] = useState(false)
  
  // 调试日志
  console.log('ProfilePage - 用户数据:', user)
  console.log('ProfilePage - lastLogin:', user?.lastLogin)
  
  const [formData, setFormData] = useState({
    nickname: user?.profile?.nickname || '',
    bio: user?.profile?.bio || '',
    location: user?.profile?.location || '',
    website: user?.profile?.website || ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarUpload = async (file: Blob, preview: string) => {
    setAvatarLoading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      console.log('开始上传头像...')

      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      console.log('上传响应状态:', response.status)

      if (response.ok) {
        try {
          const data = await response.json()
          console.log('上传成功:', data)
          setMessage('头像更新成功')
          // 刷新用户信息
          if (refreshUser) {
            await refreshUser()
          }
        } catch (jsonError) {
          console.error('解析成功响应JSON失败:', jsonError)
          setMessage('头像上传可能成功，但服务器响应格式异常')
        }
      } else {
        // 尝试解析错误响应
        const responseText = await response.text()
        console.error('上传失败，状态码:', response.status)
        console.error('响应内容:', responseText)
        
        try {
          const errorData = JSON.parse(responseText)
          setMessage(errorData.message || '头像上传失败')
        } catch (jsonError) {
          // 如果不是JSON，显示状态信息
          setMessage(`头像上传失败 (错误码: ${response.status}): ${responseText.substring(0, 100)}`)
        }
      }
    } catch (error) {
      console.error('头像上传失败:', error)
      setMessage('网络错误，头像上传失败，请重试')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleAvatarRemove = async () => {
    setAvatarLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/upload-avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setMessage('头像删除成功')
        // 刷新用户信息
        if (refreshUser) {
          await refreshUser()
        }
      } else {
        const errorData = await response.json()
        setMessage(errorData.message || '头像删除失败')
      }
    } catch (error) {
      console.error('头像删除失败:', error)
      setMessage('网络错误，头像删除失败，请重试')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMessage('个人资料更新成功')
        setIsEditing(false)
        // 刷新用户信息
        if (refreshUser) {
          await refreshUser()
        }
      } else {
        const errorData = await response.json()
        setMessage(errorData.message || '更新失败')
      }
    } catch (error: any) {
      setMessage('更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      nickname: user?.profile?.nickname || '',
      bio: user?.profile?.bio || '',
      location: user?.profile?.location || '',
      website: user?.profile?.website || ''
    })
    setIsEditing(false)
  }

  // 获取积分信息
  const fetchPointsData = async () => {
    if (!user?.id) return
    
    try {
      setPointsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/content?action=user-points&userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPointsData(data.data)
      } else if (response.status === 403) {
        // 权限不足，静默处理
        console.log('无权限查看积分信息')
      }
    } catch (error) {
      console.error('获取积分信息失败:', error)
    } finally {
      setPointsLoading(false)
    }
  }

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 在组件加载时获取积分信息
  useEffect(() => {
    if (user?.id) {
      fetchPointsData()
    }
  }, [user?.id])

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gray-50 dark:bg-gray-900"}>
      <div className={embedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* 页面标题 */}
        {!embedded && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            个人资料
          </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">管理您的个人信息和账户设置</p>
          </div>
        )}

        {/* 消息提示 */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('成功') ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
            {message}
          </div>
        )}

        {/* 个人资料卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">个人资料</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 size={16} />
                <span>编辑</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Save size={16} />
                  <span>{loading ? '保存中...' : '保存'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X size={16} />
                  <span>取消</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 头像区域 */}
            <div className="flex flex-col items-center space-y-4">
              <AvatarUploader
                currentAvatar={user?.profile?.avatar}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
                username={user?.username}
                loading={avatarLoading}
              />
            </div>

            {/* 基本信息 */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  昵称
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="请输入昵称"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-50 disabled:dark:bg-gray-700 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  个人简介
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="介绍一下自己..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-50 disabled:dark:bg-gray-700 disabled:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    所在地
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="您的所在地"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-50 disabled:dark:bg-gray-700 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    个人网站
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-50 disabled:dark:bg-gray-700 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 账户信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">账户信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">账户状态</span>
                <span className="text-green-600 dark:text-green-400 font-medium">正常</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">邮箱验证</span>
                <span className={user?.isEmailVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {user?.isEmailVerified ? '已验证' : '未验证'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">用户角色</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {user?.role === 'admin' ? '管理员' : '普通用户'}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">注册时间</span>
                <span className="text-gray-900 dark:text-white">
                  {user?.createdAt ? formatJoinDate(user.createdAt) : '未知'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">上次登录</span>
                <span className="text-gray-900 dark:text-white">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('zh-CN') : '当前会话'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 积分信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Coins className="w-5 h-5 mr-2 text-blue-600" />
            我的积分
          </h3>
          
          {pointsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">加载积分信息...</p>
            </div>
          ) : pointsData && pointsData.balances.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pointsData.balances.map((balance) => (
                <div
                  key={balance.pointTypeId}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border"
                  style={{
                    borderColor: `${balance.pointType.color}30`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span 
                        className="text-xl"
                        style={{ color: balance.pointType.color }}
                      >
                        {balance.pointType.symbol}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {balance.pointType.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(balance.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p 
                        className="text-xl font-bold"
                        style={{ color: balance.pointType.color }}
                      >
                        {balance.amount}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Coins className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">暂无积分记录</p>
              <p className="text-sm text-gray-400 mt-1">完成任务或活动来获得积分奖励</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage 