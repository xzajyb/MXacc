import React, { createContext, useContext, useState, ReactNode } from 'react'
import Toast, { ToastType } from '../components/Toast'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showSuccess: (message: string) => void
  showWarning: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showToast = (message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newToast: ToastItem = { id, message, type }
    
    setToasts(prev => [...prev, newToast])
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const showSuccess = (message: string) => showToast(message, 'success')
  const showWarning = (message: string) => showToast(message, 'warning')
  const showError = (message: string) => showToast(message, 'error')
  const showInfo = (message: string) => showToast(message, 'info')

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showWarning,
      showError,
      showInfo
    }}>
      {children}
      
      {/* Toast容器 - 使用flex布局垂直堆叠 */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              isVisible={true}
              onClose={() => removeToast(toast.id)}
              duration={0} // 由Provider控制时间
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider 