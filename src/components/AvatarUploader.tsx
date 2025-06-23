import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, X, Check, RotateCcw, Move, ZoomIn, ZoomOut, Trash2 } from 'lucide-react'

interface AvatarUploaderProps {
  currentAvatar?: string
  onUpload: (file: Blob, preview: string) => Promise<void>
  onDelete?: () => Promise<void>
  loading?: boolean
  className?: string
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentAvatar,
  onUpload,
  onDelete,
  loading = false,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    // 检查文件类型 - 重新支持SVG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      showNotification('请选择支持的图片格式：JPG、PNG、GIF、WebP、SVG', 'error')
      return
    }

    // 检查文件大小 (最大10MB，因为我们会压缩)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('图片大小不能超过10MB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setSelectedImage(imageUrl)
      setIsModalOpen(true)
      setZoom(1)
      setRotation(0)
    }
    reader.readAsDataURL(file)
  }

  const handleImageLoad = () => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current
      const container = containerRef.current
      
      // 获取容器尺寸
      const containerRect = container.getBoundingClientRect()
      const maxWidth = containerRect.width - 40 // 留边距
      const maxHeight = containerRect.height - 40
      
      // 计算显示尺寸
      let displayWidth = img.naturalWidth
      let displayHeight = img.naturalHeight
      
      // 等比缩放到容器内
      const scale = Math.min(maxWidth / displayWidth, maxHeight / displayHeight, 1)
      displayWidth *= scale
      displayHeight *= scale
      
      setImageSize({ width: displayWidth, height: displayHeight })
      
      // 设置初始裁剪区域为图片中心的正方形
      const size = Math.min(displayWidth, displayHeight) * 0.6
      setCropArea({
        x: (displayWidth - size) / 2,
        y: (displayHeight - size) / 2,
        width: size,
        height: size
      })
    }
  }

  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
    e.preventDefault()
    e.stopPropagation()
    
    if (type === 'drag') {
      setIsDragging(true)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setDragStart({ 
          x: e.clientX - rect.left - cropArea.x, 
          y: e.clientY - rect.top - cropArea.y 
        })
      }
    } else {
      setIsResizing(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    
    if (isDragging) {
      let newX = e.clientX - rect.left - dragStart.x
      let newY = e.clientY - rect.top - dragStart.y
      
      // 边界检查
      newX = Math.max(0, Math.min(newX, imageSize.width - cropArea.width))
      newY = Math.max(0, Math.min(newY, imageSize.height - cropArea.height))
      
      setCropArea(prev => ({ ...prev, x: newX, y: newY }))
    } else if (isResizing) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      const delta = Math.max(deltaX, deltaY)
      
      let newSize = Math.max(50, cropArea.width + delta)
      newSize = Math.min(newSize, Math.min(imageSize.width - cropArea.x, imageSize.height - cropArea.y))
      
      setCropArea(prev => ({ ...prev, width: newSize, height: newSize }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }, [isDragging, isResizing, dragStart, cropArea, imageSize])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  // 实时生成预览
  useEffect(() => {
    if (selectedImage && cropArea.width > 0) {
      generatePreview()
    }
  }, [selectedImage, cropArea, zoom, rotation])

  const generatePreview = () => {
    if (!selectedImage) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const outputSize = 200
    canvas.width = outputSize
    canvas.height = outputSize

    const img = new Image()
    img.onload = () => {
      // 清空画布
      ctx.clearRect(0, 0, outputSize, outputSize)
      
      // 保存上下文
      ctx.save()
      
      // 移动到画布中心
      ctx.translate(outputSize / 2, outputSize / 2)
      
      // 应用旋转
      ctx.rotate((rotation * Math.PI) / 180)
      
      // 计算缩放比例
      const scaleX = img.naturalWidth / imageSize.width
      const scaleY = img.naturalHeight / imageSize.height
      
      // 绘制裁剪的图片
      ctx.drawImage(
        img,
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY,
        -outputSize / 2,
        -outputSize / 2,
        outputSize,
        outputSize
      )
      
      // 恢复上下文
      ctx.restore()
      
      // 生成预览URL
      const preview = canvas.toDataURL('image/jpeg', 0.9)
      setPreviewUrl(preview)
    }
    img.src = selectedImage
  }

  const compressImage = (canvas: HTMLCanvasElement, quality: number = 0.9): Promise<Blob> => {
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

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const outputSize = 200
    canvas.width = outputSize
    canvas.height = outputSize

    const img = new Image()
    img.onload = async () => {
      // 清空画布
      ctx.clearRect(0, 0, outputSize, outputSize)
      
      // 保存上下文
      ctx.save()
      
      // 移动到画布中心
      ctx.translate(outputSize / 2, outputSize / 2)
      
      // 应用旋转
      ctx.rotate((rotation * Math.PI) / 180)
      
      // 计算缩放比例
      const scaleX = img.naturalWidth / imageSize.width
      const scaleY = img.naturalHeight / imageSize.height
      
      // 绘制裁剪的图片
      ctx.drawImage(
        img,
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY,
        -outputSize / 2,
        -outputSize / 2,
        outputSize,
        outputSize
      )
      
      // 恢复上下文
      ctx.restore()

      try {
        // 压缩图片
        const compressedBlob = await compressImage(canvas, 0.9)
        
        // 上传
        await onUpload(compressedBlob, previewUrl)
        
        // 关闭模态框
        handleCloseModal()
      } catch (error) {
        console.error('上传失败:', error)
        showNotification('上传失败，请重试', 'error')
      }
    }
    img.src = selectedImage
  }

  const handleDeleteAvatar = async () => {
    if (!onDelete) return
    
    if (confirm('确定要删除当前头像吗？')) {
      try {
        await onDelete()
        showNotification('头像已删除', 'success')
      } catch (error) {
        console.error('删除失败:', error)
        showNotification('删除失败，请重试', 'error')
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedImage(null)
    setPreviewUrl(null)
    setZoom(1)
    setRotation(0)
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

  // 自定义通知组件
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // 创建通知元素
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-lg">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </span>
        <span class="flex-1">${message}</span>
        <button class="text-white hover:opacity-70" onclick="this.parentElement.parentElement.remove()">✕</button>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // 显示动画
    setTimeout(() => {
      notification.classList.remove('translate-x-full')
    }, 100)
    
    // 自动移除
    setTimeout(() => {
      notification.classList.add('translate-x-full')
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        {/* 头像显示区域 */}
        <div 
          className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer relative border-4 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
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

        {/* 操作按钮 */}
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
          >
            <Upload size={14} />
            <span>{loading ? '上传中...' : currentAvatar ? '更换头像' : '上传头像'}</span>
          </button>
          
          {currentAvatar && onDelete && (
            <button
              onClick={handleDeleteAvatar}
              disabled={loading}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              title="删除头像"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-[160px]">
          支持拖拽上传，JPG、PNG、GIF、WebP、SVG 格式
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 裁剪模态框 - 使用 Portal 避免嵌套问题 */}
      <AnimatePresence>
        {isModalOpen && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  裁剪头像
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 图片裁剪区域 */}
                  <div className="lg:col-span-2">
                    <div 
                      ref={containerRef}
                      className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                      style={{ height: '400px' }}
                    >
                      <img
                        ref={imageRef}
                        src={selectedImage}
                        alt="裁剪预览"
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-none"
                        onLoad={handleImageLoad}
                        style={{ 
                          width: imageSize.width * zoom,
                          height: imageSize.height * zoom,
                          transform: `translate(-50%, -50%) rotate(${rotation}deg)`
                        }}
                      />
                      
                      {/* 裁剪框 */}
                      {imageSize.width > 0 && (
                        <div
                          className="absolute border-2 border-white shadow-lg cursor-move bg-transparent"
                          style={{
                            left: cropArea.x,
                            top: cropArea.y,
                            width: cropArea.width,
                            height: cropArea.height,
                            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`
                          }}
                          onMouseDown={(e) => handleMouseDown(e, 'drag')}
                        >
                          {/* 调整大小手柄 */}
                          <div
                            className="absolute -bottom-2 -right-2 w-6 h-6 bg-white border-2 border-blue-500 cursor-se-resize rounded-full flex items-center justify-center"
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              handleMouseDown(e, 'resize')
                            }}
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                          
                          {/* 移动指示器 */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            <Move size={20} className="text-white drop-shadow-lg" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 控制面板 */}
                  <div className="space-y-6">
                    {/* 预览 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        预览效果
                      </label>
                      <div className="flex justify-center">
                        <div className="w-24 h-24 border-2 border-gray-300 dark:border-gray-600 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                          {previewUrl && (
                            <img
                              src={previewUrl}
                              alt="头像预览"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 缩放控制 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        缩放: {Math.round(zoom * 100)}%
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <ZoomOut size={16} />
                        </button>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={zoom}
                          onChange={(e) => setZoom(parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <button
                          onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <ZoomIn size={16} />
                        </button>
                      </div>
                    </div>

                    {/* 旋转控制 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        旋转: {rotation}°
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setRotation((rotation - 90) % 360)}
                          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="1"
                          value={rotation}
                          onChange={(e) => setRotation(parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <button
                          onClick={() => setRotation((rotation + 90) % 360)}
                          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <RotateCcw size={16} className="transform rotate-180" />
                        </button>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="space-y-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleConfirmUpload}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Check size={16} />
                        )}
                        <span>{loading ? '上传中...' : '确认上传'}</span>
                      </motion.button>

                      <button
                        onClick={handleCloseModal}
                        className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        取消
                      </button>
                    </div>

                    {/* 提示信息 */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>• 拖拽白色框移动裁剪区域</p>
                      <p>• 拖拽右下角圆点调整大小</p>
                      <p>• 使用滑块调整缩放和旋转</p>
                      <p>• 最终输出 200x200 像素</p>
                    </div>
                  </div>
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