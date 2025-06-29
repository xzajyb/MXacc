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

interface PrivacySettings {
  profileVisible: boolean
  showFollowers: boolean
  showFollowing: boolean
  activityVisible: boolean
  allowDataCollection: boolean
}

export default function DebugPage() {
  const { user, isAuthenticated, loading, token } = useAuth()
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [apiTest, setApiTest] = useState<any>(null)
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null)
  const [privacyTestResult, setPrivacyTestResult] = useState<any>(null)

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

  // 获取隐私设置
  const fetchPrivacySettings = async () => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/user/user-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok && data.settings?.privacy) {
        setPrivacySettings(data.settings.privacy)
      }
    } catch (error) {
      console.error('获取隐私设置失败:', error)
    }
  }

  // 测试隐私设置是否生效
  const testPrivacySettings = async () => {
    if (!user?.id) return
    
    const token = localStorage.getItem('token')
    const results: any = {}
    
    try {
      // 测试个人资料访问
      const profileResponse = await fetch(`/api/social/messaging?action=user-profile&userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      results.profile = {
        status: profileResponse.status,
        ok: profileResponse.ok,
        canAccess: profileResponse.ok
      }

      // 测试粉丝列表访问
      const followersResponse = await fetch(`/api/social/messaging?action=followers&userId=${user.id}&page=1&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      results.followers = {
        status: followersResponse.status,
        ok: followersResponse.ok,
        canAccess: followersResponse.ok
      }

      // 测试关注列表访问
      const followingResponse = await fetch(`/api/social/messaging?action=following&userId=${user.id}&page=1&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      results.following = {
        status: followingResponse.status,
        ok: followingResponse.ok,
        canAccess: followingResponse.ok
      }

      setPrivacyTestResult(results)
    } catch (error) {
      setPrivacyTestResult({ error: error instanceof Error ? error.message : String(error) })
    }
  }

  // 初始化时获取隐私设置
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPrivacySettings()
    }
  }, [isAuthenticated, user])

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

        {/* 隐私设置调试 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            隐私设置调试
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 当前隐私设置 */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">当前设置</h3>
              {privacySettings ? (
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">个人资料公开:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${privacySettings.profileVisible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {privacySettings.profileVisible ? '是' : '否'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">粉丝列表公开:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${privacySettings.showFollowers ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {privacySettings.showFollowers ? '是' : '否'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">关注列表公开:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${privacySettings.showFollowing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {privacySettings.showFollowing ? '是' : '否'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">活动可见:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${privacySettings.activityVisible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {privacySettings.activityVisible ? '是' : '否'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">允许数据收集:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${privacySettings.allowDataCollection ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {privacySettings.allowDataCollection ? '是' : '否'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">暂无隐私设置数据</p>
              )}
              
              <button
                onClick={fetchPrivacySettings}
                className="mt-3 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
              >
                刷新设置
              </button>
            </div>

            {/* 隐私测试结果 */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">API访问测试</h3>
              <button
                onClick={testPrivacySettings}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mb-3"
                disabled={!user?.id}
              >
                测试隐私设置效果
              </button>
              
              {privacyTestResult && (
                <div className="space-y-2">
                  {privacyTestResult.error ? (
                    <div className="text-red-600 dark:text-red-400">
                      错误: {privacyTestResult.error}
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">个人资料访问:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-sm ${privacyTestResult.profile?.canAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {privacyTestResult.profile?.canAccess ? '成功' : `失败 (${privacyTestResult.profile?.status})`}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">粉丝列表访问:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-sm ${privacyTestResult.followers?.canAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {privacyTestResult.followers?.canAccess ? '成功' : `失败 (${privacyTestResult.followers?.status})`}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">关注列表访问:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-sm ${privacyTestResult.following?.canAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {privacyTestResult.following?.canAccess ? '成功' : `失败 (${privacyTestResult.following?.status})`}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>说明：</strong>这里测试的是您自己对自己资料的访问权限。如果设置为私有但测试仍然成功，这是正常的，因为您始终可以访问自己的资料。
                </p>
              </div>
            </div>
          </div>
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
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">认证问题：</h4>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300 ml-4">
                <li>如果Token过期，请重新登录</li>
                <li>如果Token格式无效，请清除localStorage并重新登录</li>
                <li>如果API调用失败，检查网络连接或服务器状态</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">隐私设置问题：</h4>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300 ml-4">
                <li>如果隐私设置没有生效，请刷新设置并重新保存</li>
                <li>如果其他用户仍能查看您的资料，请清除浏览器缓存并重新登录</li>
                <li>如果设置显示为私有但测试仍成功，这是正常的（本人始终可以查看自己的资料）</li>
                <li>建议让朋友测试是否能查看您的资料来验证隐私设置</li>
              </ul>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => {
                localStorage.removeItem('token')
                window.location.reload()
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              清除Token并刷新页面
            </button>
            
            <button
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              清除所有缓存并刷新
            </button>
            
            <button
              onClick={() => {
                fetchPrivacySettings()
                setTimeout(() => testPrivacySettings(), 1000)
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              disabled={!user?.id}
            >
              重新测试隐私设置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 