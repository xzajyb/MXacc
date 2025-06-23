import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, X, Check, Trash2, RotateCcw, Move, ZoomIn, ZoomOut } from 'lucide-react'

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
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
      alert('请选择支持的图片格式：JPG、PNG、GIF、WebP、SVG')
      return
    }

    // 检查文件大小 (最大10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setSelectedImage(imageUrl)
      setIsModalOpen(true)
      setZoom(1)
      setImagePosition({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
  }

  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current
      setImageSize({ width: naturalWidth, height: naturalHeight })
      
      // 计算容器尺寸
      const containerWidth = 400
      const containerHeight = 300
      
      // 设置初始裁剪区域为容器中心的正方形
      const cropSize = Math.min(containerWidth, containerHeight) * 0.6
      setCropArea({
        x: (containerWidth - cropSize) / 2,
        y: (containerHeight - cropSize) / 2,
        width: cropSize,
        height: cropSize
      })
    }
  }

  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
    e.preventDefault()
    if (type === 'drag') {
      setIsDragging(true)
      const rect = e.currentTarget.getBoundingClientRect()
      setDragStart({ 
        x: e.clientX - rect.left - cropArea.x, 
        y: e.clientY - rect.top - cropArea.y 
      })
    } else {
      setIsResizing(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const container = document.getElementById('crop-container')
      if (!container) return
      
      const rect = container.getBoundingClientRect()
      let newX = e.clientX - rect.left - dragStart.x
      let newY = e.clientY - rect.top - dragStart.y
      
      // 边界检查
      const maxX = rect.width - cropArea.width
      const maxY = rect.height - cropArea.height
      newX = Math.max(0, Math.min(newX, maxX))
      newY = Math.max(0, Math.min(newY, maxY))
      
      setCropArea(prev => ({ ...prev, x: newX, y: newY }))
    } else if (isResizing) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      const delta = Math.max(deltaX, deltaY)
      
      let newSize = Math.max(50, cropArea.width + delta)
      
      // 确保不超出容器边界
      const container = document.getElementById('crop-container')
      if (container) {
        const rect = container.getBoundingClientRect()
        const maxWidth = rect.width - cropArea.x
        const maxHeight = rect.height - cropArea.y
        newSize = Math.min(newSize, Math.min(maxWidth, maxHeight))
      }
      
      setCropArea(prev => ({ ...prev, width: newSize, height: newSize }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }, [isDragging, isResizing, dragStart, cropArea])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

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
    if (!selectedImage || !imageRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置输出尺寸为 200x200
    const outputSize = 200
    canvas.width = outputSize
    canvas.height = outputSize

    // 创建临时图片元素
    const img = new Image()
    img.onload = async () => {
      // 计算裁剪参数
      const container = document.getElementById('crop-container')
      if (!container) return
      
      const containerRect = container.getBoundingClientRect()
      const imageRect = imageRef.current!.getBoundingClientRect()
      
      // 计算图片在容器中的缩放比例
      const scaleX = img.naturalWidth / imageRect.width
      const scaleY = img.naturalHeight / imageRect.height
      
      // 计算实际裁剪区域
      const actualX = (cropArea.x - (imageRect.left - containerRect.left)) * scaleX
      const actualY = (cropArea.y - (imageRect.top - containerRect.top)) * scaleY
      const actualWidth = cropArea.width * scaleX
      const actualHeight = cropArea.height * scaleY

      // 绘制裁剪的图片
      ctx.drawImage(
        img,
        Math.max(0, actualX), 
        Math.max(0, actualY), 
        actualWidth, 
        actualHeight,
        0, 0, outputSize, outputSize
      )

      // 压缩图片
      const compressedBlob = await compressImage(canvas, 0.85)
      
      // 生成预览URL
      const previewUrl = canvas.toDataURL('image/jpeg', 0.85)
      
      try {
        // 上传
        await onUpload(compressedBlob, previewUrl)
        
        // 关闭模态框
        setIsModalOpen(false)
        setSelectedImage(null)
      } catch (error) {
        console.error('上传失败:', error)
      }
    }
    img.src = selectedImage
  }

  const handleDeleteAvatar = async () => {
    if (!onDelete) return
    
    if (confirm('确定要删除当前头像吗？')) {
      try {
        await onDelete()
      } catch (error) {
        console.error('删除头像失败:', error)
      }
    }
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
          className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 cursor-pointer relative border-4 border-white dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
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
              <div className="text-center">
                <Upload size={24} className="text-blue-400 mx-auto mb-2" />
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">点击上传</span>
              </div>
            </div>
          )}
          
          {/* 悬停遮罩 */}
          <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <Camera size={20} className="text-white" />
            )}
          </div>
        </div>

        {/* 操作按钮组 */}
        <div className="mt-4 flex flex-col space-y-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
          >
            <Upload size={14} />
            <span>{loading ? '上传中...' : currentAvatar ? '更换头像' : '上传头像'}</span>
          </button>
          
          {currentAvatar && onDelete && (
            <button
              onClick={handleDeleteAvatar}
              disabled={loading}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
            >
              <Trash2 size={14} />
              <span>删除头像</span>
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center max-w-[160px]">
          支持 JPG、PNG、GIF、WebP、SVG<br/>
          可手动裁剪，自动压缩至200x200
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 裁剪编辑模态框 */}
      <AnimatePresence>
        {isModalOpen && selectedImage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  裁剪头像
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* 裁剪区域 */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* 左侧：图片编辑区 */}
                  <div className="flex-1">
                    <div 
                      id="crop-container"
                      className="relative w-full h-80 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600"
                      style={{ minHeight: '320px' }}
                    >
                      <img
                        ref={imageRef}
                        src={selectedImage}
                        alt="裁剪预览"
                        className="absolute inset-0 w-full h-full object-contain"
                        onLoad={handleImageLoad}
                        style={{ 
                          transform: `scale(${zoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                          transformOrigin: 'center center'
                        }}
                      />
                      
                      {/* 裁剪框 */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* 背景蒙版 */}
                        <div className="absolute inset-0 bg-black/40"></div>
                        
                        {/* 裁剪区域 */}
                        <div
                          className="absolute border-2 border-white shadow-lg pointer-events-auto cursor-move"
                          style={{
                            left: `${cropArea.x}px`,
                            top: `${cropArea.y}px`,
                            width: `${cropArea.width}px`,
                            height: `${cropArea.height}px`,
                            backgroundColor: 'transparent'
                          }}
                          onMouseDown={(e) => handleMouseDown(e, 'drag')}
                        >
                          {/* 透明裁剪区域 */}
                          <div className="absolute inset-0 bg-transparent"></div>
                          
                          {/* 网格线 */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-white/30"></div>
                            <div className="absolute top-2/3 left-0 right-0 h-0.5 bg-white/30"></div>
                            <div className="absolute left-1/3 top-0 bottom-0 w-0.5 bg-white/30"></div>
                            <div className="absolute left-2/3 top-0 bottom-0 w-0.5 bg-white/30"></div>
                          </div>
                          
                          {/* 调整大小手柄 */}
                          <div
                            className="absolute -bottom-2 -right-2 w-6 h-6 bg-white border-2 border-blue-500 cursor-se-resize rounded-full shadow-lg hover:scale-110 transition-transform"
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              handleMouseDown(e, 'resize')
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 控制工具栏 */}
                    <div className="mt-4 flex items-center justify-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                          className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <ZoomOut size={16} />
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
                          {Math.round(zoom * 100)}%
                        </span>
                        <button
                          onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                          className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <ZoomIn size={16} />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => {
                          setZoom(1)
                          setImagePosition({ x: 0, y: 0 })
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm"
                      >
                        <RotateCcw size={14} />
                        <span>重置</span>
                      </button>
                    </div>
                  </div>

                  {/* 右侧：预览区 */}
                  <div className="lg:w-64">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                        预览效果
                      </h4>
                      <div className="flex justify-center mb-4">
                        <div className="w-24 h-24 border-2 border-gray-300 dark:border-gray-600 rounded-full overflow-hidden bg-white dark:bg-gray-700">
                          <canvas
                            ref={canvasRef}
                            width={200}
                            height={200}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p className="text-center">• 最终尺寸：200x200像素</p>
                        <p className="text-center">• 格式：JPEG (高质量)</p>
                        <p className="text-center">• 拖动裁剪框调整位置</p>
                        <p className="text-center">• 拖动右下角调整大小</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmUpload}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2 shadow-lg"
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