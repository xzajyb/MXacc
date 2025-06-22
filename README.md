# MXAcc - 梦锡账号管理系统

## 概述
MXAcc是梦锡工作室的统一账号管理系统，为所有工作室产品提供用户认证、授权和个人资料管理服务。

## 功能特性

### 🔐 核心功能
- **用户注册** - 支持邮箱注册，邮箱验证
- **用户登录** - 支持邮箱/用户名登录，记住登录状态
- **密码管理** - 安全的密码重置功能
- **个人资料** - 用户信息管理，头像上传
- **安全设置** - 两步验证，登录日志

### 🎨 界面设计
- **现代化UI** - 符合梦锡工作室设计风格
- **响应式设计** - 支持桌面端和移动端
- **深色/浅色模式** - 自适应主题切换
- **流畅动画** - 基于Framer Motion的过渡效果

### 🏗️ 技术架构

**后端：** 
- Node.js + Express.js
- MongoDB 数据库
- JWT 身份验证
- bcrypt 密码加密
- nodemailer 邮件服务

**前端：**
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion 动画
- React Query 状态管理
- React Hook Form 表单处理

## 项目结构

```
MXacc/
├── backend/           # 后端API服务
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由
│   │   └── utils/          # 工具函数
│   ├── package.json
│   └── server.js
├── frontend/          # 前端React应用
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── contexts/       # 上下文
│   │   ├── hooks/          # 自定义钩子
│   │   ├── pages/          # 页面
│   │   ├── types/          # 类型定义
│   │   └── utils/          # 工具函数
│   ├── package.json
│   └── index.html
└── README.md
```

## 快速开始

### 环境要求
- Node.js 18+
- MongoDB 5.0+
- npm 或 yarn

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 运行项目

```bash
# 启动后端服务 (端口 3001)
cd backend
npm run dev

# 启动前端服务 (端口 3000)
cd frontend
npm run dev
```

## 开发团队

梦锡工作室 - 简单的设计，可靠的性能

## 许可证

MIT License 