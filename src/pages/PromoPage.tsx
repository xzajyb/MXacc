import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Users,
  MessageSquare,
  Mail,
  Lock,
  Zap,
  Heart,
  Star,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react'

const PromoPage: React.FC = () => {
  const navigate = useNavigate()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentScene, setCurrentScene] = useState(0)
  const [progress, setProgress] = useState(0)

  // 场景配置
  const scenes = [
    {
      id: 'intro',
      duration: 8000,
      title: '梦锡工作室',
      subtitle: '新一代账号管理系统',
      description: '安全 • 简洁 • 智能',
      background: 'from-blue-600 via-purple-600 to-blue-800'
    },
    {
      id: 'security',
      duration: 10000,
      title: '企业级安全',
      subtitle: '多重保护机制',
      description: '双重验证 • 邮箱安全 • 实时监控',
      background: 'from-green-600 via-teal-600 to-blue-600'
    },
    {
      id: 'social',
      duration: 12000,
      title: '社交互动',
      subtitle: '连接每一个人',
      description: '动态分享 • 私信聊天 • 社区互动',
      background: 'from-pink-600 via-rose-600 to-orange-600'
    },
    {
      id: 'management',
      duration: 10000,
      title: '智能管理',
      subtitle: '全方位控制台',
      description: '用户管理 • 权限控制 • 系统监控',
      background: 'from-indigo-600 via-blue-600 to-cyan-600'
    },
    {
      id: 'features',
      duration: 12000,
      title: '丰富功能',
      subtitle: '一站式解决方案',
      description: '邮件系统 • 封禁管理 • 申述处理',
      background: 'from-purple-600 via-violet-600 to-pink-600'
    },
    {
      id: 'cta',
      duration: 8000,
      title: '立即开始',
      subtitle: '加入梦锡大家庭',
      description: '免费注册 • 立即体验',
      background: 'from-emerald-600 via-green-600 to-teal-600'
    }
  ]

  const totalDuration = scenes.reduce((acc, scene) => acc + scene.duration, 0)

  // 播放控制
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / totalDuration) * 100
          
          // 计算当前场景
          let accumulatedTime = 0
          for (let i = 0; i < scenes.length; i++) {
            accumulatedTime += scenes[i].duration
            if ((newProgress / 100) * totalDuration <= accumulatedTime) {
              setCurrentScene(i)
              break
            }
          }
          
          if (newProgress >= 100) {
            setIsPlaying(false)
            return 100
          }
          
          return newProgress
        })
      }, 100)
    }
    
    return () => clearInterval(interval)
  }, [isPlaying, totalDuration, scenes])

  // 重置播放
  const handleReset = () => {
    setProgress(0)
    setCurrentScene(0)
    setIsPlaying(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* 动态背景 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 1 }}
          className={`absolute inset-0 bg-gradient-to-br ${scenes[currentScene]?.background || 'from-blue-600 to-purple-600'}`}
        />
      </AnimatePresence>

      {/* 毛玻璃背景效果 */}
      <div className="absolute inset-0 backdrop-blur-[1px]">
        {/* 浮动粒子 */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      {/* 场景内容 */}
      <AnimatePresence mode="wait">
        {scenes[currentScene] && (
          <motion.div
            key={scenes[currentScene].id}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center z-10"
          >
            {/* 主标题 */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-tight"
            >
              {scenes[currentScene].title}
            </motion.h1>
            
            {/* 副标题 */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-2xl md:text-4xl font-light text-white/90 mb-6"
            >
              {scenes[currentScene].subtitle}
            </motion.h2>
            
            {/* 描述 */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl"
            >
              {scenes[currentScene].description}
            </motion.p>

            {/* 场景图标 */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 1, type: "spring" }}
              className="flex flex-wrap justify-center gap-4"
            >
              {currentScene === 0 && [Shield, Users, MessageSquare].map((Icon, index) => (
                <motion.div
                  key={index}
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: index * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                >
                  <Icon className="w-8 h-8 text-white" />
                </motion.div>
              ))}
              
              {currentScene === 1 && [Lock, Shield, Mail].map((Icon, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.8 + index * 0.2,
                    duration: 0.8,
                    type: "spring",
                    bounce: 0.5
                  }}
                  className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                >
                  <Icon className="w-10 h-10 text-white" />
                </motion.div>
              ))}
              
              {currentScene === 2 && [MessageSquare, Heart, Users, Star].map((Icon, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: 0.8 + index * 0.1,
                    duration: 0.6,
                    type: "spring"
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                >
                  <Icon className="w-8 h-8 text-white" />
                </motion.div>
              ))}
              
              {currentScene === 3 && [Monitor, Smartphone, Globe].map((Icon, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: [1, 1.1, 1],
                    rotateY: [0, 180, 360]
                  }}
                  transition={{ 
                    opacity: { delay: 1 + index * 0.2, duration: 0.8 },
                    y: { delay: 1 + index * 0.2, duration: 0.8 },
                    scale: { duration: 3, delay: index * 0.5, repeat: Infinity, ease: "easeInOut" },
                    rotateY: { duration: 3, delay: index * 0.5, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center"
                >
                  <Icon className="w-12 h-12 text-white" />
                </motion.div>
              ))}
              
              {currentScene === 4 && [Mail, Shield, Users, MessageSquare, Lock, Zap].map((Icon, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    y: [0, -5, 0],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ 
                    opacity: { delay: 0.8 + index * 0.1, duration: 0.5 },
                    scale: { delay: 0.8 + index * 0.1, duration: 0.5, type: "spring", bounce: 0.7 },
                    y: { duration: 2 + index * 0.2, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 2 + index * 0.2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                >
                  <Icon className="w-7 h-7 text-white" />
                </motion.div>
              ))}
              
              {currentScene === 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(255,255,255,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/register')}
                    className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold text-lg flex items-center space-x-2 shadow-xl"
                  >
                    <span>立即注册</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login')}
                    className="px-8 py-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl font-semibold text-lg flex items-center space-x-2"
                  >
                    <span>立即登录</span>
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 控制栏 */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-4 flex items-center space-x-4 border border-white/20">
          {/* 播放/暂停按钮 */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </motion.button>

          {/* 进度条 */}
          <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* 重置按钮 */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <RotateCcw className="w-6 h-6" />
          </motion.button>

          {/* 场景指示器 */}
          <div className="flex space-x-2">
            {scenes.map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentScene === index ? 'bg-white' : 'bg-white/40'
                }`}
                whileHover={{ scale: 1.5 }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* 返回按钮 */}
      <motion.button
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        whileHover={{ scale: 1.1, x: 5 }}
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 z-20 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white border border-white/20 hover:bg-white/30 transition-colors"
      >
        <ArrowRight className="w-6 h-6 rotate-180" />
      </motion.button>

      {/* 时间显示 */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute top-8 right-8 z-20 bg-black/30 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20"
      >
        <span className="text-white font-mono text-sm">
          {Math.floor((progress / 100) * (totalDuration / 1000))}s / {totalDuration / 1000}s
        </span>
      </motion.div>

      {/* 品牌水印 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 right-8 z-10 text-white/60 text-sm font-light"
      >
        © 2024 梦锡工作室
      </motion.div>
    </div>
  )
}

export default PromoPage 