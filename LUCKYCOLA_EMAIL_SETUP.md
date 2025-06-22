# LuckyCola 邮件API配置指南

本项目使用 [LuckyCola 邮件API](https://luckycola.com.cn/tools/customMail) 提供邮件发送服务，避免了复杂的SMTP配置。

## 🎯 为什么选择 LuckyCola API？

- ✅ 无需复杂的SMTP服务器配置
- ✅ 不限发送次数的免费API
- ✅ 支持HTML格式邮件
- ✅ 稳定可靠的第三方服务
- ✅ 简单易用的RESTful API

## 📋 准备工作

### 1. 获取 ColaKey
访问 [LuckyCola官网](https://luckycola.com.cn) 获取您的专属 ColaKey

### 2. 准备邮箱授权码
根据您的邮箱类型获取应用密码/授权码：

#### QQ邮箱
1. 登录QQ邮箱 → 设置 → 账户
2. 开启"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
3. 生成授权码

#### 163邮箱
1. 登录163邮箱 → 设置 → POP3/SMTP/IMAP
2. 开启"IMAP/SMTP服务"
3. 设置客户端授权密码

#### 126邮箱
类似163邮箱设置流程

## ⚙️ Vercel环境变量配置

在Vercel项目设置中添加以下环境变量：

```bash
# LuckyCola 邮件API配置
LUCKYCOLA_API_KEY=您的ColaKey
LUCKYCOLA_SMTP_EMAIL=您的邮箱地址
LUCKYCOLA_SMTP_CODE=您的邮箱授权码/应用密码
LUCKYCOLA_SMTP_TYPE=qq  # 或 163、126
```

### 配置示例

```bash
# 示例配置（请替换为您的实际信息）
LUCKYCOLA_API_KEY=i6qNeQszeSD6zf9298ZI2YaRNIMz
LUCKYCOLA_SMTP_EMAIL=example@qq.com
LUCKYCOLA_SMTP_CODE=abcdefghijklmnop
LUCKYCOLA_SMTP_TYPE=qq
```

## 🔧 API调用格式

我们的配置会自动发送以下格式的请求：

```json
{
  "ColaKey": "您的API密钥",
  "tomail": "目标邮箱",
  "fromTitle": "MXacc 统一账号管理系统",
  "subject": "邮件主题",
  "content": "HTML邮件内容",
  "isTextContent": false,
  "smtpCode": "您的授权码",
  "smtpEmail": "您的发送邮箱",
  "smtpCodeType": "邮箱类型"
}
```

## 📧 支持的邮件类型

### 1. 邮箱验证码邮件
- 精美的HTML模板
- 验证码突出显示
- 安全提醒信息
- 10分钟有效期

### 2. 欢迎邮件
- 品牌化设计
- 功能特性介绍
- CTA按钮引导
- 专业的邮件排版

### 3. 自定义邮件
支持发送任意内容的HTML或纯文本邮件

## ⚡ 使用方法

### 发送验证码邮件
```javascript
const { sendVerificationEmail } = require('../_lib/luckycola-email')

await sendVerificationEmail('user@example.com', '123456', 'Username')
```

### 发送欢迎邮件
```javascript
const { sendWelcomeEmail } = require('../_lib/luckycola-email')

await sendWelcomeEmail('user@example.com', 'Username')
```

### 发送自定义邮件
```javascript
const { sendEmail } = require('../_lib/luckycola-email')

await sendEmail(
  'user@example.com',
  '邮件主题',
  '<h1>HTML内容</h1>',
  true // isHTML
)
```

## 🔒 安全注意事项

1. **保密信息**: 所有API密钥和授权码都存储在Vercel环境变量中
2. **版本控制**: `luckycola-email.js` 已添加到 `.gitignore`，不会提交到GitHub
3. **权限控制**: 仅服务器端可访问邮件发送功能
4. **日志安全**: 敏感信息在日志中被隐藏

## 🚀 部署流程

1. 获取ColaKey和邮箱授权码
2. 在Vercel中设置环境变量
3. 部署项目
4. 测试邮件发送功能

## 🐛 故障排除

### 常见问题

**Q: 收到"API请求失败"错误**
A: 检查ColaKey是否正确，是否已在官网获取有效密钥

**Q: 邮件发送失败**
A: 检查邮箱授权码是否正确，邮箱类型设置是否匹配

**Q: 收不到邮件**
A: 检查垃圾邮件文件夹，确认目标邮箱地址正确

**Q: 环境变量未生效**
A: 在Vercel中重新部署项目，确保环境变量正确设置

### 调试技巧

1. 查看Vercel函数日志
2. 检查环境变量是否正确设置
3. 测试API连通性
4. 验证邮箱授权码有效性

## 📚 相关文档

- [LuckyCola官网](https://luckycola.com.cn)
- [邮件API文档](https://blog.csdn.net/qq_48896417/article/details/130298611)
- [Vercel环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)

---

💡 **提示**: 此配置确保了邮件功能的稳定性和安全性，同时保持了代码的开源性。 