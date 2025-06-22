const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const {
  getCurrentUser,
  updateProfile,
  uploadAvatar,
  updateSettings,
  changePassword,
  getLoginHistory,
  deleteAccount
} = require('../controllers/userController');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 应用认证中间件到所有路由
router.use(authenticateToken);

// 获取当前用户信息
router.get('/me', getCurrentUser);

// 更新用户资料
router.put('/profile', updateProfile);

// 上传头像
router.post('/avatar', upload.single('avatar'), uploadAvatar);

// 更新用户设置
router.put('/settings', updateSettings);

// 修改密码
router.put('/password', changePassword);

// 获取登录历史
router.get('/login-history', getLoginHistory);

// 删除账户
router.delete('/account', deleteAccount);

module.exports = router; 