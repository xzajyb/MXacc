# 🔐 MXAcc 安全指南

## ✅ 安全状态检查

### 当前安全措施 (已实施)
- [x] **环境变量分离**: 敏感信息存储在Vercel Dashboard
- [x] **完整的.gitignore**: 保护所有敏感文件类型
- [x] **密码加密**: 使用bcrypt哈希存储
- [x] **JWT认证**: 安全的token机制
- [x] **CORS配置**: 防止跨域攻击
- [x] **输入验证**: API参数验证和清理

### 环境变量安全
```
✅ 存储位置: Vercel Dashboard → Settings → Environment Variables
✅ 访问方式: process.env.VARIABLE_NAME
✅ 版本控制: 不会提交到Git
✅ 传输加密: HTTPS加密传输
```

## 🚨 绝对不能做的事

### ❌ 永远不要提交到Git
```bash
# 这些文件绝对不能提交
.env
.env.local
.env.production
config.js (包含密钥的)
database-config.js
api-keys.js
secrets.json
```

### ❌ 永远不要硬编码
```javascript
// ❌ 错误示例 - 不要这样做！
const MONGODB_URI = "mongodb+srv://user:pass@cluster.mongodb.net/db"
const JWT_SECRET = "my-secret-key"
const API_KEY = "sk-1234567890"

// ✅ 正确示例
const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET
const API_KEY = process.env.API_KEY
```

### ❌ 永远不要在前端暴露
```javascript
// ❌ 错误：前端代码中暴露后端密钥
const config = {
  jwtSecret: "secret-key",  // 危险！
  dbUrl: "mongodb://..."    // 危险！
}

// ✅ 正确：前端只包含公开信息
const config = {
  apiUrl: "https://your-app.vercel.app/api",
  appName: "MXAcc"
}
```

## 🔒 安全检查清单

### 开发阶段
- [ ] 创建.env.local文件 (仅用于本地开发)
- [ ] 确认.gitignore包含所有敏感文件模式
- [ ] 使用强密码生成器创建JWT_SECRET
- [ ] MongoDB Atlas设置IP白名单

### 部署阶段  
- [ ] 在Vercel Dashboard设置环境变量
- [ ] 删除任何本地.env文件
- [ ] 确认API端点使用HTTPS
- [ ] 测试认证流程

### 运维阶段
- [ ] 定期轮换JWT_SECRET
- [ ] 监控异常登录活动
- [ ] 定期检查依赖包安全更新
- [ ] 备份数据库

## 🛡️ 密钥管理最佳实践

### JWT_SECRET
```bash
# 生成强密钥 (32字节)
openssl rand -base64 32

# 或使用Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### MongoDB连接字符串
```
格式: mongodb+srv://username:password@cluster.mongodb.net/database
安全: 使用强密码，启用IP白名单
```

### 环境变量命名规范
```
MONGODB_URI     # 数据库连接
JWT_SECRET      # JWT密钥  
NODE_ENV        # 运行环境
MAIL_*          # 邮件服务配置
```

## 🚨 安全事件响应

### 如果密钥泄露
1. **立即行动**:
   - 在Vercel Dashboard更换所有密钥
   - 重新部署应用
   - 撤销所有用户token (强制重新登录)

2. **检查影响**:
   - 查看访问日志
   - 检查异常活动
   - 通知受影响用户

3. **预防措施**:
   - 审查代码提交历史
   - 加强访问控制
   - 增加监控告警

## 📋 定期安全审查

### 每月检查
- [ ] 依赖包安全更新
- [ ] 访问日志审查
- [ ] 环境变量轮换
- [ ] 备份完整性验证

### 每季度检查  
- [ ] 安全漏洞扫描
- [ ] 权限访问审查
- [ ] 灾难恢复测试
- [ ] 安全培训更新

## 🔗 相关资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
- [Vercel Security](https://vercel.com/docs/security)

---

**记住**: 安全是一个持续的过程，不是一次性的任务！ 