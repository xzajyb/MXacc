# 部署指南

详细的系统部署和配置说明。

## 系统要求

### 服务器要求
- **操作系统**: Linux/Windows/macOS
- **Node.js**: 18.x 或更高版本
- **内存**: 至少 2GB RAM
- **存储**: 至少 10GB 可用空间
- **网络**: 公网IP和域名（推荐）

### 数据库要求
- **MongoDB**: 5.0 或更高版本
- **推荐**: MongoDB Atlas 云数据库
- **存储**: 根据用户量预估

## 环境配置

### 环境变量
创建 `.env` 文件并配置以下变量：

```bash
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/mxacc
# 或使用 MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mxacc

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# 邮件配置
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=noreply@mxacc.com

# 应用配置
NODE_ENV=production
PORT=3000
BASE_URL=https://yourdomain.com

# 文件上传
UPLOAD_PATH=./public/uploads
MAX_FILE_SIZE=2097152
```

### 邮件服务配置
支持多种邮件服务提供商：

#### 163邮箱配置
```bash
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@163.com
SMTP_PASS=your-authorization-code
```

#### Gmail配置
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Vercel 部署

### 快速部署
1. Fork GitHub仓库
2. 连接Vercel账号
3. 导入项目
4. 配置环境变量
5. 部署

### 环境变量配置
在Vercel控制台设置：
- `MONGODB_URI`
- `JWT_SECRET`
- `SMTP_*` 相关变量

### 自定义域名
1. 在Vercel中添加域名
2. 配置DNS解析
3. 启用HTTPS

## Docker 部署

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/mxacc
      - JWT_SECRET=your-secret
    depends_on:
      - mongo

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 本地部署

### 安装依赖
```bash
git clone https://github.com/your-username/MXacc.git
cd MXacc
npm install
```

### 配置环境
```bash
cp .env.example .env
# 编辑 .env 文件
```

### 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## 反向代理

### Nginx 配置
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 数据库初始化

### 创建管理员账号
```bash
# 连接到MongoDB
mongo

# 切换到数据库
use mxacc

# 创建管理员用户
db.users.insertOne({
  username: "admin",
  email: "admin@example.com",
  password: "$2a$10$...", // 加密后的密码
  role: "admin",
  isEmailVerified: true,
  createdAt: new Date()
})
```

## 监控和维护

### 日志管理
- 应用日志：使用 PM2 或 systemd
- 错误监控：Sentry 或其他服务
- 性能监控：New Relic 或 DataDog

### 备份策略
- 数据库定期备份
- 文件上传备份
- 配置文件备份

### 更新部署
1. 备份当前数据
2. 拉取最新代码
3. 安装新依赖
4. 重新构建
5. 重启服务
6. 验证功能

## 故障排除

### 常见问题
- 数据库连接失败：检查连接字符串和网络
- 邮件发送失败：验证SMTP配置
- 文件上传失败：检查权限和存储空间
- 性能问题：优化数据库索引和缓存

### 性能优化
- 启用 gzip 压缩
- 配置 CDN
- 优化数据库查询
- 实施缓存策略 