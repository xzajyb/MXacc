import React from 'react'
import { ExternalLink, Loader } from 'lucide-react'

const WikiPage: React.FC = () => {
  const docsUrl = process.env.NODE_ENV === 'production' 
    ? '/docs/' 
    : 'http://localhost:5173/docs/'

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* 头部 */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">文档中心</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              查看平台文档和使用指南
            </p>
          </div>
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            在新窗口打开
          </a>
        </div>
      </div>

      {/* 文档内容区域 */}
      <div className="flex-1 relative">
        <iframe
          src={docsUrl}
          className="w-full h-full border-none"
          title="文档中心"
          onLoad={(e) => {
            // 移除加载指示器
            const loader = document.getElementById('wiki-loader')
            if (loader) {
              loader.style.display = 'none'
            }
          }}
          onError={() => {
            // 显示错误信息
            const loader = document.getElementById('wiki-loader')
            if (loader) {
              loader.innerHTML = `
                <div class="text-center">
                  <div class="text-red-600 dark:text-red-400 mb-4">
                    <svg class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">无法加载文档</h3>
                  <p class="text-gray-600 dark:text-gray-400 mb-4">
                    文档服务暂时不可用，请稍后重试或点击上方按钮在新窗口打开。
                  </p>
                  <button 
                    onclick="window.location.reload()" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    重新加载
                  </button>
                </div>
              `
            }
          }}
        />
        
        {/* 加载指示器 */}
        <div
          id="wiki-loader"
          className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900"
        >
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">正在加载文档...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WikiPage 