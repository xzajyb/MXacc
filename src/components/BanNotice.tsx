import React, { useState, useEffect } from 'react'
import { AlertTriangle, MessageSquare, Send, Clock, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import axios from 'axios'

interface BanInfo {
  reason: string
  expiresAt?: string
  isPermanent: boolean
  banId: string
}

interface BanNoticeProps {
  ban: BanInfo
  onClose?: () => void
}

const BanNotice: React.FC<BanNoticeProps> = ({ ban, onClose }) => {
  const { showToast } = useToast()
  const [showAppealForm, setShowAppealForm] = useState(false)
  const [appealReason, setAppealReason] = useState('')
  const [appealDetails, setAppealDetails] = useState('')
  const [submittingAppeal, setSubmittingAppeal] = useState(false)
  const [myAppeals, setMyAppeals] = useState<any[]>([])
  const [loadingAppeals, setLoadingAppeals] = useState(false)

  // 加载用户的申述记录
  const loadMyAppeals = async () => {
    setLoadingAppeals(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/social/content?action=ban-management&subAction=my-appeals', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMyAppeals(response.data.data.appeals || [])
    } catch (error: any) {
      console.error('加载申述记录失败:', error)
    } finally {
      setLoadingAppeals(false)
    }
  }

  // 提交申述
  const handleSubmitAppeal = async () => {
    if (!appealReason.trim()) {
      showToast('请填写申述原因', 'error')
      return
    }

    setSubmittingAppeal(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/social/content', {
        action: 'submit-appeal',
        banId: ban.banId,
        reason: appealReason.trim(),
        description: appealDetails.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      showToast('申述已提交，我们会尽快处理', 'success')
      setShowAppealForm(false)
      setAppealReason('')
      setAppealDetails('')
      loadMyAppeals() // 重新加载申述记录
    } catch (error: any) {
      console.error('提交申述失败:', error)
      showToast(error.response?.data?.message || '提交申述失败', 'error')
    } finally {
      setSubmittingAppeal(false)
    }
  }

  // 格式化时间
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  // 检查是否还有剩余时间
  const getTimeRemaining = () => {
    if (ban.isPermanent || !ban.expiresAt) return null
    
    const now = new Date()
    const expiry = new Date(ban.expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return '已过期'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}天${hours}小时`
    if (hours > 0) return `${hours}小时${minutes}分钟`
    return `${minutes}分钟`
  }

  // 检查是否已有待处理的申述
  const hasPendingAppeal = myAppeals.some(appeal => appeal.status === 'pending')

  useEffect(() => {
    loadMyAppeals()
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        {/* 头部 */}
        <div className="bg-red-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">账户已被封禁</h2>
                <p className="text-red-100 text-sm">您的账户已被限制使用社交功能</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-red-100 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 封禁信息 */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              封禁详情
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">封禁原因：</span>
                <span className="text-gray-900 dark:text-white">{ban.reason}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">封禁类型：</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  ban.isPermanent
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {ban.isPermanent ? '永久封禁' : '临时封禁'}
                </span>
              </div>
              {!ban.isPermanent && ban.expiresAt && (
                <>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">到期时间：</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(ban.expiresAt)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">剩余时间：</span>
                    <span className="text-gray-900 dark:text-white flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {getTimeRemaining()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 申述按钮 */}
          {!showAppealForm && (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                如果您认为此封禁是错误的，可以提交申述请求
              </p>
              <button
                onClick={() => setShowAppealForm(true)}
                disabled={hasPendingAppeal}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  hasPendingAppeal
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <MessageSquare className="w-5 h-5 inline mr-2" />
                {hasPendingAppeal ? '已有待处理的申述' : '申述封禁'}
              </button>
            </div>
          )}

          {/* 申述表单 */}
          {showAppealForm && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                提交申述
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    申述原因 *
                  </label>
                  <textarea
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="请简要说明您认为封禁错误的原因..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    详细说明（可选）
                  </label>
                  <textarea
                    value={appealDetails}
                    onChange={(e) => setAppealDetails(e.target.value)}
                    placeholder="可以提供更详细的说明、证据或其他相关信息..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleSubmitAppeal}
                    disabled={submittingAppeal || !appealReason.trim()}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {submittingAppeal ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        提交中...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        提交申述
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowAppealForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 申述历史 */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">申述记录</h3>
            {loadingAppeals ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">加载中...</p>
              </div>
            ) : myAppeals.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">暂无申述记录</p>
            ) : (
              <div className="space-y-3">
                {myAppeals.map((appeal) => (
                  <div
                    key={appeal._id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        appeal.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : appeal.status === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {appeal.status === 'pending' ? '待处理' : 
                         appeal.status === 'approved' ? '已通过' : '已驳回'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(appeal.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      <span className="font-medium">申述原因：</span>{appeal.reason}
                    </p>
                    
                    {appeal.details && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span className="font-medium">详细说明：</span>{appeal.details}
                      </p>
                    )}
                    
                    {appeal.adminResponse && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <span className="font-medium">管理员回复：</span>{appeal.adminResponse}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 注意事项 */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-400 mb-2">重要提醒</h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• 请确保申述理由真实有效，虚假申述可能导致更严厉的处罚</li>
              <li>• 管理员会在收到申述后尽快处理，请耐心等待</li>
              <li>• 如果申述被驳回，您可以在处理结果后重新提交申述</li>
              <li>• 封禁期间无法使用社交功能，但可以正常使用其他功能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BanNotice 