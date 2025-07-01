# 开发环境搭建

本地开发环境配置指南。

## 系统要求

- **Node.js**: 18.x 或更高版本
- **npm**: 8.x 或更高版本
- **Git**: 最新版本
- **MongoDB**: 5.0+ (可选，可使用云数据库)
- **代码编辑器**: VS Code (推荐)

## 项目结构

```
MXacc/
├── api/                 # API路由
├── src/                 # 前端源码
├── public/              # 静态资源
├── docs/                # 文档
├── scripts/             # 构建脚本
├── package.json         # 项目配置
└── vite.config.ts       # Vite配置
```

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/xzajyb/MXacc.git
cd MXacc
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用。

## 开发工具配置

### VS Code 扩展推荐
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

### VS Code 设置
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 调试配置

### Chrome DevTools
- 使用React Developer Tools
- 启用Vue.js devtools (如果使用)
- 网络面板调试API请求

### VS Code 调试
`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug React App",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## 数据库配置

### 本地MongoDB
```bash
# 安装MongoDB
brew install mongodb/brew/mongodb-community  # macOS
# 或
sudo apt-get install mongodb  # Ubuntu

# 启动服务
brew services start mongodb/brew/mongodb-community
```

### MongoDB Atlas (推荐)
1. 注册MongoDB Atlas账号
2. 创建免费集群
3. 获取连接字符串
4. 配置到.env文件

### 数据库初始化
```bash
# 创建示例数据
npm run init-data

# 或手动创建管理员账号
npm run create-admin
```

## API开发

### 添加新的API路由
1. 在`api/`目录创建文件
2. 导出处理函数
3. 配置路由映射

示例：
```javascript
// api/example/hello.js
module.exports = async function handler(req, res) {
  res.json({ message: 'Hello World' })
}
```

### API测试
- 使用Postman或Insomnia
- 或使用内置测试脚本：
```bash
npm run test:api
```

## 前端开发

### 组件开发
- 使用TypeScript
- 遵循组件命名规范
- 添加PropTypes或TypeScript类型

### 样式开发
- 使用Tailwind CSS
- 支持深浅主题切换
- 响应式设计优先

### 状态管理
- 使用React Context
- 局部状态用useState
- 复杂状态用useReducer

## 构建和部署

### 本地构建
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 类型检查
```bash
npm run type-check
```

### 代码检查
```bash
npm run lint
npm run lint:fix
```

## 常用命令

```bash
# 开发服务器
npm run dev

# 构建项目
npm run build

# 预览构建
npm run preview

# 类型检查
npm run type-check

# 文档开发
npm run docs:dev

# 文档构建
npm run docs:build
```

## 故障排除

### 常见问题

#### 端口占用
```bash
# 查找占用端口的进程
lsof -i :5173
# 杀死进程
kill -9 <PID>
```

#### 依赖冲突
```bash
# 清理node_modules
rm -rf node_modules package-lock.json
npm install
```

#### 类型错误
```bash
# 重新生成类型文件
npm run type-check
```

### 性能优化
- 使用React.memo优化组件
- 实施代码分割
- 优化图片资源
- 启用Tree Shaking

## 贡献指南

### 提交代码
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

### 代码规范
- 使用TypeScript
- 遵循ESLint规则
- 编写组件文档
- 添加单元测试

### 版本管理
- 使用语义化版本号
- 编写清晰的commit信息
- 更新CHANGELOG 