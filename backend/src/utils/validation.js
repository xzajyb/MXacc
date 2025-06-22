const Joi = require('joi');

// 用户注册验证
const validateRegister = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .required()
      .messages({
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名至少3个字符',
        'string.max': '用户名不能超过20个字符',
        'any.required': '用户名不能为空'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱不能为空'
      }),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': '密码至少8个字符',
        'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
        'any.required': '密码不能为空'
      })
  });
  
  return schema.validate(data);
};

// 用户登录验证
const validateLogin = (data) => {
  const schema = Joi.object({
    emailOrUsername: Joi.string()
      .required()
      .messages({
        'any.required': '邮箱或用户名不能为空'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': '密码不能为空'
      }),
    rememberMe: Joi.boolean()
  });
  
  return schema.validate(data);
};

// 邮箱验证
const validateEmail = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱不能为空'
      })
  });
  
  return schema.validate(data);
};

// 密码验证
const validatePassword = (data) => {
  const schema = Joi.object({
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': '密码至少8个字符',
        'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
        'any.required': '密码不能为空'
      })
  });
  
  return schema.validate(data);
};

// 用户资料更新验证
const validateProfileUpdate = (data) => {
  const schema = Joi.object({
    nickname: Joi.string()
      .max(30)
      .messages({
        'string.max': '昵称不能超过30个字符'
      }),
    bio: Joi.string()
      .max(200)
      .messages({
        'string.max': '个人简介不能超过200个字符'
      }),
    location: Joi.string()
      .max(50)
      .messages({
        'string.max': '地址不能超过50个字符'
      }),
    website: Joi.string()
      .uri()
      .max(100)
      .messages({
        'string.uri': '请输入有效的网站链接',
        'string.max': '网站链接不能超过100个字符'
      })
  });
  
  return schema.validate(data);
};

// 设置更新验证
const validateSettingsUpdate = (data) => {
  const schema = Joi.object({
    theme: Joi.string()
      .valid('light', 'dark', 'auto')
      .messages({
        'any.only': '主题只能是 light、dark 或 auto'
      }),
    language: Joi.string()
      .valid('zh-CN', 'en-US')
      .messages({
        'any.only': '语言只能是 zh-CN 或 en-US'
      }),
    emailNotifications: Joi.boolean()
  });
  
  return schema.validate(data);
};

// 修改密码验证
const validatePasswordChange = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': '当前密码不能为空'
      }),
    newPassword: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': '新密码至少8个字符',
        'string.pattern.base': '新密码必须包含大小写字母、数字和特殊字符',
        'any.required': '新密码不能为空'
      })
  });
  
  return schema.validate(data);
};

module.exports = {
  validateRegister,
  validateLogin,
  validateEmail,
  validatePassword,
  validateProfileUpdate,
  validateSettingsUpdate,
  validatePasswordChange
}; 