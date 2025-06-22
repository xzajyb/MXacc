import { Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import SecurityPage from './pages/SecurityPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import AdminUsersManagement from './components/AdminUsersManagement'
import AdminEmailManagement from './components/AdminEmailManagement'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <div className="text-xl font-semibold text-slate-900 dark:text-white">
            梦锡工作室
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            MXAcc 账号管理系统
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AnimatePresence mode="wait">
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ForgotPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          
          {/* 受保护的路由 - 使用统一布局 */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/security" element={
            <ProtectedRoute>
              <DashboardLayout>
                <SecurityPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          {/* 管理员路由 - 集成到主布局 */}
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <DashboardLayout>
                <AdminUsersManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/email" element={
            <ProtectedRoute>
              <DashboardLayout>
                <AdminEmailManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/system" element={
            <ProtectedRoute>
              <DashboardLayout>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">系统管理</h2>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-600 dark:text-slate-400">系统管理功能正在开发中...</p>
                  </div>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          {/* 管理员重定向 */}
          <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
          
          {/* 重定向 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App