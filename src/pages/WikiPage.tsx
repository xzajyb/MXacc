import React from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Users, 
  Target, 
  MessageCircle, 
  HelpCircle,
  Globe,
  Zap,
  Shield,
  Sparkles
} from 'lucide-react'

interface WikiPageProps {
  embedded?: boolean
}

const WikiPage: React.FC<WikiPageProps> = ({ embedded = false }) => {
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

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
      className={`${embedded ? '' : 'min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800'} p-6`}
    >
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-16 h-16 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            欢迎来到 MXacc 🌍
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            <strong>一个充满创意与协作的账号管理与社交平台</strong>
          </p>
        </motion.div>

        {/* 分割线 */}
        <div className="border-t border-slate-200 dark:border-slate-700 mb-12"></div>

        {/* 项目简介 */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <Target className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">🎯 项目简介</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">创建时间</div>
              <div className="font-semibold text-slate-900 dark:text-white">2024年</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">创始团队</div>
              <div className="font-semibold text-slate-900 dark:text-white">梦锡工作室</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">核心理念</div>
              <div className="font-semibold text-slate-900 dark:text-white">安全·便捷·社交</div>
            </div>
          </div>
        </motion.div>

        {/* 我们的目标 */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">🎯 我们的目标</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4 mt-1">
                <div className="w-3 h-3 bg-green-600 dark:bg-green-400 rounded-full"></div>
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white mb-1">
                  为用户提供<strong>安全、便捷、功能丰富</strong>的账号管理体验
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm">
                  企业级安全保护，多重认证机制，保障账号数据安全
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4 mt-1">
                <div className="w-3 h-3 bg-green-600 dark:bg-green-400 rounded-full"></div>
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white mb-1">
                  鼓励用户通过社交功能、内容分享、社群互动，建立归属感
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm">
                  丰富的社交体验，支持动态发布、私信聊天、用户关注等功能
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 新手必读指南 */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">📌 新手必读指南</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-red-600 dark:text-red-400 font-bold">⚠️</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">1. 基础规则</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                了解社区准则与行为规范，共建和谐环境。遵守用户协议，保护个人隐私。
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">🧭</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">2. 功能使用</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                熟悉账号管理、安全设置、社交功能等核心功能的使用方法。
              </p>
            </div>
          </div>
        </motion.div>

        {/* 功能特色 */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <Zap className="w-8 h-8 text-orange-600 dark:text-orange-400 mr-3" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">✨ 功能特色</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">企业级安全</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">多重认证保护</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <MessageCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">社交互动</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">动态分享交流</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">智能管理</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">便捷账号管理</p>
            </div>
          </div>
        </motion.div>

        {/* 加入我们 */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl shadow-lg p-8 mb-8 text-white"
        >
          <div className="flex items-center mb-6">
            <Globe className="w-8 h-8 mr-3" />
            <h2 className="text-2xl font-bold">📱 加入我们</h2>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">🔥 官方QQ群</div>
            <div className="text-3xl font-bold mb-2">1043492617</div>
            <p className="text-blue-100">点击复制群号加入官方交流群</p>
          </div>
        </motion.div>

        {/* 需要帮助 */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center"
        >
          <HelpCircle className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">❓ 需要帮助？</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            欢迎在群内@管理员 提交建议，或通过平台内消息系统联系我们，共同完善系统生态！
          </p>
          <div className="text-lg font-semibold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
            <strong>让我们一起，在MXacc轻松管理数字身份 🌟</strong>
          </div>
        </motion.div>

        {/* 底部版权 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-12 text-sm text-slate-500 dark:text-slate-400"
        >
          <p>Copyright © 梦锡工作室 | MXacc 账号管理系统</p>
          <p className="mt-1">基于开源协议发布 | 上次更新: {new Date().toLocaleDateString('zh-CN')}</p>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default WikiPage 