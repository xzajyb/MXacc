import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Users,
  MessageSquare,
  Zap,
  Lock,
  Heart,
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Mail,
  Bell,
  Camera,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'

const PromoPage: React.FC = () => {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // 幻灯片数据
  const slides = [
    {
      id: 'hero',
      title: '梦锡账号系统',
      subtitle: '安全、智能、现代化的用户管理平台',
      description: '为您提供企业级的安全保障，社交化的用户体验，以及智能化的管理功能',
      background: 'from-blue-600 via-purple-600 to-blue-800',
      icon: Shield
    },
    {
      id: 'security',
      title: '企业级安全保障',
      subtitle: '多重防护，守护您的数据安全',
      description: '邮箱验证、双重认证、登录监控、异常检测，全方位保护您的账户安全',
      background: 'from-green-500 via-teal-500 to-blue-500',
      icon: Lock,
      features: [
        '邮箱验证系统',
        '登录异常检测',
        '实时安全监控',
        '数据加密传输'
      ]
    },
    {
      id: 'social',
      title: '丰富的社交功能',
      subtitle: '连接用户，构建社区',
      description: '动态发布、私信聊天、关注互动，打造活跃的用户社区生态',
      background: 'from-pink-500 via-red-500 to-orange-500',
      icon: Users,
      features: [
        '动态发布分享',
        '私信实时聊天',
        '关注互动系统',
        '社区内容管理'
      ]
    },
    {
      id: 'admin',
      title: '强大的管理功能',
      subtitle: '专业工具，高效管理',
      description: '用户管理、内容审核、数据分析，为管理员提供完善的管理工具',
      background: 'from-purple-600 via-indigo-600 to-blue-600',
      icon: Zap,
      features: [
        '用户权限管理',
        '内容审核系统',
        '数据统计分析',
        '系统监控告警'
      ]
    },
    {
      id: 'experience',
      title: '卓越的用户体验',
      subtitle: '简洁优雅，响应迅速',
      description: '现代化界面设计，流畅的交互体验，支持多设备无缝切换',
      background: 'from-cyan-500 via-blue-500 to-indigo-500',
      icon: Star,
      features: [
        '响应式设计',
        '暗黑模式支持',
        '多语言界面',
        '无障碍访问'
      ]
    },
    {
      id: 'cta',
      title: '立即开始体验',
      subtitle: '加入梦锡，开启智能账号管理之旅',
      description: '注册只需30秒，立即体验企业级的账号管理系统',
      background: 'from-violet-600 via-purple-600 to-indigo-600',
      icon: Heart
    }
  ]

  // 自动播放
  useEffect(() => {
    if (!isAutoPlaying) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // 5秒切换一次

    return () => clearInterval(timer)
  }, [isAutoPlaying, slides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const handleGetStarted = () => {
    navigate('/register')
  }

  const handleLogin = () => {
    navigate('/login')
  }

  const currentSlideData = slides[currentSlide]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* 背景渐变 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.background} transition-all duration-1000`} />
      
      {/* 动态背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-white bg-opacity-10 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* 顶部导航 */}
      <motion.nav 
        className="relative z-50 p-6 flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">梦锡工作室</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="p-2 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm hover:bg-opacity-30 transition-all"
          >
            {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={handleLogin}
            className="px-4 py-2 text-white hover:text-gray-200 transition-colors"
          >
            登录
          </button>
          <button
            onClick={handleGetStarted}
            className="px-6 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            立即注册
          </button>
        </div>
      </motion.nav>

      {/* 主要内容区域 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.8 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="text-center max-w-6xl mx-auto"
          >
            {/* 图标 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
              className="mb-8"
            >
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm">
                <currentSlideData.icon className="w-12 h-12" />
              </div>
            </motion.div>

            {/* 标题 */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
            >
              {currentSlideData.title}
            </motion.h1>

            {/* 副标题 */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-2xl md:text-3xl font-light mb-8 text-gray-200"
            >
              {currentSlideData.subtitle}
            </motion.h2>

            {/* 描述 */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              {currentSlideData.description}
            </motion.p>

            {/* 功能列表 */}
            {currentSlideData.features && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto"
              >
                {currentSlideData.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    className="flex items-center space-x-3 bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm"
                  >
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-lg">{feature}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* CTA按钮 */}
            {currentSlide === slides.length - 1 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <button
                  onClick={handleGetStarted}
                  className="group px-8 py-4 bg-white text-gray-900 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center space-x-2"
                >
                  <span>立即注册</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={handleLogin}
                  className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white hover:text-gray-900 transition-all"
                >
                  已有账号？登录
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部控制器 */}
      <motion.div 
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <div className="bg-white bg-opacity-20 rounded-full p-4 backdrop-blur-sm flex items-center space-x-4">
          {/* 上一页按钮 */}
          <button
            onClick={prevSlide}
            className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* 页面指示器 */}
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-white' 
                    : 'bg-white bg-opacity-40 hover:bg-opacity-60'
                }`}
              />
            ))}
          </div>

          {/* 下一页按钮 */}
          <button
            onClick={nextSlide}
            className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* 设备展示 */}
      {currentSlide === 4 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-20 right-10 hidden lg:block"
        >
          <div className="flex items-end space-x-4">
            <div className="w-8 h-12 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="w-12 h-8 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm flex items-center justify-center">
              <Tablet className="w-6 h-6" />
            </div>
            <div className="w-16 h-10 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm flex items-center justify-center">
              <Monitor className="w-8 h-8" />
            </div>
          </div>
        </motion.div>
      )}

      {/* 进度条 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white bg-opacity-20">
        <motion.div
          className="h-full bg-white"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  )
}

export default PromoPage 