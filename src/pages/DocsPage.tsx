import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Search, Menu, X, FileText, Folder, Plus, Edit, Trash2, Settings, Home, List, ChevronUp, FolderOpen, ChevronDown, ChevronRight, PenLine, Clock, History, RefreshCw } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import Toast from '@/components/Toast'
import VueMarkdownRenderer from '@/components/VitePress/VueMarkdownRenderer'
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
  submittedBy?: string
  status?: 'approved' | 'pending' | 'rejected'
  authorId?: string
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
  const [isUserSubmission, setIsUserSubmission] = useState(false)
  const [editingDoc, setEditingDoc] = useState<DocContent | null>(null)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [toc, setToc] = useState<TocItem[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [pendingDocs, setPendingDocs] = useState<DocContent[]>([])
  const [historyDocs, setHistoryDocs] = useState<DocContent[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'approved' | 'rejected'>('all')

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
        // 从categoryPath提取显示名称，支持多级路径
        const pathParts = categoryPath.split('/')
        const displayName = pathParts.length > 1 ? 
          pathParts[pathParts.length - 1] : 
          getCategoryName(category)
        
        categoryMap.set(categoryPath, {
          name: getCategoryName(category),
          categoryPath: categoryPath,
          path: categoryPath,
          docs: []
        })
      }
      categoryMap.get(categoryPath)!.docs.push(doc)
    })
    
    // 按分类路径层级和路径排序
    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => {
      const aDepth = a.categoryPath.split('/').length
      const bDepth = b.categoryPath.split('/').length
      
      // 先按层级排序，同层级按路径排序
      if (aDepth !== bDepth) {
        return aDepth - bDepth
      }
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

  // 获取待审核文档
  const fetchPendingDocs = async () => {
    if (!isAdmin) return
    
    try {
      const response = await fetch('/api/social/content?action=get-docs&status=pending', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setPendingDocs(data.docs || [])
      }
    } catch (error) {
      console.error('获取待审核文档错误:', error)
    }
  }

  // 获取历史提交记录
  const fetchHistoryDocs = async () => {
    if (!isAdmin) return
    
    try {
      let url = '/api/social/content?action=get-docs&history=true'
      if (historyFilter !== 'all') {
        url += `&status=${historyFilter}`
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setHistoryDocs(data.docs || [])
      }
    } catch (error) {
      console.error('获取历史文档错误:', error)
    }
  }

  // 撤销文档审核
  const handleRevertDoc = async (docId: string) => {
    if (!confirm('确定要撤销此文档的审核吗？将重置为待审核状态')) {
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
          action: 'revert-doc',
          docId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // 刷新文档列表
        await fetchDocs()
        await fetchPendingDocs()
        await fetchHistoryDocs()
        setError('')
      } else {
        setError(data.message || '撤销文档审核失败')
      }
    } catch (error) {
      console.error('撤销文档审核错误:', error)
      setError('撤销文档审核失败')
    }
  }

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
        if (isAdmin) await fetchPendingDocs()
        setError('')
        
        // 如果是用户提交，显示成功提示
        if (!isAdmin && !editingDoc) {
          alert('文档已提交成功，将在审核后发布')
        }
      } else {
        setError(data.message || '保存文档失败')
      }
    } catch (error) {
      console.error('保存文档错误:', error)
      setError('保存文档失败')
    }
  }
  
  // 审核文档
  const handleReviewDoc = async (docId: string, approved: boolean) => {
    try {
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'review-doc',
          docId,
          status: approved ? 'approved' : 'rejected'
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // 刷新文档列表
        await fetchDocs()
        await fetchPendingDocs()
        setError('')
      } else {
        setError(data.message || '审核文档失败')
      }
    } catch (error) {
      console.error('审核文档错误:', error)
      setError('审核文档失败')
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
    setIsUserSubmission(false)
    setShowEditor(true)
  }

  // 用户提交文档
  const handleUserSubmitDoc = () => {
    setEditingDoc(null)
    setIsUserSubmission(true)
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
    // 如果是管理员，获取待审核文档和历史记录
    if (isAdmin) {
      fetchPendingDocs()
      if (showHistory) {
        fetchHistoryDocs()
      }
    }
  }, [isAdmin, showHistory, historyFilter])

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
      

      {/* 桌面端悬浮导航 - 确保移动端完全隐藏 */}
      <div className="desktop-nav hidden lg:block fixed left-4 top-4 w-80 z-30 max-h-[calc(100vh-2rem)]">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col overflow-hidden max-h-full">
          {/* Logo区域 - 居中显示 */}
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-center">
            <img 
              src="/logo.svg" 
              alt="MXacc" 
              className="w-12 h-12 filter blur-[0.5px] drop-shadow-lg" 
            />
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
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="px-4 pb-4 space-y-2">
            {/* 普通用户提交文档按钮 */}
            {user && (
            <button
                onClick={isAdmin ? () => setShowEditor(true) : handleUserSubmitDoc}
                className="w-full px-3 py-2 bg-blue-600/90 text-white rounded-xl hover:bg-blue-700/90 transition-colors flex items-center space-x-2 text-sm backdrop-blur-sm"
              >
                <Plus size={16} />
                <span>{isAdmin ? '新建文档' : '提交文档'}</span>
              </button>
            )}
            
            {isAdmin && (
              <>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`w-full px-3 py-2 rounded-xl transition-colors flex items-center space-x-2 text-sm backdrop-blur-sm ${
                    editMode 
                    ? 'bg-green-100/90 text-green-600 dark:bg-green-900/50 dark:text-green-400' 
                    : 'bg-gray-100/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-300 hover:bg-gray-200/90 dark:hover:bg-gray-600/90'
                  }`}
                >
                  <Settings size={16} />
                  <span>{editMode ? '退出编辑' : '编辑模式'}</span>
                </button>
                
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`w-full px-3 py-2 rounded-xl transition-colors flex items-center space-x-2 text-sm backdrop-blur-sm ${
                    showHistory 
                    ? 'bg-purple-100/90 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400' 
                    : 'bg-gray-100/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-300 hover:bg-gray-200/90 dark:hover:bg-gray-600/90'
                  }`}
                >
                  <History size={16} />
                  <span>{showHistory ? '隐藏历史记录' : '查看历史提交'}</span>
                </button>
              </>
            )}
          </div>
            
          {/* 文档目录 */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
            {/* 返回顶部按钮 */}
            <div className="mb-4">
            <button
                onClick={scrollToTop}
                className="w-full px-3 py-2 bg-gray-100/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200/90 dark:hover:bg-gray-600/90 transition-colors flex items-center space-x-2 text-sm backdrop-blur-sm"
            >
                <ChevronUp size={16} />
                <span>返回顶部</span>
            </button>
          </div>

          {/* 历史提交记录 - 仅管理员可见 */}
          {isAdmin && showHistory && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center">
                  <History size={14} className="mr-1" />
                  历史提交记录
                </h4>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-2 py-1 text-xs rounded ${
                      historyFilter === 'all' 
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setHistoryFilter('approved')}
                    className={`px-2 py-1 text-xs rounded ${
                      historyFilter === 'approved' 
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    已批准
                  </button>
                  <button
                    onClick={() => setHistoryFilter('rejected')}
                    className={`px-2 py-1 text-xs rounded ${
                      historyFilter === 'rejected' 
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    已拒绝
                  </button>
                </div>
              </div>
              <div className="space-y-1 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-2 mb-4">
                {historyDocs.length > 0 ? (
                  historyDocs.map((doc) => (
                    <div 
                      key={doc._id} 
                      className={`p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg border ${
                        doc.status === 'approved' 
                          ? 'border-green-200/50 dark:border-green-700/30' 
                          : 'border-red-200/50 dark:border-red-700/30'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1 line-clamp-1 flex items-center justify-between">
                        <span>{doc.title}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          doc.status === 'approved'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          {doc.status === 'approved' ? '已批准' : '已拒绝'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span>由 {doc.submittedBy || '未知用户'} 提交</span>
                        <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => fetchDoc(doc._id)}
                          className="flex-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                        >
                          查看
                        </button>
                        <button 
                          onClick={() => handleEditDoc(doc)}
                          className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <PenLine size={12} className="inline mr-1" />
                          编辑
                        </button>
                        <button 
                          onClick={() => handleRevertDoc(doc._id)}
                          className="flex-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
                        >
                          <RefreshCw size={12} className="inline mr-1" />
                          撤销
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-400">
                    无历史审核记录
                  </div>
                )}
              </div>
            </div>
          )}

            {/* 待审核文档区域 - 仅管理员可见 */}
            {isAdmin && pendingDocs.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center">
                  <Clock size={14} className="mr-1" />
                  待审核文档 ({pendingDocs.length})
                </h4>
                <div className="space-y-1 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg p-2">
                  {pendingDocs.map((doc) => (
                    <div 
                      key={doc._id} 
                      className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-amber-200/50 dark:border-amber-700/30"
            >
                      <div className="text-sm font-medium mb-1 line-clamp-1">{doc.title}</div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>由 {doc.submittedBy || '未知用户'} 提交</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 space-x-1">
                        <button 
                          onClick={() => handleEditDoc(doc)}
                          className="flex-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                        >
                          <PenLine size={12} className="inline mr-1" />
                          编辑
                        </button>
                        <button 
                          onClick={() => handleReviewDoc(doc._id, true)}
                          className="flex-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                        >
                          批准
                        </button>
                        <button 
                          onClick={() => handleReviewDoc(doc._id, false)}
                          className="flex-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      className={`w-full text-left px-3 py-1 rounded-lg text-sm transition-colors hover:bg-gray-100/80 dark:hover:bg-gray-700/80 backdrop-blur-sm ${
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
              <div className="space-y-1">
                {filteredCategories.map((category) => {
                  const depth = category.categoryPath.split('/').length - 1
                  const isSubCategory = depth > 0
                  const indentClass = isSubCategory ? `ml-${Math.min(depth * 4, 8)}` : ''
                  
                  return (
                    <div key={category.categoryPath} className={indentClass}>
                      <button
                        onClick={() => toggleCategory(category.categoryPath)}
                        className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors backdrop-blur-sm ${
                          isSubCategory ? 'text-xs' : ''
                        }`}
                      >
                        {expandedCategories.has(category.categoryPath) ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        )}
                        {isSubCategory ? (
                          <FolderOpen size={12} />
                        ) : (
                          <Folder size={12} />
                        )}
                        <span className="truncate flex-1 text-left">
                          {isSubCategory ? 
                            category.categoryPath.split('/').pop() : 
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
                              className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors flex items-center space-x-2 text-xs backdrop-blur-sm ${
                            currentDoc?._id === doc._id
                                  ? 'bg-blue-50/90 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50/90 dark:hover:bg-gray-700/80'
                          }`}
                        >
                              <FileText size={12} />
                          <span className="truncate flex-1">{doc.title}</span>
                          {isAdmin && editMode && (
                                <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditDoc(doc)
                                }}
                                    className="p-1 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 rounded"
                                title="编辑文档"
                              >
                                    <Edit size={8} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteDoc(doc._id)
                                }}
                                    className="p-1 hover:bg-red-200/80 dark:hover:bg-red-900/80 rounded"
                                title="删除文档"
                              >
                                    <Trash2 size={8} />
                              </button>
                            </div>
                          )}
                        </button>
                    ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                </div>
            </div>
          </div>
        </div>
      </div>

            {/* 移动端弹窗导航 - 使用Portal渲染解决层级问题 */}
      {showMobileNav && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowMobileNav(false)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Search size={20} className="mr-2" />
                文档导航
              </h2>
              <button
                onClick={() => setShowMobileNav(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
            </button>
          </div>

          {/* 搜索框 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="搜索文档..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 操作按钮 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
              {/* 文档创建/提交按钮 */}
              {user && (
                <button
                  onClick={() => {
                    if (isAdmin) {
                      setShowEditor(true)
                    } else {
                      setIsUserSubmission(true)
                      setShowEditor(true)
                    }
                    setShowMobileNav(false)
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus size={16} />
                  <span>{isAdmin ? '新建文档' : '提交文档'}</span>
                </button>
              )}
              
              {/* 管理员编辑模式切换 */}
              {isAdmin && (
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    editMode 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Settings size={16} />
                  <span>{editMode ? '退出编辑' : '编辑模式'}</span>
                </button>
              )}
            </div>

            {/* 导航内容 - 可滚动区域 */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {/* 管理员操作区域 - 历史提交记录和待审核文档 */}
              {isAdmin && (
                <>
                  {/* 历史记录按钮 */}
                  <div className="mb-4">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className={`w-full px-3 py-2 flex items-center justify-center space-x-2 rounded-lg ${
                        showHistory 
                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <History size={16} />
                      <span>{showHistory ? '隐藏历史记录' : '查看历史提交'}</span>
                    </button>
                  </div>
                  
                  {/* 历史提交记录 */}
                  {showHistory && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3 flex items-center">
                        <History size={16} className="mr-2" />
                        历史提交记录
                      </h3>
                      
                      {/* 筛选按钮 */}
                      <div className="flex space-x-2 mb-3">
                        <button
                          onClick={() => setHistoryFilter('all')}
                          className={`flex-1 py-2 text-xs rounded ${
                            historyFilter === 'all' 
                              ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          全部
                        </button>
                        <button
                          onClick={() => setHistoryFilter('approved')}
                          className={`flex-1 py-2 text-xs rounded ${
                            historyFilter === 'approved' 
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          已批准
                        </button>
                        <button
                          onClick={() => setHistoryFilter('rejected')}
                          className={`flex-1 py-2 text-xs rounded ${
                            historyFilter === 'rejected' 
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          已拒绝
                        </button>
                      </div>
                      
                      <div className="space-y-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-3 mb-4">
                        {historyDocs.length > 0 ? (
                          historyDocs.map((doc) => (
                            <div 
                              key={doc._id} 
                              className={`p-3 bg-white/90 dark:bg-gray-800/90 rounded-lg border ${
                                doc.status === 'approved' 
                                  ? 'border-green-200/50 dark:border-green-700/30' 
                                  : 'border-red-200/50 dark:border-red-700/30'
                              }`}
                            >
                              <div className="font-medium mb-1 flex items-center justify-between">
                                <span className="truncate mr-2">{doc.title}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                                  doc.status === 'approved'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}>
                                  {doc.status === 'approved' ? '已批准' : '已拒绝'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex justify-between">
                                <span>由 {doc.submittedBy || '未知用户'} 提交</span>
                                <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <button 
                                  onClick={() => {
                                    fetchDoc(doc._id)
                                    setShowMobileNav(false)
                                  }}
                                  className="py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                                >
                                  查看
                                </button>
                                <button 
                                  onClick={() => {
                                    handleEditDoc(doc)
                                    setShowMobileNav(false)
                                  }}
                                  className="py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                >
                                  编辑
                                </button>
                                <button 
                                  onClick={() => handleRevertDoc(doc._id)}
                                  className="py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
                                >
                                  撤销
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                            无历史审核记录
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 待审核文档 */}
                  {pendingDocs.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center">
                        <Clock size={16} className="mr-2" />
                        待审核文档 ({pendingDocs.length})
                      </h3>
                      <div className="space-y-2 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg p-3 mb-4">
                        {pendingDocs.map((doc) => (
                          <div 
                            key={doc._id} 
                            className="p-3 bg-white/90 dark:bg-gray-800/90 rounded-lg border border-amber-200/50 dark:border-amber-700/30"
                          >
                            <div className="font-medium mb-1">{doc.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              由 {doc.submittedBy || '未知用户'} 提交
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <button 
                                onClick={() => {
                                  handleEditDoc(doc)
                                  setShowMobileNav(false)
                                }}
                                className="py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                              >
                                编辑
                              </button>
                              <button 
                                onClick={() => handleReviewDoc(doc._id, true)}
                                className="py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded"
                              >
                                批准
                              </button>
                              <button 
                                onClick={() => handleReviewDoc(doc._id, false)}
                                className="py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded"
                              >
                                拒绝
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            )}
            
              {/* 当前文档目录 */}
              {currentDoc && toc.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <List size={16} className="mr-2" />
                    页面目录
                  </h3>
                  <div className="space-y-1">
                    {toc.map((item) => (
            <button
                        key={item.id}
                        onClick={() => {
                          scrollToHeading(item.id)
                          setShowMobileNav(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          item.level === 1 ? 'font-medium text-gray-900 dark:text-white' :
                          item.level === 2 ? 'ml-4 text-gray-700 dark:text-gray-300' :
                          item.level === 3 ? 'ml-8 text-gray-600 dark:text-gray-400' :
                          'ml-12 text-gray-500 dark:text-gray-500'
                        }`}
            >
                        {item.text}
            </button>
                    ))}
          </div>
                </div>
              )}

              {/* 文档分类列表 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Folder size={16} className="mr-2" />
                  文档分类
                </h3>
                <div className="space-y-2">
                  {filteredCategories.map((category) => (
                    <div key={category.categoryPath}>
                      <button
                        onClick={() => toggleCategory(category.categoryPath)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <Folder size={14} />
                          <span>{category.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {category.docs.length}
                          </span>
                          {expandedCategories.has(category.categoryPath) ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                        </div>
                      </button>
                      
                      {expandedCategories.has(category.categoryPath) && (
                        <div className="ml-4 mt-2 space-y-1">
                    {category.docs.map((doc) => (
                        <button
                              key={doc._id}
                              onClick={() => {
                                fetchDoc(doc._id)
                                setShowMobileNav(false)
                              }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                            currentDoc?._id === doc._id
                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                                      setShowMobileNav(false)
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
                                    className="p-1 hover:bg-red-200 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                                title="删除文档"
                              >
                                    <Trash2 size={12} />
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
        </div>,
        document.body
      )}

      {/* 主内容区域 */}
      <main className="lg:ml-[20rem] min-h-screen px-4 lg:px-8 py-4 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {currentDoc ? (
            <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 lg:p-8 relative">
              {/* 移动端搜索按钮 - 位于文章内部右上角 */}
        <button
                onClick={() => setShowMobileNav(true)}
                className="lg:hidden absolute top-4 right-4 z-30 p-3 bg-blue-50/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl shadow-md hover:bg-blue-100/80 dark:hover:bg-blue-900/70 transition-all duration-200 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50"
        >
                <Search size={18} />
        </button>

              {/* 使用 VitePress 风格的 Markdown 渲染器 */}
              <div className="vitepress-markdown-content">
                <VueMarkdownRenderer content={currentDoc.content} />
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 lg:p-12 text-center relative">
              {/* 移动端搜索按钮 - 欢迎页面也显示 */}
              <button
                onClick={() => setShowMobileNav(true)}
                className="lg:hidden absolute top-4 right-4 z-30 p-3 bg-blue-50/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl shadow-md hover:bg-blue-100/80 dark:hover:bg-blue-900/70 transition-all duration-200 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50"
              >
                <Search size={18} />
              </button>

              <FileText size={64} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                欢迎使用文档中心
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                点击右上角搜索按钮选择文档开始阅读，或使用搜索功能快速查找内容
              </p>
              {docs.length === 0 && isAdmin && (
                <button
                  onClick={() => setShowEditor(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
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
          setIsUserSubmission(false)
        }}
        onSave={handleSaveDoc}
        initialDoc={editingDoc}
        isUserSubmission={isUserSubmission}
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