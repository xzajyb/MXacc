import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Book, Plus, Edit, Trash2, FolderPlus, ExternalLink, RefreshCw, Eye, Settings, FileText, Folder, ChevronRight, Search, Filter } from 'lucide-react'
import axios from 'axios'

interface WikiCategory {
  id: string
  name: string
  slug: string
  description: string
  order: number
  isVisible: boolean
  createdAt: string
}

interface WikiDocument {
  id: string
  title: string
  slug: string
  content: string
  categoryId?: string
  order: number
  isPublished: boolean
  author: {
    id: string
    username: string
    displayName: string
  }
  createdAt: string
  updatedAt: string
}

interface WikiPageProps {
  embedded?: boolean
}

const WikiPage: React.FC<WikiPageProps> = ({ embedded = false }) => {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  
  // 状态管理
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'categories'>('overview')
  const [categories, setCategories] = useState<WikiCategory[]>([])
  const [documents, setDocuments] = useState<WikiDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [rebuildingWiki, setRebuildingWiki] = useState(false)

  // 表单状态
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<WikiCategory | WikiDocument | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    slug: '',
    description: '',
    content: '',
    categoryId: '',
    order: 0,
    isVisible: true,
    isPublished: true
  })

  // 检查权限
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      loadCategories()
      loadDocuments()
    }
  }, [isAdmin])

  // 加载分类
  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/social/content?action=wiki&type=categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setCategories(response.data.data)
      }
    } catch (error: any) {
      console.error('加载分类失败:', error)
      showToast('加载分类失败', 'error')
    }
  }

  // 加载文档
  const loadDocuments = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/social/content?action=wiki&type=list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setDocuments(response.data.data)
      }
    } catch (error: any) {
      console.error('加载文档失败:', error)
      showToast('加载文档失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  // 重建Wiki
  const handleRebuildWiki = async () => {
    setRebuildingWiki(true)
    try {
      const response = await axios.post('/api/social/content?action=wiki&type=rebuild', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        showToast('Wiki重建成功！VitePress文档已更新', 'success')
      }
    } catch (error: any) {
      console.error('重建Wiki失败:', error)
      showToast(error.response?.data?.message || '重建Wiki失败', 'error')
    } finally {
      setRebuildingWiki(false)
    }
  }

  // 创建/更新分类
  const handleSaveCategory = async () => {
    try {
      if (editingItem && 'name' in editingItem) {
        // 更新分类
        await axios.put('/api/social/content', {
          action: 'wiki',
          type: 'update-category',
          id: editingItem.id,
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          order: formData.order,
          isVisible: formData.isVisible
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        showToast('分类更新成功', 'success')
      } else {
        // 创建分类
        await axios.post('/api/social/content', {
          action: 'wiki',
          type: 'create-category',
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          order: formData.order,
          isVisible: formData.isVisible
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        showToast('分类创建成功', 'success')
      }
      
      setEditingItem(null)
      setShowCreateDialog(false)
      loadCategories()
    } catch (error: any) {
      showToast(error.response?.data?.message || '操作失败', 'error')
    }
  }

  // 创建/更新文档
  const handleSaveDocument = async () => {
    try {
      if (editingItem && 'content' in editingItem) {
        // 更新文档
        await axios.put('/api/social/content', {
          action: 'wiki',
          type: 'update-document',
          id: editingItem.id,
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          categoryId: formData.categoryId || null,
          order: formData.order,
          isPublished: formData.isPublished
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        showToast('文档更新成功', 'success')
      } else {
        // 创建文档
        await axios.post('/api/social/content', {
          action: 'wiki',
          type: 'create-document',
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          categoryId: formData.categoryId || null,
          order: formData.order,
          isPublished: formData.isPublished
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        showToast('文档创建成功', 'success')
      }
      
      setEditingItem(null)
      setShowCreateDialog(false)
      loadDocuments()
    } catch (error: any) {
      showToast(error.response?.data?.message || '操作失败', 'error')
    }
  }

  // 删除分类
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('确定删除这个分类吗？请确保分类下没有文档。')) return
    
    try {
      await axios.delete(`/api/social/content?action=wiki&type=category&id=${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('分类删除成功', 'success')
      loadCategories()
      loadDocuments() // 重新加载文档以更新分类引用
    } catch (error: any) {
      showToast(error.response?.data?.message || '删除失败', 'error')
    }
  }

  // 删除文档
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('确定删除这篇文档吗？')) return
    
    try {
      await axios.delete(`/api/social/content?action=wiki&type=document&id=${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('文档删除成功', 'success')
      loadDocuments()
    } catch (error: any) {
      showToast(error.response?.data?.message || '删除失败', 'error')
    }
  }

  // 编辑分类
  const handleEditCategory = (category: WikiCategory) => {
    setFormData({
      name: category.name,
      title: '',
      slug: category.slug,
      description: category.description,
      content: '',
      categoryId: '',
      order: category.order,
      isVisible: category.isVisible,
      isPublished: true
    })
    setEditingItem(category)
    setShowCreateDialog(true)
  }

  // 编辑文档
  const handleEditDocument = (document: WikiDocument) => {
    setFormData({
      name: '',
      title: document.title,
      slug: document.slug,
      description: '',
      content: document.content,
      categoryId: document.categoryId || '',
      order: document.order,
      isVisible: true,
      isPublished: document.isPublished
    })
    setEditingItem(document)
    setShowCreateDialog(true)
  }

  // 筛选文档
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || doc.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 获取分类名称
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '未分类'
    const category = categories.find(cat => cat.id === categoryId)
    return category?.name || '未知分类'
  }

  // 打开VitePress文档站点
  const openDocsSite = () => {
    window.open('/docs/', '_blank')
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">需要管理员权限</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">只有管理员可以管理Wiki文档</p>
          <button
            onClick={openDocsSite}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            查看文档站点
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${embedded ? '' : 'min-h-screen'} bg-gray-50 dark:bg-gray-900`}>
      <div className={`${embedded ? '' : 'py-8'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 头部 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Book className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wiki文档管理</h1>
                  <p className="text-gray-600 dark:text-gray-400">管理系统文档，保留VitePress原生界面和渲染器</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={openDocsSite}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  预览文档站点
                </button>
                <button
                  onClick={handleRebuildWiki}
                  disabled={rebuildingWiki}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${rebuildingWiki ? 'animate-spin' : ''}`} />
                  {rebuildingWiki ? '重建中...' : '重建Wiki'}
                </button>
              </div>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">文档总数</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{documents.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">已发布</p>
                  <p className="text-3xl font-bold text-green-600">{documents.filter(d => d.isPublished).length}</p>
                </div>
                <Eye className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">分类数量</p>
                  <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
                </div>
                <Folder className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">草稿</p>
                  <p className="text-3xl font-bold text-orange-600">{documents.filter(d => !d.isPublished).length}</p>
                </div>
                <Settings className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* 标签页导航 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: '概览', icon: Eye },
                  { id: 'documents', label: '文档管理', icon: FileText },
                  { id: 'categories', label: '分类管理', icon: Folder }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* 标签页内容 */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 最近文档 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">最近更新的文档</h3>
                      <div className="space-y-3">
                        {documents.slice(0, 5).map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">{doc.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {getCategoryName(doc.categoryId)} • {new Date(doc.updatedAt).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                doc.isPublished 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
                              }`}>
                                {doc.isPublished ? '已发布' : '草稿'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 分类概览 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">分类概览</h3>
                      <div className="space-y-3">
                        {categories.map((category) => {
                          const categoryDocCount = documents.filter(d => d.categoryId === category.id).length
                          return (
                            <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">{category.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-blue-600">{categoryDocCount}</p>
                                <p className="text-xs text-gray-500">篇文档</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* VitePress 功能说明 */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">VitePress 原生功能保留</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
                      <div>
                        <h4 className="font-medium mb-2">🎨 原生界面</h4>
                        <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                          <li>• 完整保留VitePress主题</li>
                          <li>• 响应式设计</li>
                          <li>• 深浅主题切换</li>
                          <li>• 侧边栏导航</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">⚡ 强大渲染器</h4>
                        <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                          <li>• 代码语法高亮</li>
                          <li>• 自定义容器</li>
                          <li>• 数学公式支持</li>
                          <li>• 3D模型展示</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-4">
                  {/* 文档管理工具栏 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="搜索文档..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">所有分类</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => setShowCreateDialog(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      新建文档
                    </button>
                  </div>

                  {/* 文档列表 */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">标题</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">分类</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">状态</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">更新时间</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredDocuments.map((doc) => (
                            <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{doc.title}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">/{doc.slug}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                  {getCategoryName(doc.categoryId)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  doc.isPublished 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                    : 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
                                }`}>
                                  {doc.isPublished ? '已发布' : '草稿'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(doc.updatedAt).toLocaleDateString('zh-CN')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleEditDocument(doc)}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="space-y-4">
                  {/* 分类管理工具栏 */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">分类管理</h3>
                    <button
                      onClick={() => {
                        setFormData({
                          name: '',
                          title: '',
                          slug: '',
                          description: '',
                          content: '',
                          categoryId: '',
                          order: categories.length,
                          isVisible: true,
                          isPublished: true
                        })
                        setShowCreateDialog(true)
                      }}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      <FolderPlus className="w-4 h-4 mr-2" />
                      新建分类
                    </button>
                  </div>

                  {/* 分类列表 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => {
                      const docCount = documents.filter(d => d.categoryId === category.id).length
                      return (
                        <div key={category.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                                <Folder className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{category.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">/{category.slug}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{category.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{docCount} 篇文档</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              category.isVisible
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {category.isVisible ? '显示' : '隐藏'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 创建/编辑对话框 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingItem 
                  ? (editingItem && 'name' in editingItem ? '编辑分类' : '编辑文档')
                  : (activeTab === 'categories' ? '新建分类' : '新建文档')
                }
              </h3>

              <div className="space-y-4">
                {/* 分类表单 */}
                {(activeTab === 'categories' || (editingItem && 'name' in editingItem)) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        分类名称 *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例如：用户指南"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL标识符 *
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例如：user-guide"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        描述
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="分类的简要描述"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          排序
                        </label>
                        <input
                          type="number"
                          value={formData.order}
                          onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isVisible}
                            onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">显示分类</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* 文档表单 */}
                {(activeTab === 'documents' || (editingItem && 'content' in editingItem)) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        文档标题 *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例如：快速开始"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL标识符 *
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例如：quick-start"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        所属分类
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">未分类</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        文档内容 * (支持Markdown)
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="# 文档标题

这里是文档内容，支持完整的Markdown语法...

## 代码示例
```javascript
console.log('Hello World')
```

## 3D模型（VitePress原生支持）
可以嵌入3D模型和其他富媒体内容"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          排序
                        </label>
                        <input
                          type="number"
                          value={formData.order}
                          onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isPublished}
                            onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">立即发布</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowCreateDialog(false)
                    setEditingItem(null)
                    setFormData({
                      name: '',
                      title: '',
                      slug: '',
                      description: '',
                      content: '',
                      categoryId: '',
                      order: 0,
                      isVisible: true,
                      isPublished: true
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (activeTab === 'categories' || (editingItem && 'name' in editingItem)) {
                      handleSaveCategory()
                    } else {
                      handleSaveDocument()
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingItem ? '更新' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WikiPage 