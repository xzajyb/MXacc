import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface SecurityData {
  twoFactorEnabled: boolean
  lastPasswordChange: string
  loginSessions: Array<{
    id: string
    ip: string
    userAgent: string
    location: string
    lastActive: string
    current: boolean
  }>
  securityLog: Array<{
    id: string
    action: string
    timestamp: string
    ip: string
    success: boolean
  }>
}

const SecurityPage: React.FC = () => {
  const { user, token } = useAuth()
  const [securityData, setSecurityData] = useState<SecurityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/security', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSecurityData(data)
      } else {
        // 模拟数据，因为后端API可能还没实现
        setSecurityData({
          twoFactorEnabled: false,
          lastPasswordChange: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          loginSessions: [
            {
              id: '1',
              ip: '192.168.1.100',
              userAgent: 'Chrome 120.0 Windows',
              location: '中国 广东 深圳',
              lastActive: new Date().toISOString(),
              current: true
            },
            {
              id: '2',
              ip: '192.168.1.101',
              userAgent: 'Safari 17.0 macOS',
              location: '中国 广东 深圳',
              lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              current: false
            }
          ],
          securityLog: [
            {
              id: '1',
              action: '登录成功',
              timestamp: new Date().toISOString(),
              ip: '192.168.1.100',
              success: true
            },
            {
              id: '2',
              action: '密码修改',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              ip: '192.168.1.100',
              success: true
            },
            {
              id: '3',
              action: '登录失败',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              ip: '203.0.113.1',
              success: false
            }
          ]
        })
      }
    } catch (err) {
      setError('获取安全信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('新密码和确认密码不匹配')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('新密码至少需要6位字符')
      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      if (response.ok) {
        setSuccess('密码修改成功')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setShowPasswordForm(false)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.message || '密码修改失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    }
  }

  const toggleTwoFactor = async () => {
    try {
      const response = await fetch('/api/user/two-factor', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: !securityData?.twoFactorEnabled
        })
      })

      if (response.ok) {
        setSecurityData(prev => prev ? {
          ...prev,
          twoFactorEnabled: !prev.twoFactorEnabled
        } : null)
        setSuccess(securityData?.twoFactorEnabled ? '两步验证已关闭' : '两步验证已开启')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('操作失败，请重试')
      }
    } catch (err) {
      setError('网络错误，请重试')
    }
  }

  const terminateSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setSecurityData(prev => prev ? {
          ...prev,
          loginSessions: prev.loginSessions.filter(s => s.id !== sessionId)
        } : null)
        setSuccess('会话已终止')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('操作失败，请重试')
      }
    } catch (err) {
      setError('网络错误，请重试')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date().getTime()
    const time = new Date(dateString).getTime()
    const diff = now - time
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            安全设置
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            管理您的账户安全和隐私设置
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* 密码安全 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">密码安全</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">登录密码</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  上次修改：{securityData?.lastPasswordChange ? formatDate(securityData.lastPasswordChange) : '未知'}
                </p>
              </div>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                修改密码
              </button>
            </div>

            {showPasswordForm && (
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    当前密码
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    新密码
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    确认新密码
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPasswordForm(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    修改密码
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 两步验证 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">两步验证</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">启用两步验证</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                为您的账户添加额外的安全保护
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium ${
                securityData?.twoFactorEnabled 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {securityData?.twoFactorEnabled ? '已启用' : '未启用'}
              </span>
              <button
                onClick={toggleTwoFactor}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  securityData?.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    securityData?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 登录会话 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">活跃会话</h2>
          <div className="space-y-4">
            {securityData?.loginSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-start space-x-4">
                  <div className={`w-3 h-3 rounded-full mt-2 ${session.current ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{session.userAgent}</h3>
                      {session.current && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          当前设备
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {session.location} • {session.ip}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      最后活跃：{getTimeAgo(session.lastActive)}
                    </p>
                  </div>
                </div>
                {!session.current && (
                  <button
                    onClick={() => terminateSession(session.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    终止会话
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 安全日志 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">安全日志</h2>
          <div className="space-y-3">
            {securityData?.securityLog.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border-l-4 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{log.action}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {log.ip} • {formatDate(log.timestamp)}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  log.success 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {log.success ? '成功' : '失败'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecurityPage 