import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

interface Logo {
  id: string
  name: string
  imageUrl: string
  link?: string
}

interface PartnerLogosProps {
  className?: string
}

const PartnerLogos: React.FC<PartnerLogosProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const { showError } = useToast()
  const [logos, setLogos] = useState<Logo[]>([])
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPartnerLogos = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        // 先检查用户设置中是否启用了合作伙伴logo
        const userSettingsResponse = await fetch('/api/user/user-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
                 if (userSettingsResponse.ok) {
           const userData = await userSettingsResponse.json()
           const isUserEnabled = userData.settings?.partnerLogos?.enabled !== false
           setEnabled(isUserEnabled)
           
           // 如果用户禁用了，就不需要获取logo列表
           if (!isUserEnabled) {
             setLoading(false)
             return
           }
         }
        
        // 获取系统设置中的logo列表
        let systemResponse
        if (user?.role === 'admin') {
          // 管理员使用管理API
          systemResponse = await fetch('/api/admin/system-settings', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        } else {
          // 普通用户使用公共API
          systemResponse = await fetch('/api/social/content?action=partner-logos', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        }
        
        if (systemResponse.ok) {
                     const systemData = await systemResponse.json()
           // 检查系统是否全局启用了合作伙伴logo
           const systemEnabled = systemData.data?.enabled !== false
           
           if (systemEnabled && enabled) {
             setLogos(systemData.data?.logos || [])
           } else {
             setLogos([])
           }
        }
      } catch (error) {
        console.error('获取合作伙伴logo失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPartnerLogos()
  }, [user])

  // 如果禁用了或没有logo，不显示任何内容
  if (!enabled || logos.length === 0) {
    return null
  }

  return (
    <div className={`partner-logos ${className}`}>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">合作伙伴</div>
      <div className="flex flex-wrap justify-center gap-3">
        {logos.map(logo => (
          <div 
            key={logo.id}
            className="bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow"
          >
            {logo.link ? (
              <a 
                href={logo.link}
                target="_blank"
                rel="noopener noreferrer"
                title={logo.name}
              >
                <img 
                  src={logo.imageUrl} 
                  alt={logo.name}
                  className="h-8 w-auto object-contain"
                />
              </a>
            ) : (
              <img 
                src={logo.imageUrl} 
                alt={logo.name}
                className="h-8 w-auto object-contain"
                title={logo.name}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PartnerLogos 