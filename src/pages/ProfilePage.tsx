import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Mail, Calendar, Shield, Camera, Save, X, Edit3, Check } from 'lucide-react'

interface ProfileData {
  username: string
  email: string
  fullName: string
  bio: string
  location: string
  website: string
  joinDate: string
}

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    email: '',
    fullName: '',
    bio: '',
    location: '',
    website: '',
    joinDate: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        website: user.profile?.website || '',
        joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : ''
      })
    }
  }, [user])

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          bio: profileData.bio,
          location: profileData.location,
          website: profileData.website
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: '个人资料更新成功！' })
        setIsEditing(false)
        // 更新用户信息
        if (updateProfile) {
          updateProfile(data.user)
        }
      } else {
        setMessage({ type: 'error', text: data.message || '更新失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // 重置为原始数据
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        website: user.profile?.website || '',
        joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : ''
      })
    }
    setIsEditing(false)
    setMessage(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          个人资料
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          管理您的个人信息和偏好设置
        </p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 - 头像和基本信息 */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            {/* 头像区域 */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-white">
                    {profileData.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {profileData.fullName || profileData.username}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                @{profileData.username}
              </p>
              {user?.role === 'admin' && (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 mt-2">
                  <Shield className="h-3 w-3 mr-1" />
                  管理员
                </div>
              )}
            </div>

            {/* 账户统计 */}
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-slate-400">邮箱状态:</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  user?.isEmailVerified 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {user?.isEmailVerified ? '已验证' : '未验证'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-slate-400">加入时间:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{profileData.joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧 - 详细信息表单 */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            {/* 表单头部 */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  详细信息
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    编辑
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      保存
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4 mr-1" />
                      取消
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 表单内容 */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 用户名 - 只读 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">用户名不可修改</p>
                </div>

                {/* 邮箱 - 只读 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">邮箱地址不可修改</p>
                </div>

                {/* 真实姓名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    真实姓名
                  </label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="请输入您的真实姓名"
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isEditing 
                        ? 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                    }`}
                  />
                </div>

                {/* 地址 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    所在地
                  </label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    placeholder="请输入您的所在地"
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isEditing 
                        ? 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                    }`}
                  />
                </div>

                {/* 网站 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    个人网站
                  </label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://example.com"
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isEditing 
                        ? 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                    }`}
                  />
                </div>

                {/* 个人简介 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    个人简介
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="介绍一下自己..."
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors resize-none ${
                      isEditing 
                        ? 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                    }`}
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {profileData.bio.length}/200 字符
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage 