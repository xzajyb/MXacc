import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  loading?: boolean
  customContent?: React.ReactNode
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  type = 'warning',
  loading = false,
  customContent
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: 'text-red-600 dark:text-red-400',
          confirmBg: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
          confirmText: 'text-white'
        }
      case 'warning':
        return {
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700',
          confirmText: 'text-white'
        }
      case 'info':
      default:
        return {
          iconColor: 'text-blue-600 dark:text-blue-400',
          confirmBg: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
          confirmText: 'text-white'
        }
    }
  }

  const config = getTypeConfig()

  const handleConfirm = async (e?: React.FormEvent) => {
    console.log('ConfirmDialog handleConfirm 被调用', { title, loading });
    
    if (e) {
      e.preventDefault()
    }
    
    try {
      console.log('开始执行 onConfirm 回调...');
      await onConfirm()
      console.log('onConfirm 回调执行完成');
      // 只有在操作成功且没有错误时才关闭对话框
      // 让父组件决定何时关闭
    } catch (error) {
      // 错误由父组件处理，不关闭对话框
      console.error('确认操作失败:', error)
    }
  }

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
          onClick={loading ? undefined : onClose} // 加载时禁止点击关闭
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* 对话框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className={`w-6 h-6 ${config.iconColor}`} />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* 内容 */}
              <div className="p-6">
                {customContent ? (
                  <div>{customContent}</div>
                ) : (
                  message && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {message}
                </p>
                  )
                )}
              </div>
              
              {/* 按钮 */}
              <div className="flex justify-end space-x-3 p-6 bg-gray-50 dark:bg-gray-800/80">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium ${config.confirmText} ${config.confirmBg} rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
                >
                  {loading && <LoadingSpinner size="sm" />}
                  <span>{confirmText}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // 使用 React Portal 渲染到 body，确保不受父容器影响
  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(dialogContent, document.body)
}

export default ConfirmDialog 