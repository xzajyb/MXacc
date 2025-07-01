import React, { useEffect, useState } from 'react'
import axios from 'axios'

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
}

const PartnerLogos: React.FC<PartnerLogosProps> = ({ className = "", compact = false }) => {
  const [partnerLogos, setPartnerLogos] = useState<PartnerLogosData>({
    logos: [],
    enabled: true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPartnerLogos = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await axios.get('/api/user/user-settings?type=partner-logos', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

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
  }, [])

  if (loading || !partnerLogos.enabled || partnerLogos.logos.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center ${className}`}>
      {partnerLogos.logos.map((logo, index) => (
        <div key={index} className={`${compact ? 'h-8' : 'h-10'} px-2 border-l border-gray-200 dark:border-gray-600 flex items-center mx-1`}>
          <img 
            src={logo.imageData || logo.url} 
            alt={logo.name} 
            title={logo.name}
            className={`${compact ? 'max-h-6 max-w-[60px]' : 'max-h-8 max-w-[80px]'} object-contain`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      ))}
    </div>
  )
}

export default PartnerLogos 