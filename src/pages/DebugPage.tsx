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
  const [dataConsistency, setDataConsistency] = useState<any>(null)

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

  // 数据一致性检查
  const checkDataConsistency = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // 同时调用多个API来检查数据一致性
      const [settingsResponse, profileResponse] = await Promise.all([
        fetch('/api/user/user-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/user/user-profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const settingsData = settingsResponse.ok ? await settingsResponse.json() : null
      const profileData = profileResponse.ok ? await profileResponse.json() : null

      const consistency = {
        timestamp: new Date().toLocaleString(),
        settingsAPI: {
          status: settingsResponse.status,
          success: settingsResponse.ok,
          privacy: settingsData?.settings?.privacy || null
        },
        profileAPI: {
          status: profileResponse.status,
          success: profileResponse.ok,
          data: profileData || null
        },
        dataMatch: settingsData?.settings?.privacy && profileData ? 
          JSON.stringify(settingsData.settings.privacy) === JSON.stringify(profileData.settings?.privacy || {}) : 
          false
      }

      setDataConsistency(consistency)
    } catch (error) {
      setDataConsistency({
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toLocaleString()
      })
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
                <div className="space-y-3">
                  {/* 与设置页面保持一致的顺序和标签 */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">公开个人资料</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">允许其他用户查看你的个人资料</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${privacySettings.profileVisible ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {privacySettings.profileVisible ? '开启' : '关闭'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">公开粉丝列表</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">允许其他用户查看你的粉丝列表</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${privacySettings.showFollowers ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {privacySettings.showFollowers ? '开启' : '关闭'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">公开关注列表</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">允许其他用户查看你的关注列表</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${privacySettings.showFollowing ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {privacySettings.showFollowing ? '开启' : '关闭'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">公开活动记录</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">允许其他用户查看你的活动记录</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${privacySettings.activityVisible ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {privacySettings.activityVisible ? '开启' : '关闭'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">允许数据收集</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">允许系统收集匿名使用数据以改善服务</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${privacySettings.allowDataCollection ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {privacySettings.allowDataCollection ? '开启' : '关闭'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">暂无隐私设置数据</p>
              )}
              
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={fetchPrivacySettings}
                  className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  刷新设置
                </button>
                                 <button
                   onClick={() => window.open('/settings', '_blank')}
                   className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
                 >
                   打开设置页面
                 </button>
                 <button
                   onClick={checkDataConsistency}
                   className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm"
                 >
                   检查数据一致性
                 </button>
               </div>
              
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>📋 数据来源：</strong>以上显示的设置数据来自 <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">/api/user/user-settings</code> API，
                  与设置页面使用完全相同的数据源，确保信息一致性。
                </p>
              </div>
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
           
           {/* 数据一致性检查结果 */}
           {dataConsistency && (
             <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
               <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">数据一致性检查结果</h3>
               
               {dataConsistency.error ? (
                 <div className="text-red-600 dark:text-red-400">
                   错误: {dataConsistency.error}
                 </div>
               ) : (
                 <div className="space-y-3">
                   <div className="text-sm text-gray-600 dark:text-gray-400">
                     检查时间: {dataConsistency.timestamp}
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                       <h4 className="font-medium text-gray-900 dark:text-white mb-2">设置API</h4>
                       <div className="text-sm space-y-1">
                         <div>状态: <span className={`font-medium ${dataConsistency.settingsAPI.success ? 'text-green-600' : 'text-red-600'}`}>
                           {dataConsistency.settingsAPI.status}
                         </span></div>
                         <div>隐私数据: {dataConsistency.settingsAPI.privacy ? '✅ 已获取' : '❌ 未获取'}</div>
                       </div>
                     </div>
                     
                     <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                       <h4 className="font-medium text-gray-900 dark:text-white mb-2">用户资料API</h4>
                       <div className="text-sm space-y-1">
                         <div>状态: <span className={`font-medium ${dataConsistency.profileAPI.success ? 'text-green-600' : 'text-red-600'}`}>
                           {dataConsistency.profileAPI.status}
                         </span></div>
                         <div>用户数据: {dataConsistency.profileAPI.data ? '✅ 已获取' : '❌ 未获取'}</div>
                       </div>
                     </div>
                   </div>
                   
                   <div className={`p-3 rounded-lg ${dataConsistency.dataMatch ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                     <div className={`text-sm font-medium ${dataConsistency.dataMatch ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                       {dataConsistency.dataMatch ? '✅ 数据一致' : '❌ 数据不一致'}
                     </div>
                     <div className={`text-xs mt-1 ${dataConsistency.dataMatch ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                       {dataConsistency.dataMatch 
                         ? '设置页面和调试页面显示的隐私设置数据完全一致' 
                         : '检测到数据不一致，建议清除缓存后重新登录'}
                     </div>
                   </div>
                   
                   {!dataConsistency.dataMatch && (
                     <details className="mt-3">
                       <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                         查看详细数据对比
                       </summary>
                       <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-600 rounded text-xs font-mono">
                         <div className="mb-2">
                           <strong>设置API返回:</strong>
                           <pre>{JSON.stringify(dataConsistency.settingsAPI.privacy, null, 2)}</pre>
                         </div>
                         <div>
                           <strong>用户资料API返回:</strong>
                           <pre>{JSON.stringify(dataConsistency.profileAPI.data?.settings?.privacy || null, null, 2)}</pre>
                         </div>
                       </div>
                     </details>
                   )}
                 </div>
               )}
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
            
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">数据一致性问题：</h4>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300 ml-4">
                <li>如果数据一致性检查显示不一致，表示不同API返回的数据有差异</li>
                <li>点击"检查数据一致性"按钮验证设置页面和调试页面的数据是否同步</li>
                <li>如果发现不一致，请先尝试刷新设置，然后清除缓存</li>
                <li>数据一致性检查可以帮助诊断缓存问题或API同步问题</li>
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
                setTimeout(() => {
                  testPrivacySettings()
                  checkDataConsistency()
                }, 1000)
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              disabled={!user?.id}
            >
              完整诊断检查
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 