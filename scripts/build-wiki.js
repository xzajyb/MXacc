const { MongoClient } = require('mongodb')
const fs = require('fs').promises
const path = require('path')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'mxacc'

async function buildWiki() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    console.log('🔄 连接到 MongoDB...')
    await client.connect()
    const db = client.db(DB_NAME)
    
    console.log('📚 获取文档数据...')
    const categories = await db.collection('wiki_categories')
      .find({ isVisible: true })
      .sort({ order: 1, name: 1 })
      .toArray()
    
    const documents = await db.collection('wikis')
      .find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .toArray()
    
    console.log(`📂 发现 ${categories.length} 个分类，${documents.length} 篇文档`)
    
    // 清理并重建 docs 目录结构
    const docsDir = path.join(process.cwd(), 'docs')
    
    // 保留 .vitepress 目录
    const vitepressDir = path.join(docsDir, '.vitepress')
    const vitepressExists = await fs.access(vitepressDir).then(() => true).catch(() => false)
    
    if (!vitepressExists) {
      console.log('❌ .vitepress 目录不存在，请先运行 npx vitepress init')
      process.exit(1)
    }
    
    // 清理旧的文档文件（保留 .vitepress）
    const docsContent = await fs.readdir(docsDir)
    for (const item of docsContent) {
      if (item !== '.vitepress') {
        const itemPath = path.join(docsDir, item)
        const stat = await fs.stat(itemPath)
        if (stat.isDirectory()) {
          await fs.rm(itemPath, { recursive: true, force: true })
        } else {
          await fs.unlink(itemPath)
        }
      }
    }
    
    // 创建首页
    await fs.writeFile(path.join(docsDir, 'index.md'), `---
layout: home

hero:
  name: MXacc 文档中心
  text: 企业级社交管理平台
  tagline: 功能强大、安全可靠的现代化社交平台解决方案
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看源码
      link: https://github.com/yourusername/mxacc

features:
  - title: 🚀 现代化架构
    details: 基于 React 18 + TypeScript + MongoDB 构建，提供出色的开发体验
  - title: 🔐 企业级安全
    details: 完整的用户认证、权限管理、数据加密和安全审计
  - title: 💬 丰富的社交功能
    details: 支持帖子发布、评论系统、私信聊天、用户关注等完整社交功能
  - title: 📱 响应式设计
    details: 适配桌面端和移动端，提供一致的用户体验
  - title: 🎨 可定制主题
    details: 支持深色/浅色模式切换，可自定义界面风格
  - title: ⚡ 高性能
    details: 优化的数据库查询、缓存策略和前端性能优化
---
`)

    console.log('✅ 创建首页完成')
    
    // 生成侧边栏配置
    const sidebar = []
    
    // 按分类组织文档
    const categorizedDocs = new Map()
    const uncategorizedDocs = []
    
    for (const doc of documents) {
      if (doc.categoryId) {
        const categoryId = doc.categoryId.toString()
        if (!categorizedDocs.has(categoryId)) {
          categorizedDocs.set(categoryId, [])
        }
        categorizedDocs.get(categoryId).push(doc)
      } else {
        uncategorizedDocs.push(doc)
      }
    }
    
    // 创建分类目录和文档
    for (const category of categories) {
      const categoryId = category._id.toString()
      const categoryDocs = categorizedDocs.get(categoryId) || []
      
      if (categoryDocs.length === 0) continue
      
      // 创建分类目录
      const categoryDir = path.join(docsDir, category.slug)
      await fs.mkdir(categoryDir, { recursive: true })
      
      // 创建分类索引页
      await fs.writeFile(path.join(categoryDir, 'index.md'), `# ${category.name}

${category.description || ''}

## 文档列表

${categoryDocs.map(doc => `- [${doc.title}](./${doc.slug}.md)`).join('\n')}
`)
      
      // 创建分类下的文档
      const sidebarItems = []
      for (const doc of categoryDocs) {
        const docPath = path.join(categoryDir, `${doc.slug}.md`)
        const frontmatter = `---
title: ${doc.title}
---

# ${doc.title}

${doc.content}

---

*最后更新时间: ${doc.updatedAt.toLocaleDateString('zh-CN')}*  
*作者: ${doc.author?.displayName || doc.author?.username || '管理员'}*
`
        await fs.writeFile(docPath, frontmatter)
        
        sidebarItems.push({
          text: doc.title,
          link: `/${category.slug}/${doc.slug}`
        })
      }
      
      sidebar.push({
        text: category.name,
        collapsed: false,
        items: [
          { text: '概览', link: `/${category.slug}/` },
          ...sidebarItems
        ]
      })
      
      console.log(`📁 创建分类 "${category.name}" 完成，包含 ${categoryDocs.length} 篇文档`)
    }
    
    // 处理未分类文档
    if (uncategorizedDocs.length > 0) {
      const guideDir = path.join(docsDir, 'guide')
      await fs.mkdir(guideDir, { recursive: true })
      
      const sidebarItems = []
      for (const doc of uncategorizedDocs) {
        const docPath = path.join(guideDir, `${doc.slug}.md`)
        const frontmatter = `---
title: ${doc.title}
---

# ${doc.title}

${doc.content}

---

*最后更新时间: ${doc.updatedAt.toLocaleDateString('zh-CN')}*  
*作者: ${doc.author?.displayName || doc.author?.username || '管理员'}*
`
        await fs.writeFile(docPath, frontmatter)
        
        sidebarItems.push({
          text: doc.title,
          link: `/guide/${doc.slug}`
        })
      }
      
      sidebar.unshift({
        text: '指南',
        collapsed: false,
        items: sidebarItems
      })
      
      console.log(`📁 创建 "指南" 分类完成，包含 ${uncategorizedDocs.length} 篇未分类文档`)
    }
    
    // 更新 VitePress 配置
    const configPath = path.join(vitepressDir, 'config.mts')
    const configContent = `import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "MXacc 文档中心",
  description: "MXacc 企业级社交管理平台官方文档",
  
  head: [
    ['link', { rel: 'icon', href: '/logo.png' }]
  ],
  
  themeConfig: {
    logo: '/logo.png',
    
    nav: [
      { text: '首页', link: '/' },
      { text: '文档', link: '/guide/' },
      { text: '返回应用', link: '${process.env.FRONTEND_URL || 'http://localhost:5173'}' }
    ],

    sidebar: ${JSON.stringify(sidebar, null, 6)},

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/mxacc' }
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 MXacc Team'
    },
    
    search: {
      provider: 'local'
    },
    
    editLink: {
      pattern: 'javascript:void(0)',
      text: '编辑此页'
    },
    
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    }
  }
})
`
    
    await fs.writeFile(configPath, configContent)
    console.log('⚙️ 更新 VitePress 配置完成')
    
    // 复制 logo 文件
    const publicDir = path.join(docsDir, 'public')
    await fs.mkdir(publicDir, { recursive: true })
    
    const logoSrc = path.join(process.cwd(), 'public', 'logo.png')
    const logoDest = path.join(publicDir, 'logo.png')
    
    try {
      await fs.copyFile(logoSrc, logoDest)
      console.log('🖼️ 复制 logo 完成')
    } catch (error) {
      console.log('⚠️ logo 文件不存在，跳过复制')
    }
    
    console.log('🎉 Wiki 构建完成！')
    console.log('💡 运行以下命令启动文档服务：')
    console.log('   cd docs && npm run docs:dev')
    
  } catch (error) {
    console.error('❌ 构建失败:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  buildWiki()
}

module.exports = buildWiki 