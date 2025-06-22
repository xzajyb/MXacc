# 🔧 MXAcc API 调试指南

## ✅ 已修复的问题

1. **CORS支持**: ✅ 添加了跨域请求头
2. **测试端点**: ✅ 创建了 `/api/test` 用于调试
3. **前端警告**: ✅ 修复了autocomplete属性
4. **构建成功**: ✅ 代码已推送并重新部署

## 🧪 立即测试

### 1. 测试API是否工作
访问您的部署域名测试基础API：
```
https://your-app.vercel.app/api/test
```

**期望结果**:
```json
{
  "message": "✅ API测试成功！",
  "timestamp": "2024-06-22T...",
  "env": {
    "NODE_ENV": "production",
    "hasMongoURI": false,
    "hasJWTSecret": false
  }
}
```

### 2. 检查环境变量状态

如果测试API显示 `"hasMongoURI": false` 或 `"hasJWTSecret": false`，说明环境变量未设置。

## ⚙️ 设置环境变量

### 在Vercel Dashboard中添加：

1. **访问**: https://vercel.com/dashboard
2. **选择项目**: MXAcc
3. **进入Settings** → **Environment Variables**
4. **添加变量**:

```bash
# 必需的环境变量
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mxacc
JWT_SECRET=your-super-secure-jwt-secret-key-here
NODE_ENV=production
```

### MongoDB Atlas快速设置：

1. 访问 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 创建免费集群（M0 Sandbox）
3. **网络访问** → 添加IP → `0.0.0.0/0` (允许所有)
4. **数据库访问** → 创建用户
5. **连接** → 复制连接字符串

## 🎯 测试完整功能

环境变量设置后，测试注册API：

```bash
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "123456"
  }'
```

**成功响应**:
```json
{
  "message": "注册成功",
  "token": "eyJ...",
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

## 🚨 常见错误排查

### 404 错误
- ✅ **已修复**: CORS支持已添加
- 📍 **检查**: API路径是否正确 (`/api/auth/login`)

### 500 错误
- 📍 **检查**: MongoDB连接字符串
- 📍 **检查**: 网络访问配置
- 📍 **检查**: 数据库用户权限

### CORS 错误
- ✅ **已修复**: 所有API已添加CORS头部

## ⚡ 快速解决方案

如果仍有问题：

1. **重新部署**: 在Vercel Dashboard点击"Redeploy"
2. **查看日志**: Functions → View Function Logs
3. **测试本地**: `npm run build` 确保本地构建成功

## 🎉 成功指标

当一切正常时，您应该看到：

- ✅ `/api/test` 返回成功响应
- ✅ 前端可以成功注册用户
- ✅ 前端可以成功登录
- ✅ 控制台没有CORS错误

**您的MXAcc系统马上就能完全正常工作了！** 🚀 