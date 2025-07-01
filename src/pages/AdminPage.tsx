import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Shield, Mail, Users, Send, AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react'
import { motion } from 'framer-motion'

interface User {
  _id: string
  username: string
  email: string
  isEmailVerified: boolean
  role: string
  createdAt: string
  lastLoginAt?: string
  isDisabled?: boolean
}

interface UserStats {
  total: number
  verified: number
  unverified: number
  admins: number
  disabled: number
}

interface AdminPageProps {
  embedded?: boolean
}

const AdminPage: React.FC<AdminPageProps> = ({ embedded = false }) => {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'email' | 'users' | 'messages'>('email')
  const [loading, setLoading] = useState(false)

  // 检查管理员权限
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">访问被拒绝</h1>
          <p className="text-gray-600 dark:text-gray-400">您需要管理员权限才能访问此页面</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'email' as const, label: '邮件管理', icon: Mail },
    { id: 'users' as const, label: '用户管理', icon: Users },
    { id: 'messages' as const, label: '系统消息', icon: Send }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${embedded ? '' : 'min-h-screen bg-gray-50 dark:bg-gray-900'} p-6`}
    >
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">管理控制台</h1>
          <p className="text-gray-600 dark:text-gray-400">系统管理和用户管理功能</p>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* 标签页内容 */}
          <div className="p-6">
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">邮件管理</h3>
                  <p className="text-gray-500 dark:text-gray-400">邮件管理功能正在开发中...</p>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">用户管理</h3>
                  <p className="text-gray-500 dark:text-gray-400">用户管理功能正在开发中...</p>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">系统消息</h3>
                  <p className="text-gray-500 dark:text-gray-400">系统消息功能正在开发中...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 快速统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">总用户数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">已验证用户</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">未验证用户</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">管理员</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* 系统状态 */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">系统状态</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">数据库连接</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">API服务</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">邮件服务</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminPage 