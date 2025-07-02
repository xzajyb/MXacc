---
layout: page
---

# MXacc 文档中心

欢迎使用 MXacc 账号管理系统文档中心。

<div id="dynamic-wiki-content">
  <div style="text-align: center; padding: 2rem;">
    <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
    <p>正在加载文档内容...</p>
  </div>
</div>

<script>
if (typeof window !== 'undefined') {
  // 全局变量存储数据
  let globalDocuments = []
  let globalCategories = []

  // 等待页面加载完成后执行
  document.addEventListener('DOMContentLoaded', function() {
    loadWikiContent()
  })

  async function loadWikiContent() {
    try {
      // 获取文档分类和内容
      const [categoriesRes, documentsRes] = await Promise.all([
        fetch('/api/social/content?action=wiki&type=categories'),
        fetch('/api/social/content?action=wiki&type=list')
      ])
      
      const categoriesData = await categoriesRes.json()
      const documentsData = await documentsRes.json()
      
      if (categoriesData.success && documentsData.success) {
        globalCategories = categoriesData.data || []
        globalDocuments = documentsData.data || []
        renderWikiContent(globalCategories, globalDocuments)
      } else {
        document.getElementById('dynamic-wiki-content').innerHTML = 
          '<div style="text-align: center; padding: 2rem; color: red;"><p>加载文档失败，请稍后重试</p></div>'
      }
    } catch (error) {
      console.error('加载Wiki内容失败:', error)
      document.getElementById('dynamic-wiki-content').innerHTML = 
        '<div style="text-align: center; padding: 2rem; color: red;"><p>网络错误，请检查连接后重试</p></div>'
    }
  }

  function renderWikiContent(categories, documents) {
    const container = document.getElementById('dynamic-wiki-content')
    let currentDocument = documents.length > 0 ? documents[0] : null
    
    // 构建HTML
    const html = `
      <div style="display: flex; gap: 2rem; min-height: 70vh;">
        <!-- 侧边栏 -->
        <div id="wiki-sidebar" style="width: 280px; flex-shrink: 0; background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border: 1px solid #e9ecef; max-height: 80vh; overflow-y: auto;">
          <h3 style="margin: 0 0 1rem 0; font-size: 1.2rem; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 0.5rem;">文档目录</h3>
          <div id="categories-list"></div>
        </div>
        
        <!-- 主内容区 -->
        <div style="flex: 1; min-width: 0;">
          <div id="document-content" style="background: white; padding: 2rem; border-radius: 8px; border: 1px solid #e9ecef; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div id="document-header"></div>
            <div id="document-body"></div>
          </div>
        </div>
      </div>
    `
    
    container.innerHTML = html
    
    // 渲染分类和文档列表
    renderCategories(categories, documents)
    
    // 显示当前文档
    if (currentDocument) {
      displayDocument(currentDocument, categories)
    } else {
      displayWelcome()
    }
  }

  function renderCategories(categories, documents) {
    const categoriesList = document.getElementById('categories-list')
    let html = ''
    
    // 为每个分类生成内容
    categories.forEach(category => {
      const categoryDocs = documents.filter(doc => doc.categoryId === category.id)
      if (categoryDocs.length > 0) {
        html += `
          <div style="margin-bottom: 1.5rem;">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; color: #34495e; font-weight: 600;">${category.name}</h4>
            <ul style="list-style: none; margin: 0; padding: 0;">
              ${categoryDocs.map(doc => `
                <li style="padding: 0.5rem 0.75rem; margin-bottom: 0.25rem; cursor: pointer; border-radius: 4px; transition: all 0.2s ease; font-size: 0.9rem;" 
                    onmouseover="this.style.background='#e3f2fd'; this.style.color='#1976d2'"
                    onmouseout="this.style.background=''; this.style.color=''"
                    onclick="selectDocument('${doc.id}')">
                  ${doc.title}
                </li>
              `).join('')}
            </ul>
          </div>
        `
      }
    })
    
    // 未分类文档
    const uncategorizedDocs = documents.filter(doc => !doc.categoryId || doc.categoryId === '')
    if (uncategorizedDocs.length > 0) {
      html += `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; color: #34495e; font-weight: 600;">未分类</h4>
          <ul style="list-style: none; margin: 0; padding: 0;">
            ${uncategorizedDocs.map(doc => `
              <li style="padding: 0.5rem 0.75rem; margin-bottom: 0.25rem; cursor: pointer; border-radius: 4px; transition: all 0.2s ease; font-size: 0.9rem;" 
                  onmouseover="this.style.background='#e3f2fd'; this.style.color='#1976d2'"
                  onmouseout="this.style.background=''; this.style.color=''"
                  onclick="selectDocument('${doc.id}')">
                ${doc.title}
              </li>
            `).join('')}
          </ul>
        </div>
      `
    }
    
    categoriesList.innerHTML = html
  }

  function selectDocument(docId) {
    const doc = globalDocuments.find(d => d.id === docId)
    if (doc) {
      displayDocument(doc, globalCategories)
      
      // 更新选中状态
      document.querySelectorAll('#categories-list li').forEach(li => {
        li.style.background = ''
        li.style.color = ''
      })
      event.target.style.background = '#2196f3'
      event.target.style.color = 'white'
    }
  }

  function displayDocument(doc, categories) {
    const header = document.getElementById('document-header')
    const body = document.getElementById('document-body')
    
    const categoryName = getCategoryName(doc.categoryId, categories)
    const updateDate = doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('zh-CN') : '未知'
    
    header.innerHTML = `
      <h1 style="margin: 0 0 0.5rem 0; color: #2c3e50; font-size: 2rem;">${doc.title}</h1>
      <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: #6c757d; margin-bottom: 2rem; border-bottom: 1px solid #e9ecef; padding-bottom: 1rem;">
        <span style="background: #e3f2fd; color: #1976d2; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 500;">${categoryName}</span>
        <span>最后更新：${updateDate}</span>
      </div>
    `
    
    body.innerHTML = `<div style="line-height: 1.6; color: #2c3e50;">${doc.content}</div>`
  }

  function displayWelcome() {
    const header = document.getElementById('document-header')
    const body = document.getElementById('document-body')
    
    header.innerHTML = `
      <h1 style="margin: 0 0 0.5rem 0; color: #2c3e50; font-size: 2rem;">欢迎使用 MXacc 文档中心</h1>
    `
    
    body.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: #6c757d;">
        <p>请从左侧选择一篇文档查看。</p>
        <p>如果您是管理员，可以通过管理控制台创建和编辑文档。</p>
        <p style="margin-top: 2rem; font-style: italic;">文档内容通过数据库动态加载，管理员可在后台实时编辑。</p>
      </div>
    `
  }

  function getCategoryName(categoryId, categories) {
    if (!categoryId) return '未分类'
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.name : '未分类'
  }

  // 为全局函数设置window属性，避免作用域问题
  window.selectDocument = selectDocument
}
</script>

<style>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  #dynamic-wiki-content > div {
    flex-direction: column !important;
  }
  
  #wiki-sidebar {
    width: 100% !important;
    max-height: 40vh !important;
  }
}
</style> 