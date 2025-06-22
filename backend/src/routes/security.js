const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  generateTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactor,
  getSecuritySettings
} = require('../controllers/securityController');

// 应用认证中间件到所有路由
router.use(authenticateToken);

// 获取安全设置
router.get('/settings', getSecuritySettings);

// 生成两步验证密钥
router.post('/2fa/generate', generateTwoFactorSecret);

// 启用两步验证
router.post('/2fa/enable', enableTwoFactor);

// 禁用两步验证
router.post('/2fa/disable', disableTwoFactor);

// 验证两步验证码
router.post('/2fa/verify', verifyTwoFactor);

module.exports = router; 