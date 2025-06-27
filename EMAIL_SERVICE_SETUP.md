# 统一邮件发送服务配置指南

## 📧 服务概述

统一邮件发送服务是为MXacc项目设计的异步邮件处理系统，解决了以下问题：
- ✅ **邮件发送阻塞API响应** - 通过异步队列处理，立即返回响应
- ✅ **重复的邮件发送逻辑** - 统一的邮件模板和发送接口
- ✅ **缺乏统一错误处理** - 集中的错误处理和重试机制
- ✅ **难以管理和监控** - 统一的日志记录和状态跟踪

## 🚀 功能特性

### 支持的邮件类型
1. **验证码邮件** (`verification`) - 邮箱验证码
2. **欢迎邮件** (`welcome`) - 注册成功欢迎
3. **密码重置邮件** (`password_reset`) - 密码重置验证码
4. **密码重置通知** (`password_reset_notification`) - 忘记密码重置安全通知
5. **密码修改通知** (`password_change_notification`) - 主动修改密码安全通知
6. **安全警报** (`security_alert`) - 账户安全警报
7. **管理员通知** (`admin_notification`) - 系统管理员通知

### 技术特性
- 🚀 **异步处理** - 邮件发送不阻塞API响应
- 📬 **内存队列** - 简单高效的邮件队列管理
- 🎨 **统一模板** - 专业的SVG图标邮件模板
- 🔄 **自动重试** - 发送失败的错误处理机制
- 📊 **详细日志** - 完整的邮件发送状态记录

## ⚙️ 环境配置

### 必需的环境变量

在你的 `.env` 文件中添加以下配置：

```bash
# 邮件服务配置
LUCKYCOLA_API_KEY=你的LuckyCola_API密钥
LUCKYCOLA_SMTP_CODE=你的SMTP授权码
LUCKYCOLA_SMTP_EMAIL=你的SMTP邮箱地址
LUCKYCOLA_SMTP_TYPE=qq  # 或其他邮箱类型

# 应用基础URL配置
BASE_URL=http://localhost:3000  # 本地开发
# VERCEL_URL 在Vercel部署时自动设置

# 前端URL配置
CLIENT_URL=https://mxacc.mxos.top  # 或你的前端域名
FRONTEND_URL=https://mxacc.mxos.top  # 用于邮件中的链接
```

### Vercel部署配置

在Vercel项目设置中添加环境变量：
- `LUCKYCOLA_API_KEY`
- `LUCKYCOLA_SMTP_CODE`
- `LUCKYCOLA_SMTP_EMAIL`
- `LUCKYCOLA_SMTP_TYPE`
- `CLIENT_URL`
- `FRONTEND_URL`

## 📝 API使用说明

### 邮件服务API端点

```
POST /api/services/email
```

### 请求格式

```json
{
  "type": "邮件类型",
  "to": "接收者邮箱",
  "data": {
    // 邮件模板数据
  }
}
```

### 响应格式

```json
{
  "success": true,
  "message": "邮件已加入发送队列",
  "taskId": "任务ID",
  "code": "验证码(如适用)"
}
```

## 🔧 邮件类型详解

### 1. 验证码邮件

```javascript
// 发送验证码邮件
fetch('/api/services/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'verification',
    to: 'user@example.com',
    data: {
      code: '123456',  // 可选，不提供会自动生成
      username: 'testuser'
    }
  })
})
```

### 2. 欢迎邮件

```javascript
// 发送欢迎邮件
fetch('/api/services/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'welcome',
    to: 'user@example.com',
    data: {
      username: 'testuser'
    }
  })
})
```

### 3. 密码重置邮件

```javascript
// 发送密码重置邮件
fetch('/api/services/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'password_reset',
    to: 'user@example.com',
    data: {
      code: '654321',
      username: 'testuser'
    }
  })
})
```

### 4. 密码重置通知

```javascript
// 发送密码重置通知（忘记密码重置后）
fetch('/api/services/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'password_reset_notification',
    to: 'user@example.com',
    data: {
      username: 'testuser',
      timestamp: '2024-01-15 14:30:25',
      ip: '192.168.1.1',
      deviceInfo: {
        device: '桌面设备',
        os: 'Windows',
        browser: 'Chrome'
      }
    }
  })
})
```

### 5. 密码修改通知

```javascript
// 发送密码修改通知（主动修改密码后）
fetch('/api/services/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'password_change_notification',
    to: 'user@example.com',
    data: {
      username: 'testuser',
      timestamp: '2024-01-15 15:45:30',
      ip: '192.168.1.1',
      deviceInfo: {
        device: '桌面设备',
        os: 'Windows',
        browser: 'Chrome'
      }
    }
  })
})
```

### 5. 安全警报

```javascript
// 发送安全警报
fetch('/api/services/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'security_alert',
    to: 'user@example.com',
    data: {
      username: 'testuser',
      alertType: '异常登录警报',
      details: '检测到来自新设备的登录尝试'
    }
  })
})
```

### 6. 管理员通知

```javascript
// 发送管理员通知
fetch('/api/services/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'admin_notification',
    to: 'admin@example.com',
    data: {
      title: '系统维护通知',
      content: '系统将于今晚23:00-01:00进行维护升级',
      username: 'admin'
    }
  })
})
```

## 🔄 迁移指南

### 从直接邮件调用迁移到邮件服务

**旧方式 (直接调用):**
```javascript
import { sendVerificationEmail } from '../_lib/luckycola-email'

// 阻塞式发送
await sendVerificationEmail(email, code, username)
```

**新方式 (邮件服务):**
```javascript
// 异步发送，立即返回
const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
               process.env.BASE_URL || 'http://localhost:3000'

const response = await fetch(`${baseUrl}/api/services/email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'verification',
    to: email,
    data: { code, username }
  })
})
```

## 📊 监控和日志

### 日志格式

邮件服务会输出详细的日志信息：

```
📧 邮件已加入队列: verification -> user@example.com
📬 开始处理邮件队列，共 1 封邮件
📧 正在发送邮件: verification -> user@example.com
✅ 邮件发送成功: 1642234567890.123
📭 邮件队列处理完成
```

### 错误处理

发送失败时的日志：
```
❌ 邮件发送失败: 1642234567890.123 Error: 邮件服务超时
```

## 🔧 队列机制

### 内存队列特性
- **FIFO处理** - 先进先出的队列处理
- **自动触发** - 添加邮件时自动开始处理
- **发送间隔** - 每封邮件间隔100ms发送，避免频繁请求
- **并发控制** - 同时只处理一个队列，避免资源竞争

### 生产环境建议
对于高并发场景，建议使用Redis等外部队列系统：

```javascript
// 可扩展为Redis队列
const redis = require('redis')
const client = redis.createClient(process.env.REDIS_URL)

async function addToRedisQueue(emailData) {
  await client.lpush('email_queue', JSON.stringify(emailData))
}
```

## 🚀 性能优化

### 现有优化
1. **异步处理** - 邮件发送不阻塞API响应
2. **批量处理** - 队列批量处理多封邮件
3. **错误隔离** - 单个邮件失败不影响其他邮件
4. **资源复用** - 邮件模板一次编译，多次使用

### 扩展优化建议
1. **Redis队列** - 使用Redis实现分布式队列
2. **重试机制** - 添加指数退避重试策略
3. **优先级队列** - 不同类型邮件设置优先级
4. **监控告警** - 集成监控系统，邮件发送失败告警

## 🔒 安全特性

### 输入验证
- ✅ 邮箱格式验证
- ✅ 邮件类型白名单校验
- ✅ 请求参数完整性检查

### 防护措施
- ✅ CORS跨域保护
- ✅ 敏感信息脱敏日志
- ✅ 环境变量安全存储

## 📞 故障排除

### 常见问题

**1. 邮件发送失败**
```bash
# 检查环境变量
echo $LUCKYCOLA_API_KEY
echo $LUCKYCOLA_SMTP_CODE

# 检查网络连接
curl -I https://luckycola.com.cn/tools/customMail
```

**2. 队列处理缓慢**
- 检查LuckyCola API服务状态
- 增加发送间隔时间
- 监控内存使用情况

**3. 模板渲染错误**
- 检查邮件数据格式
- 验证模板函数参数
- 查看详细错误日志

## 📈 未来规划

- [ ] **Redis队列集成** - 支持分布式部署
- [ ] **邮件模板编辑器** - 可视化邮件模板编辑
- [ ] **发送统计面板** - 邮件发送成功率统计
- [ ] **A/B测试支持** - 邮件模板效果测试
- [ ] **多邮件服务商** - 支持多个邮件发送商自动切换

## 🤝 技术支持

如有问题请联系：
- **QQ群**: 915435295
- **GitHub Issues**: 提交技术问题
- **邮箱**: support@mxos.top

---

**版本**: v1.0.0  
**更新日期**: 2024年1月  
**维护者**: 梦锡工作室技术团队 