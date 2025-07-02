import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Eye, Code, FileText, Tag, Globe, Lock, Upload, Plus, Trash2, Folder, FolderOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import MarkdownRenderer from './MarkdownRenderer'

interface DocEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (docData: any) => void
  initialDoc?: any
}

interface Category {
  value: string
  label: string
  englishPath: string
  parentCategory?: string
  level?: number
}

const DocEditor: React.FC<DocEditorProps> = ({ isOpen, onClose, onSave, initialDoc }) => {
  const { isDark } = useTheme()
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('guide')
  const [categoryPath, setCategoryPath] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryEnglish, setNewCategoryEnglish] = useState('')
  const [parentCategory, setParentCategory] = useState('')

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  // 默认分类
  const defaultCategories: Category[] = [
    { value: 'guide', label: '指南', englishPath: 'guide' },
    { value: 'api', label: 'API文档', englishPath: 'api' },
    { value: 'tutorial', label: '教程', englishPath: 'tutorial' },
    { value: 'faq', label: '常见问题', englishPath: 'faq' },
    { value: 'development', label: '开发', englishPath: 'development' }
  ]

  // 预设的中英文映射
  const categoryMapping: Record<string, string> = {
    '指南': 'guide',
    'API文档': 'api',
    '教程': 'tutorial',
    '常见问题': 'faq',
    '开发': 'development',
    '安全': 'security',
    '部署': 'deployment',
    '配置': 'configuration',
    '故障排除': 'troubleshooting',
    '最佳实践': 'best-practices',
    '高级': 'advanced',
    '基础': 'basic'
  }

  // 从标题自动生成 slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // 自动生成英文路径
  const generateEnglishPath = (chineseName: string) => {
    // 先检查预设映射
    if (categoryMapping[chineseName]) {
      return categoryMapping[chineseName]
    }
    
    // 否则转换为拼音或英文
    return chineseName
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // 从后端加载分类
  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'manage-categories',
          categoryAction: 'get'
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // 合并默认分类和自定义分类
        const allCategories = [...defaultCategories, ...data.categories]
        setCategories(allCategories)
      } else {
        // 如果获取失败，使用默认分类
        setCategories(defaultCategories)
      }
    } catch (error) {
      console.error('加载分类失败:', error)
      setCategories(defaultCategories)
    } finally {
      setLoading(false)
    }
  }

  // 构建分类路径
  const buildCategoryPath = (categoryValue: string, categories: Category[]): string => {
    const category = categories.find(c => c.value === categoryValue)
    if (!category) return categoryValue
    
    if (category.parentCategory) {
      const parentPath = buildCategoryPath(category.parentCategory, categories)
      return `${parentPath}/${category.englishPath}`
    }
    
    return category.englishPath
  }

  // 排序分类以显示正确的层级结构
  const sortCategoriesHierarchically = (categories: Category[]): Category[] => {
    const topLevel = categories.filter(c => !c.parentCategory)
    const withChildren = categories.filter(c => c.parentCategory)
    
    const result: Category[] = []
    
    const addCategory = (category: Category, level: number = 0) => {
      result.push({ ...category, level })
      
      // 添加子分类
      const children = withChildren.filter(c => c.parentCategory === category.value)
      children.forEach(child => addCategory(child, level + 1))
    }
    
    topLevel.forEach(category => addCategory(category))
    
    return result
  }

  // 获取分类显示名称（带层级缩进）
  const getCategoryDisplayName = (category: Category, level?: number): string => {
    const actualLevel = level !== undefined ? level : (category as any).level || 0
    const indent = '　'.repeat(actualLevel) // 使用全角空格缩进
    const prefix = actualLevel > 0 ? '└─ ' : ''
    return `${indent}${prefix}${category.label}`
  }

  // 处理标题变化
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle))
    }
  }

  // 处理分类变化
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    setCategoryPath(buildCategoryPath(newCategory, categories))
  }

  // 添加新分类
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('分类名称不能为空')
      return
    }

    const englishPath = newCategoryEnglish || generateEnglishPath(newCategoryName)
    const categoryValue = englishPath

    if (categories.find(c => c.value === categoryValue)) {
      alert('该分类已存在')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'manage-categories',
          categoryAction: 'create',
          categoryData: {
            value: categoryValue,
            label: newCategoryName.trim(),
            englishPath: englishPath,
            parentCategory: parentCategory || null
          }
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // 重新加载分类列表
        await loadCategories()
        setNewCategoryName('')
        setNewCategoryEnglish('')
        setParentCategory('')
        alert('分类创建成功')
      } else {
        alert(data.message || '创建分类失败')
      }
    } catch (error) {
      console.error('创建分类失败:', error)
      alert('创建分类失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除分类
  const handleDeleteCategory = async (categoryValue: string) => {
    // 检查是否为默认分类
    if (defaultCategories.some(c => c.value === categoryValue)) {
      alert('无法删除默认分类')
      return
    }

    if (!confirm('确定要删除这个分类吗？')) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'manage-categories',
          categoryAction: 'delete',
          categoryData: {
            value: categoryValue
          }
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // 重新加载分类列表
        await loadCategories()
        
        // 如果删除的是当前选中的分类，重置为默认分类
        if (category === categoryValue) {
          setCategory('guide')
          setCategoryPath('guide')
        }
        
        alert('分类删除成功')
      } else {
        alert(data.message || '删除分类失败')
      }
    } catch (error) {
      console.error('删除分类失败:', error)
      alert('删除分类失败')
    } finally {
      setLoading(false)
    }
  }

  // 添加标签
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // 处理键盘事件（标签输入）
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag()
    }
  }

  // 保存文档
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('标题和内容不能为空')
      return
    }

    setSaving(true)
    try {
      const docData = {
        title: title.trim(),
        slug: slug || generateSlug(title),
        content: content.trim(),
        category,
        categoryPath: categoryPath || buildCategoryPath(category, categories),
        tags,
        isPublic,
        ...(initialDoc?._id && { docId: initialDoc._id })
      }
      
      await onSave(docData)
      onClose()
    } catch (error) {
      console.error('保存文档失败:', error)
    } finally {
      setSaving(false)
    }
  }

  // 初始化数据
  useEffect(() => {
    if (isOpen) {
      // 加载分类
      loadCategories()
      
      if (initialDoc) {
        setTitle(initialDoc.title || '')
        setSlug(initialDoc.slug || '')
        setContent(initialDoc.content || '')
        setCategory(initialDoc.category || 'guide')
        setCategoryPath(initialDoc.categoryPath || buildCategoryPath(initialDoc.category || 'guide', categories))
        setTags(initialDoc.tags || [])
        setIsPublic(initialDoc.isPublic !== false)
      } else {
        // 重置表单
        setTitle('')
        setSlug('')
        setContent('')
        setCategory('guide')
        setCategoryPath('guide')
        setTags([])
        setIsPublic(true)
      }
    }
  }, [initialDoc, isOpen])

  // 更新分类路径
  useEffect(() => {
    setCategoryPath(buildCategoryPath(category, categories))
  }, [category, categories])

  if (!isOpen) return null

  // 使用 React Portal 渲染到 body，确保不受父容器影响
  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {initialDoc ? '编辑文档' : '创建新文档'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 模式切换 */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setMode('edit')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  mode === 'edit' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Code size={16} className="inline mr-1" />
                编辑
              </button>
              <button
                onClick={() => setMode('preview')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  mode === 'preview' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Eye size={16} className="inline mr-1" />
                预览
              </button>
            </div>
            
            {/* 保存按钮 */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{saving ? '保存中...' : '保存'}</span>
            </button>
            
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 主体内容 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧设置面板 */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="space-y-6">
              {/* 基本信息 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  文档标题 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="输入文档标题"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* URL Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL 地址
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="自动生成"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  /{categoryPath}/{slug}
                </p>
              </div>

              {/* 分类管理 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    文档分类
                  </label>
                  <button
                    onClick={() => setShowCategoryManager(!showCategoryManager)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    管理分类
                  </button>
                </div>
                
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  {sortCategoriesHierarchically(categories).map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {getCategoryDisplayName(cat)}
                    </option>
                  ))}
                </select>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  分类路径: /{categoryPath}
                </p>

                {/* 分类管理面板 */}
                {showCategoryManager && (
                  <div className="mt-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">分类管理</h4>
                    
                    {/* 添加新分类 */}
                    <div className="space-y-3 mb-4">
                      <input
                        type="text"
                        placeholder="分类名称（中文）"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="英文路径（可选，自动生成）"
                        value={newCategoryEnglish}
                        onChange={(e) => setNewCategoryEnglish(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <select
                        value={parentCategory}
                        onChange={(e) => setParentCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={loading}
                      >
                        <option value="">作为顶级分类</option>
                        {sortCategoriesHierarchically(categories).map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {getCategoryDisplayName(cat)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddCategory}
                        disabled={loading}
                        className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
                      >
                        <Plus size={14} />
                        <span>{loading ? '保存中...' : '添加分类'}</span>
                      </button>
                    </div>

                    {/* 现有分类列表 */}
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {sortCategoriesHierarchically(categories).map((cat) => {
                        const isDefault = defaultCategories.some(d => d.value === cat.value)
                        return (
                          <div key={cat.value} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="flex items-center space-x-2">
                              {cat.parentCategory ? <FolderOpen size={14} /> : <Folder size={14} />}
                              <span className="text-sm">
                                {getCategoryDisplayName(cat)}
                              </span>
                              <span className="text-xs text-gray-500">({cat.englishPath})</span>
                              {isDefault && (
                                <span className="text-xs px-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded">
                                  默认
                                </span>
                              )}
                            </div>
                            {!isDefault && (
                              <button
                                onClick={() => handleDeleteCategory(cat.value)}
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                                title="删除分类"
                                disabled={loading}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  标签
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                    >
                      <Tag size={12} className="mr-1" />
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyPress}
                  placeholder="添加标签，按回车确认"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 可见性 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  可见性
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      className="mr-2"
                    />
                    <Globe size={16} className="mr-2 text-green-600" />
                    <span className="text-sm">公开 - 所有用户可见</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      className="mr-2"
                    />
                    <Lock size={16} className="mr-2 text-orange-600" />
                    <span className="text-sm">私有 - 仅管理员可见</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧编辑/预览区域 */}
          <div className="flex-1 flex flex-col">
            {mode === 'edit' ? (
              <div className="flex-1 p-6">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="使用 Markdown 语法编写文档内容..."
                  className="w-full h-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg p-4 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ) : (
              <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-800">
                <div className="max-w-none">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                    {title || '文档标题'}
                  </h1>
                  <MarkdownRenderer content={content || '在左侧编辑区域输入 Markdown 内容...'} />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )

  // 使用 React Portal 渲染到 body
  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(modalContent, document.body)
}

export default DocEditor 