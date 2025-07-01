const { MongoClient } = require('mongodb')

// 屯人服Wiki数据
const wikiData = {
  categories: [
    {
      name: '开始使用',
      description: '新手入门指南和基础设置',
      order: 1
    },
    {
      name: '游戏功能',
      description: '服务器特色功能和系统介绍',
      order: 2
    },
    {
      name: '规则制度',
      description: '服务器规则和管理制度',
      order: 3
    },
    {
      name: 'API文档',
      description: '技术文档和API接口说明',
      order: 4
    }
  ],
  pages: [
    {
      title: '从这里开始',
      content: `# 欢迎来到屯人服

## 服务器简介

屯人服是一个《我的世界》生存服务器，专注于为玩家提供**稳定、友好、创意驱动**的生存环境。

### 📋 基本信息
- **创建时间**：2025年3月28日
- **创始团队**：mc506lw(老万) × alazeprt  
- **核心理念**：通过协作与自由探索，打造沉浸式生存体验

### 🎯 服务器目标
- 为玩家提供**稳定、友好、创意驱动**的生存环境
- 鼓励玩家通过建筑、冒险、社群互动，建立归属感

### 📱 联系方式
- **官方QQ群**：1043492617
- 玩家可以在群内@管理员提交建议

## 快速入门

### 1. 服务器连接
- **Java版地址**：play.506521.xyz
- **基岩版地址**：bedrock.506521.xyz
- **端口**：19132

### 2. 基础命令
- \`/spawn\` - 回到主城
- \`/home\` - 回到家
- \`/sethome [名称]\` - 设置家
- \`/tpa [玩家名]\` - 传送请求

### 3. 新手礼包
新玩家可以使用 \`/kit starter\` 获取新手礼包，包含：
- 基础工具套装
- 初始食物
- 建筑材料

## 服务器特色

### 🎮 游戏功能
- **假人系统** - 挂机助手
- **传送点系统** - 快速移动
- **图片系统** - 分享截图
- **点歌功能** - 音乐播放
- **称号系统** - 个性展示
- **箱子商店** - 经济交易

### 🔫 特色系统
- **枪械系统** - 现代武器
- **超大视距** - 更好体验
- **额外附魔** - 增强装备

### 🎯 小游戏
- 独立的小游戏服务器
- 多种休闲娱乐模式

## 社区文化

屯人服致力于打造一个和谐友好的游戏环境，欢迎所有热爱《我的世界》的玩家加入我们的大家庭！`,
      slug: 'getting-started',
      categoryName: '开始使用',
      tags: ['入门', '新手', '指南'],
      order: 1
    },
    {
      title: '服务器规则',
      content: `# 服务器规则

## 基本准则

### 🚫 禁止行为
1. **恶意破坏**：故意破坏他人建筑
2. **偷盗行为**：未经允许拿取他人物品
3. **恶意PVP**：在和平区域进行恶意攻击
4. **开挂作弊**：使用任何形式的外挂程序
5. **言语骚扰**：辱骂、歧视、恶意言论

### ✅ 鼓励行为
1. **友好合作**：与其他玩家友好相处
2. **创意建筑**：发挥创造力建造优秀作品
3. **资源共享**：适当共享资源，互帮互助
4. **积极参与**：参与服务器活动和社区建设

## 处罚措施

### 警告系统
- **首次违规**：口头警告
- **二次违规**：书面警告
- **三次违规**：临时封禁

### 封禁政策
- **轻微违规**：1-7天临时封禁
- **严重违规**：30天以上封禁
- **极严重违规**：永久封禁

### 申诉流程
如果认为处罚有误，可以：
1. 在QQ群联系管理员
2. 提供相关证据
3. 等待管理员审核
4. 接受最终裁决

## 建筑规范

### 领地保护
- 使用 \`/claim\` 保护重要建筑
- 尊重他人的领地范围
- 不在他人领地附近恶意建造

### 建筑标准
- 建筑应当美观、符合主题
- 不建造有害环境的结构
- 合理利用空间，不过度占用

## 经济规则

### 交易规范
- 诚信交易，不欺骗他人
- 价格合理，不恶意垄断
- 使用官方货币系统

### 商店管理
- 箱子商店需要合理定价
- 定期补充商店库存
- 不设置陷阱商店

## 技术规范

### 红石机械
- 红石设备需要合理设计
- 不制造造成卡顿的机械
- 大型机械需要申请

### 自动化农场
- 允许合理的自动化设施
- 不建造过度消耗资源的农场
- 注意对服务器性能的影响

记住：屯人服是大家的家，让我们一起维护这个美好的游戏环境！`,
      slug: 'server-rules',
      categoryName: '规则制度',
      tags: ['规则', '制度', '管理'],
      order: 1
    },
    {
      title: '传送点系统',
      content: `# 传送点系统

传送点系统是屯人服的核心功能之一，为玩家提供便捷的快速移动方式。

## 基础命令

### 设置家
\`\`\`
/sethome [名称]
\`\`\`
在当前位置设置一个家，可以设置多个家并命名。

### 回家
\`\`\`
/home [名称]
\`\`\`
传送到指定的家，如果不指定名称则传送到默认家。

### 查看家列表
\`\`\`
/homes
\`\`\`
查看所有已设置的家。

### 删除家
\`\`\`
/delhome [名称]
\`\`\`
删除指定的家。

## 传送请求

### 发送传送请求
\`\`\`
/tpa [玩家名]
\`\`\`
向指定玩家发送传送到他身边的请求。

### 传送邀请
\`\`\`
/tpahere [玩家名]
\`\`\`
邀请指定玩家传送到你身边。

### 接受请求
\`\`\`
/tpaccept
\`\`\`
接受最近收到的传送请求。

### 拒绝请求
\`\`\`
/tpdeny
\`\`\`
拒绝最近收到的传送请求。

## 公共传送点

### 主城传送
\`\`\`
/spawn
\`\`\`
传送回服务器主城。

### 随机传送
\`\`\`
/rtp
\`\`\`
随机传送到野外，适合寻找新的建筑地点。

### 世界传送
\`\`\`
/world [世界名]
\`\`\`
传送到指定世界，支持：
- \`overworld\` - 主世界
- \`nether\` - 下界
- \`end\` - 末地

## 传送限制

### 冷却时间
- 普通传送：5秒冷却
- 跨世界传送：10秒冷却
- 随机传送：30秒冷却

### 安全检查
系统会自动检查目标位置的安全性：
- 避免传送到岩浆中
- 避免传送到虚空
- 确保有足够的空间

### 距离限制
- tpa请求无距离限制
- 设置家需要在自己的领地内
- 某些特殊区域禁止传送

## 高级功能

### 传送石
使用传送石可以：
- 快速传送到绑定位置
- 无需输入命令
- 可以交易给其他玩家

### VIP特权
VIP玩家享有额外特权：
- 更多家的数量限制
- 更短的冷却时间
- 特殊传送权限

### 传送历史
\`\`\`
/back
\`\`\`
返回上一个位置，适合误传送时使用。

## 注意事项

1. **传送安全**：传送前确认目标位置安全
2. **请求礼貌**：发送传送请求时保持礼貌
3. **避免滥用**：不要频繁发送传送请求
4. **领地保护**：尊重他人的私人领地
5. **应急使用**：遇到危险时可以使用/spawn逃生

传送系统让屯人服的世界变得更加便利，合理使用这些功能可以大大提升游戏体验！`,
      slug: 'teleport-system',
      categoryName: '游戏功能',
      tags: ['传送', '功能', '命令'],
      order: 1
    },
    {
      title: '假人系统',
      content: `# 假人系统

假人系统允许玩家在离线时保持在线状态，继续进行自动化任务。

## 基本概念

假人是一个虚拟的玩家角色，可以代替真实玩家执行简单的任务：
- 保持农场运行
- 维持红石机械
- 占位守护重要区域

## 假人命令

### 创建假人
\`\`\`
/player [假人名] spawn
\`\`\`
在当前位置创建一个假人。

### 假人移动
\`\`\`
/player [假人名] move forward
/player [假人名] move back
/player [假人名] move left
/player [假人名] move right
\`\`\`

### 假人动作
\`\`\`
/player [假人名] attack continuous
/player [假人名] use continuous
/player [假人名] jump continuous
\`\`\`

### 删除假人
\`\`\`
/player [假人名] kill
\`\`\`

## 使用场景

### 农场维护
- **刷怪塔**：保持区块加载，持续产出怪物
- **农作物农场**：自动收割和种植
- **动物农场**：维持动物繁殖

### 红石机械
- **时钟电路**：保持复杂红石电路运行
- **自动化生产**：维持生产线正常工作
- **信号传输**：保持长距离信号传输

### 区域守护
- **领地保护**：防止重要区域被怪物破坏
- **建筑保护**：维护大型建筑周围环境
- **资源点守护**：保护重要资源采集点

## 假人限制

### 数量限制
- 普通玩家：最多2个假人
- VIP玩家：最多5个假人
- 管理员：无限制

### 功能限制
假人**不能**执行的操作：
- 聊天和社交
- 复杂的建造任务
- 使用高级工具
- 参与PVP战斗

### 时间限制
- 单次运行：最长24小时
- 每日使用：累计不超过8小时
- 冷却时间：删除后需等待30分钟

## 高级应用

### 假人脚本
\`\`\`
/player [假人名] set_home
/player [假人名] go_home
/player [假人名] follow [玩家名]
\`\`\`

### 假人装备
假人可以装备：
- 工具（镐、斧、锄等）
- 武器（剑、弓等）
- 防具（提供基础保护）

### 假人AI
设置假人的行为模式：
- **被动模式**：只执行基本任务
- **主动模式**：会主动寻找目标
- **防御模式**：会反击攻击者

## 管理功能

### 假人列表
\`\`\`
/player list
\`\`\`
查看所有在线假人。

### 假人状态
\`\`\`
/player [假人名] status
\`\`\`
查看指定假人的详细状态。

### 假人传送
\`\`\`
/tp [假人名]
\`\`\`
传送到指定假人位置。

## 注意事项

1. **合理使用**：不要滥用假人系统
2. **性能考虑**：过多假人会影响服务器性能
3. **安全防护**：假人可能被其他玩家攻击
4. **定期检查**：及时清理不需要的假人
5. **遵守规则**：假人使用需遵守服务器规则

假人系统是屯人服的特色功能，合理使用可以大大提升游戏效率和体验！`,
      slug: 'bot-system',
      categoryName: '游戏功能',
      tags: ['假人', 'AI', '自动化'],
      order: 2
    },
    {
      title: 'API接口文档',
      content: `# API接口文档

本文档描述了MXacc Wiki系统的API接口，为开发者提供完整的接口说明。

## 基础信息

### 基础URL
\`\`\`
https://你的域名/api/wiki
\`\`\`

### 认证方式
使用Bearer Token认证：
\`\`\`
Authorization: Bearer <your_token>
\`\`\`

### 响应格式
所有API返回JSON格式：
\`\`\`json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
\`\`\`

## 公开API（无需认证）

### 获取Wiki页面
\`\`\`
GET /api/wiki/content?action=get-page&slug=page-slug
\`\`\`

**参数：**
- \`action\`: 固定值 "get-page"
- \`slug\`: 页面URL标识
- \`pageId\`: 页面ID（可选，与slug二选一）

**响应：**
\`\`\`json
{
  "success": true,
  "data": {
    "_id": "page_id",
    "title": "页面标题",
    "content": "页面内容",
    "slug": "page-slug",
    "category": {
      "_id": "category_id",
      "name": "分类名称"
    },
    "tags": ["标签1", "标签2"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
\`\`\`

### 获取分类列表
\`\`\`
GET /api/wiki/content?action=get-categories
\`\`\`

### 获取页面列表
\`\`\`
GET /api/wiki/content?action=get-pages&categoryId=xxx&page=1&limit=20
\`\`\`

### 搜索页面
\`\`\`
GET /api/wiki/content?action=search&search=关键词&page=1&limit=20
\`\`\`

### 获取导航结构
\`\`\`
GET /api/wiki/content?action=get-navigation
\`\`\`

### 获取最近更新
\`\`\`
GET /api/wiki/content?action=get-recent&limit=10
\`\`\`

### 获取统计信息
\`\`\`
GET /api/wiki/content?action=get-stats
\`\`\`

## 管理API（需要管理员权限）

### 创建分类
\`\`\`
POST /api/wiki/management
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "action": "create-category",
  "name": "分类名称",
  "description": "分类描述",
  "order": 1
}
\`\`\`

### 更新分类
\`\`\`
PUT /api/wiki/management
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "action": "update-category",
  "categoryId": "category_id",
  "name": "新名称",
  "description": "新描述",
  "order": 2
}
\`\`\`

### 删除分类
\`\`\`
DELETE /api/wiki/management
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "action": "delete-category",
  "categoryId": "category_id"
}
\`\`\`

### 创建页面
\`\`\`
POST /api/wiki/management
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "action": "create-page",
  "title": "页面标题",
  "content": "页面内容（支持Markdown）",
  "slug": "page-slug",
  "categoryId": "category_id",
  "tags": ["标签1", "标签2"],
  "order": 1,
  "published": true
}
\`\`\`

### 更新页面
\`\`\`
PUT /api/wiki/management
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "action": "update-page",
  "pageId": "page_id",
  "title": "新标题",
  "content": "新内容",
  "categoryId": "new_category_id",
  "tags": ["新标签"],
  "published": true
}
\`\`\`

### 删除页面
\`\`\`
DELETE /api/wiki/management
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "action": "delete-page",
  "pageId": "page_id"
}
\`\`\`

## 错误代码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

## 数据结构

### 页面对象
\`\`\`typescript
interface WikiPage {
  _id: string
  title: string
  content: string
  slug: string
  categoryId?: string
  category?: WikiCategory
  tags: string[]
  order: number
  published: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}
\`\`\`

### 分类对象
\`\`\`typescript
interface WikiCategory {
  _id: string
  name: string
  description: string
  order: number
  createdAt: string
  createdBy: string
}
\`\`\`

## 使用示例

### JavaScript/Fetch
\`\`\`javascript
// 获取页面
const response = await fetch('/api/wiki/content?action=get-page&slug=getting-started')
const data = await response.json()

if (data.success) {
  console.log(data.data.title)
}

// 创建页面（需要管理员权限）
const createResponse = await fetch('/api/wiki/management', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    action: 'create-page',
    title: '新页面',
    content: '# 新页面内容',
    slug: 'new-page'
  })
})
\`\`\`

### curl
\`\`\`bash
# 获取页面
curl "https://你的域名/api/wiki/content?action=get-page&slug=getting-started"

# 创建页面
curl -X POST "https://你的域名/api/wiki/management" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "action": "create-page",
    "title": "新页面",
    "content": "# 页面内容",
    "slug": "new-page"
  }'
\`\`\`

## 限制说明

1. **频率限制**：每分钟最多100次请求
2. **内容长度**：页面内容最大100KB
3. **标签数量**：每个页面最多10个标签
4. **slug格式**：只允许字母、数字、连字符和下划线

更多技术细节请联系开发团队。`,
      slug: 'api-documentation',
      categoryName: 'API文档',
      tags: ['API', '文档', '开发'],
      order: 1
    }
  ]
}

