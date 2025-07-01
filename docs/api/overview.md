# API 概述

MXacc 提供完整的 RESTful API，支持用户认证、资料管理、社交互动等功能。

## 基础信息

- **Base URL**: `https://mxacc.mxos.top/api`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON
- **编码格式**: UTF-8

## 认证

所有需要认证的 API 都需要在请求头中包含 JWT token：

```http
Authorization: Bearer <your-jwt-token>
```

### 获取Token
通过登录接口获取：
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

## API 分类

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/email-verification` - 邮箱验证

### 用户管理
- `GET /api/user/user-profile` - 获取用户资料
- `PUT /api/user/user-profile` - 更新用户资料
- `PUT /api/user/user-settings` - 更新用户设置
- `POST /api/user/upload-avatar` - 上传头像

### 社交功能
- `GET /api/social/content` - 获取帖子列表
- `POST /api/social/content` - 发布帖子
- `POST /api/social/messaging` - 私信功能

### 管理功能
- `GET /api/admin/users` - 用户管理
- `POST /api/admin/send-email` - 邮件发送
- `GET /api/admin/system-messages` - 系统消息

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述",
  "error": "detailed-error-code"
}
```

## 状态码

- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证或token无效
- `403` - 权限不足
- `404` - 资源不存在
- `429` - 请求频率限制
- `500` - 服务器内部错误

## 请求限制

为了保护服务器资源，API 设有请求频率限制：

- 登录接口：每分钟最多 5 次
- 注册接口：每小时最多 3 次
- 发帖接口：每分钟最多 10 次
- 其他接口：每分钟最多 60 次

## 错误处理

当API返回错误时，请检查：

1. 请求URL是否正确
2. HTTP方法是否匹配
3. 请求头是否包含必要的认证信息
4. 请求体格式是否正确
5. 是否超出了请求频率限制

## SDK 和工具

目前提供以下开发工具：

- **JavaScript SDK**: 前端集成库
- **API文档**: 详细的接口说明
- **Postman集合**: 便于测试的请求集合

## 更新日志

- v1.0 - 基础认证和用户管理功能
- v1.1 - 添加社交功能
- v1.2 - 完善管理员功能
- v1.3 - 优化性能和安全性 