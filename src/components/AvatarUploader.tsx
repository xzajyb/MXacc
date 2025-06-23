import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, X, Check, RotateCw, ZoomIn, ZoomOut, Trash2, User } from 'lucide-react'
import AvatarEditor from 'react-avatar-editor'

interface AvatarUploaderProps {
  currentAvatar?: string
  onUpload: (file: Blob, preview: string) => Promise<void>
  onRemove?: () => Promise<void>
  username?: string
  loading?: boolean
  className?: string
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentAvatar,
  onUpload,
  onRemove,
  username = 'U',
  loading = false,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | File | null>(null)
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 })
  const [removeLoading, setRemoveLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<AvatarEditor>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    // 检查文件类型 - 支持SVG和透明背景
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'image/svg+xml'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      alert('请选择支持的图片格式：JPG、PNG、GIF、WebP、SVG')
      return
    }

    // 检查文件大小 (最大10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB')
      return
    }

    setSelectedImage(file)
    setScale(1)
    setRotate(0)
    setPosition({ x: 0.5, y: 0.5 })
    setIsModalOpen(true)
  }

  const handlePositionChange = (position: { x: number, y: number }) => {
    setPosition(position)
  }

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value)
    setScale(newScale)
  }

  const handleRotateLeft = () => {
    setRotate(prev => prev - 90)
  }

  const handleRotateRight = () => {
    setRotate(prev => prev + 90)
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5))
  }

  const handleConfirmUpload = async () => {
    if (!editorRef.current || !selectedImage) return

    try {
      // 获取裁切后的canvas
      const canvas = editorRef.current.getImageScaledToCanvas()
      
      // 创建一个新的canvas来处理透明背景
      const outputCanvas = document.createElement('canvas')
      const outputCtx = outputCanvas.getContext('2d')
      
      if (outputCtx) {
        outputCanvas.width = 200
        outputCanvas.height = 200
        
        // 不填充背景，保持透明
        // outputCtx.fillStyle = 'transparent' // 保持透明背景
        
        // 绘制圆形裁切
        outputCtx.save()
        outputCtx.beginPath()
        outputCtx.arc(100, 100, 100, 0, Math.PI * 2)
        outputCtx.clip()
        
        // 绘制图片
        outputCtx.drawImage(canvas, 0, 0, 200, 200)
        outputCtx.restore()
        
        // 转换为blob，使用PNG格式保持透明度
        outputCanvas.toBlob(async (blob: Blob | null) => {
          if (blob) {
            // 生成预览URL，使用PNG格式保持透明度
            const previewUrl = outputCanvas.toDataURL('image/png')
            
            try {
              await onUpload(blob, previewUrl)
              setIsModalOpen(false)
              setSelectedImage(null)
            } catch (error) {
              console.error('上传失败:', error)
            }
          }
        }, 'image/png') // 使用PNG格式保持透明度
      }
    } catch (error) {
      console.error('处理图片失败:', error)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!onRemove) return
    
    if (confirm('确定要删除当前头像吗？删除后将显示默认头像。')) {
      setRemoveLoading(true)
      try {
        await onRemove()
      } catch (error) {
        console.error('删除头像失败:', error)
        alert('删除头像失败，请重试')
      } finally {
        setRemoveLoading(false)
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

  // 生成默认头像
  const renderDefaultAvatar = () => {
    const firstChar = username.charAt(0).toUpperCase()
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
        <span className="text-white font-bold text-4xl">
          {firstChar}
        </span>
      </div>
    )
  }

  // Modal 内容
  const modalContent = (
    <AnimatePresence>
      {isModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                编辑头像
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* 头像编辑器 */}
              <div className="flex justify-center">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <AvatarEditor
                    ref={editorRef}
                    image={selectedImage}
                    width={200}
                    height={200}
                    border={20}
                    color={[255, 255, 255, 0.8]} // 白色半透明蒙版，更清晰地显示透明区域
                    scale={scale}
                    rotate={rotate}
                    position={position}
                    onPositionChange={handlePositionChange}
                    borderRadius={100} // 圆形裁切
                    crossOrigin="anonymous"
                  />
                </div>
              </div>

              {/* 控制面板 */}
              <div className="space-y-4">
                {/* 缩放控制 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      缩放: {Math.round(scale * 100)}%
                    </label>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleZoomOut}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        title="缩小"
                      >
                        <ZoomOut size={16} />
                      </button>
                      <button
                        onClick={handleZoomIn}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        title="放大"
                      >
                        <ZoomIn size={16} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={scale}
                    onChange={handleScaleChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                  />
                </div>

                {/* 旋转控制 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    旋转: {rotate}°
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleRotateLeft}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <RotateCw size={16} className="transform rotate-180" />
                      <span>左转</span>
                    </button>
                    <button
                      onClick={handleRotateRight}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <RotateCw size={16} />
                      <span>右转</span>
                    </button>
                  </div>
                </div>

                {/* 使用说明 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 拖拽图片调整位置，使用滑块调整大小，点击按钮旋转图片。透明背景将被保留。
                  </p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
  )

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
              style={{ backgroundColor: 'transparent' }} // 确保透明背景不被覆盖
            />
          ) : (
            renderDefaultAvatar()
          )}
          
          {/* 悬停遮罩 */}
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {loading || removeLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <Camera size={24} className="text-white" />
            )}
          </div>
        </div>

        {/* 操作按钮组 */}
        <div className="mt-3 flex flex-col space-y-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || removeLoading}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
          >
            <Upload size={14} />
            <span>{loading ? '上传中...' : currentAvatar ? '更换头像' : '上传头像'}</span>
          </button>
          
          {/* 删除头像按钮 - 只有当前有头像时才显示 */}
          {currentAvatar && onRemove && (
            <button
              onClick={handleRemoveAvatar}
              disabled={loading || removeLoading}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
            >
              <Trash2 size={14} />
              <span>{removeLoading ? '删除中...' : '删除头像'}</span>
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-[160px]">
          支持拖拽上传，JPG、PNG、GIF、WebP、SVG 格式，保留透明背景
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 使用 React Portal 渲染模态框到 body，确保蒙版覆盖整个页面 */}
      {typeof document !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  )
}

export default AvatarUploader 