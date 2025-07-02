import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Search, Menu, X, FileText, Folder, Plus, Edit, Trash2, Settings, Home, List, ChevronUp, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import Toast from '@/components/Toast'
import MarkdownRenderer from '@/components/VitePress/MarkdownRenderer'
import DocEditor from '@/components/VitePress/DocEditor'

interface DocContent {
  _id: string
  title: string
  slug: string
  content: string
  category: string
  categoryPath: string
  path: string
  isPublic: boolean
  author: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

interface Category {
  name: string
  categoryPath: string
  path: string
  docs: DocContent[]
  subcategories?: Category[]
}

interface TocItem {
  id: string
  text: string
  level: number
}

const DocsPage: React.FC = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [docs, setDocs] = useState<DocContent[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentDoc, setCurrentDoc] = useState<DocContent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingDoc, setEditingDoc] = useState<DocContent | null>(null)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [toc, setToc] = useState<TocItem[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // 管理员权限检查
  const isAdmin = user?.role === 'admin'

  // 获取分类显示名称
  const getCategoryName = (category: string): string => {
    const categoryNames: Record<string, string> = {
      'guide': '指南',
      'api': 'API 文档',
      'development': '开发',
      'tutorial': '教程',
      'faq': '常见问题',
      'security': '安全',
      'deployment': '部署',
      'configuration': '配置',
      'troubleshooting': '故障排除',
      'best-practices': '最佳实践',
      'advanced': '高级',
      'basic': '基础'
    }
    return categoryNames[category] || category
  }

  // 提取文档目录
  const extractToc = (content: string): TocItem[] => {
    const lines = content.split('\n')
    const tocItems: TocItem[] = []
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,4})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const text = match[2].trim()
        const id = `heading-${index}-${text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '-')}`
        
        tocItems.push({
          id,
          text,
          level
        })
      }
    })
    
    return tocItems
  }

  // 滚动到标题
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      // 移动端点击目录项后关闭导航
      if (window.innerWidth < 1024) {
        setShowMobileNav(false)
      }
    }
  }

  // 返回顶部
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (window.innerWidth < 1024) {
      setShowMobileNav(false)
    }
  }

  // 获取文档列表
  const fetchDocs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/social/content?action=get-docs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setDocs(data.docs || [])
        organizeDocs(data.docs || [])
      } else {
        setError(data.message || '获取文档失败')
      }
    } catch (error) {
      console.error('获取文档错误:', error)
      setError('获取文档失败')
    } finally {
      setLoading(false)
    }
  }

  // 组织文档结构 - 按categoryPath树状排序
  const organizeDocs = (docsData: DocContent[]) => {
    const categoryMap = new Map<string, Category>()
    
    docsData.forEach(doc => {
      const categoryPath = doc.categoryPath || doc.category || 'guide'
      const category = doc.category || 'guide'
      
      if (!categoryMap.has(categoryPath)) {
        categoryMap.set(categoryPath, {
          name: getCategoryName(category),
          categoryPath: categoryPath,
          path: categoryPath,
          docs: []
        })
      }
      categoryMap.get(categoryPath)!.docs.push(doc)
    })
    
    // 按分类路径排序，然后按文档创建时间排序
    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => {
      return a.categoryPath.localeCompare(b.categoryPath)
    })
    
    sortedCategories.forEach(category => {
      category.docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    })
    
    setCategories(sortedCategories)
    
    // 默认展开第一级分类
    const firstLevelCategories = new Set(
      sortedCategories
        .filter(cat => !cat.categoryPath.includes('/'))
        .map(cat => cat.categoryPath)
    )
    setExpandedCategories(firstLevelCategories)
  }

  // 获取单个文档内容
  const fetchDoc = async (docId: string) => {
    try {
      const response = await fetch(`/api/social/content?action=get-doc&docId=${docId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setCurrentDoc(data.doc)
        setToc(extractToc(data.doc.content))
      } else {
        setError(data.message || '获取文档内容失败')
      }
    } catch (error) {
      console.error('获取文档内容错误:', error)
      setError('获取文档内容失败')
    }
  }

  // 搜索过滤
  const filteredDocs = useMemo(() => {
    if (!searchQuery) return docs
    return docs.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [docs, searchQuery])

  // 过滤后的分类
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories
    
    return categories.map(category => ({
      ...category,
      docs: category.docs.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })).filter(category => category.docs.length > 0)
  }, [categories, searchQuery])

  // 保存文档
  const handleSaveDoc = async (docData: any) => {
    try {
      const action = editingDoc ? 'update-doc' : 'create-doc'
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action,
          ...docData
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // 刷新文档列表
        await fetchDocs()
        setError('')
      } else {
        setError(data.message || '保存文档失败')
      }
    } catch (error) {
      console.error('保存文档错误:', error)
      setError('保存文档失败')
    }
  }

  // 删除文档
  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('确定要删除这个文档吗？此操作不可撤销。')) {
      return
    }

    try {
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'delete-doc',
          docId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // 如果删除的是当前文档，清空当前文档
        if (currentDoc?._id === docId) {
          setCurrentDoc(null)
          setToc([])
        }
        // 刷新文档列表
        await fetchDocs()
        setError('')
      } else {
        setError(data.message || '删除文档失败')
      }
    } catch (error) {
      console.error('删除文档错误:', error)
      setError('删除文档失败')
    }
  }

  // 编辑文档
  const handleEditDoc = (doc: DocContent) => {
    setEditingDoc(doc)
    setShowEditor(true)
  }

  // 切换分类展开状态
  const toggleCategory = (categoryPath: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryPath)) {
      newExpanded.delete(categoryPath)
    } else {
      newExpanded.add(categoryPath)
    }
    setExpandedCategories(newExpanded)
  }

  // 窗口大小变化监听
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowMobileNav(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchDocs()
  }, [])

  useEffect(() => {
    // 默认加载第一个文档
    if (docs.length > 0 && !currentDoc) {
      fetchDoc(docs[0]._id)
    }
  }, [docs])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-white dark:bg-gray-900 ${isDark ? 'dark' : ''}`}>
      {/* 移动端头部 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="MXacc" className="w-8 h-8" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">文档中心</h1>
          </div>
          <button
            onClick={() => setShowMobileNav(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* 左侧固定导航 */}
      <div className={`fixed left-0 top-0 bottom-0 w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 z-30 transform transition-transform duration-300 lg:translate-x-0 ${
        showMobileNav ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo区域 */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="MXacc" className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">MXacc</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">文档中心</p>
            </div>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="搜索文档..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
            />
          </div>
        </div>

        {/* 操作按钮 */}
        {isAdmin && (
          <div className="px-4 pb-4 space-y-2">
            <button
              onClick={() => setShowEditor(true)}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
            >
              <Plus size={16} />
              <span>新建文档</span>
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                editMode 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Settings size={16} />
              <span>{editMode ? '退出编辑' : '编辑模式'}</span>
            </button>
          </div>
        )}

        {/* 文档目录 */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* 返回顶部按钮 */}
          <div className="mb-4">
            <button
              onClick={scrollToTop}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2 text-sm"
            >
              <ChevronUp size={16} />
              <span>返回顶部</span>
            </button>
          </div>

          {/* 当前文档目录 */}
          {currentDoc && toc.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                页面目录
              </h4>
              <div className="space-y-1">
                {toc.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    className={`w-full text-left px-3 py-1 rounded text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      item.level === 1 ? 'font-semibold text-gray-900 dark:text-white' :
                      item.level === 2 ? 'ml-3 text-gray-700 dark:text-gray-300' :
                      item.level === 3 ? 'ml-6 text-gray-600 dark:text-gray-400' :
                      'ml-9 text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 文档分类和列表 */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              文档导航
            </h4>
            <div className="space-y-2">
              {filteredCategories.map((category) => (
                <div key={category.categoryPath}>
                  <button
                    onClick={() => toggleCategory(category.categoryPath)}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {expandedCategories.has(category.categoryPath) ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    {category.categoryPath.includes('/') ? (
                      <FolderOpen size={14} />
                    ) : (
                      <Folder size={14} />
                    )}
                    <span className="truncate flex-1 text-left">
                      {category.categoryPath.includes('/') ? 
                        `└─ ${category.name}` : 
                        category.name
                      }
                    </span>
                    <span className="text-xs text-gray-400">({category.docs.length})</span>
                  </button>
                  
                  {expandedCategories.has(category.categoryPath) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {category.docs.map((doc) => (
                        <button
                          key={doc._id}
                          onClick={() => fetchDoc(doc._id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                            currentDoc?._id === doc._id
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <FileText size={14} />
                          <span className="truncate flex-1">{doc.title}</span>
                          {isAdmin && editMode && (
                            <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditDoc(doc)
                                }}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                title="编辑文档"
                              >
                                <Edit size={10} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteDoc(doc._id)
                                }}
                                className="p-1 hover:bg-red-200 dark:hover:bg-red-900 rounded"
                                title="删除文档"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 移动端遮罩层 */}
      {showMobileNav && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setShowMobileNav(false)}
        />
      )}

      {/* 主内容区域 */}
      <main className="lg:ml-80 min-h-screen pt-16 lg:pt-0">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {currentDoc ? (
            <article className="vitepress-content">
              {/* 使用 VitePress 风格的 Markdown 渲染器 */}
              <div className="vitepress-markdown-content">
                <MarkdownRenderer content={currentDoc.content} />
              </div>

              {/* 底部编辑链接（仅管理员可见） */}
              {isAdmin && (
                <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      作者: {currentDoc.author} • 更新于: {new Date(currentDoc.updatedAt).toLocaleDateString('zh-CN')}
                    </span>
                    <button
                      onClick={() => handleEditDoc(currentDoc)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      编辑页面
                    </button>
                  </div>
                </footer>
              )}
            </article>
          ) : (
            <div className="text-center py-24">
              <FileText size={64} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                欢迎使用文档中心
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                从左侧导航选择一个文档开始阅读，或使用搜索功能快速查找内容
              </p>
              {docs.length === 0 && isAdmin && (
                <button
                  onClick={() => setShowEditor(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  创建第一个文档
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 文档编辑器 */}
      <DocEditor
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false)
          setEditingDoc(null)
        }}
        onSave={handleSaveDoc}
        initialDoc={editingDoc}
      />

      {/* 错误提示 */}
      {error && (
        <Toast
          message={error}
          type="error"
          isVisible={!!error}
          onClose={() => setError('')}
        />
      )}
    </div>
  )
}

export default DocsPage