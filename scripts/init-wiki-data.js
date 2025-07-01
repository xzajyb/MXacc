const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'mxacc'

async function initWikiData() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    console.log('🔄 连接到 MongoDB...')
    await client.connect()
    const db = client.db(DB_NAME)
    
    // 清理现有数据
    console.log('🧹 清理现有Wiki数据...')
    await db.collection('wiki_categories').deleteMany({})
    await db.collection('wikis').deleteMany({})
    
    // 创建示例分类
    console.log('📂 创建示例分类...')
    const categories = [
      {
        name: '快速开始',
        slug: 'getting-started',
        description: '快速上手指南和基础教程',
        order: 1,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '用户指南',
        slug: 'user-guide',
        description: '详细的用户操作指南',
        order: 2,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'API文档',
        slug: 'api-docs',
        description: '开发者API接口文档',
        order: 3,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '管理员指南',
        slug: 'admin-guide',
        description: '管理员功能使用指南',
        order: 4,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    const categoryResult = await db.collection('wiki_categories').insertMany(categories)
    const categoryIds = Object.values(categoryResult.insertedIds)
    console.log(`✅ 创建了 ${categoryIds.length} 个分类`)
    
    // 创建示例文档
    console.log('📝 创建示例文档...')
    const documents = [
      // 快速开始分类
      {
        title: '安装与配置',
        slug: 'installation',
        content: `# 安装与配置

欢迎使用 MXacc 企业级社交管理平台！本指南将帮助您快速完成系统的安装和基础配置。

## 系统要求

- Node.js 18.x 或更高版本
- MongoDB 4.4 或更高版本
- 4GB 以上内存
- 2GB 可用磁盘空间

## 快速安装

### 1. 克隆代码库

\`\`\`bash
git clone https://github.com/yourusername/mxacc.git
cd mxacc
\`\`\`

### 2. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 3. 环境配置

复制环境变量模板文件：

\`\`\`bash
cp .env.example .env
\`\`\`

编辑 \`.env\` 文件，配置以下关键参数：

\`\`\`env
# 数据库连接
MONGODB_URI=mongodb://localhost:27017

# JWT密钥
JWT_SECRET=your-super-secret-key

# 邮件服务配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
\`\`\`

### 4. 启动服务

\`\`\`bash
# 开发环境
npm run dev

# 生产环境构建
npm run build
\`\`\`

## 初始配置

首次启动后，访问 \`http://localhost:5173\` 完成初始配置：

1. 创建管理员账户
2. 配置邮件服务
3. 设置系统参数
4. 导入初始数据

## 验证安装

访问以下页面验证安装是否成功：

- 用户登录页面：\`/login\`
- 管理控制台：\`/admin\`
- API健康检查：\`/api/health\`

## 常见问题

### MongoDB 连接失败

确保 MongoDB 服务正在运行，并检查连接字符串是否正确。

### 邮件发送失败

检查 SMTP 配置，确保使用正确的应用密码而不是登录密码。

### 端口冲突

如果端口 5173 被占用，可以修改 \`vite.config.ts\` 中的端口配置。
`,
        categoryId: categoryIds[0],
        order: 1,
        isPublished: true,
        author: {
          id: 'system',
          username: 'system',
          displayName: '系统管理员'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '功能概览',
        slug: 'features-overview',
        content: `# 功能概览

MXacc 是一个功能强大的企业级社交管理平台，提供完整的用户管理、社交互动和内容管理解决方案。

## 核心功能

### 👥 用户管理系统

- **用户注册与认证**：支持邮箱注册、邮箱验证、密码重置
- **个人资料管理**：头像上传、个人信息编辑、隐私设置
- **权限管理**：角色分配、权限控制、管理员功能
- **安全功能**：双重认证、登录历史、安全日志

### 💬 社交功能

- **动态发布**：支持文字、图片、链接等多种内容类型
- **互动系统**：点赞、评论、转发、收藏
- **私信聊天**：实时消息、消息撤回、已读状态
- **关注系统**：关注用户、粉丝管理、动态推荐

### 🛠️ 管理功能

- **用户管理**：用户列表、状态管理、批量操作
- **内容审核**：帖子管理、评论审核、违规处理
- **系统监控**：用户统计、行为分析、性能监控
- **邮件系统**：群发邮件、模板管理、发送统计

### 📚 文档系统

- **Wiki文档**：支持 Markdown 格式的文档编写
- **分类管理**：多级分类、排序管理、权限控制
- **版本控制**：文档版本、修改历史、回滚功能
- **搜索功能**：全文搜索、标签过滤、智能推荐

## 技术特性

### 🚀 现代化技术栈

- **前端**：React 18 + TypeScript + Tailwind CSS
- **后端**：Node.js + Express + MongoDB
- **实时通信**：WebSocket + Socket.io
- **部署**：Docker + Vercel + 阿里云

### 🔒 安全保障

- **数据加密**：JWT Token + BCrypt 密码加密
- **权限控制**：基于角色的访问控制(RBAC)
- **输入验证**：XSS防护、SQL注入防护
- **审计日志**：用户行为记录、安全事件追踪

### 📱 用户体验

- **响应式设计**：适配桌面端和移动端
- **主题系统**：深色/浅色模式切换
- **国际化**：多语言支持
- **无障碍**：WAI-ARIA 标准支持

## 使用场景

### 企业内部协作

- 员工社交网络
- 内部知识分享
- 项目协作交流
- 企业文化建设

### 社区运营

- 用户社区管理
- 内容创作平台
- 知识问答系统
- 用户增长运营

### 教育培训

- 在线学习平台
- 师生互动系统
- 课程资源管理
- 学习进度跟踪

## 下一步

现在您已经了解了 MXacc 的主要功能，建议继续阅读：

1. [用户注册与登录](./user-registration)
2. [个人资料设置](./profile-settings)
3. [社交功能使用](./social-features)
4. [管理员指南](../admin-guide/admin-overview)
`,
        categoryId: categoryIds[0],
        order: 2,
        isPublished: true,
        author: {
          id: 'system',
          username: 'system',
          displayName: '系统管理员'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // 用户指南分类
      {
        title: '用户注册与登录',
        slug: 'user-registration',
        content: `# 用户注册与登录

本指南将详细介绍如何注册新账户和登录系统。

## 用户注册

### 注册流程

1. **访问注册页面**
   - 点击登录页面的"注册新账户"链接
   - 或直接访问 \`/register\` 页面

2. **填写注册信息**
   - 用户名：3-20个字符，支持字母、数字、下划线
   - 邮箱地址：必须是有效的邮箱地址
   - 密码：至少8个字符，包含字母和数字
   - 确认密码：必须与密码一致

3. **提交注册**
   - 点击"注册"按钮
   - 系统会发送验证邮件到您的邮箱

4. **邮箱验证**
   - 检查您的邮箱收件箱
   - 点击验证邮件中的链接
   - 完成邮箱验证

### 注册注意事项

- 用户名一旦设置不可修改，请谨慎选择
- 邮箱地址用于登录和找回密码，请确保可以正常接收邮件
- 密码应包含大小写字母、数字和特殊字符以提高安全性

## 用户登录

### 登录方式

1. **邮箱登录**
   - 输入注册时使用的邮箱地址
   - 输入密码
   - 点击"登录"按钮

2. **记住登录状态**
   - 勾选"记住我"选项
   - 系统会在30天内保持登录状态

### 忘记密码

如果忘记密码，可以通过以下步骤重置：

1. **进入重置页面**
   - 点击登录页面的"忘记密码？"链接

2. **输入邮箱**
   - 输入注册时使用的邮箱地址
   - 点击"发送重置邮件"

3. **检查邮箱**
   - 查收密码重置邮件
   - 点击邮件中的重置链接

4. **设置新密码**
   - 输入新密码
   - 确认新密码
   - 保存设置

## 账户安全

### 密码安全

- 使用强密码，包含大小写字母、数字和特殊字符
- 定期更换密码，建议每3个月更换一次
- 不要在多个网站使用相同密码

### 登录安全

- 不要在公共场所保存登录状态
- 使用后及时退出登录
- 发现异常登录及时修改密码

### 邮箱安全

- 保护好邮箱账户安全
- 开启邮箱的双重认证
- 定期检查登录设备

## 常见问题

### 收不到验证邮件

1. 检查垃圾邮件文件夹
2. 确认邮箱地址输入正确
3. 联系管理员重新发送

### 登录失败

1. 确认邮箱和密码输入正确
2. 检查账户是否已验证邮箱
3. 确认账户未被停用

### 账户被锁定

如果多次登录失败，账户可能被临时锁定：

1. 等待15分钟后重试
2. 使用忘记密码功能重置
3. 联系管理员解锁

## 下一步

成功登录后，建议：

1. [完善个人资料](./profile-settings)
2. [设置隐私选项](./privacy-settings)
3. [开始使用社交功能](./social-features)
`,
        categoryId: categoryIds[1],
        order: 1,
        isPublished: true,
        author: {
          id: 'system',
          username: 'system',
          displayName: '系统管理员'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // API文档分类
      {
        title: 'API认证',
        slug: 'api-authentication',
        content: `# API认证

MXacc API 使用基于 JWT (JSON Web Token) 的认证机制，确保 API 调用的安全性。

## 获取访问令牌

### 登录接口

\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
\`\`\`

### 响应示例

\`\`\`json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60d5ecb74d6b2b001f647a8e",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "isEmailVerified": true
    }
  }
}
\`\`\`

## 使用访问令牌

### 请求头设置

在所有需要认证的 API 请求中，需要在请求头中包含访问令牌：

\`\`\`http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

### JavaScript 示例

\`\`\`javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/user/profile', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
\`\`\`

### cURL 示例

\`\`\`bash
curl -X GET "https://api.mxacc.com/api/user/profile" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json"
\`\`\`

## 令牌管理

### 令牌有效期

- 访问令牌有效期：24小时
- 刷新令牌有效期：30天

### 令牌刷新

当访问令牌过期时，可以使用刷新令牌获取新的访问令牌：

\`\`\`http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
\`\`\`

### 令牌撤销

退出登录时，应该撤销访问令牌：

\`\`\`http
POST /api/auth/logout
Authorization: Bearer your-access-token
\`\`\`

## 错误处理

### 常见认证错误

#### 401 Unauthorized

令牌无效或已过期：

\`\`\`json
{
  "success": false,
  "message": "Token无效",
  "code": "INVALID_TOKEN"
}
\`\`\`

#### 403 Forbidden

权限不足：

\`\`\`json
{
  "success": false,
  "message": "权限不足",
  "code": "INSUFFICIENT_PERMISSIONS"
}
\`\`\`

### 错误处理建议

\`\`\`javascript
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (response.status === 401) {
    // 令牌过期，尝试刷新或跳转到登录页
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  
  if (response.status === 403) {
    // 权限不足
    console.error('权限不足');
    return;
  }
  
  return response.json();
}
\`\`\`

## 安全最佳实践

### 令牌存储

- **推荐**：使用 httpOnly cookie 存储刷新令牌
- **可选**：使用 localStorage 存储访问令牌（注意 XSS 风险）
- **避免**：在 URL 参数中传递令牌

### 传输安全

- 始终使用 HTTPS 传输令牌
- 避免在日志中记录令牌
- 定期轮换令牌

### 权限控制

- 使用最小权限原则
- 定期审核 API 权限
- 监控异常 API 调用

## 权限级别

### 用户权限

- \`user\`：普通用户权限
- \`admin\`：管理员权限
- \`super_admin\`：超级管理员权限

### API 权限检查

不同的 API 端点需要不同的权限级别：

\`\`\`javascript
// 普通用户可访问
GET /api/user/profile

// 需要管理员权限
GET /api/admin/users
POST /api/admin/system-messages

// 需要超级管理员权限
DELETE /api/admin/users/:id
PUT /api/admin/system-config
\`\`\`

## 下一步

了解了认证机制后，您可以：

1. [探索用户API](./user-api)
2. [了解社交API](./social-api)
3. [查看管理员API](./admin-api)
`,
        categoryId: categoryIds[2],
        order: 1,
        isPublished: true,
        author: {
          id: 'system',
          username: 'system',
          displayName: '系统管理员'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // 管理员指南分类
      {
        title: '管理员控制台',
        slug: 'admin-console',
        content: `# 管理员控制台

管理员控制台是 MXacc 系统的核心管理界面，提供全面的系统管理功能。

## 访问控制台

### 权限要求

只有具有管理员权限的用户才能访问管理员控制台：

- 角色：\`admin\` 或 \`super_admin\`
- 邮箱已验证
- 账户状态正常

### 访问方式

1. **通过导航菜单**
   - 登录系统后，点击侧边栏的"管理控制台"

2. **直接访问**
   - 访问 \`/admin\` 页面

## 功能模块

### 📧 邮件管理

发送系统邮件给用户：

- **邮件模板**：系统通知、安全警报、欢迎邮件等
- **收件人选择**：全部用户、指定用户、自定义邮箱
- **邮件预览**：发送前预览邮件效果
- **发送记录**：查看发送历史和结果

#### 使用步骤

1. 选择邮件模板
2. 配置邮件内容和参数
3. 选择收件人
4. 预览邮件效果
5. 发送邮件

### 👥 用户管理

管理系统中的所有用户：

- **用户列表**：查看用户详细信息
- **状态管理**：启用/禁用用户账户
- **角色管理**：分配管理员权限
- **搜索过滤**：按用户名、邮箱、状态筛选

#### 用户操作

- **启用/禁用**：控制用户登录权限
- **重置密码**：为用户重置密码
- **邮箱验证**：手动验证用户邮箱
- **权限提升**：将用户提升为管理员

### 📢 系统消息

发布系统通知和公告：

- **消息类型**：信息、警告、成功、错误
- **优先级**：低、普通、高、紧急
- **发布范围**：全局消息、个人专属
- **自动标记**：设置消息是否自动标记为已读

#### 消息管理

1. 编写消息标题和内容
2. 选择消息类型和优先级
3. 设置发布范围
4. 发布消息

### 🚫 封禁管理

管理用户封禁和申述：

#### 用户封禁

- **封禁类型**：临时封禁、永久封禁
- **封禁时长**：小时、天、周、月
- **封禁原因**：详细说明封禁原因
- **通知设置**：是否通知被封禁用户

#### 申述处理

- **申述列表**：查看用户提交的申述
- **申述详情**：查看申述内容和图片证据
- **处理决定**：通过或驳回申述
- **回复消息**：给用户回复处理结果

### 🏷️ 头衔管理

管理用户头衔系统：

#### 头衔创建

- **头衔名称**：显示在用户名旁的标识
- **头衔颜色**：自定义头衔颜色
- **头衔描述**：头衔的详细说明

#### 头衔分配

- **用户选择**：为指定用户分配头衔
- **批量操作**：批量分配或移除头衔
- **头衔管理**：查看和管理用户的头衔

### 🖼️ 合作伙伴

管理首页显示的合作伙伴Logo：

- **Logo管理**：添加、编辑、删除合作伙伴Logo
- **显示控制**：启用/禁用Logo展示功能
- **排序管理**：调整Logo显示顺序

### 📝 帖子管理

管理社交平台的内容：

- **帖子列表**：查看所有用户发布的帖子
- **内容审核**：删除违规或不当内容
- **批量操作**：批量删除多个帖子
- **搜索功能**：按关键词搜索帖子

### 📚 文档管理

管理Wiki文档系统：

- **分类管理**：创建和管理文档分类
- **文档编辑**：创建、编辑、删除文档
- **发布控制**：控制文档的发布状态
- **Wiki重建**：重新生成静态文档站点

## 使用技巧

### 快速操作

- 使用搜索功能快速定位用户或内容
- 利用筛选条件缩小查询范围
- 使用批量操作提高工作效率

### 安全建议

- 定期检查系统日志
- 谨慎使用批量删除功能
- 及时处理用户申述
- 保护管理员账户安全

### 监控指标

关注以下关键指标：

- 新用户注册数量
- 用户活跃度
- 内容发布量
- 系统错误率

## 常见任务

### 新用户审核

1. 查看未验证邮箱的用户
2. 检查用户信息是否完整
3. 手动验证邮箱（如需要）
4. 发送欢迎邮件

### 内容审核

1. 定期检查新发布的帖子
2. 处理用户举报的内容
3. 删除违规内容
4. 对违规用户进行处理

### 系统维护

1. 发布系统维护通知
2. 执行数据备份
3. 更新系统配置
4. 监控系统性能

## 故障排除

### 常见问题

1. **无法访问控制台**
   - 检查用户权限
   - 确认邮箱已验证
   - 联系超级管理员

2. **邮件发送失败**
   - 检查SMTP配置
   - 验证邮件模板
   - 查看错误日志

3. **用户操作异常**
   - 刷新页面重试
   - 检查网络连接
   - 查看浏览器控制台

## 下一步

掌握管理员控制台后，建议：

1. [了解用户管理策略](./user-management)
2. [学习内容审核标准](./content-moderation)
3. [掌握系统监控方法](./system-monitoring)
`,
        categoryId: categoryIds[3],
        order: 1,
        isPublished: true,
        author: {
          id: 'system',
          username: 'system',
          displayName: '系统管理员'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    const documentResult = await db.collection('wikis').insertMany(documents)
    console.log(`✅ 创建了 ${documents.length} 篇文档`)
    
    console.log('🎉 Wiki示例数据初始化完成！')
    console.log('💡 现在您可以：')
    console.log('   1. 访问管理员控制台的"文档管理"标签页')
    console.log('   2. 创建或编辑更多文档')
    console.log('   3. 运行 npm run docs:generate 生成静态文档')
    console.log('   4. 运行 npm run docs:dev 启动文档开发服务器')
    
  } catch (error) {
    console.error('❌ 初始化失败:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initWikiData()
}

module.exports = initWikiData 