import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Book, 
  Search, 
  Edit, 
  Plus, 
  Folder, 
  File, 
  Upload, 
  Download,
  Trash2,
  Save,
  X,
  ChevronRight,
  ChevronDown,
  Home,
  Archive,
  Globe,
  Users,
  Zap,
  Shield,
  Star,
  MessageCircle
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmDialog from '../components/ConfirmDialog'

interface WikiPageProps {
  embedded?: boolean
}

interface WikiDocument {
  id: string
  title: string
  content: string
  path: string
  parentId?: string
  type: 'folder' | 'document'
  tags: string[]
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
    nickname?: string
  }
  isPublic: boolean
  order: number
}

interface WikiCategory {
  id: string
  name: string
  icon: string
  description: string
  children: WikiDocument[]
}

const WikiPage: React.FC<WikiPageProps> = ({ embedded = false }) => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  
  // 状态管理
  const [categories, setCategories] = useState<WikiCategory[]>([])
  const [documents, setDocuments] = useState<WikiDocument[]>([])
  const [currentDocument, setCurrentDocument] = useState<WikiDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingDocument, setEditingDocument] = useState<WikiDocument | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isAdmin, setIsAdmin] = useState(false)
  
  // 编辑器状态
  const [editorTitle, setEditorTitle] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [editorPath, setEditorPath] = useState('')
  const [editorTags, setEditorTags] = useState('')
  const [editorIsPublic, setEditorIsPublic] = useState(true)
  const [editorParentId, setEditorParentId] = useState('')
  const [editorType, setEditorType] = useState<'folder' | 'document'>('document')
  const [isSaving, setIsSaving] = useState(false)
  
  // 上传状态
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  // 删除确认
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<WikiDocument | null>(null)

  useEffect(() => {
    setIsAdmin(user?.role === 'admin')
    loadWikiData()
  }, [user])

  // 加载Wiki数据
  const loadWikiData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/social/content?action=wiki-list', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data.categories || [])
        setDocuments(data.data.documents || [])
        
        // 如果没有文档且是管理员，加载默认的屯人服Wiki内容
        if (data.data.documents.length === 0 && user?.role === 'admin') {
          await initializeDefaultWiki()
        }
      }
    } catch (error) {
      console.error('加载Wiki数据失败:', error)
      showError('加载Wiki数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 初始化默认Wiki内容（屯人服Wiki）
  const initializeDefaultWiki = async () => {
    const defaultWikiContent = [
      {
        title: '欢迎来到屯人服 🌍',
        path: '/home',
        type: 'document' as const,
        content: `# 欢迎来到屯人服 🌍

**一个充满创意与协作的《我的世界》生存服务器**

---

## 🎯 **服务器简介**

* **创建时间**：2025年3月28日
* **创始团队**：mc506lw(老万) × alazeprt
* **核心理念**：通过协作与自由探索，打造沉浸式生存体验

---

## 🎯 **我们的目标**

✅ 为玩家提供**稳定、友好、创意驱动**的生存环境  
✅ 鼓励玩家通过建筑、冒险、社群互动，建立归属感

---

## 📌 **新手必读指南**

1. **基础规则**  
   ⚠️ 了解社区准则与行为规范，共建和谐环境
2. **加入方式**  
   🧭 获取服务器IP地址、版本要求及入服流程说明

---

## 📱 **加入我们**

🔥 **官方QQ群**：点击直达群聊

* **群号**：1043492617

---

## ❓ **需要帮助？**

欢迎在群内@管理员 提交建议，共同完善服务器生态！  
**让我们一起，在屯人服轻松做自己 🌟**`,
        tags: ['首页', '介绍', '屯人服'],
        isPublic: true,
        order: 1
      },
      {
        title: '加入服务器',
        path: '/join',
        type: 'document' as const,
        content: `# 加入服务器

## Java版

* **服务器地址**：待填写
* **版本要求**：1.19.x - 1.20.x
* **端口**：25565

## 基岩版

* **服务器地址**：待填写
* **端口**：19132

## 入服流程

1. 打开《我的世界》客户端
2. 选择"多人游戏"
3. 添加服务器地址
4. 点击连接
5. 在游戏内按照指引完成新手教程`,
        tags: ['新手', '加入', '教程'],
        isPublic: true,
        order: 2
      },
      {
        title: '服务器规则',
        path: '/rules',
        type: 'document' as const,
        content: `# 服务器规则

## 基本行为准则

1. **尊重他人**：禁止使用不当言论、恶意攻击其他玩家
2. **公平游戏**：禁止使用作弊工具、利用游戏漏洞
3. **协作友善**：鼓励团队合作，帮助新手玩家
4. **保护环境**：不随意破坏他人建筑和公共设施

## 违规处罚

* **警告**：首次违规
* **禁言**：重复违规
* **临时封禁**：严重违规
* **永久封禁**：恶意破坏

## 申诉流程

如对处罚有异议，可在QQ群内联系管理员申诉`,
        tags: ['规则', '行为准则', '处罚'],
        isPublic: true,
        order: 3
      },
      {
        title: '枪械系统',
        path: '/guns',
        type: 'document' as const,
        content: `# 枪械系统

## 基准说明

服务器采用了先进的枪械插件，为玩家提供更丰富的PVP体验。

## 枪械类型

### 手枪类
- **手枪**：近距离高伤害
- **左轮**：威力强但装弹慢

### 步枪类  
- **突击步枪**：全能型武器
- **狙击步枪**：远程高精度

### 特殊武器
- **火箭筒**：范围伤害
- **机枪**：高射速压制

## 获取方式

1. 击败怪物掉落
2. 箱子商店购买
3. 玩家交易获得

## 使用说明

* 右键射击
* Shift + 右键瞄准
* Q键装弹`,
        tags: ['枪械', 'PVP', '武器'],
        isPublic: true,
        order: 4
      }
    ]

    try {
      const token = localStorage.getItem('token')
      for (const doc of defaultWikiContent) {
        await fetch('/api/social/content', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'create-wiki',
            ...doc
          })
        })
      }
      
      showSuccess('已初始化默认Wiki内容')
      await loadWikiData()
    } catch (error) {
      console.error('初始化默认Wiki失败:', error)
    }
  }

  // 搜索文档
  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // 切换文件夹展开/折叠
  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  // 打开编辑器
  const openEditor = (document?: WikiDocument) => {
    if (document) {
      setEditingDocument(document)
      setEditorTitle(document.title)
      setEditorContent(document.content)
      setEditorPath(document.path)
      setEditorTags(document.tags.join(', '))
      setEditorIsPublic(document.isPublic)
      setEditorParentId(document.parentId || '')
      setEditorType(document.type)
    } else {
      setEditingDocument(null)
      setEditorTitle('')
      setEditorContent('')
      setEditorPath('')
      setEditorTags('')
      setEditorIsPublic(true)
      setEditorParentId('')
      setEditorType('document')
    }
    setShowEditor(true)
  }

  // 保存文档
  const saveDocument = async () => {
    if (!editorTitle.trim() || !editorContent.trim()) {
      showError('标题和内容不能为空')
      return
    }

    try {
      setIsSaving(true)
      const token = localStorage.getItem('token')
      
      const requestBody = {
        action: editingDocument ? 'update-wiki' : 'create-wiki',
        id: editingDocument?.id,
        title: editorTitle.trim(),
        content: editorContent.trim(),
        path: editorPath.trim() || `/${editorTitle.toLowerCase().replace(/\s+/g, '-')}`,
        tags: editorTags.split(',').map(tag => tag.trim()).filter(Boolean),
        isPublic: editorIsPublic,
        parentId: editorParentId || undefined,
        type: editorType
      }

      const response = await fetch('/api/social/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        showSuccess(editingDocument ? '文档更新成功' : '文档创建成功')
        setShowEditor(false)
        await loadWikiData()
      } else {
        const error = await response.json()
        showError(error.message || '保存失败')
      }
    } catch (error) {
      console.error('保存文档失败:', error)
      showError('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 删除文档
  const deleteDocument = async () => {
    if (!documentToDelete) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/social/content?action=delete-wiki&id=${documentToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        showSuccess('文档删除成功')
        setShowDeleteDialog(false)
        setDocumentToDelete(null)
        setCurrentDocument(null)
        await loadWikiData()
      } else {
        const error = await response.json()
        showError(error.message || '删除失败')
      }
    } catch (error) {
      console.error('删除文档失败:', error)
      showError('删除失败')
    }
  }

  // 上传Markdown文件
  const handleFileUpload = async () => {
    if (uploadFiles.length === 0) {
      showError('请选择要上传的文件')
      return
    }

    try {
      setIsUploading(true)
      const token = localStorage.getItem('token')

      for (const file of uploadFiles) {
        const content = await file.text()
        const title = file.name.replace(/\.md$/, '')
        const path = `/${title.toLowerCase().replace(/\s+/g, '-')}`

        await fetch('/api/social/content', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'create-wiki',
            title,
            content,
            path,
            tags: ['上传'],
            isPublic: true,
            type: 'document'
          })
        })
      }

      showSuccess(`成功上传 ${uploadFiles.length} 个文件`)
      setShowUploadModal(false)
      setUploadFiles([])
      await loadWikiData()
    } catch (error) {
      console.error('上传失败:', error)
      showError('上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  // 渲染文档内容（简单的Markdown解析）
  const renderContent = (content: string) => {
    // 简单的Markdown渲染
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4 text-gray-900 dark:text-white">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mb-2 text-gray-700 dark:text-gray-200">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/^\* (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal">$2</li>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(.*)$/gm, '<p class="mb-4">$1</p>')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-gray-50 dark:bg-gray-900'}`}>
      <div className="flex h-full">
        {/* 侧边栏 - 目录导航 */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* 搜索栏 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索文档..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 管理员工具 */}
          {isAdmin && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditor()}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>新建</span>
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>上传</span>
                </button>
              </div>
            </div>
          )}

          {/* 文档列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {(searchTerm ? filteredDocuments : documents).map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors group ${
                    currentDocument?.id === doc.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setCurrentDocument(doc)}
                >
                  {doc.type === 'folder' ? (
                    <Folder className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <File className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="flex-1 text-sm font-medium truncate">{doc.title}</span>
                  
                  {isAdmin && (
                    <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditor(doc)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDocumentToDelete(doc)
                          setShowDeleteDialog(true)
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {documents.length === 0 && (
              <div className="text-center py-8">
                <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">暂无Wiki文档</p>
                {isAdmin && (
                  <button
                    onClick={() => openEditor()}
                    className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    创建第一个文档
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentDocument ? (
            <>
              {/* 文档头部 */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {currentDocument.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>路径: {currentDocument.path}</span>
                      <span>•</span>
                      <span>作者: {currentDocument.author.nickname || currentDocument.author.username}</span>
                      <span>•</span>
                      <span>更新: {new Date(currentDocument.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {currentDocument.tags.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        {currentDocument.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {isAdmin && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditor(currentDocument)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>编辑</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 文档内容 */}
              <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 p-6">
                <div 
                  className="prose prose-gray dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderContent(currentDocument.content) }}
                />
              </div>
            </>
          ) : (
            /* 欢迎页面 */
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
              <div className="text-center">
                <Book className="w-24 h-24 text-blue-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  欢迎来到Wiki
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                  这里是知识库和文档中心，选择左侧的文档开始阅读，或者搜索您需要的内容。
                </p>
                
                {/* 快捷链接 */}
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  {documents.slice(0, 4).map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setCurrentDocument(doc)}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <File className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.title}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 编辑器模态框 */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditor(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 编辑器头部 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingDocument ? '编辑文档' : '创建文档'}
                </h3>
                <button
                  onClick={() => setShowEditor(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 编辑器内容 */}
              <div className="p-4 max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      标题
                    </label>
                    <input
                      type="text"
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="输入文档标题"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      路径
                    </label>
                    <input
                      type="text"
                      value={editorPath}
                      onChange={(e) => setEditorPath(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="/document-path"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      标签 (用逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={editorTags}
                      onChange={(e) => setEditorTags(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="标签1, 标签2, 标签3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      类型
                    </label>
                    <select
                      value={editorType}
                      onChange={(e) => setEditorType(e.target.value as 'folder' | 'document')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="document">文档</option>
                      <option value="folder">文件夹</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editorIsPublic}
                      onChange={(e) => setEditorIsPublic(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">公开可见</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    内容 (支持Markdown)
                  </label>
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="# 标题&#10;&#10;这里是文档内容..."
                  />
                </div>
              </div>

              {/* 编辑器底部 */}
              <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveDocument}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? '保存中...' : '保存'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 上传模态框 */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  上传Markdown文件
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    选择.md文件
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".md,.markdown"
                    onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {uploadFiles.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      将要上传的文件：
                    </p>
                    <ul className="text-sm space-y-1">
                      {uploadFiles.map((file, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">
                          • {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={uploadFiles.length === 0 || isUploading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUploading ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />}
                    <span>{isUploading ? '上传中...' : '上传'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setDocumentToDelete(null)
        }}
        onConfirm={deleteDocument}
        title="删除文档"
        message={`确定要删除文档 "${documentToDelete?.title}" 吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />
    </div>
  )
}

export default WikiPage 