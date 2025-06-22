# 🔧 Vercel环境变量设置指南

## 立即设置这些环境变量

### 1. MONGODB_URI
```
Name: MONGODB_URI
Value: mongodb+srv://yy222dghjbk:zBq5QCFMxgqUUyWB@cluster0.mos4iul.mongodb.net/mxacc?retryWrites=true&w=majority&appName=Cluster0
Environment: Production, Preview, Development (全选)
```

### 2. JWT_SECRET  
```
Name: JWT_SECRET
Value: UpmxehLZkNe6qTS23Bo4r4fudGT4hX3feBZnZWrvSAc=
Environment: Production, Preview, Development (全选)
```

### 3. NODE_ENV
```
Name: NODE_ENV
Value: production
Environment: Production (只选Production)
```

## 📋 设置步骤

1. **访问**: https://vercel.com/dashboard
2. **选择项目**: 找到并点击您的MXAcc项目
3. **进入设置**: 点击顶部的 "Settings" 标签
4. **环境变量**: 在左侧菜单点击 "Environment Variables"
5. **添加变量**: 点击 "Add New" 按钮
6. **填写信息**: 
   - Name: 变量名称
   - Value: 变量值
   - Environment: 选择环境 (建议全选)
7. **保存**: 点击 "Save" 按钮
8. **重复**: 为每个变量重复步骤5-7

## ✅ 验证设置

设置完成后：

1. **重新部署**: 在项目页面点击 "Redeploy" 按钮
2. **测试API**: 访问 `https://your-app.vercel.app/api/test`
3. **预期结果**:
```json
{
  "message": "MXAcc API 运行正常",
  "timestamp": "2024-01-XX...",
  "environment": "production",
  "hasMongoURI": true,
  "hasJWTSecret": true
}
```

## 🚨 常见问题

### MongoDB连接失败
- 确认Network Access设置为 0.0.0.0/0
- 检查连接字符串包含数据库名称 `/mxacc`
- 验证用户名密码正确

### API仍返回500
- 等待2-3分钟让环境变量生效
- 强制重新部署 (Redeploy)
- 检查Function Logs查看具体错误

### 环境变量不生效
- 确认选择了正确的Environment
- 重新部署应用
- 清除浏览器缓存

## 📱 快速测试命令

```bash
# 测试API连接
curl https://your-app.vercel.app/api/test

# 测试注册功能
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"123456"}'

# 测试登录功能  
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
``` 