import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Users,
  MessageSquare,
  Heart,
  Lock,
  Zap,
  Globe,
  Star,
  ArrowRight,
  Sparkles,
  Mail,
  UserPlus,
  Eye,
  Settings,
  Bell,
  Camera,
  Send,
  Rocket,
  Crown,
  Target
} from 'lucide-react'

const PromoPage: React.FC = () => {
  const navigate = useNavigate()
  const [currentFeature, setCurrentFeature] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "强大社交功能",
      description: "发布动态、评论互动、私信聊天，打造属于你的社交圈",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "安全可靠",
      description: "企业级安全保障，邮箱验证，隐私保护，让你安心使用",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "个性化定制",
      description: "完整的个人资料管理，隐私设置，打造专属个人空间",
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "现代化体验",
      description: "流畅的用户界面，实时通知，极致的使用体验",
      color: "from-orange-500 to-red-500"
    }
  ]

  const stats = [
    { number: "100%", label: "安全保障", icon: <Shield className="w-6 h-6" /> },
    { number: "24/7", label: "全天候服务", icon: <Globe className="w-6 h-6" /> },
    { number: "∞", label: "无限可能", icon: <Sparkles className="w-6 h-6" /> },
    { number: "0", label: "使用门槛", icon: <Star className="w-6 h-6" /> }
  ]

  const socialFeatures = [
    { icon: <MessageSquare className="w-5 h-5" />, name: "动态发布", desc: "分享生活点滴" },
    { icon: <Heart className="w-5 h-5" />, name: "点赞评论", desc: "互动交流" },
    { icon: <Send className="w-5 h-5" />, name: "私信聊天", desc: "一对一沟通" },
    { icon: <Camera className="w-5 h-5" />, name: "图片分享", desc: "多媒体支持" },
    { icon: <Users className="w-5 h-5" />, name: "关注系统", desc: "建立联系" },
    { icon: <Bell className="w-5 h-5" />, name: "实时通知", desc: "不错过任何消息" }
  ]

  const securityFeatures = [
    { icon: <Mail className="w-5 h-5" />, name: "邮箱验证", desc: "确保账户安全" },
    { icon: <Lock className="w-5 h-5" />, name: "隐私保护", desc: "自主控制可见性" },
    { icon: <Shield className="w-5 h-5" />, name: "数据加密", desc: "企业级安全" },
    { icon: <Eye className="w-5 h-5" />, name: "透明管理", desc: "公开透明的管理" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* 导航栏 */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 p-6"
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                梦锡工作室
              </h1>
              <p className="text-sm text-gray-400">MXacc 账号系统</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
            >
              登录
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full hover:from-purple-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg"
            >
              立即注册
            </button>
          </div>
        </div>
      </motion.nav>

      {/* 主要内容 */}
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
          transition={{ duration: 0.8 }}
          className="text-center py-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                梦锡账号
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-4">
              打造现代化社交体验
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              集成完整社交功能、企业级安全保障、个性化定制的现代账号系统
              <br />
              让每一次连接都充满意义
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => navigate('/register')}
              className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full text-lg font-semibold hover:from-purple-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-2xl flex items-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>开始使用</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 border border-gray-600 rounded-full text-lg font-semibold hover:border-gray-400 hover:bg-gray-800/50 transition-all"
            >
              已有账号
            </button>
          </motion.div>
        </motion.div>

        {/* 功能特性轮播 */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-20"
        >
          <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeature}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${features[currentFeature].color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  {features[currentFeature].icon}
                </div>
                <h3 className="text-3xl font-bold mb-4">{features[currentFeature].title}</h3>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">{features[currentFeature].description}</p>
              </motion.div>
            </AnimatePresence>
            
            {/* 指示器 */}
            <div className="flex justify-center space-x-3 mt-8">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentFeature === index ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* 统计数据 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
              className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all"
            >
              <div className="text-purple-400 mb-3 flex justify-center">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold mb-2">{stat.number}</div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* 社交功能展示 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                强大的社交功能
              </span>
            </h2>
            <p className="text-xl text-gray-300">连接世界，分享精彩</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {socialFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.6 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all group cursor-pointer"
              >
                <div className="text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">{feature.name}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 安全特性 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                安全可靠保障
              </span>
            </h2>
            <p className="text-xl text-gray-300">企业级安全，让你安心使用</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 2 + index * 0.1 }}
                className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all group"
              >
                <div className="text-green-400 mb-3 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">{feature.name}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2 }}
          className="text-center py-20"
        >
          <div className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-lg rounded-3xl p-12 border border-white/20">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 1, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-8"
            >
              <Rocket className="w-10 h-10" />
            </motion.div>
            
            <h2 className="text-4xl font-bold mb-6">
              准备好开始你的
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {" "}数字之旅{" "}
              </span>
              了吗？
            </h2>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              加入梦锡账号系统，体验现代化的社交功能，享受安全可靠的服务
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="group px-10 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full text-xl font-bold hover:from-purple-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center space-x-3"
              >
                <Target className="w-6 h-6" />
                <span>立即体验</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="px-10 py-4 border-2 border-gray-500 rounded-full text-xl font-bold hover:border-gray-300 hover:bg-gray-800/50 transition-all"
              >
                现在登录
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 页脚 */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.6 }}
        className="relative z-10 py-12 border-t border-white/10"
      >
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold">梦锡工作室</span>
          </div>
          <p className="text-gray-400 mb-4">
            打造下一代社交体验 | 安全 · 可靠 · 现代化
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <span>© 2025 梦锡工作室</span>
            <span>|</span>
            <span>MXacc 账号系统</span>
            <span>|</span>
            <span>现代化社交平台</span>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}

export default PromoPage 