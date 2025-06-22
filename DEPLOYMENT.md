# 🚀 MXAcc Vercel部署指南

## 📋 部署前准备

### 1. 安装依赖
```bash
# 安装根目录API依赖
npm install

# 安装前端依赖
cd frontend && npm install
```

### 2. 设置云数据库 (MongoDB Atlas)

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建免费账户并新建集群
3. 配置网络访问：允许所有IP地址 (0.0.0.0/0)
4. 创建数据库用户
5. 获取连接字符串

## 🌐 Vercel部署步骤

### 方式一：通过Vercel CLI (推荐)

1. **安装Vercel CLI**
```bash
npm i -g vercel
```

2. **登录Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
vercel --prod
```

### 方式二：通过GitHub连接

1. 将代码推送到GitHub
2. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
3. 点击 "New Project"
4. 导入GitHub仓库
5. 配置环境变量 (见下方)

## ⚙️ 环境变量配置

在Vercel Dashboard中设置以下环境变量：

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mxacc?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key
NODE_ENV=production
```

## 🧪 测试部署

部署完成后测试以下功能：

1. **前端访问**: 访问Vercel提供的域名
2. **API测试**: 
   - GET `https://your-domain.vercel.app/api/user/profile` (需要认证)
   - POST `https://your-domain.vercel.app/api/auth/register`

## 🎯 核心功能状态

✅ **已实现**:
- 用户注册 (`/api/auth/register`)
- 用户登录 (`/api/auth/login`) 
- 用户资料 (`/api/user/profile`)
- 前端UI界面
- 响应式设计
- 深色模式

🚧 **开发中**:
- 邮箱验证
- 密码重置
- 两步验证
- 文件上传

## 🔧 常见问题

### 1. API返回500错误
检查MongoDB连接字符串和网络访问设置

### 2. 前端无法加载
确保`frontend/dist`目录正确生成

### 3. JWT错误
确保`JWT_SECRET`环境变量已设置

## 📱 功能演示

部署成功后，您的系统将具备：

- **登录页面**: 现代化UI设计
- **注册功能**: 实时表单验证
- **仪表板**: 用户信息展示
- **主题切换**: 深色/浅色模式
- **响应式**: 完美适配移动端

## 🌟 下一步

1. **域名绑定**: 在Vercel Dashboard绑定自定义域名
2. **邮件服务**: 配置SendGrid或其他邮件服务
3. **分析工具**: 添加Vercel Analytics
4. **性能优化**: 启用边缘缓存

---

🎉 **恭喜！** 您的MXAcc系统现在已经是一个完整可用的在线服务！ 