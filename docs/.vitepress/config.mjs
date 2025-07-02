import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MXacc 文档中心',
  description: '梦锡工作室账号管理系统 - 官方文档',
  lang: 'zh-CN',
  base: '/docs/',
  
  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#667eea' }]
  ],

  themeConfig: {
    logo: '/logo.svg',
    
    // 隐藏顶部导航栏
    nav: false,

    // 动态侧边栏将在构建时生成
    sidebar: [
      {
        text: '指南',
        items: [
          { text: '介绍', link: '/guide/' },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '用户手册', link: '/guide/user-manual' },
          { text: '管理员指南', link: '/guide/admin-guide' }
        ]
      },
      {
        text: 'API 文档',
        items: [
          { text: 'API 概述', link: '/api/overview' },
          { text: '认证 API', link: '/api/auth' },
          { text: '用户 API', link: '/api/user' },
          { text: '社交 API', link: '/api/social' }
        ]
      },
      {
        text: '开发',
        items: [
          { text: '部署指南', link: '/development/deployment' },
          { text: '开发环境', link: '/development/setup' },
          { text: '贡献指南', link: '/development/contributing' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/xzajyb/MXacc' }
    ],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024 梦锡工作室'
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
    }
  },

  markdown: {
    lineNumbers: true
  },

  // 添加构建钩子来处理数据库内容
  buildEnd: async (siteConfig) => {
    // 这里可以添加从数据库获取内容的逻辑
    console.log('VitePress构建完成，文档已生成')
  }
}) 