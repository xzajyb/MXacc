# Vercel 环境变量配置指南

## 📧 邮件服务配置

请在 Vercel 项目的 **Settings** → **Environment Variables** 中添加以下变量：

### 必需的环境变量

```bash
# SMTP服务器配置（Outlook）
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false

# 邮箱认证信息
SMTP_USER=qrfuci164227@outlook.com
SMTP_PASS=tdrhcke6603

# 可选配置
LOGO_URL=https://your-domain.vercel.app/logo.svg
```

## 🔧 配置步骤

1. **登录 Vercel 控制台**
   - 访问 https://vercel.com/dashboard
   - 选择您的 MXacc 项目

2. **进入设置页面**
   - 点击项目名称进入项目详情
   - 点击顶部的 "Settings" 标签

3. **添加环境变量**
   - 在左侧菜单中选择 "Environment Variables"
   - 点击 "Add New" 按钮
   - 逐个添加上述所有变量

4. **重新部署**
   - 配置完成后，在 "Deployments" 页面
   - 点击最新部署旁的三个点菜单
   - 选择 "Redeploy" 重新部署

## ✅ 验证配置

配置完成后，您可以通过以下方式验证：

1. **注册新用户** - 系统会自动发送验证邮件到指定邮箱
2. **查看部署日志** - 在 Vercel 的 Functions 标签下查看邮件发送日志
3. **测试邮箱验证** - 在验证页面点击"发送验证邮件"

## 🚨 注意事项

- **安全性**：这些配置信息不会被提交到 GitHub 仓库
- **环境隔离**：建议为 Production 和 Preview 环境设置相同的变量
- **邮箱限制**：Outlook 邮箱可能有发送频率限制，请合理使用

## 📞 故障排除

如果邮件发送失败，请检查：

1. ✅ 环境变量是否正确设置
2. ✅ Outlook 邮箱密码是否正确
3. ✅ 是否已重新部署项目
4. ✅ 检查 Vercel Functions 日志中的错误信息

---

配置完成后，MXacc 系统将能够正常发送邮箱验证邮件！ 