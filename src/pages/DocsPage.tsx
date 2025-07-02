import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Search, Menu, X, FileText, Folder, Plus, Edit, Trash2, Settings, Home, List, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingDoc, setEditingDoc] = useState<DocContent | null>(null)
  const [showFloatingNav, setShowFloatingNav] = useState(true)
  const [showToc, setShowToc] = useState(false)

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
      {/* 左侧悬浮导航栏 */}
      <div className={`fixed left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-50 transition-all duration-300 ${showFloatingNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-2 space-y-2 min-w-[280px] max-w-[90vw] max-h-[80vh] overflow-hidden">
          
          {/* 导航切换按钮 */}
          <div className="flex items-center justify-between px-3 py-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">文档导航</h3>
            <button
              onClick={() => setShowFloatingNav(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* 搜索框 */}
          <div className="px-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="搜索文档..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="px-3 space-y-2">
            {isAdmin && (
              <>
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
              </>
            )}
            
            <button
              onClick={() => setShowToc(!showToc)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2 text-sm"
            >
              <List size={16} />
              <span>文章目录</span>
            </button>
          </div>

          {/* 分类和文档列表 */}
          <div className="max-h-72 sm:max-h-96 overflow-y-auto px-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.path}>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {category.name}
                  </h4>
                  <ul className="space-y-1">
                    {category.docs.map((doc) => (
                      <li key={doc._id}>
                        <button
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
                            <div className="flex space-x-1">
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
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 悬浮导航展开按钮 */}
      {!showFloatingNav && (
        <button
          onClick={() => setShowFloatingNav(true)}
          className="fixed left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-full p-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* 主内容区域 */}
      <main className="min-h-screen">
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
                    <span>作者: {currentDoc.author} • 更新于: {new Date(currentDoc.updatedAt).toLocaleDateString('zh-CN')}</span>
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