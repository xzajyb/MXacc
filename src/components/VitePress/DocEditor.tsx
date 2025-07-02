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

  const [categories, setCategories] = useState<Category[]>(() => {
    // 从localStorage读取保存的分类
    const savedCategories = localStorage.getItem('doc-categories')
    if (savedCategories) {
      try {
        return JSON.parse(savedCategories)
      } catch (e) {
        console.error('解析分类数据失败:', e)
      }
    }
    // 默认分类
    return [
      { value: 'guide', label: '指南', englishPath: 'guide' },
      { value: 'api', label: 'API文档', englishPath: 'api' },
      { value: 'tutorial', label: '教程', englishPath: 'tutorial' },
      { value: 'faq', label: '常见问题', englishPath: 'faq' },
      { value: 'development', label: '开发', englishPath: 'development' }
    ]
  })

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

  // 构建分类路径
  const buildCategoryPath = (categoryValue: string, categories: Category[]): string => {
    const category = categories.find(c => c.value === categoryValue)
    if (!category) return categoryValue
    
    if (category.parentCategory) {
      const parentCategory = categories.find(c => c.value === category.parentCategory)
      if (parentCategory) {
        return `${parentCategory.englishPath}/${category.englishPath}`
      }
    }
    
    return category.englishPath
  }

  // 构建分类显示名称（父-父-子格式）
  const buildCategoryDisplayName = (categoryValue: string, categories: Category[]): string => {
    const category = categories.find(c => c.value === categoryValue)
    if (!category) return categoryValue
    
    if (category.parentCategory) {
      const parentCategory = categories.find(c => c.value === category.parentCategory)
      if (parentCategory) {
        return `${parentCategory.label}-${category.label}`
      }
    }
    
    return category.label
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
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      alert('分类名称不能为空')
      return
    }

    const englishPath = newCategoryEnglish || generateEnglishPath(newCategoryName)
    const categoryValue = englishPath

    const newCategory: Category = {
      value: categoryValue,
      label: newCategoryName.trim(),
      englishPath: englishPath,
      parentCategory: parentCategory || undefined
    }

    if (categories.find(c => c.value === categoryValue)) {
      alert('该分类已存在')
      return
    }

    setCategories([...categories, newCategory])
    setNewCategoryName('')
    setNewCategoryEnglish('')
    setParentCategory('')
    
    // 显示成功提示
    alert(`分类 "${newCategory.label}" 已添加到本地，刷新页面前有效`)
  }

  // 删除分类
  const handleDeleteCategory = (categoryValue: string) => {
    if (!confirm('确定要删除这个分类吗？')) return
    
    // 检查是否有子分类
    const hasChildren = categories.some(c => c.parentCategory === categoryValue)
    if (hasChildren) {
      alert('该分类下有子分类，请先删除子分类')
      return
    }

    setCategories(categories.filter(c => c.value !== categoryValue))
    
    // 如果删除的是当前选中的分类，重置为默认分类
    if (category === categoryValue) {
      setCategory('guide')
      setCategoryPath('guide')
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
  }, [initialDoc, isOpen])

  // 更新分类路径
  useEffect(() => {
    setCategoryPath(buildCategoryPath(category, categories))
  }, [category, categories])

  // 保存分类到localStorage
  useEffect(() => {
    localStorage.setItem('doc-categories', JSON.stringify(categories))
  }, [categories])

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
                >
                  {categories
                    .sort((a, b) => {
                      // 按层级排序，父分类在前
                      const aDepth = a.parentCategory ? 1 : 0
                      const bDepth = b.parentCategory ? 1 : 0
                      if (aDepth !== bDepth) return aDepth - bDepth
                      return a.label.localeCompare(b.label)
                    })
                    .map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {buildCategoryDisplayName(cat.value, categories)}
                      </option>
                    ))}
                </select>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  分类路径: /{categoryPath}
                </p>

                {/* 分类管理面板 */}
                {showCategoryManager && (
                  <div className="mt-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">分类管理</h4>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                      📝 提示：分类暂时保存在本地，页面刷新前有效
                    </p>
                    
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
                      >
                        <option value="">作为顶级分类</option>
                        {categories.filter(c => !c.parentCategory).map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddCategory}
                        className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Plus size={14} />
                        <span>添加分类</span>
                      </button>
                    </div>

                    {/* 现有分类列表 */}
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {categories.map((cat) => (
                        <div key={cat.value} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="flex items-center space-x-2">
                            {cat.parentCategory ? <FolderOpen size={14} /> : <Folder size={14} />}
                            <span className="text-sm">
                              {cat.parentCategory ? `└─ ${cat.label}` : cat.label}
                            </span>
                            <span className="text-xs text-gray-500">({cat.englishPath})</span>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(cat.value)}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                            title="删除分类"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
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