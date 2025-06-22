# 邮件安全配置文档

## 📧 邮件发送安全措施

### 🔒 已实施的安全措施

#### 1. **邮件发送API统一管理**
- ✅ 关闭了调试API (`api/debug/email-status.js`) 的测试邮件发送功能
- ✅ 关闭了backend服务器的所有邮件发送功能
- ✅ 仅保留前端API (`api/auth/send-verification.js`) 作为唯一邮件发送入口

#### 2. **严格的用户验证**
- ✅ **只有未认证邮箱的用户才能发送验证邮件**
- ✅ 已认证用户返回 `403 ALREADY_VERIFIED` 错误
- ✅ 禁用账户无法发送邮件 (`403 ACCOUNT_DISABLED`)
- ✅ 必须提供有效的JWT Token才能访问API

#### 3. **发送频率限制**
- ✅ **3分钟内最多发送3次**验证邮件
- ✅ **每次发送间隔30秒**防止频繁点击
- ✅ 超过限制返回 `429 RATE_LIMIT_EXCEEDED`
- ✅ 发送过于频繁返回 `429 TOO_FREQUENT`

#### 4. **用户隔离性**
- ✅ 每个用户有独立的 `emailSendInfo` 记录
- ✅ 通过JWT Token识别用户，确保用户间隔离
- ✅ 用户A的操作不会影响用户B的发送限制

#### 5. **安全错误处理**
- ✅ 邮件发送失败时**不泄露验证码**
- ✅ 发送失败时回滚计数器
- ✅ 返回通用错误信息，不暴露内部逻辑
- ✅ 开发环境才显示详细错误信息

### 🚫 已关闭的API端点

#### Backend服务器邮件功能 (已关闭)
```bash
POST /api/auth/resend-verification   # 返回 403 API_DISABLED
POST /api/auth/forgot-password       # 返回 403 API_DISABLED  
POST /api/auth/register              # 不再自动发送邮件
```

#### 调试API (已关闭测试功能)
```bash
GET /api/debug/email-status?sendTest=true  # 返回错误信息，不发送邮件
```

### ✅ 唯一有效的邮件发送API

```bash
POST /api/auth/send-verification
Authorization: Bearer <JWT_TOKEN>
```

**严格限制条件：**
1. 用户邮箱必须未验证 (`isEmailVerified: false`)
2. 用户账户必须未被禁用 (`isDisabled: false`)
3. 3分钟内发送次数 < 3次
4. 距离上次发送 >= 30秒
5. 必须提供有效JWT Token

### 🛡️ 安全返回状态码

| 状态码 | 错误代码 | 说明 |
|--------|----------|------|
| `403` | `ALREADY_VERIFIED` | 邮箱已验证，无需重复发送 |
| `403` | `ACCOUNT_DISABLED` | 账户已禁用 |
| `403` | `API_DISABLED` | API已关闭 (Backend) |
| `429` | `RATE_LIMIT_EXCEEDED` | 发送次数达到上限 |
| `429` | `TOO_FREQUENT` | 发送过于频繁 |
| `500` | `EMAIL_SEND_FAILED` | 邮件发送失败 |

### 📊 发送限制详情

```javascript
// 每个用户的发送信息
emailSendInfo: {
  sendCount: 0,           // 当前周期发送次数
  firstSendTime: null,    // 首次发送时间  
  lastSendTime: null      // 最后发送时间
}

// 限制规则
MAX_SENDS_PER_PERIOD: 3        // 3分钟内最多3次
RESET_PERIOD: 3 * 60 * 1000    // 3分钟重置周期
MIN_INTERVAL: 30 * 1000        // 最小发送间隔30秒
CODE_EXPIRE: 10 * 60 * 1000    // 验证码10分钟过期
```

### 🔐 邮件服务配置

使用LuckyCola第三方邮件API，敏感信息存储在Vercel环境变量：

```bash
LUCKYCOLA_API_KEY=ColaKey          # API密钥
LUCKYCOLA_SMTP_EMAIL=邮箱地址      # 发送邮箱
LUCKYCOLA_SMTP_CODE=应用密码       # 邮箱密码
LUCKYCOLA_SMTP_TYPE=qq/163/126     # 邮箱类型
```

**安全保证：**
- ✅ 邮件在Vercel服务器端发送
- ✅ 用户端无法访问敏感信息
- ✅ 前后端完全分离，安全隔离

### 📝 使用建议

1. **用户注册后**，引导用户到验证页面发送验证邮件
2. **发送失败时**，用户可以重试（受限制保护）
3. **超过限制时**，提示用户等待时间
4. **生产环境**确保关闭不必要的调试API

---

## ⚠️ 重要提醒

- 此配置确保了邮件发送的安全性和可控性
- 所有邮件发送都经过严格验证和限制
- 建议定期检查和更新安全策略
- 监控邮件发送日志，防止滥用

**配置完成时间：** 2024年12月19日  
**生效范围：** 整个MXacc系统 