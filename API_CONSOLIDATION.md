# API 合并总结 - Vercel Hobby 计划兼容性

## 🎯 问题解决

Vercel Hobby 计划限制最多12个 Serverless Functions，通过合并相关功能的API，现在只有**11个API文件**，完全符合限制。

## 📊 合并结果

### 最终API文件列表（11个）：

**auth 认证相关 (4个)**
- `login.js` - 保留（复杂登录逻辑）
- `register.js` - 保留（重要注册功能）  
- `forgot-password.js` - 保留（复杂邮件逻辑）
- `email-verification.js` - 🆕合并（verify-email + send-verification）
- `token-operations.js` - 🆕合并（refresh-token + reset-password）

**user 用户相关 (3个)**
- `upload-avatar.js` - 保留（复杂文件处理）
- `user-settings.js` - 🆕合并（settings + security-settings）
- `user-profile.js` - 🆕合并（profile + login-history）

**admin 管理员 (2个)**
- `users.js` - 保留（重要用户管理）
- `send-email.js` - 保留（复杂邮件模板）

**debug 调试 (1个)**
- `system-debug.js` - 🆕合并（email-status + user-settings）

## 🔧 API调用方式

合并后的API通过参数区分功能：

### 邮箱验证
```javascript
// 发送验证邮件
POST /api/auth/email-verification
{ "action": "send" }

// 验证邮箱
POST /api/auth/email-verification  
{ "action": "verify", "verificationCode": "123456" }
```

### Token操作
```javascript
// 刷新Token
POST /api/auth/token-operations
{ "action": "refresh", "refreshToken": "xxx" }

// 重置密码
POST /api/auth/token-operations
{ "action": "reset-password", "email": "xxx", "resetCode": "123456", "newPassword": "xxx" }
```

### 用户设置
```javascript
// 普通设置
GET/PUT /api/user/user-settings

// 安全设置  
GET/PUT /api/user/user-settings?type=security
```

### 用户资料
```javascript
// 用户资料
GET/PUT /api/user/user-profile

// 登录历史
GET /api/user/user-profile?type=login-history
```

## ✅ 优势

1. **Vercel兼容**：从20+减少到11个API，符合限制
2. **功能完整**：100%保留所有原有功能
3. **性能优化**：减少冷启动函数数量
4. **维护简化**：相关功能集中管理

现在项目可以在Vercel Hobby计划上正常部署！🚀 