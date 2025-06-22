const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/authController');

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

// 刷新令牌
router.post('/refresh-token', refreshToken);

// 邮箱验证
router.post('/verify-email', verifyEmail);

// 重发验证邮件
router.post('/resend-verification', resendVerification);

// 忘记密码
router.post('/forgot-password', forgotPassword);

// 重置密码
router.post('/reset-password', resetPassword);

// 登出
router.post('/logout', logout);

module.exports = router; 