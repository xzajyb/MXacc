import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'locked';
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  profile: {
    displayName?: string;
    nickname?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
  };
}

interface UserModalData {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'locked';
  isEmailVerified: boolean;
  profile: {
    displayName: string;
    nickname: string;
    bio: string;
    location: string;
    website: string;
  };
  password?: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserModalData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 检查是否为管理员
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            权限不足
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            您需要管理员权限才能访问此页面
          </p>
        </div>
      </div>
    );
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users?page=${currentPage}&limit=20&search=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const handleEditUser = (user: User) => {
    setEditingUser({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      profile: {
        displayName: user.profile.displayName || '',
        nickname: user.profile.nickname || '',
        bio: user.profile.bio || '',
        location: user.profile.location || '',
        website: user.profile.website || ''
      }
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users?userId=${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingUser)
      });

      if (response.ok) {
        await fetchUsers();
        setShowEditModal(false);
        setEditingUser(null);
      } else {
        const error = await response.json();
        alert(error.message || '更新失败');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('更新用户时发生错误');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchUsers();
        setDeleteConfirm(null);
      } else {
        const error = await response.json();
        alert(error.message || '删除失败');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('删除用户时发生错误');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? '管理员' : '普通用户';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? '正常' : '锁定';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">用户管理</h1>
            <p className="text-slate-600 dark:text-slate-400">管理所有用户账号</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
              A
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400">管理员模式</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索用户名、邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-professional w-full"
              />
            </div>
            <button
              onClick={() => setCurrentPage(1)}
              className="btn-primary px-6 py-2 rounded-lg"
            >
              搜索
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">用户</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">角色</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">状态</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">邮箱验证</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">注册时间</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {users.map((userData) => (
                      <motion.tr
                        key={userData._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {userData.username}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {userData.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userData.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                          }`}>
                            {getRoleText(userData.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userData.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          }`}>
                            {getStatusText(userData.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userData.isEmailVerified
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                          }`}>
                            {userData.isEmailVerified ? '已验证' : '未验证'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(userData.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditUser(userData)}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                            >
                              编辑
                            </button>
                            {userData.role !== 'admin' && (
                              <button
                                onClick={() => setDeleteConfirm(userData._id)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                              >
                                删除
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      第 {currentPage} 页，共 {totalPages} 页
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="btn-secondary px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">编辑用户</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      用户名
                    </label>
                    <input
                      type="text"
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                      className="input-professional w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      className="input-professional w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      角色
                    </label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value as 'admin' | 'user'})}
                      className="input-professional w-full"
                    >
                      <option value="user">普通用户</option>
                      <option value="admin">管理员</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      状态
                    </label>
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({...editingUser, status: e.target.value as 'active' | 'locked'})}
                      className="input-professional w-full"
                    >
                      <option value="active">正常</option>
                      <option value="locked">锁定</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    邮箱验证状态
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingUser.isEmailVerified}
                      onChange={(e) => setEditingUser({...editingUser, isEmailVerified: e.target.checked})}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">已验证邮箱</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    新密码（留空则不修改）
                  </label>
                  <input
                    type="password"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                    className="input-professional w-full"
                    placeholder="输入新密码"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      显示名称
                    </label>
                    <input
                      type="text"
                      value={editingUser.profile.displayName}
                      onChange={(e) => setEditingUser({
                        ...editingUser, 
                        profile: {...editingUser.profile, displayName: e.target.value}
                      })}
                      className="input-professional w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      昵称
                    </label>
                    <input
                      type="text"
                      value={editingUser.profile.nickname}
                      onChange={(e) => setEditingUser({
                        ...editingUser, 
                        profile: {...editingUser.profile, nickname: e.target.value}
                      })}
                      className="input-professional w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="btn-secondary px-4 py-2 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveUser}
                  className="btn-primary px-4 py-2 rounded-lg"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                确认删除
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                您确定要删除这个用户吗？此操作无法撤销。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary px-4 py-2 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 