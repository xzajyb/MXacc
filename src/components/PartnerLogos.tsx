import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

interface Logo {
  url: string
  name: string
  imageData?: string // base64图片数据
}

interface PartnerLogosData {
  logos: Logo[]
  enabled: boolean
}

interface PartnerLogosProps {
  className?: string
  compact?: boolean
  loginPage?: boolean // 登录/注册页面特殊样式
}

const PartnerLogos: React.FC<PartnerLogosProps> = ({ className = "", compact = false, loginPage = false }) => {
  const [partnerLogos, setPartnerLogos] = useState<PartnerLogosData>({
    logos: [],
    enabled: true
  })
  const [loading, setLoading] = useState(false) // 默认不显示加载状态，避免闪烁
  const [isVisible, setIsVisible] = useState(false) // 控制整体可见性，用于动画

  // 预加载Logo
  useEffect(() => {
    const fetchPartnerLogos = async () => {
      try {
        // 登录页和注册页不需要token
        const token = localStorage.getItem('token')
        
        const response = await axios.get('/api/user/user-settings?type=partner-logos', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })

        if (response.data && response.data.partnerLogos) {
          setPartnerLogos(response.data.partnerLogos)
          // 添加短暂延迟后显示，确保动画效果
          setTimeout(() => setIsVisible(true), 100)
        }
      } catch (error) {
        console.error('获取合作伙伴Logo失败:', error)
      } finally {
        setLoading(false)
      }
    }

    // 立即设置loading为false，避免闪烁
    fetchPartnerLogos()
  }, [])

  if (!partnerLogos.enabled || partnerLogos.logos.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center ${className}`}>
      <AnimatePresence>
        {isVisible && partnerLogos.logos.map((logo, index) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            className={`${
              loginPage 
                ? 'h-12 px-2' 
                : compact 
                  ? 'h-8 px-2' 
                  : 'h-10 px-2'
            } border-l border-gray-200 dark:border-gray-600 flex items-center mx-1`}
          >
            <img 
              src={logo.imageData || logo.url} 
              alt={logo.name} 
              title={logo.name}
              className={`${
                loginPage 
                  ? 'max-h-8 max-w-[100px]' 
                  : compact 
                    ? 'max-h-6 max-w-[60px]' 
                    : 'max-h-8 max-w-[80px]'
              } object-contain rounded-md`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default PartnerLogos 