import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Book, 
  Search, 
  Menu, 
  X, 
  Home, 
  ChevronRight, 
  Clock, 
  Tag,
  Edit,
  Plus,
  FolderPlus,
  Settings,
  Eye,
  BookOpen
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import WikiEditor from '../components/WikiEditor'


interface WikiPage {
  _id: string
  title: string
  content: string
  slug: string
  categoryId?: string
  category?: {
    _id: string
    name: string
    description: string
  }
  tags: string[]
  createdAt: string
  updatedAt: string
  order: number
  published: boolean
  contentSummary?: string
}

interface WikiCategory {
  _id: string
  name: string
  description: string
  order: number
  pageCount?: number
  pages?: WikiPage[]
}

interface WikiNavigation {
  _id: string
  name: string
  description: string
  order: number
  pages: Array<{
    _id: string
    title: string
    slug: string
    order: number
  }>
}

const WikiPage: React.FC = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const { showSuccess, showError } = useToast()
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<'home' | 'page' | 'search' | 'admin'>('home')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WikiPage[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  
  // Wiki内容状态
  const [navigation, setNavigation] = useState<WikiNavigation[]>([])
  const [currentPage, setCurrentPage] = useState<WikiPage | null>(null)
  const [recentPages, setRecentPages] = useState<WikiPage[]>([])
  const [categories, setCategories] = useState<WikiCategory[]>([])
  const [stats, setStats] = useState({ totalPages: 0, totalCategories: 0 })
  
  // 编辑器状态
  const [showEditor, setShowEditor] = useState(false)
  const [editingPage, setEditingPage] = useState<WikiPage | null>(null)

  const isAdmin = user?.role === 'admin'

  // 编辑页面
  const handleEditPage = (page: WikiPage) => {
    setEditingPage(page)
    setShowEditor(true)
  }

  // 创建新页面
  const handleCreatePage = () => {
    setEditingPage(null)
    setShowEditor(true)
  }

  // 获取Wiki导航
  const fetchNavigation = async () => {
    try {
      const response = await fetch('/api/wiki/content?action=get-navigation')
      const data = await response.json()
      if (data.success) {
        setNavigation(data.data)
      }
    } catch (error) {
      console.error('获取导航失败:', error)
    }
  }

  // 获取首页内容
  const fetchHomeContent = async () => {
    try {
      setLoading(true)
      const [recentRes, categoriesRes, statsRes] = await Promise.all([
        fetch('/api/wiki/content?action=get-recent&limit=6'),
        fetch('/api/wiki/content?action=get-categories'),
        fetch('/api/wiki/content?action=get-stats')
      ])

      const [recentData, categoriesData, statsData] = await Promise.all([
        recentRes.json(),
        categoriesRes.json(),
        statsRes.json()
      ])

      if (recentData.success) setRecentPages(recentData.data)
      if (categoriesData.success) setCategories(categoriesData.data)
      if (statsData.success) setStats(statsData.data)
    } catch (error) {
      console.error('获取首页内容失败:', error)
      showError('获取内容失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取页面内容
  const fetchPage = async (slug: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/wiki/content?action=get-page&slug=${slug}`)
      const data = await response.json()
      
      if (data.success) {
        setCurrentPage(data.data)
        setActiveView('page')
      } else {
        showError('页面不存在')
        setActiveView('home')
      }
    } catch (error) {
      console.error('获取页面失败:', error)
      showError('获取页面失败')
      setActiveView('home')
    } finally {
      setLoading(false)
    }
  }

  // 搜索功能
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearchLoading(true)
      const response = await fetch(`/api/wiki/content?action=search&search=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.data.results)
        setActiveView('search')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      showError('搜索失败')
    } finally {
      setSearchLoading(false)
    }
  }

  // 处理搜索输入
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  useEffect(() => {
    fetchNavigation()
    fetchHomeContent()
  }, [])

  // 渲染Markdown内容
  const renderMarkdown = (content: string) => {
    // 这里可以使用更复杂的Markdown渲染器
    return (
      <div 
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ 
          __html: content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        }}
      />
    )
  }

  // 首页内容
  const renderHomeContent = () => (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          MXacc Wiki
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          欢迎来到梦锡账号系统的知识库，这里包含了详细的使用指南、API文档和常见问题解答
        </p>
        
        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalPages}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">总页面</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalCategories}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">分类</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{recentPages.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">最近更新</div>
          </div>
        </div>
      </div>

      {/* 分类浏览 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">浏览分类</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <motion.div
              key={category._id}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                // 显示分类下的页面
                console.log('查看分类:', category.name)
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{category.pageCount || 0} 页面</p>
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* 最近更新 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">最近更新</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recentPages.map((page) => (
            <motion.div
              key={page._id}
              whileHover={{ scale: 1.01 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => fetchPage(page.slug)}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400">
                {page.title}
              </h3>
              {page.contentSummary && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {page.contentSummary}...
                </p>
              )}
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(page.updatedAt).toLocaleDateString()}</span>
                </div>
                {page.tags && page.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Tag className="w-3 h-3" />
                    <span>{page.tags.slice(0, 2).join(', ')}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )

  // 页面内容
  const renderPageContent = () => {
    if (!currentPage) return null

    return (
      <div className="max-w-4xl mx-auto">
        {/* 面包屑导航 */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <button 
            onClick={() => setActiveView('home')}
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Home className="w-4 h-4" />
          </button>
          <ChevronRight className="w-3 h-3" />
          {currentPage.category && (
            <>
              <span>{currentPage.category.name}</span>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-gray-900 dark:text-white">{currentPage.title}</span>
        </nav>

        {/* 页面头部 */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {currentPage.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>更新于 {new Date(currentPage.updatedAt).toLocaleDateString()}</span>
              </div>
              {currentPage.tags && currentPage.tags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <div className="flex space-x-1">
                    {currentPage.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {isAdmin && (
            <button
              onClick={() => handleEditPage(currentPage)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>编辑</span>
            </button>
          )}
        </div>

        {/* 页面内容 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          {renderMarkdown(currentPage.content)}
        </div>
      </div>
    )
  }

  // 搜索结果
  const renderSearchResults = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          搜索结果
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          找到 {searchResults.length} 个关于 "{searchQuery}" 的结果
        </p>
      </div>

      <div className="space-y-6">
        {searchResults.map((page) => (
          <motion.div
            key={page._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => fetchPage(page.slug)}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400">
              {page.title}
            </h3>
            {page.contentSummary && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {page.contentSummary}...
              </p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              {page.category && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {page.category.name}
                </span>
              )}
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(page.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {searchResults.length === 0 && !searchLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">未找到相关内容</h3>
            <p className="text-gray-600 dark:text-gray-400">
              尝试使用不同的关键词或浏览分类页面
            </p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* 侧边栏遮罩 (移动端) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-30 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900 dark:text-white">MXacc Wiki</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">知识库</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 搜索框 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文档..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </form>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {/* 首页 */}
            <button
              onClick={() => setActiveView('home')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'home'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>首页</span>
            </button>

            {/* 管理员功能 */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    管理功能
                  </span>
                </div>
                <button
                  onClick={handleCreatePage}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>新建页面</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
                  <FolderPlus className="w-4 h-4" />
                  <span>新建分类</span>
                </button>
              </>
            )}

            {/* 分类导航 */}
            <div className="pt-4 pb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                分类
              </span>
            </div>
            
            {navigation.map((category) => (
              <div key={category._id} className="space-y-1">
                <div className="font-medium text-gray-900 dark:text-white px-3 py-1">
                  {category.name}
                </div>
                {category.pages.map((page) => (
                  <button
                    key={page._id}
                    onClick={() => fetchPage(page.slug)}
                    className={`w-full flex items-center space-x-2 px-6 py-1.5 rounded text-sm transition-colors ${
                      currentPage?.slug === page.slug
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                  >
                    <span>{page.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeView === 'home' ? 'Wiki首页' : 
                 activeView === 'page' ? currentPage?.title : 
                 activeView === 'search' ? '搜索结果' : 'Wiki'}
              </span>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeView === 'home' && renderHomeContent()}
                {activeView === 'page' && renderPageContent()}
                {activeView === 'search' && renderSearchResults()}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Wiki编辑器模态框 */}
      {showEditor && (
        <WikiEditor
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false)
            setEditingPage(null)
          }}
          page={editingPage}
          categories={categories}
          onSave={() => {
            // 重新获取导航和内容
            fetchNavigation()
            if (activeView === 'home') {
              fetchHomeContent()
            }
            showSuccess(editingPage ? '页面更新成功' : '页面创建成功')
          }}
        />
      )}
    </div>
  )
}

export default WikiPage 