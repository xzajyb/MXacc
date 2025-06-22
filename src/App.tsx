import { Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import VerifyEmailPage from '@/pages/VerifyEmailPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ProfilePage from '@/pages/ProfilePage'
import SettingsPage from '@/pages/SettingsPage'
import SecurityPage from '@/pages/SecurityPage'
import LoadingSpinner from '@/components/LoadingSpinner'
import ProtectedRoute from '@/components/ProtectedRoute'

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <div className="text-xl font-semibold gradient-mx-text">
            梦锡工作室
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            MXAcc 账号管理系统
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* 受保护的路由 */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/security" element={
            <ProtectedRoute>
              <SecurityPage />
            </ProtectedRoute>
          } />
          
          {/* 重定向 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App 