import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface TokenInfo {
  raw: string | null
  decoded: any
  isValid: boolean
  isExpired: boolean
  expiresAt: string | null
  timeUntilExpiry: string | null
}

export default function DebugPage() {
  const { user, isAuthenticated, loading, token } = useAuth()
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [apiTest, setApiTest] = useState<any>(null)

  // 解析token信息
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setTokenInfo({
        raw: null,
        decoded: null,
        isValid: false,
        isExpired: false,
        expiresAt: null,
        timeUntilExpiry: null
      })
      return
    }

    try {
      // 解析JWT
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }

      const payload = JSON.parse(atob(parts[1]))
      const currentTime = Date.now() / 1000
      const isExpired = payload.exp < currentTime
      const timeUntilExpiry = payload.exp - currentTime

      setTokenInfo({
        raw: token,
        decoded: payload,
        isValid: true,
        isExpired,
        expiresAt: new Date(payload.exp * 1000).toLocaleString(),
        timeUntilExpiry: isExpired 
          ? '已过期' 
          : `${Math.floor(timeUntilExpiry / 3600)}小时${Math.floor((timeUntilExpiry % 3600) / 60)}分钟`
      })
    } catch (error) {
      setTokenInfo({
        raw: token,
        decoded: null,
        isValid: false,
        isExpired: false,
        expiresAt: null,
        timeUntilExpiry: null
      })
    }
  }, [])

  // 测试API调用
  const testAPI = async () => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/user/user-profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      setApiTest({
        status: response.status,
        ok: response.ok,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      })
         } catch (error) {
       setApiTest({
         error: error instanceof Error ? error.message : String(error),
         status: 'Network Error'
       })
     }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          认证调试信息
        </h1>

        {/* 基本认证状态 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            基本认证状态
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Loading:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {loading ? '加载中' : '已加载'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">已认证:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isAuthenticated ? '是' : '否'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">用户:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {user ? `${user.username} (${user.email})` : '未登录'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">邮箱验证:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${user?.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user?.isEmailVerified ? '已验证' : '未验证'}
              </span>
            </div>
          </div>
        </div>

        {/* Token信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Token信息
          </h2>
          {tokenInfo ? (
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Token存在:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${tokenInfo.raw ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {tokenInfo.raw ? '是' : '否'}
                </span>
              </div>
              {tokenInfo.raw && (
                <>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Token格式:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${tokenInfo.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {tokenInfo.isValid ? '有效' : '无效'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">是否过期:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${tokenInfo.isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {tokenInfo.isExpired ? '已过期' : '未过期'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">过期时间:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {tokenInfo.expiresAt || '未知'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">剩余时间:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {tokenInfo.timeUntilExpiry || '未知'}
                    </span>
                  </div>
                  {tokenInfo.decoded && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">用户ID:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {tokenInfo.decoded.userId}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Token (前50字符):</span>
                    <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-900 dark:text-white break-all">
                      {tokenInfo.raw.substring(0, 50)}...
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">正在分析Token...</p>
          )}
        </div>

        {/* API测试 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            API测试
          </h2>
          <button
            onClick={testAPI}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
          >
            测试 /api/user/user-profile
          </button>
          
          {apiTest && (
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 dark:text-gray-400">状态码:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${apiTest.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {apiTest.status}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">响应数据:</span>
                <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-900 dark:text-white">
                  <pre>{JSON.stringify(apiTest.data || apiTest.error, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 环境信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            环境信息
          </h2>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600 dark:text-gray-400">URL:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{window.location.href}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">User Agent:</span>
              <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white break-all">
                {navigator.userAgent}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">LocalStorage支持:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${typeof(Storage) !== "undefined" ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {typeof(Storage) !== "undefined" ? '支持' : '不支持'}
              </span>
            </div>
          </div>
        </div>

        {/* 解决建议 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            常见问题解决方案
          </h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
            <li>如果Token过期，请重新登录</li>
            <li>如果Token格式无效，请清除localStorage并重新登录</li>
            <li>如果API调用失败，检查网络连接或服务器状态</li>
            <li>如果持续出现问题，请联系技术支持</li>
          </ul>
          
          <button
            onClick={() => {
              localStorage.removeItem('token')
              window.location.reload()
            }}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            清除Token并刷新页面
          </button>
        </div>
      </div>
    </div>
  )
} 