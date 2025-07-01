# MXacc Wiki系统使用指南

## 系统概述

MXacc已成功集成完整的Wiki文档管理系统，支持创建、编辑、管理和浏览知识库内容。系统基于VitePress架构，提供现代化的文档协作平台。

## 主要功能

### 📝 文档管理
- **创建文档**: 支持Markdown格式的富文本编辑
- **编辑文档**: 实时编辑，自动保存版本历史
- **删除文档**: 权限控制的安全删除
- **文档分类**: 多级分类组织结构
- **访问控制**: 公开/私有文档权限管理

### 🏷️ 分类管理
- **创建分类**: 自定义分类名称、图标、描述
- **分类排序**: 自定义显示顺序
- **分类筛选**: 按分类浏览文档
- **层级结构**: 支持多级分类嵌套

### 📂 批量导入
- **Markdown导入**: 批量导入现有Markdown文档
- **格式解析**: 自动解析文档标题和内容
- **分类归档**: 自动分配分类和路径
- **屯人服Wiki移植**: 完整移植屯人服Wiki内容

### 🔍 搜索和浏览
- **全文搜索**: 搜索文档标题和内容
- **分类筛选**: 按分类浏览文档列表
- **树状展示**: 层级结构的文档组织
- **快速访问**: 便捷的导航和链接

## 访问方式

### 1. 通过导航菜单
- 登录系统后，在主导航中点击"Wiki文档"
- 直接访问完整的Wiki管理界面

### 2. 独立页面访问
- 访问 `/wiki` 路径
- 独立的Wiki系统界面

### 3. 管理员控制台
- 在管理员页面中的"Wiki管理"标签
- 查看系统状态和导入指南

## 屯人服Wiki内容

系统已预装完整的屯人服Wiki内容，包括：

### 📋 核心文档
1. **欢迎来到屯人服** - 服务器介绍和目标
2. **加入服务器** - Java版和基岩版加入指南
3. **服务器规则** - 完整的游戏规则和违规处理
4. **绑定系统** - QQ号绑定功能说明
5. **传送点系统** - 传送功能使用指南
6. **假人系统** - 自动化工具使用说明
7. **枪械系统** - 武器系统详细介绍
8. **指令大全** - 完整的游戏指令列表
9. **常见问题** - FAQ和疑难解答

### 🎯 内容特色
- **中文界面**: 完全本地化的中文内容
- **详细说明**: 每个功能都有详细的使用指南
- **实用性强**: 面向实际使用场景的文档
- **定期更新**: 支持内容的持续维护和更新

## 导入操作

### 方法一：命令行导入
```bash
# 设置管理员Token环境变量
export ADMIN_TOKEN=your_admin_token_here

# 运行导入脚本
npm run import-wiki
```

### 方法二：Web界面导入
1. 访问Wiki系统 (`/wiki`)
2. 点击"批量导入"标签页
3. 粘贴Markdown格式的内容
4. 点击"开始导入"

### 方法三：API调用
```javascript
// POST /api/social/content
{
  "action": "wiki-management",
  "subAction": "import-docs",
  "docs": [
    {
      "title": "文档标题",
      "content": "文档内容（Markdown格式）",
      "category": "分类名称"
    }
  ]
}
```

## API接口

### 文档管理
- `GET /api/social/content?action=wiki&subAction=docs` - 获取文档列表
- `GET /api/social/content?action=wiki&subAction=doc&docId=xxx` - 获取单个文档
- `POST /api/social/content` (action: wiki-management, subAction: save-doc) - 保存文档
- `POST /api/social/content` (action: wiki-management, subAction: delete-doc) - 删除文档

### 分类管理
- `GET /api/social/content?action=wiki&subAction=categories` - 获取分类列表
- `POST /api/social/content` (action: wiki-management, subAction: create-category) - 创建分类

### 批量导入
- `POST /api/social/content` (action: wiki-management, subAction: import-docs) - 批量导入

## 权限控制

### 管理员权限
- ✅ 创建、编辑、删除文档
- ✅ 管理分类
- ✅ 批量导入
- ✅ 访问管理界面

### 普通用户权限
- ✅ 浏览公开文档
- ✅ 搜索文档内容
- ✅ 查看文档详情
- ❌ 编辑和管理功能

## 数据存储

### MongoDB集合
- `wiki_docs` - 存储Wiki文档
- `wiki_categories` - 存储文档分类

### 数据结构
```javascript
// 文档结构
{
  _id: ObjectId,
  title: String,           // 文档标题
  content: String,         // 文档内容（Markdown）
  slug: String,           // URL路径
  category: String,       // 分类
  isPublic: Boolean,      // 是否公开
  parentId: ObjectId,     // 父文档ID（可选）
  order: Number,          // 排序
  authorId: ObjectId,     // 作者ID
  createdAt: Date,        // 创建时间
  updatedAt: Date,        // 更新时间
  updatedBy: ObjectId     // 最后更新者ID
}

// 分类结构
{
  _id: ObjectId,
  name: String,           // 分类名称
  description: String,    // 分类描述
  slug: String,          // URL路径
  icon: String,          // 分类图标
  order: Number,         // 排序
  createdAt: Date,       // 创建时间
  createdBy: ObjectId    // 创建者ID
}
```

## 技术架构

### 前端组件
- `WikiPage.tsx` - 主要的Wiki页面组件
- `DashboardPage.tsx` - 集成Wiki导航
- `AdminPage.tsx` - 管理员Wiki控制台

### 后端API
- `api/social/content.js` - Wiki功能集成到社交API
- 支持CRUD操作和批量导入

### 路由配置
- `/wiki` - Wiki主页面
- 集成到现有的路由系统中

## 使用技巧

### 1. 文档编写
- 使用Markdown格式编写内容
- 支持标题、列表、链接、代码块等
- 建议使用清晰的标题结构

### 2. 分类管理
- 为不同类型的内容创建专门分类
- 使用表情符号作为分类图标增强视觉效果
- 合理设置分类排序

### 3. 搜索优化
- 在文档标题中包含关键词
- 在内容中使用相关的术语和标签
- 定期更新和维护文档内容

### 4. 协作管理
- 多个管理员可以协同编辑
- 系统记录每次编辑的历史
- 支持版本追踪和回滚

## 故障排除

### 常见问题
1. **导入失败**: 检查管理员权限和Token设置
2. **搜索无结果**: 确认文档已设为公开状态
3. **分类不显示**: 检查分类的排序设置
4. **编辑权限不足**: 确认用户具有管理员权限

### 日志检查
- 查看浏览器控制台的错误信息
- 检查服务器日志文件
- 确认数据库连接状态

## 扩展开发

### 自定义功能
- 可以基于现有API扩展新功能
- 支持自定义文档模板
- 可以集成外部搜索引擎

### 集成建议
- 与用户权限系统深度集成
- 考虑添加评论和协作功能
- 支持多语言版本

---

**Wiki系统已完全集成到MXacc平台中，为用户提供完整的知识库管理体验！** 