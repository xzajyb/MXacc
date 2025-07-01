import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FolderPlus, 
  Upload, 
  Save, 
  X,
  Eye,
  Settings,
  FileText,
  Folder,
  ChevronRight,
  ChevronDown,
  Home
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmDialog from '../components/ConfirmDialog'

interface WikiDoc {
  id: string
  title: string
  content?: string
  slug: string
  category: string
  author: {
    id: string
    username: string
    nickname?: string
    avatar?: string
    role: string
  }
  createdAt: Date
  updatedAt: Date
  updatedBy: any
  order: number
  parentId?: string
  children?: WikiDoc[]
}

interface WikiCategory {
  id: string
  name: string
  description: string
  slug: string
  icon: string
  order: number
}

interface WikiPageProps {
  embedded?: boolean
}

const WikiPage: React.FC<WikiPageProps> = ({ embedded = false }) => {
  const { user, token } = useAuth()
  const { showSuccess, showError } = useToast()
  const [activeTab, setActiveTab] = useState<'list' | 'view' | 'edit' | 'categories' | 'import'>('list')
  const [loading, setLoading] = useState(false)
  
  // 文档相关状态
  const [docs, setDocs] = useState<WikiDoc[]>([])
  const [currentDoc, setCurrentDoc] = useState<WikiDoc | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  // 编辑器状态
  const [editDoc, setEditDoc] = useState<{
    id?: string
    title: string
    content: string
    category: string
    slug: string
    isPublic: boolean
    parentId?: string
    order: number
  }>({
    title: '',
    content: '',
    category: 'general',
    slug: '',
    isPublic: true,
    order: 0
  })
  
  // 分类相关状态
  const [categories, setCategories] = useState<WikiCategory[]>([])
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    slug: '',
    icon: '📁',
    order: 0
  })
  
  // 导入相关状态
  const [importData, setImportData] = useState('')
  const [importing, setImporting] = useState(false)
  
  // 确认对话框
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  // 获取文档列表
  const fetchDocs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social/content?action=wiki&subAction=docs&category=${selectedCategory}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setDocs(data.docs)
      } else {
        showError(data.message || '获取文档列表失败')
      }
    } catch (error) {
      console.error('获取文档列表失败:', error)
      showError('获取文档列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/social/content?action=wiki&subAction=categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('获取分类列表失败:', error)
    }
  }

  // 获取单个文档
  const fetchDoc = async (docId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social/content?action=wiki&subAction=doc&docId=${docId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setCurrentDoc(data.doc)
        setActiveTab('view')
      } else {
        showError(data.message || '获取文档失败')
      }
    } catch (error) {
      console.error('获取文档失败:', error)
      showError('获取文档失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存文档
  const saveDoc = async () => {
    if (!editDoc.title.trim() || !editDoc.content.trim()) {
      showError('标题和内容不能为空')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'wiki-management',
          subAction: 'save-doc',
          ...editDoc
        })
      })
      
      const data = await response.json()
      if (data.success) {
        showSuccess(data.message)
        setActiveTab('list')
        fetchDocs()
        // 重置编辑器
        setEditDoc({
          title: '',
          content: '',
          category: 'general',
          slug: '',
          isPublic: true,
          order: 0
        })
      } else {
        showError(data.message || '保存文档失败')
      }
    } catch (error) {
      console.error('保存文档失败:', error)
      showError('保存文档失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除文档
  const deleteDoc = async (docId: string) => {
    try {
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'wiki-management',
          subAction: 'delete-doc',
          docId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        showSuccess(data.message)
        fetchDocs()
        if (currentDoc?.id === docId) {
          setCurrentDoc(null)
          setActiveTab('list')
        }
      } else {
        showError(data.message || '删除文档失败')
      }
    } catch (error) {
      console.error('删除文档失败:', error)
      showError('删除文档失败')
    }
  }

  // 创建分类
  const createCategory = async () => {
    if (!newCategory.name.trim()) {
      showError('分类名称不能为空')
      return
    }

    try {
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'wiki-management',
          subAction: 'create-category',
          ...newCategory
        })
      })
      
      const data = await response.json()
      if (data.success) {
        showSuccess(data.message)
        fetchCategories()
        setNewCategory({
          name: '',
          description: '',
          slug: '',
          icon: '📁',
          order: 0
        })
      } else {
        showError(data.message || '创建分类失败')
      }
    } catch (error) {
      console.error('创建分类失败:', error)
      showError('创建分类失败')
    }
  }

  // 导入文档
  const importDocs = async () => {
    if (!importData.trim()) {
      showError('请输入导入数据')
      return
    }

    try {
      setImporting(true)
      // 解析导入数据，支持屯人服Wiki格式
      const docs = parseImportData(importData)
      
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'wiki-management',
          subAction: 'import-docs',
          docs
        })
      })
      
      const data = await response.json()
      if (data.success) {
        showSuccess(data.message)
        setActiveTab('list')
        fetchDocs()
        setImportData('')
      } else {
        showError(data.message || '导入文档失败')
      }
    } catch (error) {
      console.error('导入文档失败:', error)
      showError('导入文档失败')
    } finally {
      setImporting(false)
    }
  }

  // 解析导入数据的函数
  const parseImportData = (data: string) => {
    // 简单的Markdown格式解析
    const sections = data.split(/\n\s*#\s+/).filter(section => section.trim())
    
    return sections.map((section, index) => {
      const lines = section.trim().split('\n')
      const title = lines[0].replace(/^#+\s*/, '').trim()
      const content = lines.slice(1).join('\n').trim()
      
      return {
        title,
        content: content || `# ${title}\n\n此文档正在编写中...`,
        category: '屯人服Wiki',
        path: title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '-')
      }
    })
  }

  // 编辑文档
  const editDocument = (doc: WikiDoc) => {
    setEditDoc({
      id: doc.id,
      title: doc.title,
      content: doc.content || '',
      category: doc.category,
      slug: doc.slug,
      isPublic: true,
      parentId: doc.parentId,
      order: doc.order
    })
    setActiveTab('edit')
  }

  // 自动生成slug
  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '-')
  }

  useEffect(() => {
    fetchDocs()
    fetchCategories()
  }, [selectedCategory])

  // 过滤文档
  const filteredDocs = docs.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 检查管理员权限
  const isAdmin = user?.role === 'admin'

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-gray-50 dark:bg-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        {!embedded && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span>Wiki文档中心</span>
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              知识库管理和文档协作平台
            </p>
          </div>
        )}

        {/* 导航标签 */}
        <div className="flex items-center space-x-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            文档列表
          </button>
          
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setActiveTab('edit')
                  setEditDoc({
                    title: '',
                    content: '',
                    category: 'general',
                    slug: '',
                    isPublic: true,
                    order: 0
                  })
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'edit'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                新建文档
              </button>
              
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'categories'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Folder className="w-4 h-4 inline mr-2" />
                分类管理
              </button>
              
              <button
                onClick={() => setActiveTab('import')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'import'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                批量导入
              </button>
            </>
          )}
        </div>

        {/* 主要内容区域 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* 文档列表 */}
            {activeTab === 'list' && (
              <div className="space-y-6">
                {/* 搜索和筛选 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="搜索文档..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="w-full sm:w-48">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">所有分类</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.slug}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 文档列表 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  {loading ? (
                    <div className="p-8 text-center">
                      <LoadingSpinner />
                      <p className="mt-2 text-gray-500 dark:text-gray-400">加载中...</p>
                    </div>
                  ) : filteredDocs.length === 0 ? (
                    <div className="p-8 text-center">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm ? '没有找到匹配的文档' : '暂无文档'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredDocs.map((doc) => (
                        <div key={doc.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => fetchDoc(doc.id)}>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                {doc.title}
                              </h3>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                分类: {doc.category} • 作者: {doc.author.username} • 
                                更新于 {new Date(doc.updatedAt).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                            
                            {isAdmin && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    editDocument(doc)
                                  }}
                                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  title="编辑文档"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: '删除文档',
                                      message: `确定要删除文档"${doc.title}"吗？此操作不可撤销。`,
                                      onConfirm: () => {
                                        deleteDoc(doc.id)
                                        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                                      }
                                    })
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                  title="删除文档"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 文档查看 */}
            {activeTab === 'view' && currentDoc && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentDoc.title}
                      </h1>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        作者: {currentDoc.author.username} • 
                        创建于 {new Date(currentDoc.createdAt).toLocaleDateString('zh-CN')} • 
                        更新于 {new Date(currentDoc.updatedAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActiveTab('list')}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4 inline mr-2" />
                        关闭
                      </button>
                      
                      {isAdmin && (
                        <button
                          onClick={() => editDocument(currentDoc)}
                          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <Edit className="w-4 h-4 inline mr-2" />
                          编辑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ 
                      __html: currentDoc.content?.replace(/\n/g, '<br>') || '' 
                    }} />
                  </div>
                </div>
              </div>
            )}

            {/* 文档编辑器 */}
            {activeTab === 'edit' && isAdmin && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editDoc.id ? '编辑文档' : '新建文档'}
                  </h2>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* 基本信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        文档标题 *
                      </label>
                      <input
                        type="text"
                        value={editDoc.title}
                        onChange={(e) => {
                          const title = e.target.value
                          setEditDoc(prev => ({
                            ...prev,
                            title,
                            slug: prev.slug || generateSlug(title)
                          }))
                        }}
                        placeholder="请输入文档标题"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL路径
                      </label>
                      <input
                        type="text"
                        value={editDoc.slug}
                        onChange={(e) => setEditDoc(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="url-path"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        分类
                      </label>
                      <select
                        value={editDoc.category}
                        onChange={(e) => setEditDoc(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">常规</option>
                        <option value="屯人服Wiki">屯人服Wiki</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.slug}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        排序
                      </label>
                      <input
                        type="number"
                        value={editDoc.order}
                        onChange={(e) => setEditDoc(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* 内容编辑器 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      文档内容 *
                    </label>
                    <textarea
                      value={editDoc.content}
                      onChange={(e) => setEditDoc(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="请输入文档内容，支持Markdown格式..."
                      rows={20}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center justify-end space-x-4">
                    <button
                      onClick={() => setActiveTab('list')}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={saveDoc}
                      disabled={loading}
                      className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>保存中...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>保存文档</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 分类管理 */}
            {activeTab === 'categories' && isAdmin && (
              <div className="space-y-6">
                {/* 创建新分类 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    创建新分类
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        分类名称 *
                      </label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => {
                          const name = e.target.value
                          setNewCategory(prev => ({
                            ...prev,
                            name,
                            slug: prev.slug || generateSlug(name)
                          }))
                        }}
                        placeholder="请输入分类名称"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        图标
                      </label>
                      <input
                        type="text"
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="📁"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        描述
                      </label>
                      <textarea
                        value={newCategory.description}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="请输入分类描述"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={createCategory}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>创建分类</span>
                    </button>
                  </div>
                </div>

                {/* 现有分类列表 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      现有分类
                    </h3>
                  </div>
                  
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {categories.map((category) => (
                      <div key={category.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{category.icon}</span>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                {category.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {category.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            排序: {category.order}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 批量导入 */}
            {activeTab === 'import' && isAdmin && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  批量导入文档
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      导入数据 (支持Markdown格式)
                    </label>
                    <textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder={`# 文档标题1\n\n文档内容1...\n\n# 文档标题2\n\n文档内容2...`}
                      rows={20}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      导入格式说明：
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                      <li>• 使用 # 标题 来分隔不同的文档</li>
                      <li>• 每个标题下的内容将作为该文档的内容</li>
                      <li>• 支持Markdown格式</li>
                      <li>• 导入的文档将自动归类到"屯人服Wiki"分类</li>
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-4">
                    <button
                      onClick={() => setImportData('')}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      清空
                    </button>
                    <button
                      onClick={importDocs}
                      disabled={importing || !importData.trim()}
                      className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {importing ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>导入中...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>开始导入</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 确认对话框 */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type="danger"
        />
      </div>
    </div>
  )
}

export default WikiPage 