import React, { useState, useEffect } from 'react'
import { X, Save, Eye, Code, FileText, Tag, Globe, Lock, Upload, List, Trash2, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import VitePressRenderer, { TocItem } from './VitePressRenderer'

interface DocEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (docData: any) => void
  initialDoc?: any
}

const DocEditor: React.FC<DocEditorProps> = ({ isOpen, onClose, onSave, initialDoc }) => {
  const { isDark } = useTheme()
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('guide')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customToc, setCustomToc] = useState<TocItem[]>([])
  const [newTocTitle, setNewTocTitle] = useState('')
  const [newTocLevel, setNewTocLevel] = useState(1)

  const categories = [
    { value: 'guide', label: '指南' },
    { value: 'api', label: 'API 文档' },
    { value: 'tutorial', label: '教程' },
    { value: 'faq', label: '常见问题' },
    { value: 'development', label: '开发' }
  ]

  // 从标题自动生成 slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // 处理标题变化
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle))
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

  // 添加目录项
  const handleAddTocItem = () => {
    if (newTocTitle.trim()) {
      const newTocItem: TocItem = {
        id: `toc-${Date.now()}`,
        title: newTocTitle.trim(),
        level: newTocLevel,
        anchor: `#${newTocTitle.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')}`
      }
      setCustomToc([...customToc, newTocItem])
      setNewTocTitle('')
      setNewTocLevel(1)
    }
  }

  // 移除目录项
  const handleRemoveTocItem = (index: number) => {
    setCustomToc(customToc.filter((_, i) => i !== index))
  }

  // 处理目录输入键盘事件
  const handleTocKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTocItem()
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
        tags,
        isPublic,
        toc: customToc,
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
      setTags(initialDoc.tags || [])
      setIsPublic(initialDoc.isPublic !== false)
      setCustomToc(initialDoc.toc || [])
    } else {
      // 重置表单
      setTitle('')
      setSlug('')
      setContent('')
      setCategory('guide')
      setTags([])
      setIsPublic(true)
      setCustomToc([])
    }
  }, [initialDoc, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col"
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
                  /{category}/{slug}
                </p>
              </div>

              {/* 分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  文档分类
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
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

              {/* 预设目录 */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <List size={16} className="mr-2" />
                  预设目录（优先显示）
                </label>
                
                {/* 目录列表 */}
                <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                  {customToc.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border">
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm truncate ${
                          item.level === 1 ? 'font-semibold' : 
                          item.level === 2 ? 'font-medium pl-4' : 
                          'font-normal pl-8'
                        }`}>
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500">H{item.level}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveTocItem(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="删除目录项"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* 添加目录项 */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <select
                      value={newTocLevel}
                      onChange={(e) => setNewTocLevel(parseInt(e.target.value))}
                      className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value={1}>H1</option>
                      <option value={2}>H2</option>
                      <option value={3}>H3</option>
                      <option value={4}>H4</option>
                    </select>
                    <input
                      type="text"
                      value={newTocTitle}
                      onChange={(e) => setNewTocTitle(e.target.value)}
                      onKeyDown={handleTocKeyPress}
                      placeholder="目录标题"
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddTocItem}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      title="添加目录项"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    预设目录将覆盖自动提取的标题目录
                  </p>
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
                                      <VitePressRenderer content={content || '在左侧编辑区域输入 Markdown 内容...'} />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DocEditor 