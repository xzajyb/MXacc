import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, X, Check } from 'lucide-react'

interface AvatarUploaderProps {
  currentAvatar?: string
  onUpload: (file: Blob, preview: string) => Promise<void>
  loading?: boolean
  className?: string
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentAvatar,
  onUpload,
  loading = false,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('请选择支持的图片格式：JPG、PNG、GIF、WebP')
      return
    }

    // 检查文件大小 (最大10MB，因为我们会压缩)
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setSelectedImage(imageUrl)
      processImagePreview(imageUrl)
      setIsModalOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const processImagePreview = (imageUrl: string) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 设置输出尺寸为 200x200
      const outputSize = 200
      canvas.width = outputSize
      canvas.height = outputSize

      // 计算居中裁剪参数
      const { width, height } = img
      const size = Math.min(width, height)
      const x = (width - size) / 2
      const y = (height - size) / 2

      // 绘制裁剪的图片
      ctx.drawImage(img, x, y, size, size, 0, 0, outputSize, outputSize)
      
      // 生成预览
      const preview = canvas.toDataURL('image/jpeg', 0.85)
      setPreviewUrl(preview)
    }
    img.src = imageUrl
  }

  const compressImage = (canvas: HTMLCanvasElement, quality: number = 0.85): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        }
      }, 'image/jpeg', quality)
    })
  }

  const handleConfirmUpload = async () => {
    if (!selectedImage || !previewUrl) return

    const img = new Image()
    img.onload = async () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 设置输出尺寸为 200x200
      const outputSize = 200
      canvas.width = outputSize
      canvas.height = outputSize

      // 计算居中裁剪参数
      const { width, height } = img
      const size = Math.min(width, height)
      const x = (width - size) / 2
      const y = (height - size) / 2

      // 绘制裁剪的图片
      ctx.drawImage(img, x, y, size, size, 0, 0, outputSize, outputSize)

      // 压缩图片
      const compressedBlob = await compressImage(canvas, 0.85)
      
      try {
        // 上传
        await onUpload(compressedBlob, previewUrl)
        
        // 关闭模态框
        setIsModalOpen(false)
        setSelectedImage(null)
        setPreviewUrl(null)
      } catch (error) {
        console.error('上传失败:', error)
      }
    }
    img.src = selectedImage
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        {/* 头像显示区域 */}
        <div 
          className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer relative border-4 border-gray-200 dark:border-gray-600"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {currentAvatar ? (
            <img 
              src={currentAvatar} 
              alt="头像" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Upload size={32} className="text-gray-400" />
            </div>
          )}
          
          {/* 悬停遮罩 */}
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <Camera size={24} className="text-white" />
            )}
          </div>
        </div>

        {/* 上传按钮 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="mt-3 inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
        >
          <Upload size={14} />
          <span>{loading ? '上传中...' : '更换头像'}</span>
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-[160px]">
          支持拖拽上传，自动裁剪并压缩至200x200
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 预览确认模态框 */}
      <AnimatePresence>
        {isModalOpen && selectedImage && previewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  确认头像
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* 原图预览 */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    原图预览
                  </label>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <img
                      src={selectedImage}
                      alt="原图"
                      className="max-w-full max-h-32 mx-auto rounded"
                    />
                  </div>
                </div>

                {/* 裁剪后预览 */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    头像预览 (自动居中裁剪)
                  </label>
                  <div className="flex justify-center">
                    <div className="w-24 h-24 border-2 border-gray-300 dark:border-gray-600 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={previewUrl}
                        alt="头像预览"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    图片将自动裁剪为正方形并压缩至200x200像素
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmUpload}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Check size={16} />
                    )}
                    <span>{loading ? '上传中...' : '确认上传'}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AvatarUploader 