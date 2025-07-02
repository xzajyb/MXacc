const { MongoClient } = require('mongodb')
const fs = require('fs').promises
const path = require('path')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'mxacc'

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
    
    await fs.ensureDir(vitepressDir)
    await fs.ensureDir(docsDir)
    await fs.ensureDir(publicDir)

    // 构建侧边栏
    const sidebar = buildSidebar(categories, documents)

    // 更新 VitePress 配置
    const configPath = path.join(vitepressDir, 'config.mts')
    const configContent = `import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "MXacc 文档中心",
  description: "MXacc 企业级社交管理平台官方文档",
  lang: 'zh-CN',
  base: '/docs/',
  outDir: '../public/docs',
  
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
      // 启用图像懒加载
      lazyLoading: true
    },
    container: {
      tipLabel: '提示',
      warningLabel: '注意',
      dangerLabel: '警告',
      infoLabel: '信息',
      detailsLabel: '详细信息'
    },
    math: true,  // 启用数学公式支持
    attrs: {
      // 启用属性支持，用于3D模型和自定义组件
      leftDelimiter: '{',
      rightDelimiter: '}'
    }
  },
  
  // Vite配置，支持3D模型文件类型
  vite: {
    assetsInclude: [
      // 支持3D模型文件格式
      '**/*.gltf',
      '**/*.glb', 
      '**/*.fbx',
      '**/*.obj',
      '**/*.dae',
      '**/*.3ds',
      '**/*.ply',
      '**/*.stl'
    ],
    optimizeDeps: {
      include: [
        'three',
        '@tweenjs/tween.js'
      ]
    }
  },
  
  themeConfig: {
    logo: '/docs/logo.png',
    siteTitle: 'MXacc 文档',
    
    nav: [
      { text: '首页', link: '/' },
      { text: '用户指南', link: '/guide/' },
      { text: 'API文档', link: '/api/' },
      { text: '开发指南', link: '/dev/' },
      { 
        text: '更多',
        items: [
          { text: '更新日志', link: '/changelog' },
          { text: '常见问题', link: '/faq' },
          { text: '返回应用', link: '${process.env.FRONTEND_URL || 'http://localhost:5173'}' }
        ]
      }
    ],

    sidebar: ${JSON.stringify(sidebar, null, 6)},

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/mxacc' }
    ],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © ${new Date().getFullYear()} MXacc Team'
    },

    editLink: {
      pattern: 'javascript:void(0)', // 禁用GitHub编辑，因为内容由后台管理
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
    console.log('✅ VitePress配置已更新（保留原生功能和3D模型支持）')

    // 生成文档文件
    console.log('📝 生成文档文件...')
    await generateDocuments(docsDir, categories, documents)

    // 生成首页
    await generateIndexPage(docsDir, categories, documents)

    console.log('🎉 Wiki构建完成！')
    console.log('💡 VitePress原生前端和md渲染器已保留，支持3D模型等高级功能')
    
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