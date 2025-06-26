import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { Clock, Mail, RefreshCw, CheckCircle, UserMinus, Settings, Shield, Eye, EyeOff } from 'lucide-react';

interface VerifyEmailPageProps {
  embedded?: boolean
}

interface SendInfo {
  sendCount: number;
  remainingAttempts: number;
  canSendAgainAt: string | null;
}

// 格式化时间显示（秒转换为分:秒）
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 格式化剩余等待时间
const formatRemainingTime = (seconds: number): string => {
  if (seconds <= 0) return '0秒';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds > 0 ? remainingSeconds + '秒' : ''}`;
  } else {
    return `${remainingSeconds}秒`;
  }
};

export default function VerifyEmailPage({ embedded = false }: VerifyEmailPageProps) {
  const { user, sendEmailVerification, verifyEmail, changeEmail, deleteAccount, logout } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
  const [sendInfo, setSendInfo] = useState<SendInfo | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [canSendAgain, setCanSendAgain] = useState(true);
  const [nextSendTime, setNextSendTime] = useState<Date | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // 更改邮箱相关状态
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changeEmailPassword, setChangeEmailPassword] = useState('');
  const [showChangeEmailPassword, setShowChangeEmailPassword] = useState(false);
  const [changeEmailLoading, setChangeEmailLoading] = useState(false);
  
  // 删除账号相关状态
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  
  const navigate = useNavigate();

  // 倒计时更新
  useEffect(() => {
    const timer = setInterval(() => {
      if (codeExpiresAt) {
        const now = new Date();
        const timeLeft = Math.max(0, Math.floor((codeExpiresAt.getTime() - now.getTime()) / 1000));
        setRemainingTime(timeLeft);
        
        if (timeLeft === 0) {
          setCodeExpiresAt(null);
        }
      }

      if (nextSendTime) {
        const now = new Date();
        const timeUntilCanSend = Math.max(0, Math.floor((nextSendTime.getTime() - now.getTime()) / 1000));
        
        if (timeUntilCanSend === 0) {
          setCanSendAgain(true);
          setNextSendTime(null);
        } else {
          setCanSendAgain(false);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [codeExpiresAt, nextSendTime]);

  const handleSendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await sendEmailVerification();
      if (result.success) {
        setMessage(result.message);
        
        // 设置验证码过期时间
        if ((result as any).expiresAt) {
          setCodeExpiresAt(new Date((result as any).expiresAt));
        }
        
        // 设置发送信息
        if ((result as any).sendInfo) {
          setSendInfo((result as any).sendInfo);
          if ((result as any).sendInfo.canSendAgainAt) {
            setNextSendTime(new Date((result as any).sendInfo.canSendAgainAt));
            setCanSendAgain(false);
          }
        }
        
        // 如果有验证码（开发模式），显示它
        if (result.verificationCode) {
          setMessage(`${result.message} (验证码: ${result.verificationCode})`);
        }
      } else {
        setError(result.message);
        // 处理频率限制错误
        if ((result as any).canSendAgainAt) {
          setNextSendTime(new Date((result as any).canSendAgainAt));
          setCanSendAgain(false);
        }
      }
    } catch (err: any) {
      setError(err.message || '发送验证邮件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('请输入验证码');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await verifyEmail(verificationCode);
      if (result.success) {
        setMessage(result.message);
        if (!embedded) {
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('验证失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理更改邮箱
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !changeEmailPassword.trim()) {
      setError('请填写完整的邮箱和密码信息');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('邮箱格式无效');
      return;
    }

    setChangeEmailLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await changeEmail(newEmail, changeEmailPassword);
      if (result.success) {
        setMessage(result.message);
        setShowChangeEmail(false);
        setNewEmail('');
        setChangeEmailPassword('');
        // 清空验证相关状态，因为需要重新验证新邮箱
        setVerificationCode('');
        setCodeExpiresAt(null);
        setSendInfo(null);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || '更改邮箱失败');
    } finally {
      setChangeEmailLoading(false);
    }
  };

  // 处理删除账号
  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword.trim()) {
      setError('请输入密码确认删除');
      return;
    }

    setDeleteAccountLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await deleteAccount(deleteAccountPassword);
      if (result.success) {
        setMessage(result.message);
        setShowDeleteAccount(false);
        // 账号删除成功，用户会自动注销
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || '删除账户失败');
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  if (!user) {
    if (!embedded) {
      navigate('/login');
    }
    return null;
  }

  if (user.isEmailVerified && !embedded) {
    navigate('/dashboard');
    return null;
  }

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full ${embedded ? 'max-w-2xl' : 'max-w-md'}`}
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          验证您的邮箱
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          为了确保账号安全，请验证您的邮箱地址
        </p>
      </div>

      <div className="space-y-6">
        {/* 邮箱信息 */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg mb-4">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">{user.email}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            我们将向上述邮箱发送验证码
          </p>
        </div>

        {/* 发送限制信息 */}
        {sendInfo && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <RefreshCw className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">发送状态</span>
            </div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              <p>已发送: {sendInfo.sendCount}/3 次</p>
              <p>剩余机会: {sendInfo.remainingAttempts} 次</p>
              {!canSendAgain && nextSendTime && (
                <p>下次可发送: {formatRemainingTime(Math.max(0, Math.floor((nextSendTime.getTime() - new Date().getTime()) / 1000)))}</p>
              )}
            </div>
          </div>
        )}

        {/* 验证码有效时间 */}
        {codeExpiresAt && remainingTime > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">验证码有效时间</span>
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p>剩余时间: {formatTime(remainingTime)}</p>
              <div className="mt-2 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.max(0, (remainingTime / 600) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 发送按钮 */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: canSendAgain && !loading ? 1.02 : 1 }}
            whileTap={{ scale: canSendAgain && !loading ? 0.98 : 1 }}
            onClick={handleSendVerification}
            disabled={loading || !canSendAgain}
            className="btn-primary w-full py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : !canSendAgain ? (
              nextSendTime ? (
                `请等待 ${formatRemainingTime(Math.max(0, Math.floor((nextSendTime.getTime() - new Date().getTime()) / 1000)))}`
              ) : '发送受限'
            ) : codeExpiresAt && remainingTime > 0 ? (
              '重新发送验证邮件'
            ) : (
              '发送验证邮件'
            )}
          </motion.button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              已收到验证码？
            </span>
          </div>
        </div>

        <form onSubmit={handleVerifyEmail} className="space-y-4">
          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              验证码
            </label>
            <div className="relative">
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // 只允许数字
                  setVerificationCode(value);
                }}
                placeholder="请输入6位数字验证码"
                className="input-professional w-full py-3 px-4 rounded-xl text-center tracking-widest font-mono text-lg"
                maxLength={6}
              />
              {codeExpiresAt && remainingTime > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {formatTime(remainingTime)}
                  </span>
                </div>
              )}
            </div>
            {remainingTime === 0 && codeExpiresAt && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                验证码已过期，请重新获取
              </p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !verificationCode.trim() || verificationCode.length !== 6 || (remainingTime === 0 && !!codeExpiresAt)}
            className="btn-primary w-full py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>验证邮箱</span>
              </>
            )}
          </motion.button>
        </form>

        {/* 操作结果显示 */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </motion.div>
        )}

        {/* 其他操作按钮 */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowChangeEmail(true)}
              className="flex items-center justify-center space-x-2 py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>更改绑定邮箱</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteAccount(true)}
              className="flex items-center justify-center space-x-2 py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <UserMinus className="w-4 h-4" />
              <span>删除账号</span>
            </motion.button>
          </div>

          <div className="text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>• 验证码有效期为10分钟</p>
              <p>• 每3分钟最多发送3次验证邮件</p>
              <p>• 请检查垃圾邮件文件夹</p>
            </div>
          </div>
          
          {!embedded && (
            <div className="text-center">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-200 transition-colors"
              >
                注销登录
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (embedded) {
    return (
      <div className="flex items-start justify-center">
        {content}
      </div>
    );
  }

  const confirmLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
        {content}
      </div>
      
      {/* 确认注销对话框 */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="确认注销"
        message="确定要注销登录吗？您需要验证邮箱后才能使用系统功能。"
        confirmText="注销"
        cancelText="取消"
        type="warning"
      />

      {/* 更改邮箱表单弹窗 */}
      {showChangeEmail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">更改绑定邮箱</h3>
            </div>
            
            <form onSubmit={handleChangeEmail} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  新邮箱地址
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="请输入新的邮箱地址"
                  className="input-professional w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <input
                    type={showChangeEmailPassword ? "text" : "password"}
                    value={changeEmailPassword}
                    onChange={(e) => setChangeEmailPassword(e.target.value)}
                    placeholder="请输入当前账户密码"
                    className="input-professional w-full pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowChangeEmailPassword(!showChangeEmailPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400"
                  >
                    {showChangeEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  更改邮箱后，您需要重新验证新邮箱地址才能正常使用账户功能。
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangeEmail(false);
                    setNewEmail('');
                    setChangeEmailPassword('');
                  }}
                  disabled={changeEmailLoading}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={changeEmailLoading || !newEmail.trim() || !changeEmailPassword.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {changeEmailLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>处理中...</span>
                    </>
                  ) : (
                    <span>确认更改</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 删除账号表单弹窗 */}
      {showDeleteAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">危险操作：删除账号</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h4 className="font-medium text-red-800 dark:text-red-200">警告</h4>
                </div>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li>• 此操作不可逆转</li>
                  <li>• 您的所有数据将被永久删除</li>
                  <li>• 删除后无法恢复账户信息</li>
                  <li>• 请确保您已备份重要数据</li>
                </ul>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deleteAccountPassword}
                    onChange={(e) => setDeleteAccountPassword(e.target.value)}
                    placeholder="请输入当前账户密码确认删除"
                    className="input-professional w-full pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400"
                  >
                    {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAccount(false);
                    setDeleteAccountPassword('');
                  }}
                  disabled={deleteAccountLoading}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountLoading || !deleteAccountPassword.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {deleteAccountLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>删除中...</span>
                    </>
                  ) : (
                    <span>确认删除</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}