import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Shield, Users, Mail, Calendar, Activity } from 'lucide-react'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()

  const getDisplayName = () => {
    return (user as any)?.nickname || user?.username || user?.email?.split('@')[0] || 'User'
  }

  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString('zh-CN') : '暂无'
  }

  return (
    <div className="p-6 space-y-6">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
            {getDisplayName().charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold">欢迎回来，{getDisplayName()}！</h1>
            <p className="text-blue-100 mt-2">
              {user?.role === 'admin' ? '管理员账户' : '普通用户账户'} • 
              {user?.isEmailVerified ? ' 邮箱已验证' : ' 邮箱未验证'}
            </p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">账户状态</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {user?.isEmailVerified ? '已验证' : '未验证'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">权限级别</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {user?.role === 'admin' ? '管理员' : '普通用户'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">注册时间</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {formatDate(user?.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">最后登录</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {formatDate((user as any)?.lastLoginAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">快速操作</h3>
          <div className="space-y-3">
            <a
              href="/profile"
              className="flex items-center space-x-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <User className="h-5 w-5 text-blue-600" />
              <span className="text-slate-900 dark:text-white">编辑个人资料</span>
            </a>
            <a
              href="/security"
              className="flex items-center space-x-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-slate-900 dark:text-white">安全设置</span>
            </a>
            {user?.role === 'admin' && (
              <>
                <a
                  href="/admin/users"
                  className="flex items-center space-x-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-slate-900 dark:text-white">用户管理</span>
                </a>
                <a
                  href="/admin/email"
                  className="flex items-center space-x-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Mail className="h-5 w-5 text-red-600" />
                  <span className="text-slate-900 dark:text-white">邮件管理</span>
                </a>
              </>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">账户信息</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">用户名</label>
              <p className="text-slate-900 dark:text-white mt-1">{user?.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">邮箱地址</label>
              <p className="text-slate-900 dark:text-white mt-1">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">账户类型</label>
              <p className="text-slate-900 dark:text-white mt-1">
                {user?.role === 'admin' ? '管理员' : '普通用户'}
              </p>
            </div>
            {!user?.isEmailVerified && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  ⚠️ 您的邮箱尚未验证，部分功能可能受限。
                </p>
                <a
                  href="/verify-email"
                  className="text-yellow-600 dark:text-yellow-400 hover:underline text-sm font-medium"
                >
                  立即验证邮箱
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 系统信息 */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">系统信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-600 dark:text-slate-400">系统版本：</span>
            <span className="text-slate-900 dark:text-white ml-2">MXacc v1.0.0</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">服务状态：</span>
            <span className="text-green-600 dark:text-green-400 ml-2">正常运行</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">维护团队：</span>
            <span className="text-slate-900 dark:text-white ml-2">梦锡工作室</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage 