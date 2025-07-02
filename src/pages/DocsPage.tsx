import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Search, Menu, FileText, Plus, Edit, Trash2, Settings, Home } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import Toast from '@/components/Toast'
import VitePressRenderer, { TocItem } from '@/components/VitePress/VitePressRenderer'
import DocEditor from '@/components/VitePress/DocEditor'

interface DocContent {
  _id: string
  title: string
  slug: string
  content: string
  category: string
  path: string
  isPublic: boolean
  author: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

interface Category {
  name: string
  path: string
  docs: DocContent[]
  subcategories?: Category[]
}

const DocsPage: React.FC = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [docs, setDocs] = useState<DocContent[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentDoc, setCurrentDoc] = useState<DocContent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingDoc, setEditingDoc] = useState<DocContent | null>(null)
  const [, setIsDesktop] = useState(false)
  const [currentToc, setCurrentToc] = useState<TocItem[]>([])
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  // 管理员权限检查
  const isAdmin = user?.role === 'admin'

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

  // 组织文档结构
  const organizeDocs = (docsData: DocContent[]) => {
    const categoryMap = new Map<string, Category>()
    
    docsData.forEach(doc => {
      const category = doc.category || 'guide'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          name: getCategoryName(category),
          path: category,
          docs: []
        })
      }
      categoryMap.get(category)!.docs.push(doc)
    })
    
    setCategories(Array.from(categoryMap.values()))
  }

  // 获取分类显示名称
  const getCategoryName = (category: string): string => {
    const categoryNames: Record<string, string> = {
      'guide': '指南',
      'api': 'API 文档',
      'development': '开发',
      'tutorial': '教程',
      'faq': '常见问题'
    }
    return categoryNames[category] || category
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

  // 获取搜索后的分类
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

  // 目录滚动
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // 处理目录更新
  const handleTocUpdate = (toc: TocItem[]) => {
    setCurrentToc(toc)
  }

  // 检测桌面端并自动打开侧边栏
  useEffect(() => {
    const checkDesktop = () => {
      const isDesktopSize = window.innerWidth >= 1024
      setIsDesktop(isDesktopSize)
      if (isDesktopSize) {
        setSidebarOpen(true)
      }
    }
    
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
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
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isDark ? 'dark' : ''}`}>
        {/* 移动端右上角搜索按钮 */}
        <div className="lg:hidden fixed top-6 right-6 z-50">
          <button
            onClick={() => setShowMobileSearch(true)}
            className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-110 active:scale-95 transition-all duration-200 animate-pulse"
            title="搜索文档"
          >
            <Search size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* 左侧悬浮导航栏 */}
      <div className="fixed top-6 left-6 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
          {/* 移动端菜单按钮 */}
          <div className="lg:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
              title="切换菜单"
            >
              <Menu size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* 桌面端导航按钮组 */}
          <div className="hidden lg:flex flex-col p-2 space-y-2">
            {/* Logo */}
            <div className="p-3 text-center border-b border-gray-200 dark:border-gray-700">
              <img src="/logo.svg" alt="MXacc" className="w-8 h-8 mx-auto" />
            </div>

            {/* 搜索 */}
            <div className="relative">
              <input
                type="text"
                placeholder="搜索文档..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>

            {/* 文章目录 */}
            {currentDoc && currentToc.length > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    文章目录
                  </h4>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    title="返回顶部"
                  >
                    ↑ 顶部
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <ul className="space-y-1">
                    {currentToc.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => scrollToHeading(item.id)}
                          className={`w-full text-left py-1 px-2 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            item.level === 1 
                              ? 'font-medium text-gray-900 dark:text-white' 
                              : item.level === 2
                                ? 'font-normal text-gray-700 dark:text-gray-300 pl-4'
                                : 'text-gray-600 dark:text-gray-400 pl-6'
                          }`}
                        >
                          <span className="truncate block">{item.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 管理员操作 */}
            {isAdmin && (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowEditor(true)}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                  title="新建文档"
                >
                  <Plus size={16} />
                  <span>新建文档</span>
                </button>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`w-full px-4 py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 text-sm font-medium ${
                    editMode 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  title={editMode ? '退出编辑模式' : '编辑模式'}
                >
                  <Settings size={16} />
                  <span>{editMode ? '退出编辑' : '编辑模式'}</span>
                </button>
              </div>
            )}

            {/* 返回主站 */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <a
                href="/"
                className="w-full px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 text-sm rounded-xl"
                title="返回主站"
              >
                <Home size={16} />
                <span>返回主站</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端搜索和操作面板 */}
      {(sidebarOpen || showMobileSearch) && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black bg-opacity-50" onClick={() => {
          setSidebarOpen(false)
          setShowMobileSearch(false)
        }}>
          <div className="absolute top-20 left-6 right-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            {/* 搜索 */}
            <div className="relative">
              <input
                type="text"
                placeholder="搜索文档..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>

            {/* 管理员操作 */}
            {isAdmin && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowEditor(true)
                    setSidebarOpen(false)
                    setShowMobileSearch(false)
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus size={16} />
                  <span>新建文档</span>
                </button>
                <button
                  onClick={() => {
                    setEditMode(!editMode)
                    setSidebarOpen(false)
                    setShowMobileSearch(false)
                  }}
                  className={`w-full px-4 py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 ${
                    editMode 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Settings size={16} />
                  <span>{editMode ? '退出编辑' : '编辑模式'}</span>
                </button>
              </div>
            )}

            {/* 返回主站 */}
            <a
              href="/"
              className="w-full px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 rounded-xl"
            >
              <Home size={16} />
              <span>返回主站</span>
            </a>
          </div>
        </div>
      )}

      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && !showMobileSearch && (
        <div 
          className="lg:hidden fixed inset-0 z-[50] bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* VitePress 风格的侧边栏 */}
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} lg:w-80 transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 z-[40] lg:z-auto`}>
          <div className="p-6 h-full overflow-y-auto">
                        <nav className="space-y-6">
              {/* 文档分类 */}
              {filteredCategories.map((category) => (
                <div key={category.path}>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                    {category.name}
                  </h3>
                  <ul className="space-y-2">
                    {category.docs.map((doc) => (
                      <li key={doc._id}>
                        <button
                          onClick={() => fetchDoc(doc._id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                            currentDoc?._id === doc._id
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-400 border-l-2 border-blue-600'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <FileText size={16} />
                          <span className="truncate">{doc.title}</span>
                          {isAdmin && editMode && (
                            <div className="ml-auto flex space-x-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditDoc(doc)
                                }}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                title="编辑文档"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteDoc(doc._id)
                                }}
                                className="p-1 hover:bg-red-200 dark:hover:bg-red-900 rounded"
                                title="删除文档"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* 主内容区域 */}
        <main className="flex-1 min-h-screen">
          <div className="max-w-4xl mx-auto px-6 py-8 lg:pl-8">
            {currentDoc ? (
              <article className="vitepress-content">
                <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {currentDoc.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>作者: {currentDoc.author}</span>
                    <span>•</span>
                    <span>更新于: {new Date(currentDoc.updatedAt).toLocaleDateString('zh-CN')}</span>
                    {currentDoc.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-2">
                          <span>标签:</span>
                          {currentDoc.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </header>
                
                {/* 使用 VitePress 风格的 Markdown 渲染器 */}
                <div className="vitepress-markdown-content">
                  <VitePressRenderer 
                    content={currentDoc.content} 
                    onTocUpdate={handleTocUpdate}
                  />
                </div>

                {/* 底部编辑链接（仅管理员可见） */}
                {isAdmin && (
                  <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>在管理页面编辑此文档</span>
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
                  从左侧侧边栏选择一个文档开始阅读，或使用搜索功能快速查找内容
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
      </div>

      {/* 文档编辑器 */}
      <div className={showEditor ? 'relative z-[100]' : ''}>
        <DocEditor
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false)
            setEditingDoc(null)
          }}
          onSave={handleSaveDoc}
          initialDoc={editingDoc}
        />
      </div>

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