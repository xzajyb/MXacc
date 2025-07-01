import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface Logo {
  url: string
  name: string
}

interface PartnerLogosData {
  logos: Logo[]
  enabled: boolean
}

interface PartnerLogosProps {
  className?: string
  authPage?: boolean // 是否在登录/注册页面使用
}

const PartnerLogos: React.FC<PartnerLogosProps> = ({ className = '', authPage = false }) => {
  const [partnerLogos, setPartnerLogos] = useState<PartnerLogosData>({
    logos: [],
    enabled: true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPartnerLogos = async () => {
      try {
        // 在登录/注册页面使用不需要认证的API
        const token = localStorage.getItem('token')
        
        let url = '/api/user/user-settings?type=partner-logos'
        let response
        
        if (authPage || !token) {
          url = '/api/auth/partner-logos'
          response = await axios.get(url)
        } else {
          response = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        }

        if (response.data && response.data.partnerLogos) {
          setPartnerLogos(response.data.partnerLogos)
        }
      } catch (error) {
        console.error('获取合作伙伴Logo失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPartnerLogos()
  }, [authPage])

  if (loading || !partnerLogos.enabled || partnerLogos.logos.length === 0) {
    return null
  }

  // 为登录/注册页面使用不同的样式
  if (authPage) {
    return (
      <div className={`flex items-center justify-center space-x-4 ${className}`}>
        {partnerLogos.logos.map((logo, index) => (
          <div key={index} className="flex items-center justify-center">
            <img 
              src={logo.url} 
              alt={logo.name} 
              title={logo.name}
              className="max-h-10 max-w-[100px] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        ))}
      </div>
    )
  }

  // 仪表盘页面样式
  return (
    <>
      {partnerLogos.logos.map((logo, index) => (
        <div key={index} className={`h-10 px-2 border-l border-gray-200 dark:border-gray-600 flex items-center mx-2 ${className}`}>
          <img 
            src={logo.url} 
            alt={logo.name} 
            title={logo.name}
            className="max-h-8 max-w-[80px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      ))}
    </>
  )
}

export default PartnerLogos 