import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VerifyEmailPage() {
  const { user, sendEmailVerification, verifyEmail } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await sendEmailVerification();
      if (result.success) {
        setMessage(result.message);
        // 如果有验证码（开发模式），显示它
        if (result.verificationCode) {
          setMessage(`${result.message} (验证码: ${result.verificationCode})`);
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('发送验证邮件失败');
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
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('验证失败');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (user.isEmailVerified) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md"
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
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              我们将向 <span className="font-medium text-slate-900 dark:text-white">{user.email}</span> 发送验证邮件
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendVerification}
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingSpinner size="sm" /> : '发送验证邮件'}
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
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="请输入验证码"
                className="input-professional w-full py-3 px-4 rounded-xl text-center tracking-widest font-mono text-lg"
                maxLength={8}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !verificationCode.trim()}
              className="btn-primary w-full py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingSpinner size="sm" /> : '验证邮箱'}
            </motion.button>
          </form>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
            >
              <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </motion.div>
          )}

          <div className="text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              暂时跳过，稍后验证
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 