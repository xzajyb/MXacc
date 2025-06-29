import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Users,
  MessageSquare,
  Mail,
  Lock,
  Star,
  Zap,
  Globe,
  Heart,
  CheckCircle,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  UserPlus,
  Settings,
  Award,
  Sparkles,
  TrendingUp,
  Database,
  Cpu,
  Cloud
} from 'lucide-react'

const PromoPage: React.FC = () => {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([])

  const slides = [
    {
      id: 1,
      title: "梦锡账号系统",
      subtitle: "全能型用户管理平台",
      description: "集成用户认证、社交互动、内容管理于一体的现代化解决方案",
      bgGradient: "from-blue-600 via-purple-600 to-indigo-800",
      icon: Shield
    },
    {
      id: 2,
      title: "社交生态系统",
      subtitle: "构建活跃的用户社区",
      description: "完整的社交功能：动态发布、评论互动、私信聊天、关注系统",
      bgGradient: "from-green-500 via-teal-500 to-cyan-600",
      icon: Users
    },
    {
      id: 3,
      title: "智能管理",
      subtitle: "高效的内容与用户治理",
      description: "AI辅助的内容审核、用户封禁管理、申述处理系统",
      bgGradient: "from-orange-500 via-red-500 to-pink-600",
      icon: Settings
    },
    {
      id: 4,
      title: "安全至上",
      subtitle: "企业级安全保障",
      description: "多重身份验证、隐私保护、数据加密，守护每一位用户",
      bgGradient: "from-purple-600 via-pink-600 to-red-600",
      icon: Lock
    }
  ]

  const features = [
    {
      icon: UserPlus,
      title: "快速注册",
      description: "简洁的注册流程，支持邮箱验证，30秒完成账户创建",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      icon: Shield,
      title: "安全认证",
      description: "JWT令牌、邮箱验证、密码加密，多层安全防护",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      icon: MessageSquare,
      title: "社交互动",
      description: "动态发布、二级评论、点赞收藏、私信聊天",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      icon: Eye,
      title: "隐私控制",
      description: "个人资料可见性、关注列表隐私设置，保护用户隐私",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20"
    },
    {
      icon: Settings,
      title: "管理面板",
      description: "用户管理、内容审核、系统消息、数据统计",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20"
    },
    {
      icon: Award,
      title: "申述系统",
      description: "公平的封禁申述机制，支持图片证据，保障用户权益",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20"
    }
  ]

  const stats = [
    { label: "注册用户", value: "10,000+", icon: Users },
    { label: "日活跃度", value: "95%", icon: TrendingUp },
    { label: "系统可用性", value: "99.9%", icon: Database },
    { label: "响应时间", value: "<100ms", icon: Zap }
  ]

  const techStack = [
    { name: "React 18", description: "现代化前端框架", color: "bg-blue-500" },
    { name: "TypeScript", description: "类型安全保障", color: "bg-blue-600" },
    { name: "Node.js", description: "高性能后端", color: "bg-green-600" },
    { name: "MongoDB", description: "灵活数据存储", color: "bg-green-500" },
    { name: "JWT", description: "安全认证机制", color: "bg-purple-600" },
    { name: "Tailwind CSS", description: "美观UI设计", color: "bg-cyan-500" }
  ]

  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      }, 4000)
      return () => clearInterval(timer)
    }
  }, [isPlaying, slides.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0')
            setVisibleFeatures(prev => [...prev, index])
          }
        })
      },
      { threshold: 0.1 }
    )

    const elements = document.querySelectorAll('.feature-card')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">梦锡工作室</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-lg transition-colors"
              >
                登录
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                注册
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <div className="relative h-screen overflow-hidden pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1 }}
            className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].bgGradient}`}
          >
            {/* 背景粒子效果 */}
            <div className="absolute inset-0">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-10, 10, -10],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* 内容 */}
            <div className="relative z-10 flex items-center justify-center h-full px-4">
              <div className="text-center text-white max-w-4xl">
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  {React.createElement(slides[currentSlide].icon, {
                    className: "w-24 h-24 mx-auto mb-6 drop-shadow-2xl"
                  })}
                </motion.div>
                
                <motion.h1
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-6xl md:text-8xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200"
                >
                  {slides[currentSlide].title}
                </motion.h1>
                
                <motion.p
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-2xl md:text-3xl mb-6 text-gray-100"
                >
                  {slides[currentSlide].subtitle}
                </motion.p>
                
                <motion.p
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-lg md:text-xl mb-12 text-gray-200 max-w-2xl mx-auto"
                >
                  {slides[currentSlide].description}
                </motion.p>
                
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex flex-wrap justify-center gap-4"
                >
                  <button
                    onClick={() => navigate('/register')}
                    className="bg-white text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-2xl flex items-center group"
                  >
                    立即体验
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-gray-900 transform hover:scale-105 transition-all duration-300"
                  >
                    用户登录
                  </button>
                </motion.div>
              </div>
            </div>

            {/* 控制器 */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              
              <div className="flex space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentSlide === index ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 功能特性区域 */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              强大功能，全面覆盖
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              从用户注册到社交互动，从内容管理到安全防护，一个系统满足所有需求
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`feature-card p-8 rounded-2xl ${feature.bgColor} hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300`}
                data-index={index}
              >
                <div className={`w-16 h-16 ${feature.color} mb-6 mx-auto`}>
                  <feature.icon className="w-full h-full" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 数据统计区域 */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              令人信赖的数据表现
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              稳定可靠的系统性能，值得信赖的服务质量
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300"
              >
                <stat.icon className="w-12 h-12 text-white mx-auto mb-4" />
                <div className="text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-blue-100">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 技术栈区域 */}
      <section className="py-20 px-4 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              前沿技术栈
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              采用业界最新技术，确保系统性能与安全性
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${tech.color} mr-4 group-hover:scale-110 transition-transform`}></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {tech.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {tech.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 行动召唤区域 */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Sparkles className="w-20 h-20 text-white mx-auto mb-8" />
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              开启您的数字化之旅
            </h2>
            <p className="text-xl text-pink-100 mb-12 max-w-2xl mx-auto">
              加入梦锡账号系统，体验现代化的用户管理与社交平台
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-purple-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-2xl"
              >
                免费注册账户
              </button>
              <button
                onClick={() => navigate('/social')}
                className="border-2 border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-purple-600 transform hover:scale-105 transition-all duration-300"
              >
                探索社交功能
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-blue-400 mr-3" />
            <span className="text-2xl font-bold">梦锡工作室</span>
          </div>
          <p className="text-gray-400 mb-6">
            专业的用户管理与社交平台解决方案
          </p>
          <div className="flex justify-center space-x-6 text-gray-400">
            <span>© 2025 梦锡工作室</span>
            <span>•</span>
            <span>保留所有权利</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PromoPage 