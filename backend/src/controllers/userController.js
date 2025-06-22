const User = require('../models/User');
const { validateProfileUpdate, validateSettingsUpdate, validatePasswordChange } = require('../utils/validation');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// 配置Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          settings: user.settings,
          role: user.role,
          emailVerified: user.security.emailVerified,
          lastLogin: user.security.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户信息失败'
    });
  }
};

// 更新用户资料
const updateProfile = async (req, res) => {
  try {
    const { error } = validateProfileUpdate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: '数据验证失败',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const { nickname, bio, location, website } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    // 更新资料
    if (nickname !== undefined) user.profile.nickname = nickname;
    if (bio !== undefined) user.profile.bio = bio;
    if (location !== undefined) user.profile.location = location;
    if (website !== undefined) user.profile.website = website;
    
    await user.save();
    
    res.json({
      status: 'success',
      message: '资料更新成功',
      data: {
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('更新资料错误:', error);
    res.status(500).json({
      status: 'error',
      message: '更新资料失败'
    });
  }
};

// 上传头像
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: '请选择头像文件'
      });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    // 上传到Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'mxacc/avatars',
      public_id: `avatar_${user._id}`,
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });
    
    // 更新用户头像
    user.profile.avatar = result.secure_url;
    await user.save();
    
    res.json({
      status: 'success',
      message: '头像上传成功',
      data: {
        avatar: result.secure_url
      }
    });
  } catch (error) {
    console.error('上传头像错误:', error);
    res.status(500).json({
      status: 'error',
      message: '头像上传失败'
    });
  }
};

// 更新用户设置
const updateSettings = async (req, res) => {
  try {
    const { error } = validateSettingsUpdate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: '数据验证失败',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const { theme, language, emailNotifications } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    // 更新设置
    if (theme !== undefined) user.settings.theme = theme;
    if (language !== undefined) user.settings.language = language;
    if (emailNotifications !== undefined) user.settings.emailNotifications = emailNotifications;
    
    await user.save();
    
    res.json({
      status: 'success',
      message: '设置更新成功',
      data: {
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('更新设置错误:', error);
    res.status(500).json({
      status: 'error',
      message: '更新设置失败'
    });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    const { error } = validatePasswordChange(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: '数据验证失败',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    // 验证当前密码
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: '当前密码不正确'
      });
    }
    
    // 检查新密码是否与当前密码相同
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        status: 'error',
        message: '新密码不能与当前密码相同'
      });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.json({
      status: 'success',
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      status: 'error',
      message: '修改密码失败'
    });
  }
};

// 获取登录历史
const getLoginHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    
    const loginHistory = user.security.loginHistory.slice(startIndex, endIndex);
    const totalCount = user.security.loginHistory.length;
    
    res.json({
      status: 'success',
      data: {
        loginHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取登录历史错误:', error);
    res.status(500).json({
      status: 'error',
      message: '获取登录历史失败'
    });
  }
};

// 删除账户
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: '请输入密码确认删除'
      });
    }
    
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: '密码不正确'
      });
    }
    
    // 删除用户（软删除，将状态设为 inactive）
    user.status = 'inactive';
    user.email = `deleted_${Date.now()}_${user.email}`;
    user.username = `deleted_${Date.now()}_${user.username}`;
    
    await user.save();
    
    res.json({
      status: 'success',
      message: '账户删除成功'
    });
  } catch (error) {
    console.error('删除账户错误:', error);
    res.status(500).json({
      status: 'error',
      message: '删除账户失败'
    });
  }
};

module.exports = {
  getCurrentUser,
  updateProfile,
  uploadAvatar,
  updateSettings,
  changePassword,
  getLoginHistory,
  deleteAccount
}; 