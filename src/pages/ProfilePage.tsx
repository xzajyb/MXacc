import React, { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Save, X, Edit3, Camera } from 'lucide-react'

const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
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

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    try {
      // TODO: 实现个人资料更新API调用
      setMessage('个人资料更新功能正在开发中')
      setIsEditing(false)
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

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('成功') ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
          {message}
        </div>
      )}

      {/* 个人资料卡片 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {user?.profile?.avatar ? (
                  <img 
                    src={user.profile.avatar} 
                    alt="头像" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={48} className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">用户头像</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">头像上传功能开发中</p>
            </div>
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
                {user?.createdAt ? formatJoinDate(user.createdAt) : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">上次登录</span>
              <span className="text-gray-900 dark:text-white">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('zh-CN') : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage 