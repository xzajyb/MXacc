import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Shield, Clock, Send, CheckCircle } from 'lucide-react'
import axios from 'axios'

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [sendInfo, setSendInfo] = useState<any>(null)

  // 发送重置验证码
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('请输入邮箱地址')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await axios.post('/api/auth/password-reset', { email })
      
      setMessage(response.data.message)
      if (response.data.expiresAt) {
        setExpiresAt(new Date(response.data.expiresAt))
        setSendInfo(response.data.sendInfo)
        setStep('reset')
      }
    } catch (error: any) {
      const errorData = error.response?.data
      if (errorData?.code === 'RATE_LIMIT_EXCEEDED' || errorData?.code === 'TOO_FREQUENT') {
        setError(errorData.message)
        if (errorData.remainingTime) {
          // 显示倒计时
          let remaining = errorData.remainingTime
          const countdown = setInterval(() => {
            remaining--
            if (remaining <= 0) {
              clearInterval(countdown)
              setError('')
            } else {
              const minutes = Math.floor(remaining / 60)
              const seconds = remaining % 60
              setError(`${errorData.message} (${minutes}:${seconds.toString().padStart(2, '0')})`)
            }
          }, 1000)
        }
      } else {
        setError(errorData?.message || '发送失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  // 重置密码
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resetCode.trim()) {
      setError('请输入验证码')
      return
    }

    if (!newPassword) {
      setError('请输入新密码')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (newPassword.length < 8) {
      setError('密码长度不能少于8位')
      return
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(newPassword)) {
      setError('密码必须包含大小写字母和数字')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await axios.post('/api/auth/token-operations', {
        action: 'reset-password',
        email,
        resetCode,
        newPassword
      })
      
      setMessage(response.data.message)
      // 重置成功，可以跳转到登录页面
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } catch (error: any) {
      const errorData = error.response?.data
      setError(errorData?.message || '重置失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 计算剩余时间
  const getRemainingTime = () => {
    if (!expiresAt) return null
    const now = new Date()
    const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
    if (remaining <= 0) return null
    
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 返回按钮 */}
        <Link 
          to="/login" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回登录
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 标题区域 */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <Shield className="h-8 w-8 text-red-600" />
          </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 'email' ? '找回密码' : '重置密码'}
          </h1>
            <p className="text-gray-600 mt-2">
              {step === 'email' 
                ? '输入您的邮箱地址，我们将发送重置验证码' 
                : '输入验证码和新密码来重置您的账户密码'
              }
          </p>
        </div>

          {/* 发送验证码表单 */}
          {step === 'email' && (
            <form onSubmit={handleSendResetCode} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="输入您的邮箱地址"
                    required
              />
            </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <div className="text-red-600 text-sm">{error}</div>
                </div>
              )}

              {message && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-green-600 text-sm">{message}</div>
                </div>
              )}

            <button
              type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    发送中...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    发送重置验证码
                  </>
                )}
            </button>
          </form>
          )}

          {/* 重置密码表单 */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* 验证码有效期显示 */}
              {expiresAt && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center text-blue-600 text-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    验证码有效期：{getRemainingTime() || '已过期'}
                  </div>
                  <div className="text-xs text-blue-500 mt-1">
                    验证码已发送到：{email}
                  </div>
                  {sendInfo && (
                    <div className="text-xs text-blue-500 mt-1">
                      已发送 {sendInfo.sendCount}/3 次，剩余 {sendInfo.remainingAttempts} 次机会
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  验证码
                </label>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-lg font-mono tracking-widest"
                  placeholder="输入6位数字验证码"
                  maxLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新密码
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="输入新密码（至少8位，包含大小写字母和数字）"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="再次输入新密码"
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <div className="text-red-600 text-sm">{error}</div>
                </div>
              )}

              {message && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-green-600 text-sm">
                    {message}
                    <br />
                    <span className="text-xs">2秒后自动跳转到登录页面...</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  重新发送
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      重置中...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      重置密码
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 安全提示 */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">🔐 安全提示</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 验证码有效期为10分钟</li>
              <li>• 3分钟内最多可发送3次验证码</li>
              <li>• 新密码必须包含大小写字母和数字</li>
              <li>• 如非本人操作，请立即联系客服</li>
            </ul>
          </div>
        </div>

        {/* 底部链接 */}
        <div className="text-center mt-6">
          <Link to="/register" className="text-blue-600 hover:text-blue-700 text-sm">
            还没有账号？立即注册
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage 