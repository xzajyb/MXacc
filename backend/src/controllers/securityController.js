const User = require('../models/User');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// 生成两步验证密钥
const generateTwoFactorSecret = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    if (user.settings.twoFactorEnabled) {
      return res.status(400).json({
        status: 'error',
        message: '两步验证已启用'
      });
    }
    
    // 生成密钥
    const secret = speakeasy.generateSecret({
      name: `MXAcc (${user.email})`,
      issuer: '梦锡工作室',
      length: 32
    });
    
    // 暂存密钥（未启用）
    user.security.twoFactorSecret = secret.base32;
    await user.save();
    
    // 生成二维码
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    res.json({
      status: 'success',
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntry: secret.otpauth_url
      }
    });
  } catch (error) {
    console.error('生成两步验证密钥错误:', error);
    res.status(500).json({
      status: 'error',
      message: '生成两步验证密钥失败'
    });
  }
};

// 启用两步验证
const enableTwoFactor = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: '验证码不能为空'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    if (user.settings.twoFactorEnabled) {
      return res.status(400).json({
        status: 'error',
        message: '两步验证已启用'
      });
    }
    
    if (!user.security.twoFactorSecret) {
      return res.status(400).json({
        status: 'error',
        message: '请先生成两步验证密钥'
      });
    }
    
    // 验证令牌
    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // 允许时间差2个周期（60秒）
    });
    
    if (!verified) {
      return res.status(400).json({
        status: 'error',
        message: '验证码不正确'
      });
    }
    
    // 启用两步验证
    user.settings.twoFactorEnabled = true;
    await user.save();
    
    res.json({
      status: 'success',
      message: '两步验证启用成功'
    });
  } catch (error) {
    console.error('启用两步验证错误:', error);
    res.status(500).json({
      status: 'error',
      message: '启用两步验证失败'
    });
  }
};

// 禁用两步验证
const disableTwoFactor = async (req, res) => {
  try {
    const { password, token } = req.body;
    
    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: '请输入密码'
      });
    }
    
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    if (!user.settings.twoFactorEnabled) {
      return res.status(400).json({
        status: 'error',
        message: '两步验证未启用'
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
    
    // 如果提供了验证码，也需要验证
    if (token) {
      const verified = speakeasy.totp.verify({
        secret: user.security.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });
      
      if (!verified) {
        return res.status(400).json({
          status: 'error',
          message: '验证码不正确'
        });
      }
    }
    
    // 禁用两步验证
    user.settings.twoFactorEnabled = false;
    user.security.twoFactorSecret = undefined;
    await user.save();
    
    res.json({
      status: 'success',
      message: '两步验证禁用成功'
    });
  } catch (error) {
    console.error('禁用两步验证错误:', error);
    res.status(500).json({
      status: 'error',
      message: '禁用两步验证失败'
    });
  }
};

// 验证两步验证码
const verifyTwoFactor = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: '验证码不能为空'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    if (!user.settings.twoFactorEnabled || !user.security.twoFactorSecret) {
      return res.status(400).json({
        status: 'error',
        message: '两步验证未启用'
      });
    }
    
    // 验证令牌
    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });
    
    if (!verified) {
      return res.status(400).json({
        status: 'error',
        message: '验证码不正确'
      });
    }
    
    res.json({
      status: 'success',
      message: '验证成功'
    });
  } catch (error) {
    console.error('验证两步验证码错误:', error);
    res.status(500).json({
      status: 'error',
      message: '验证失败'
    });
  }
};

// 获取安全设置
const getSecuritySettings = async (req, res) => {
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
        twoFactorEnabled: user.settings.twoFactorEnabled,
        emailVerified: user.security.emailVerified,
        lastLogin: user.security.lastLogin,
        loginAttempts: user.security.loginAttempts,
        isLocked: user.isLocked
      }
    });
  } catch (error) {
    console.error('获取安全设置错误:', error);
    res.status(500).json({
      status: 'error',
      message: '获取安全设置失败'
    });
  }
};

module.exports = {
  generateTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactor,
  getSecuritySettings
}; 