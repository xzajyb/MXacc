import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Users, Search, Filter, MoreVertical, Shield, ShieldCheck, Ban, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import axios from 'axios'

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

const AdminUsersManagement: React.FC = () => {
  const { token, user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    verified: 0,
    unverified: 0,
    admins: 0,
    disabled: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerified, setFilterVerified] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        verified: filterVerified,
        role: filterRole
      })

      const response = await axios.get(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setUsers(response.data.data.users)
      setUserStats(response.data.data.stats)
    } catch (error) {
      console.error('加载用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [currentPage, token])

  // 搜索用户
  const handleSearch = () => {
    setCurrentPage(1)
    loadUsers()
  }

  // 用户操作
  const handleUserAction = async (userId: string, action: string) => {
    try {
      await axios.put('/api/admin/users', {
        userId,
        action
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      alert('操作成功')
      loadUsers()
    } catch (error: any) {
      console.error('用户操作失败:', error)
      alert(error.response?.data?.message || '操作失败')
    }
  }

  // 批量操作
  const handleBatchAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      alert('请选择要操作的用户')
      return
    }

    const confirmMessage = action === 'delete' ? '确定要删除这些用户吗？此操作不可撤销！' : `确定要对选中的 ${selectedUsers.length} 个用户执行操作吗？`
    
    if (!confirm(confirmMessage)) return

    try {
      await Promise.all(
        selectedUsers.map(userId => 
          axios.put('/api/admin/users', { userId, action }, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      )
      
      alert('批量操作成功')
      setSelectedUsers([])
      loadUsers()
    } catch (error: any) {
      console.error('批量操作失败:', error)
      alert(error.response?.data?.message || '批量操作失败')
    }
  }

  // 切换用户选择
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === users.length 
        ? [] 
        : users.map(u => u._id)
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getUserStatusColor = (user: User) => {
    if (user.isDisabled) return 'text-red-600 bg-red-50'
    if (!user.isEmailVerified) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getUserStatusText = (user: User) => {
    if (user.isDisabled) return '已禁用'
    if (!user.isEmailVerified) return '未验证'
    return '正常'
  }

  return (
    <div className="p-6 space-y-6">
      {/* 统计面板 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">总用户数</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{userStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <ShieldCheck className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">已验证</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{userStats.verified}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">未验证</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{userStats.unverified}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">管理员</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{userStats.admins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <Ban className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">已禁用</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{userStats.disabled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="搜索用户名或邮箱"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
            >
              <option value="">所有状态</option>
              <option value="true">已验证</option>
              <option value="false">未验证</option>
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
            >
              <option value="">所有角色</option>
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>

            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              搜索
            </button>
          </div>
        </div>

        {/* 批量操作 */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 dark:text-blue-300">
                已选择 {selectedUsers.length} 个用户
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBatchAction('disable')}
                  className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                >
                  批量禁用
                </button>
                <button
                  onClick={() => handleBatchAction('enable')}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                >
                  批量启用
                </button>
                <button
                  onClick={() => handleBatchAction('delete')}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  批量删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 用户列表 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">用户列表</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length}
                onChange={toggleSelectAll}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">全选</span>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">加载中...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            没有找到用户
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    选择
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    用户信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    最后登录
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(userItem._id)}
                        onChange={() => toggleUserSelection(userItem._id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                          {userItem.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {userItem.username}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {userItem.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserStatusColor(userItem)}`}>
                        {getUserStatusText(userItem)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userItem.role === 'admin' 
                          ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300'
                          : 'text-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {userItem.role === 'admin' ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(userItem.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {userItem.lastLoginAt ? formatDate(userItem.lastLoginAt) : '从未登录'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === userItem._id ? null : userItem._id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {showActionMenu === userItem._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg z-10 border border-slate-200 dark:border-slate-700">
                            <div className="py-1">
                              {userItem._id !== user?._id && (
                                <>
                                  <button
                                    onClick={() => {
                                      handleUserAction(userItem._id, userItem.isDisabled ? 'enable' : 'disable')
                                      setShowActionMenu(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"
                                  >
                                    {userItem.isDisabled ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                                    {userItem.isDisabled ? '启用用户' : '禁用用户'}
                                  </button>
                                  
                                  {!userItem.isEmailVerified && (
                                    <button
                                      onClick={() => {
                                        handleUserAction(userItem._id, 'verify')
                                        setShowActionMenu(null)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"
                                    >
                                      <ShieldCheck className="h-4 w-4 mr-2" />
                                      验证邮箱
                                    </button>
                                  )}
                                  
                                  {userItem.role !== 'admin' && (
                                    <button
                                      onClick={() => {
                                        handleUserAction(userItem._id, 'makeAdmin')
                                        setShowActionMenu(null)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"
                                    >
                                      <Shield className="h-4 w-4 mr-2" />
                                      设为管理员
                                    </button>
                                  )}
                                  
                                  {userItem.role === 'admin' && userItem._id !== user?._id && (
                                    <button
                                      onClick={() => {
                                        handleUserAction(userItem._id, 'removeAdmin')
                                        setShowActionMenu(null)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"
                                    >
                                      <Shield className="h-4 w-4 mr-2" />
                                      移除管理员
                                    </button>
                                  )}
                                  
                                  {userItem.role !== 'admin' && (
                                    <button
                                      onClick={() => {
                                        if (confirm('确定要删除此用户吗？此操作不可撤销！')) {
                                          handleUserAction(userItem._id, 'delete')
                                          setShowActionMenu(null)
                                        }
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      删除用户
                                    </button>
                                  )}
                                </>
                              )}
                              
                              {userItem._id === user?._id && (
                                <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                                  无法操作自己的账户
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              显示第 {(currentPage - 1) * 20 + 1} - {Math.min(currentPage * 20, userStats.total)} 条，共 {userStats.total} 条记录
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={users.length < 20}
                className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUsersManagement 