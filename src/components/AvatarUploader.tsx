import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, X, Check, Move, Maximize2 } from 'lucide-react'
import ReactDOM from 'react-dom'

interface AvatarUploaderProps {
  currentAvatar?: string
  onUpload: (file: Blob, preview: string) => Promise<void>
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
  loading = false,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    // 检查文件类型 - 添加SVG支持
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
      setScale(1)
    }
    reader.readAsDataURL(file)
  }

  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current
      setImageSize({ width: naturalWidth, height: naturalHeight })
      
      // 设置初始裁剪区域为图片中心的正方形
      const size = Math.min(naturalWidth, naturalHeight) * 0.8
      setCropArea({
        x: (naturalWidth - size) / 2,
        y: (naturalHeight - size) / 2,
        width: size,
        height: size
      })
      
      // 立即更新预览
      updatePreview()
    }
  }

  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
    e.preventDefault()
    e.stopPropagation()
    
    if (type === 'drag') {
      setIsDragging(true)
      const rect = cropContainerRef.current?.getBoundingClientRect()
      if (rect) {
        setDragStart({ 
          x: e.clientX - (cropArea.x * scale), 
          y: e.clientY - (cropArea.y * scale)
        })
      }
    } else {
      setIsResizing(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && imageRef.current) {
      const newX = (e.clientX - dragStart.x) / scale
      const newY = (e.clientY - dragStart.y) / scale
      
      // 边界检查
      const maxX = imageSize.width - cropArea.width
      const maxY = imageSize.height - cropArea.height
      
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      }))
    } else if (isResizing) {
      const deltaX = (e.clientX - dragStart.x) / scale
      const deltaY = (e.clientY - dragStart.y) / scale
      const delta = Math.max(deltaX, deltaY)
      
      setCropArea(prev => {
        let newSize = Math.max(50, prev.width + delta)
        newSize = Math.min(newSize, Math.min(imageSize.width - prev.x, imageSize.height - prev.y))
        return { ...prev, width: newSize, height: newSize }
      })
      
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }, [isDragging, isResizing, dragStart, cropArea, imageSize, scale])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  // 监听鼠标移动和释放
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

  // 更新预览
  const updatePreview = useCallback(() => {
    if (!selectedImage || !canvasRef.current || !imageRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置输出尺寸为 200x200
    canvas.width = 200
    canvas.height = 200

    // 清空画布
    ctx.clearRect(0, 0, 200, 200)
    
    // 绘制裁剪的图片
    ctx.drawImage(
      imageRef.current,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, 200, 200
    )
    
    // 生成预览URL
    const preview = canvas.toDataURL('image/jpeg', 0.85)
    setPreviewUrl(preview)
  }, [selectedImage, cropArea])

  // 当裁剪区域变化时更新预览
  useEffect(() => {
    updatePreview()
  }, [cropArea, updatePreview])

  const compressImage = (canvas: HTMLCanvasElement, quality: number = 0.85): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to compress image'))
        }
      }, 'image/jpeg', quality)
    })
  }

  const handleConfirmUpload = async () => {
    if (!selectedImage || !previewUrl || !canvasRef.current) return

    try {
      const compressedBlob = await compressImage(canvasRef.current, 0.85)
      await onUpload(compressedBlob, previewUrl)
      
      // 关闭模态框
      setIsModalOpen(false)
      setSelectedImage(null)
      setPreviewUrl(null)
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请重试')
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

  // 模态框内容
  const modalContent = isModalOpen && selectedImage ? (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            裁剪头像
          </h3>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：图片裁剪区域 */}
            <div className="space-y-4">
              <div 
                ref={cropContainerRef}
                className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                style={{ maxHeight: '500px' }}
              >
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="裁剪预览"
                  className="max-w-full max-h-full mx-auto block"
                  onLoad={handleImageLoad}
                  style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
                />
                
                {/* 裁剪框覆盖层 */}
                {imageRef.current && imageSize.width > 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* 暗色遮罩 */}
                    <svg className="absolute inset-0 w-full h-full">
                      <defs>
                        <mask id="cropMask">
                          <rect x="0" y="0" width="100%" height="100%" fill="white" />
                          <rect
                            x={`${(cropArea.x / imageSize.width) * 100}%`}
                            y={`${(cropArea.y / imageSize.height) * 100}%`}
                            width={`${(cropArea.width / imageSize.width) * 100}%`}
                            height={`${(cropArea.height / imageSize.height) * 100}%`}
                            fill="black"
                          />
                        </mask>
                      </defs>
                      <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#cropMask)" />
                    </svg>
                    
                    {/* 裁剪区域 */}
                    <div
                      className="absolute border-2 border-white shadow-lg cursor-move pointer-events-auto"
                      style={{
                        left: `${(cropArea.x / imageSize.width) * 100}%`,
                        top: `${(cropArea.y / imageSize.height) * 100}%`,
                        width: `${(cropArea.width / imageSize.width) * 100}%`,
                        height: `${(cropArea.height / imageSize.height) * 100}%`,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'drag')}
                    >
                      {/* 裁剪框网格线 */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="border border-white/30" />
                        ))}
                      </div>
                      
                      {/* 中心指示器 */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Move size={20} className="text-white drop-shadow-lg" />
                      </div>
                      
                      {/* 调整大小手柄 */}
                      <div
                        className="absolute -bottom-2 -right-2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-se-resize pointer-events-auto"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          handleMouseDown(e, 'resize')
                        }}
                      >
                        <Maximize2 size={12} className="text-blue-500 m-auto mt-1" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 缩放控制 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  缩放: {Math.round(scale * 100)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* 右侧：预览和信息 */}
            <div className="space-y-6">
              {/* 预览 */}
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  头像预览
                </label>
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 border-4 border-gray-300 dark:border-gray-600 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <canvas
                        ref={canvasRef}
                        width={200}
                        height={200}
                        className="w-full h-full"
                      />
                    </div>
                    {/* 预览装饰 */}
                    <div className="absolute -inset-1 rounded-full border-2 border-blue-500/20"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  最终尺寸：200x200像素
                </p>
              </div>

              {/* 使用提示 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">使用提示</h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• 拖动图片调整裁剪位置</li>
                  <li>• 拖动右下角圆点调整裁剪大小</li>
                  <li>• 使用缩放滑块查看细节</li>
                  <li>• 支持 JPG、PNG、GIF、WebP、SVG 格式</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3 pt-6 border-t dark:border-gray-700 mt-6">
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
      </motion.div>
    </div>
  ) : null

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
          支持拖拽上传，可手动调整裁剪区域
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 使用 Portal 渲染模态框到 body */}
      <AnimatePresence>
        {modalContent && ReactDOM.createPortal(modalContent, document.body)}
      </AnimatePresence>
    </>
  )
}

export default AvatarUploader 