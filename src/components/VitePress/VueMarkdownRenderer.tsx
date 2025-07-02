import React, { useMemo, useEffect, useState, useRef } from 'react'
import MarkdownIt from 'markdown-it'
import { useTheme } from '@/contexts/ThemeContext'

interface VueMarkdownRendererProps {
  content: string
  className?: string
}

interface VueComponentData {
  id: string
  template: string
  script?: string
  style?: string
  data?: any
  methods?: any
  mounted?: boolean
}

const VueMarkdownRenderer: React.FC<VueMarkdownRendererProps> = ({ content, className = '' }) => {
  const { isDark } = useTheme()
  const [copiedBlocks, setCopiedBlocks] = useState<Set<string>>(new Set())
  const [vueComponents, setVueComponents] = useState<VueComponentData[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // 创建完整的markdown-it实例
  const md = useMemo(() => {
    const markdownIt = new MarkdownIt({
      html: true,
      xhtmlOut: true,
      breaks: false,
      langPrefix: 'language-',
      linkify: true,
      typographer: true,
    })

    // 尝试动态加载插件
    const loadPlugins = async () => {
      try {
        // 动态导入插件 (使用 @ts-ignore 来忽略类型错误)
        // @ts-ignore
        const markdownItContainer = await import('markdown-it-container')
        // @ts-ignore
        const markdownItEmoji = await import('markdown-it-emoji')
        // @ts-ignore
        const markdownItTaskLists = await import('markdown-it-task-lists')

        // 安全地添加插件
        if (markdownItEmoji.default) {
          markdownIt.use(markdownItEmoji.default)
        }

        if (markdownItTaskLists.default) {
          markdownIt.use(markdownItTaskLists.default, { enabled: true })
        }

        if (markdownItContainer.default) {
          // 添加容器
          const containers = ['tip', 'warning', 'danger', 'info', 'details']
          containers.forEach(name => {
            markdownIt.use(markdownItContainer.default, name, {
              render: (tokens: any, idx: number) => {
                const token = tokens[idx]
                const info = token.info.trim().slice(name.length).trim()
                if (token.nesting === 1) {
                  const title = info || name.toUpperCase()
                  const icon = getContainerIcon(name)
                  if (name === 'details') {
                    const detailsId = `details-${Math.random().toString(36).substr(2, 9)}`
                    return `<details class="custom-container details" data-details-id="${detailsId}">
                      <summary class="custom-container-title">
                        ${icon}${title}
                      </summary>
                      <div class="details-content">`
                  } else {
                    return `<div class="custom-container ${name}">
                      <p class="custom-container-title">${icon}${title}</p>\n`
                  }
                } else {
                  return name === 'details' ? `</div></details>\n` : `</div>\n`
                }
              }
            })
          })
        }

      } catch (e) {
        console.warn('Some markdown-it plugins failed to load:', e)
      }
    }

    loadPlugins()

    // 自定义代码块渲染
    markdownIt.renderer.rules.fence = (tokens, idx, options, env, renderer) => {
      const token = tokens[idx]
      const info = token.info ? token.info.trim() : ''
      const langMatch = info.match(/^(\w+)/)
      const lang = langMatch ? langMatch[1] : ''
      const blockId = `code-block-${idx}-${Math.random().toString(36).substr(2, 9)}`
      
      // 检查是否是Vue组件
      if (lang === 'vue' || (lang === 'html' && token.content.includes('<script>'))) {
        return renderVueComponent(token.content, blockId)
      }
      
      return `<div class="custom-code-block" data-lang="${lang}" data-block-id="${blockId}">
        <div class="code-block-header">
          <span class="code-lang">${lang || 'text'}</span>
          <button class="copy-button" onclick="copyCode('${blockId}')">
            <svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
              <path d="m4 16c-1.1 0-2-.9-2-2v-10c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
            </svg>
          </button>
        </div>
        <pre class="code-content"><code class="language-${lang}">${markdownIt.utils.escapeHtml(token.content)}</code></pre>
      </div>`
    }

    return markdownIt
  }, [])

  // 获取容器图标
  const getContainerIcon = (type: string) => {
    const icons = {
      tip: '💡',
      warning: '⚠️',
      danger: '🚨',
      info: 'ℹ️',
      details: '📋'
    }
    return icons[type as keyof typeof icons] || '📝'
  }

  // 渲染Vue组件
  const renderVueComponent = (vueCode: string, componentId: string) => {
    // 解析Vue组件
    const templateMatch = vueCode.match(/<template>([\s\S]*?)<\/template>/)
    const scriptMatch = vueCode.match(/<script>([\s\S]*?)<\/script>/)
    const styleMatch = vueCode.match(/<style[^>]*>([\s\S]*?)<\/style>/)

    const template = templateMatch ? templateMatch[1].trim() : vueCode
    const script = scriptMatch ? scriptMatch[1].trim() : ''
    const style = styleMatch ? styleMatch[1].trim() : ''

    // 创建Vue组件数据
    const componentData: VueComponentData = {
      id: componentId,
      template,
      script,
      style,
      data: {},
      methods: {},
      mounted: false
    }

    // 执行Vue脚本
    if (script) {
      try {
        // 创建一个安全的执行环境
        const dataMatch = script.match(/data\s*\(\s*\)\s*\{[\s\S]*?return\s*(\{[\s\S]*?\})/s)
        const methodsMatch = script.match(/methods\s*:\s*(\{[\s\S]*?\})/s)

        if (dataMatch) {
          try {
            componentData.data = new Function('return ' + dataMatch[1])()
          } catch (e) {
            console.warn('Failed to parse Vue data:', e)
          }
        }

        if (methodsMatch) {
          try {
            componentData.methods = new Function('return ' + methodsMatch[1])()
          } catch (e) {
            console.warn('Failed to parse Vue methods:', e)
          }
        }
      } catch (e) {
        console.warn('Failed to execute Vue script:', e)
      }
    }

    // 添加到组件列表
    setVueComponents(prev => [...prev.filter(c => c.id !== componentId), componentData])

    // 渲染Vue组件预览
    return `<div class="vue-component-container" data-component-id="${componentId}">
      <div class="vue-component-preview">
        <div class="vue-preview-header">
          <span class="vue-preview-title">🚀 Vue组件预览</span>
          <button class="vue-run-button" onclick="runVueComponent('${componentId}')">
            ▶️ 运行组件
          </button>
        </div>
        <div class="vue-preview-content" id="vue-preview-${componentId}">
          <div class="vue-placeholder">👆 点击"运行组件"按钮查看Vue组件效果</div>
        </div>
      </div>
      <div class="vue-component-code">
        <div class="code-block-header">
          <span class="code-lang">vue</span>
          <button class="copy-button" onclick="copyCode('${componentId}')">
            <svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
              <path d="m4 16c-1.1 0-2-.9-2-2v-10c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
            </svg>
          </button>
        </div>
        <pre class="code-content"><code class="language-vue">${md.utils.escapeHtml(vueCode)}</code></pre>
      </div>
    </div>`
  }

  // 运行Vue组件
  const runVueComponent = (componentId: string) => {
    const component = vueComponents.find(c => c.id === componentId)
    if (!component) return

    const previewElement = document.getElementById(`vue-preview-${componentId}`)
    if (!previewElement) return

    try {
      // 处理Vue模板
      let processedTemplate = component.template

      // 处理Vue指令和插值
      Object.entries(component.data || {}).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
        processedTemplate = processedTemplate.replace(regex, String(value))
      })

      // 处理v-for指令
      processedTemplate = processedTemplate.replace(
        /(<[^>]+)v-for="([^"]+)"([^>]*>)/g,
        (match, start, forExpr, end) => {
          const [item, array] = forExpr.split(' in ').map((s: string) => s.trim())
          const arrayData = component.data?.[array] || []
          
          if (Array.isArray(arrayData)) {
            return arrayData.map((itemData: any, index: number) => {
              let itemHtml = start + end
              itemHtml = itemHtml.replace(new RegExp(`\\{\\{\\s*${item}\\s*\\}\\}`, 'g'), String(itemData))
              itemHtml = itemHtml.replace(new RegExp(`\\{\\{\\s*${item}\\.([^}]+)\\s*\\}\\}`, 'g'), 
                (_m: string, prop: string) => String((itemData as any)[prop] || ''))
              return itemHtml
            }).join('')
          }
          return match
        }
      )

      // 处理v-if指令
      processedTemplate = processedTemplate.replace(
        /(<[^>]+)v-if="([^"]+)"([^>]*>[\s\S]*?<\/[^>]+>)/g,
        (match, start, condition, rest) => {
          try {
            const evalCondition = new Function(...Object.keys(component.data || {}), `return ${condition}`)
            const result = evalCondition(...Object.values(component.data || {}))
            return result ? match.replace(`v-if="${condition}"`, '') : ''
          } catch (e) {
            console.warn('Failed to evaluate v-if condition:', e)
            return match
          }
        }
      )

      // 处理点击事件
      processedTemplate = processedTemplate.replace(
        /@click="([^"]+)"/g,
        (match, methodName) => {
          const method = component.methods?.[methodName]
          if (method) {
            const methodId = `method-${componentId}-${methodName}-${Math.random().toString(36).substr(2, 9)}`
            // 注册方法到window
            ;(window as any)[methodId] = () => {
              try {
                method.call({ 
                  ...component.data,
                  $set: (obj: any, key: string, value: any) => {
                    obj[key] = value
                    // 重新运行组件以更新UI
                    setTimeout(() => runVueComponent(componentId), 0)
                  }
                })
              } catch (e) {
                console.warn('Failed to execute method:', e)
              }
            }
            return `onclick="${methodId}()"`
          }
          return match
        }
      )

      // 应用样式
      if (component.style) {
        const styleId = `vue-style-${componentId}`
        let existingStyle = document.getElementById(styleId)
        if (existingStyle) {
          existingStyle.remove()
        }
        const styleElement = document.createElement('style')
        styleElement.id = styleId
        styleElement.textContent = component.style
        document.head.appendChild(styleElement)
      }

      // 渲染到预览区域
      previewElement.innerHTML = `<div class="vue-runtime-component">
        <div class="vue-success-message">✅ Vue组件运行成功！</div>
        ${processedTemplate}
      </div>`
      
      // 标记为已挂载
      const updatedComponent = { ...component, mounted: true }
      setVueComponents(prev => prev.map(c => c.id === componentId ? updatedComponent : c))

    } catch (e) {
      console.error('Failed to run Vue component:', e)
      previewElement.innerHTML = `<div class="vue-error">❌ 运行错误: ${(e as Error).message}</div>`
    }
  }

  // 渲染HTML
  const renderedHtml = useMemo(() => {
    try {
      return md.render(content)
    } catch (e) {
      console.error('Markdown rendering error:', e)
      return `<div class="markdown-error">渲染错误: ${(e as Error).message}</div>`
    }
  }, [content, md])

  // 复制代码功能
  const copyCode = async (blockId: string) => {
    const codeBlock = document.querySelector(`[data-block-id="${blockId}"] .code-content`) as HTMLElement
    if (codeBlock) {
      try {
        await navigator.clipboard.writeText(codeBlock.textContent || '')
        setCopiedBlocks(prev => new Set([...prev, blockId]))
        setTimeout(() => {
          setCopiedBlocks(prev => {
            const newSet = new Set(prev)
            newSet.delete(blockId)
            return newSet
          })
        }, 2000)
      } catch (err) {
        console.error('复制失败:', err)
      }
    }
  }

  // 注册全局函数
  useEffect(() => {
    ;(window as any).copyCode = copyCode
    ;(window as any).runVueComponent = runVueComponent
    
    return () => {
      delete (window as any).copyCode
      delete (window as any).runVueComponent
    }
  }, [vueComponents])

  return (
    <>
      {/* 完整的VitePress + Vue执行样式 */}
      <style>{`
        .vue-markdown-content {
          line-height: 1.7;
          color: ${isDark ? '#e2e8f0' : '#374151'};
          font-size: 16px;
          max-width: none;
        }

        /* 标题样式 */
        .vue-markdown-content h1,
        .vue-markdown-content h2,
        .vue-markdown-content h3,
        .vue-markdown-content h4,
        .vue-markdown-content h5,
        .vue-markdown-content h6 {
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: ${isDark ? '#f8fafc' : '#1f2937'};
          position: relative;
        }

        .vue-markdown-content h1 { font-size: 2.25rem; }
        .vue-markdown-content h2 { 
          font-size: 1.875rem; 
          border-bottom: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
          padding-bottom: 0.5rem;
        }
        .vue-markdown-content h3 { font-size: 1.5rem; }
        .vue-markdown-content h4 { font-size: 1.25rem; }
        .vue-markdown-content h5 { font-size: 1.125rem; }
        .vue-markdown-content h6 { font-size: 1rem; }

        /* 段落和文本 */
        .vue-markdown-content p {
          margin: 1em 0;
        }

        .vue-markdown-content strong {
          font-weight: 600;
          color: ${isDark ? '#f1f5f9' : '#111827'};
        }

        /* 链接样式 */
        .vue-markdown-content a {
          color: ${isDark ? '#60a5fa' : '#3b82f6'};
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }

        .vue-markdown-content a:hover {
          border-bottom-color: ${isDark ? '#60a5fa' : '#3b82f6'};
        }

        /* 表格样式 */
        .vue-markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
          border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
          border-radius: 8px;
          overflow: hidden;
        }

        .vue-markdown-content th,
        .vue-markdown-content td {
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
        }

        .vue-markdown-content th {
          background: ${isDark ? '#1f2937' : '#f9fafb'};
          font-weight: 600;
        }

        .vue-markdown-content tr:hover {
          background: ${isDark ? '#1f2937' : '#f9fafb'};
        }

        /* 列表样式 */
        .vue-markdown-content ul,
        .vue-markdown-content ol {
          margin: 1em 0;
          padding-left: 1.5rem;
        }

        .vue-markdown-content li {
          margin: 0.5em 0;
        }

        /* 引用块 */
        .vue-markdown-content blockquote {
          margin: 1em 0;
          padding: 0 1rem;
          border-left: 4px solid ${isDark ? '#60a5fa' : '#3b82f6'};
          background: ${isDark ? '#1e293b' : '#f8fafc'};
          border-radius: 0 4px 4px 0;
        }

        /* 行内代码 */
        .vue-markdown-content code {
          background: ${isDark ? '#1e293b' : '#f1f5f9'};
          color: ${isDark ? '#e2e8f0' : '#1e293b'};
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
          font-size: 0.875em;
        }

        /* 代码块样式 */
        .custom-code-block {
          margin: 1rem 0;
          border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
          border-radius: 8px;
          overflow: hidden;
          background: ${isDark ? '#111827' : '#ffffff'};
        }

        .code-block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          background: ${isDark ? '#1f2937' : '#f9fafb'};
          border-bottom: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
        }

        .code-lang {
          font-size: 0.875rem;
          font-weight: 500;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
        }

        .copy-button {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: transparent;
          border: 1px solid ${isDark ? '#374151' : '#d1d5db'};
          border-radius: 4px;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-button:hover {
          background: ${isDark ? '#374151' : '#f3f4f6'};
          border-color: ${isDark ? '#4b5563' : '#9ca3af'};
        }

        .code-content {
          padding: 1rem;
          margin: 0;
          font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          background: transparent;
          overflow-x: auto;
        }

        .code-content code {
          background: transparent;
          padding: 0;
          border-radius: 0;
          font-size: inherit;
          color: inherit;
        }

        /* Vue组件容器 - 重点样式 */
        .vue-component-container {
          margin: 2rem 0;
          border: 2px solid ${isDark ? '#059669' : '#10b981'};
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .vue-component-preview {
          background: ${isDark ? '#0f172a' : '#f0fdf4'};
          border-bottom: 2px solid ${isDark ? '#059669' : '#10b981'};
        }

        .vue-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: ${isDark ? '#059669' : '#10b981'};
          color: white;
        }

        .vue-preview-title {
          font-weight: 700;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .vue-run-button {
          padding: 0.75rem 1.5rem;
          background: ${isDark ? '#ffffff' : '#ffffff'};
          color: ${isDark ? '#059669' : '#10b981'};
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .vue-run-button:hover {
          background: ${isDark ? '#f9fafb' : '#f9fafb'};
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .vue-preview-content {
          padding: 1.5rem;
          min-height: 120px;
          background: ${isDark ? '#1e293b' : '#ffffff'};
        }

        .vue-placeholder {
          color: ${isDark ? '#94a3b8' : '#64748b'};
          font-style: italic;
          text-align: center;
          padding: 2rem;
          font-size: 1.1rem;
          border: 2px dashed ${isDark ? '#475569' : '#cbd5e1'};
          border-radius: 8px;
          background: ${isDark ? '#334155' : '#f8fafc'};
        }

        .vue-runtime-component {
          font-family: inherit;
          animation: fadeIn 0.3s ease-out;
        }

        .vue-success-message {
          background: ${isDark ? '#064e3b' : '#d1fae5'};
          color: ${isDark ? '#10b981' : '#047857'};
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-weight: 600;
          border: 1px solid ${isDark ? '#10b981' : '#047857'};
        }

        .vue-error {
          color: #ef4444;
          background: ${isDark ? '#451a1a' : '#fef2f2'};
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #ef4444;
          font-weight: 600;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* 自定义容器样式 */
        .custom-container {
          margin: 1.5rem 0;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .custom-container-title {
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .custom-container.tip {
          background: ${isDark ? '#1e3a8a20' : '#dbeafe'};
          border-left-color: #3b82f6;
          color: ${isDark ? '#93c5fd' : '#1e40af'};
        }

        .custom-container.warning {
          background: ${isDark ? '#92400e20' : '#fef3c7'};
          border-left-color: #f59e0b;
          color: ${isDark ? '#fbbf24' : '#92400e'};
        }

        .custom-container.danger {
          background: ${isDark ? '#dc262620' : '#fee2e2'};
          border-left-color: #ef4444;
          color: ${isDark ? '#f87171' : '#dc2626'};
        }

        .custom-container.info {
          background: ${isDark ? '#06b6d420' : '#cffafe'};
          border-left-color: #06b6d4;
          color: ${isDark ? '#67e8f9' : '#0891b2'};
        }

        .custom-container.details {
          background: ${isDark ? '#374151' : '#f9fafb'};
          border-left-color: #6b7280;
          border: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .vue-markdown-content {
            font-size: 14px;
          }
          
          .vue-preview-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
          
          .vue-run-button {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      <div 
        ref={containerRef}
        className={`vue-markdown-content ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </>
  )
}

export default VueMarkdownRenderer 