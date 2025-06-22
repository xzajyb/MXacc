const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
const { validateRegister, validateLogin, validateEmail, validatePassword } = require('../utils/validation');

// 用户注册
const register = async (req, res) => {
  try {
    const { error } = validateRegister(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: '数据验证失败',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const { username, email, password } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用'
      });
    }
    
    // 生成邮箱验证令牌
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    
    // 创建用户
    const user = new User({
      username,
      email,
      password,
      profile: {
        nickname: username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      },
      security: {
        emailVerificationToken,
        emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24小时
      }
    });
    
    await user.save();
    
    // 发送验证邮件
    try {
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${emailVerificationToken}`;
      await sendEmail({
        to: email,
        subject: '验证您的梦锡账号邮箱',
        template: 'emailVerification',
        data: {
          username,
          verificationUrl
        }
      });
    } catch (emailError) {
      console.error('发送验证邮件失败:', emailError);
    }
    
    res.status(201).json({
      status: 'success',
      message: '注册成功，请检查邮箱并验证账号',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      status: 'error',
      message: '注册失败，请稍后重试'
    });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: '数据验证失败',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const { emailOrUsername, password, rememberMe } = req.body;
    
    // 查找用户（支持邮箱或用户名登录）
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '用户名或密码错误'
      });
    }
    
    // 检查账户是否被锁定
    if (user.isLocked) {
      return res.status(423).json({
        status: 'error',
        message: '账户已被暂时锁定，请稍后再试'
      });
    }
    
    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      return res.status(401).json({
        status: 'error',
        message: '用户名或密码错误'
      });
    }
    
    // 检查账户状态
    if (user.status !== 'active') {
      return res.status(403).json({
        status: 'error',
        message: '账户已被禁用'
      });
    }
    
    // 重置登录尝试次数
    if (user.security.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }
    
    // 记录登录历史
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await user.recordLogin(ip, userAgent, ''); // TODO: 添加地理位置
    
    // 生成令牌
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    // 设置令牌过期时间
    const accessTokenExpire = rememberMe ? '30d' : '7d';
    const refreshTokenExpire = rememberMe ? '90d' : '30d';
    
    res.json({
      status: 'success',
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          settings: user.settings,
          role: user.role,
          emailVerified: user.security.emailVerified
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: accessTokenExpire
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      status: 'error',
      message: '登录失败，请稍后重试'
    });
  }
};

// 刷新令牌
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: '刷新令牌缺失'
      });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: '无效的刷新令牌'
      });
    }
    
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();
    
    res.json({
      status: 'success',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: '刷新令牌已过期'
      });
    }
    
    console.error('刷新令牌错误:', error);
    res.status(500).json({
      status: 'error',
      message: '刷新令牌失败'
    });
  }
};

// 邮箱验证
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: '验证令牌缺失'
      });
    }
    
    const user = await User.findOne({
      'security.emailVerificationToken': token,
      'security.emailVerificationExpires': { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: '验证令牌无效或已过期'
      });
    }
    
    user.security.emailVerified = true;
    user.security.emailVerificationToken = undefined;
    user.security.emailVerificationExpires = undefined;
    
    await user.save();
    
    res.json({
      status: 'success',
      message: '邮箱验证成功'
    });
  } catch (error) {
    console.error('邮箱验证错误:', error);
    res.status(500).json({
      status: 'error',
      message: '邮箱验证失败'
    });
  }
};

// 重发验证邮件
const resendVerification = async (req, res) => {
  try {
    const { error } = validateEmail(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: '邮箱格式不正确'
      });
    }
    
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    if (user.security.emailVerified) {
      return res.status(400).json({
        status: 'error',
        message: '邮箱已经验证过了'
      });
    }
    
    // 生成新的验证令牌
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.security.emailVerificationToken = emailVerificationToken;
    user.security.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    
    await user.save();
    
    // 发送验证邮件
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${emailVerificationToken}`;
    await sendEmail({
      to: email,
      subject: '验证您的梦锡账号邮箱',
      template: 'emailVerification',
      data: {
        username: user.username,
        verificationUrl
      }
    });
    
    res.json({
      status: 'success',
      message: '验证邮件已重新发送'
    });
  } catch (error) {
    console.error('重发验证邮件错误:', error);
    res.status(500).json({
      status: 'error',
      message: '重发验证邮件失败'
    });
  }
};

// 忘记密码
const forgotPassword = async (req, res) => {
  try {
    const { error } = validateEmail(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: '邮箱格式不正确'
      });
    }
    
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      // 为了安全，即使用户不存在也返回成功消息
      return res.json({
        status: 'success',
        message: '如果该邮箱存在，重置链接已发送'
      });
    }
    
    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.security.passwordResetToken = resetToken;
    user.security.passwordResetExpires = Date.now() + 1 * 60 * 60 * 1000; // 1小时
    
    await user.save();
    
    // 发送重置邮件
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: '重置您的梦锡账号密码',
      template: 'passwordReset',
      data: {
        username: user.username,
        resetUrl
      }
    });
    
    res.json({
      status: 'success',
      message: '如果该邮箱存在，重置链接已发送'
    });
  } catch (error) {
    console.error('忘记密码错误:', error);
    res.status(500).json({
      status: 'error',
      message: '发送重置邮件失败'
    });
  }
};

// 重置密码
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const { error } = validatePassword({ password });
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: '密码格式不正确',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const user = await User.findOne({
      'security.passwordResetToken': token,
      'security.passwordResetExpires': { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: '重置令牌无效或已过期'
      });
    }
    
    user.password = password;
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;
    
    await user.save();
    
    res.json({
      status: 'success',
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      status: 'error',
      message: '重置密码失败'
    });
  }
};

// 登出（可选，主要在前端清除令牌）
const logout = async (req, res) => {
  res.json({
    status: 'success',
    message: '登出成功'
  });
};

module.exports = {
  register,
  login,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  logout
}; 