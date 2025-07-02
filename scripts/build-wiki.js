const { MongoClient } = require('mongodb')
const fs = require('fs').promises
const path = require('path')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'mxacc'

// 连接数据库
async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  return client
}

// 构建侧边栏
function buildSidebar(categories, documents) {
  const sidebar = []
  
  // 为每个分类生成侧边栏项
  categories.forEach(category => {
    const categoryDocs = documents.filter(doc => doc.categoryId === category._id.toString())
    
    if (categoryDocs.length > 0) {
      const sidebarItem = {
        text: category.name,
        items: categoryDocs.map(doc => ({
          text: doc.title,
          link: `/${category.slug}/${doc.slug}`
        }))
      }
      sidebar.push(sidebarItem)
    }
  })
  
  return sidebar
}

// 生成文档文件
async function generateDocuments(docsDir, categories, documents) {
  // 清理旧文档
  try {
    const dirs = await fs.readdir(docsDir)
    for (const dir of dirs) {
      const dirPath = path.join(docsDir, dir)
      try {
        const stat = await fs.stat(dirPath)
        if (stat.isDirectory() && dir !== '.vitepress' && dir !== 'public') {
          await fs.rmdir(dirPath, { recursive: true })
        }
      } catch (e) {
        // 忽略错误
      }
    }
  } catch (e) {
    // 目录不存在，忽略
  }

  // 为每个分类创建目录和文档
  for (const category of categories) {
    const categoryDir = path.join(docsDir, category.slug)
    await fs.mkdir(categoryDir, { recursive: true })
    
    const categoryDocs = documents.filter(doc => doc.categoryId === category._id.toString())
    
    for (const doc of categoryDocs) {
      const docPath = path.join(categoryDir, `${doc.slug}.md`)
      const content = `# ${doc.title}

${doc.content}

---
*最后更新：${new Date(doc.updatedAt).toLocaleDateString('zh-CN')}*
`
      await fs.writeFile(docPath, content)
    }
  }
}

// 创建重定向页面而不是首页
async function generateRedirectPage(docsDir, categories, documents) {
  // 找第一个有效的文档作为重定向目标
  let redirectTarget = '/guide/getting-started'
  
  if (categories.length > 0) {
    const firstCategory = categories[0]
    const firstCategoryDocs = documents.filter(doc => doc.categoryId === firstCategory._id.toString())
    if (firstCategoryDocs.length > 0) {
      redirectTarget = `/${firstCategory.slug}/${firstCategoryDocs[0].slug}`
    }
  }

  const indexContent = `---
layout: home
---

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 自动重定向到第一个文档
  if (typeof window !== 'undefined') {
    window.location.href = '${redirectTarget}'
  }
})
</script>

# 正在跳转...

正在跳转到文档内容，如果没有自动跳转，请点击：[进入文档](${redirectTarget})
`

  const indexPath = path.join(docsDir, 'index.md')
  await fs.writeFile(indexPath, indexContent)
}

async function buildWiki() {
  try {
    console.log('🚀 开始构建Wiki文档...')
    
    // 连接数据库
    console.log('📦 连接数据库...')
    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    
    // 获取分类和文档
    console.log('📚 获取Wiki数据...')
    const categories = await db.collection('wiki_categories')
      .find({ isVisible: { $ne: false } })
      .sort({ order: 1, name: 1 })
      .toArray()
      
    const documents = await db.collection('wikis')
      .find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .toArray()

    console.log(`找到 ${categories.length} 个分类和 ${documents.length} 篇文档`)

    // 确保目录存在
    const vitepressDir = path.join(process.cwd(), 'docs/.vitepress')
    const docsDir = path.join(process.cwd(), 'docs')
    const publicDir = path.join(process.cwd(), 'public/docs')
    
    await fs.mkdir(vitepressDir, { recursive: true })
    await fs.mkdir(docsDir, { recursive: true })
    await fs.mkdir(publicDir, { recursive: true })

    // 构建侧边栏
    const sidebar = buildSidebar(categories, documents)

    // 更新 VitePress 配置
    const configPath = path.join(vitepressDir, 'config.mjs')
    const configContent = `import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MXacc 文档中心',
  description: 'MXacc 企业级社交管理平台官方文档',
  lang: 'zh-CN',
  base: '/docs/',
  
  head: [
    ['link', { rel: 'icon', href: '/docs/logo.png' }],
    ['meta', { name: 'theme-color', content: '#667eea' }],
    ['meta', { name: 'author', content: 'MXacc Team' }],
    ['meta', { name: 'keywords', content: 'MXacc,文档,API,用户指南,开发指南' }]
  ],
  
  // VitePress原生markdown配置，支持3D模型和高级功能
  markdown: {
    lineNumbers: true,
    image: {
      lazyLoading: true
    },
    container: {
      tipLabel: '提示',
      warningLabel: '注意',
      dangerLabel: '警告',
      infoLabel: '信息',
      detailsLabel: '详细信息'
    },
    math: true,
    attrs: {
      leftDelimiter: '{',
      rightDelimiter: '}'
    }
  },
  
  // Vite配置，支持3D模型文件类型
  vite: {
    assetsInclude: [
      '**/*.gltf', '**/*.glb', '**/*.fbx', '**/*.obj',
      '**/*.dae', '**/*.3ds', '**/*.ply', '**/*.stl'
    ],
    optimizeDeps: {
      include: ['three', '@tweenjs/tween.js']
    }
  },
  
  themeConfig: {
    logo: '/docs/logo.png',
    siteTitle: 'MXacc 文档',
    
    // 隐藏顶部导航栏，提供更干净的内嵌体验
    nav: false,

    sidebar: ${JSON.stringify(sidebar, null, 6)},

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/mxacc' }
    ],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © ${new Date().getFullYear()} MXacc Team'
    },

    editLink: {
      pattern: 'javascript:void(0)',
      text: '内容由管理员维护'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      label: '页面导航'
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换'
                }
              }
            }
          }
        }
      }
    }
  }
})
`

    await fs.writeFile(configPath, configContent)
    console.log('✅ VitePress配置已更新（已移除导航栏）')

    // 生成文档文件
    console.log('📝 生成文档文件...')
    await generateDocuments(docsDir, categories, documents)

    // 生成重定向页面而不是首页
    await generateRedirectPage(docsDir, categories, documents)

    // 关闭数据库连接
    await client.close()

    console.log('🎉 Wiki构建完成！')
    console.log('💡 已移除导航栏，首页自动重定向到内容页面')
    
  } catch (error) {
    console.error('❌ Wiki构建失败:', error)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  buildWiki()
    .then(() => {
      console.log('✨ 构建完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('构建失败:', error)
      process.exit(1)
    })
}

// 导出函数供API调用
module.exports = buildWiki 