import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import WikiPage from './WikiPage'

const WikiPageStandalone: React.FC = () => {
  const { user } = useAuth()

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* 顶部导航栏 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧导航 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
                <h1 className="font-bold text-xl text-gray-900 dark:text-white">Wiki知识库</h1>
              </div>
              
              {/* 面包屑导航 */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>/</span>
                <span>屯人服文档</span>
              </div>
            </div>

            {/* 右侧导航 */}
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>返回仪表板</span>
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wiki内容 */}
      <div className="flex-1">
        <WikiPage embedded={false} />
      </div>

      {/* 底部信息 */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>© 2024 屯人服 Wiki</span>
              <span>•</span>
              <a
                href="https://mxos.top"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                官方网站
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <span>基于 MXacc 平台</span>
              <span>•</span>
              <span>知识库系统</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default WikiPageStandalone 