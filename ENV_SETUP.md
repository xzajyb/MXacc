# 🔐 MXAcc 环境变量配置指南

## 1. 必需的环境变量

### MONGODB_URI (必需)
MongoDB Atlas连接字符串

**格式:** `mongodb+srv://username:password@cluster.mongodb.net/mxacc`

**获取步骤:**
1. 访问 https://cloud.mongodb.com/
2. 登录或注册MongoDB Atlas账号
3. 创建新集群 (选择免费的M0 Sandbox)
4. 创建数据库用户 (Database Access)
5. 设置网络访问 (Network Access - 添加 0.0.0.0/0 允许所有IP)
6. 获取连接字符串 (Connect -> Connect your application)

### JWT_SECRET (必需) 
JWT认证密钥

**生成方法:**
```bash
# 方法1: 使用OpenSSL
openssl rand -base64 32

# 方法2: 使用Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法3: 在线生成器
# https://generate-secret.vercel.app/32
```

## 2. 在Vercel Dashboard中设置

1. 访问 https://vercel.com/dashboard
2. 选择您的MXAcc项目
3. 进入 Settings → Environment Variables
4. 添加以下变量:

```
MONGODB_URI = mongodb+srv://your_username:your_password@your_cluster.mongodb.net/mxacc
JWT_SECRET = your_generated_secret_key_here
NODE_ENV = production
```

## 3. 使用Vercel CLI设置 (可选)

```bash
# 设置生产环境变量
vercel env add MONGODB_URI
vercel env add JWT_SECRET

# 设置所有环境
vercel env add NODE_ENV production
```

## 4. 本地开发环境

创建 `.env.local` 文件:
```
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/mxacc
JWT_SECRET=your_generated_secret_key_here
NODE_ENV=development
```

## 5. 验证配置

设置完成后，访问测试端点:
- https://your-app.vercel.app/api/test

应该返回: `{"message":"MXAcc API 运行正常"}`

## 6. 常见问题

### MongoDB连接失败
- 检查用户名密码是否正确
- 确认网络访问设置允许所有IP (0.0.0.0/0)
- 数据库名称是否为 'mxacc'

### JWT Token错误  
- 确保JWT_SECRET足够长 (建议32字符+)
- 不要在客户端代码中暴露JWT_SECRET

### API 500错误
- 检查Vercel Functions日志
- 确认所有环境变量已正确设置
- 查看Runtime Logs寻找具体错误信息 