# MXacc 邮件服务配置指南

本指南将帮助您在Vercel中配置MXacc的邮件发送功能。

## 🔒 安全注意事项

**重要：** 邮件配置包含敏感信息，已被添加到`.gitignore`中，不会被提交到GitHub。
所有邮件相关的配置都通过Vercel环境变量进行管理。

## 📧 支持的邮件服务商

推荐使用以下邮件服务商：

### 1. Gmail（推荐）
- 免费且稳定
- 需要开启"两步验证"并生成"应用专用密码"
- 设置简单

### 2. 腾讯企业邮箱
- 专业邮箱服务
- 支持自定义域名

### 3. 阿里云邮件推送
- 专业的邮件发送服务
- 高送达率

## ⚙️ Vercel环境变量配置

在Vercel项目的 **Settings** → **Environment Variables** 中添加以下变量：

### 必需变量

```bash
# SMTP服务器配置
SMTP_HOST=smtp.gmail.com              # Gmail: smtp.gmail.com | 腾讯: smtp.exmail.qq.com
SMTP_PORT=587                         # 587 for TLS | 465 for SSL
SMTP_SECURE=false                     # false for port 587 | true for port 465

# 发送邮箱认证信息
SMTP_USER=your-email@gmail.com        # 您的邮箱地址
SMTP_PASS=your-app-password           # 邮箱密码或应用专用密码

# 可选配置
LOGO_URL=https://your-domain.com/logo.png  # 邮件中显示的Logo URL
```

### Gmail配置示例

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcd efgh ijkl mnop         # 16位应用专用密码
```

## 🔑 Gmail应用专用密码设置

1. **开启两步验证**
   - 访问 [Google账号安全设置](https://myaccount.google.com/security)
   - 开启"两步验证"

2. **生成应用专用密码**
   - 在"两步验证"设置中
   - 点击"应用专用密码"
   - 选择"邮件"和"Windows计算机"
   - 生成16位密码，如：`abcd efgh ijkl mnop`

3. **使用应用专用密码**
   - 将生成的16位密码作为`SMTP_PASS`的值
   - 注意：不是您的Gmail登录密码

## 🧪 测试邮件配置

配置完成后，您可以通过以下方式测试：

1. **注册新用户** - 系统会自动发送验证邮件
2. **重新发送验证邮件** - 在验证页面点击"发送验证邮件"

## 📋 其他邮件服务商配置

### 腾讯企业邮箱
```bash
SMTP_HOST=smtp.exmail.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@your-domain.com
SMTP_PASS=your-email-password
```

### QQ邮箱
```bash
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@qq.com
SMTP_PASS=your-authorization-code    # 授权码，不是QQ密码
```

### Outlook/Hotmail（当前配置）
```bash

```

**重要：请将以上配置添加到Vercel环境变量中！**

## 🚨 故障排除

### 常见问题

1. **"SMTP配置不完整"错误**
   - 检查Vercel环境变量是否正确设置
   - 确保`SMTP_USER`和`SMTP_PASS`都已配置

2. **"邮件发送失败"错误**
   - 检查邮箱密码是否正确
   - Gmail需要使用应用专用密码，不是登录密码
   - 检查SMTP主机和端口配置

3. **收不到邮件**
   - 检查垃圾邮件文件夹
   - 确认邮箱地址拼写正确
   - 尝试重新发送验证邮件

### 调试模式

在开发环境中，如果邮件发送失败，系统会在控制台显示验证码供测试使用。

## 🔐 安全建议

1. **定期更换密码** - 建议每3-6个月更换一次应用专用密码
2. **监控邮件发送** - 定期检查邮件发送日志
3. **限制IP访问** - 如果可能，限制SMTP访问的IP地址范围

## 📞 技术支持

如果您在配置过程中遇到问题，请：

1. 检查本指南的故障排除部分
2. 查看Vercel项目的Function Logs
3. 联系技术支持团队

---

**⚠️ 重要提醒：请勿将邮件配置信息提交到Git仓库！** 