async function importWikiData() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017')
  
  try {
    await client.connect()
    console.log('连接到MongoDB成功')
    
    const db = client.db('mxacc')
    const categoriesCollection = db.collection('wiki_categories')
    const pagesCollection = db.collection('wiki_pages')
    
    // 清空现有数据
    await categoriesCollection.deleteMany({})
    await pagesCollection.deleteMany({})
    console.log('清空现有Wiki数据')
    
    // 导入分类
    const categoryMap = {}
    for (const categoryData of wikiData.categories) {
      const category = {
        ...categoryData,
        createdAt: new Date(),
        createdBy: 'system'
      }
      
      const result = await categoriesCollection.insertOne(category)
      categoryMap[categoryData.name] = result.insertedId
      console.log(`创建分类: ${categoryData.name}`)
    }
    
    // 导入页面
    for (const pageData of wikiData.pages) {
      const page = {
        title: pageData.title,
        content: pageData.content,
        slug: pageData.slug,
        categoryId: categoryMap[pageData.categoryName],
        tags: pageData.tags,
        order: pageData.order,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system'
      }
      
      await pagesCollection.insertOne(page)
      console.log(`创建页面: ${pageData.title}`)
    }
    
    console.log('Wiki数据导入完成！')
    console.log(`- 导入了 ${wikiData.categories.length} 个分类`)
    console.log(`- 导入了 ${wikiData.pages.length} 个页面`)
    
  } catch (error) {
    console.error('导入数据时出错:', error)
  } finally {
    await client.close()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  importWikiData()
}

module.exports = { importWikiData, wikiData } 