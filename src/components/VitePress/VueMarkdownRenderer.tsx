import React, { useMemo, useEffect, useState, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import MarkdownIt from 'markdown-it'
import { useTheme } from '@/contexts/ThemeContext'
import VueComponentRenderer from './VueComponentRenderer'

interface VueMarkdownRendererProps {
  content: string
  className?: string
}

interface VueComponentInfo {
  id: string
  code: string
  placeholder: string
}

const VueMarkdownRenderer: React.FC<VueMarkdownRendererProps> = ({ content, className = '' }) => {
  const { isDark } = useTheme()
  const [copiedBlocks, setCopiedBlocks] = useState<Set<string>>(new Set())
  const contentRef = useRef<HTMLDivElement>(null)
  const vueRootsRef = useRef<Map<string, any>>(new Map())
  const vueComponentsRef = useRef<VueComponentInfo[]>([])

  // 创建markdown-it实例
  const md = useMemo(() => {
    // 重置Vue组件列表
    vueComponentsRef.current = []
    
    const markdownIt = new MarkdownIt({
      html: true,
      xhtmlOut: true,
      breaks: false,
      langPrefix: 'language-',
      linkify: true,
      typographer: true,
    })

    // 动态加载插件
    const loadPlugins = async () => {
      try {
        // @ts-ignore
        const markdownItContainer = await import('markdown-it-container')
        // @ts-ignore
        const markdownItEmoji = await import('markdown-it-emoji')
        // @ts-ignore
        const markdownItTaskLists = await import('markdown-it-task-lists')

        if (markdownItEmoji.default) {
          markdownIt.use(markdownItEmoji.default)
        }

        if (markdownItTaskLists.default) {
          markdownIt.use(markdownItTaskLists.default, { enabled: true })
        }

        if (markdownItContainer.default) {
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
    markdownIt.renderer.rules.fence = (tokens, idx) => {
      const token = tokens[idx]
      const info = token.info ? token.info.trim() : ''
      const langMatch = info.match(/^(\w+)/)
      const lang = langMatch ? langMatch[1] : ''
      const blockId = `code-block-${idx}-${Math.random().toString(36).substr(2, 9)}`
      
      // 检查是否是Vue组件
      if (lang === 'vue' || (lang === 'html' && token.content.includes('<script>'))) {
        const componentId = `vue-component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const placeholder = `vue-placeholder-${componentId}`
        
        console.log('Vue component detected:', { lang, componentId, placeholder })
        
        // 添加到Vue组件列表（使用ref而不是state）
        vueComponentsRef.current.push({
          id: componentId,
          code: token.content,
          placeholder: placeholder
        })
        
        console.log('Vue components list:', vueComponentsRef.current)
        
        // 返回占位符div
        return `<div id="${placeholder}" class="vue-component-placeholder" data-vue-id="${componentId}"></div>`
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

  // 渲染HTML
  const renderedHtml = useMemo(() => {
    try {
      const html = md.render(content)
      console.log('Markdown rendered, Vue components found:', vueComponentsRef.current.length)
      return html
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
    
    return () => {
      delete (window as any).copyCode
    }
  }, [])

  // 渲染Vue组件到DOM（在HTML渲染完成后）
  useEffect(() => {
    if (!contentRef.current) return

    console.log('Starting Vue component rendering...')
    console.log('Vue components to render:', vueComponentsRef.current)

    // 清理之前的Vue根
    vueRootsRef.current.forEach(root => {
      try {
        root.unmount()
      } catch (e) {
        console.warn('Failed to unmount Vue component root:', e)
      }
    })
    vueRootsRef.current.clear()

    // 短延迟确保DOM完全更新
    const renderTimer = setTimeout(() => {
      vueComponentsRef.current.forEach(component => {
        const placeholder = contentRef.current!.querySelector(`#${component.placeholder}`)
        console.log(`Looking for placeholder: #${component.placeholder}`, placeholder)
        
        if (placeholder) {
          console.log(`Found placeholder for component ${component.id}, rendering...`)
          
          try {
            // 创建新的React根并渲染Vue组件
            const root = createRoot(placeholder)
            root.render(
              <VueComponentRenderer 
                vueCode={component.code} 
                componentId={component.id}
                isDark={isDark}
              />
            )
            vueRootsRef.current.set(component.id, root)
            
            console.log(`Vue component ${component.id} rendered successfully`)
          } catch (error) {
            console.error(`Failed to render Vue component ${component.id}:`, error)
            placeholder.innerHTML = `<div class="vue-error">Vue组件渲染失败: ${(error as Error).message}</div>`
          }
        } else {
          console.warn(`Placeholder not found for component ${component.id}`)
          console.log('Available elements:', Array.from(contentRef.current!.querySelectorAll('[id*="vue"]')).map(el => el.id))
        }
      })
    }, 100)

    // 清理函数
    return () => {
      clearTimeout(renderTimer)
      vueRootsRef.current.forEach(root => {
        try {
          root.unmount()
        } catch (e) {
          console.warn('Failed to unmount Vue component root:', e)
        }
      })
      vueRootsRef.current.clear()
    }
  }, [renderedHtml]) // 只依赖于渲染的HTML

  return (
    <>
      {/* 完整的VitePress + Vue 3执行样式 */}
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

        /* Vue组件占位符样式 */
        .vue-component-placeholder {
          min-height: 50px;
          background: ${isDark ? '#1f2937' : '#f9fafb'};
          border: 2px dashed ${isDark ? '#374151' : '#d1d5db'};
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 1rem 0;
          position: relative;
        }

        .vue-component-placeholder::before {
          content: "正在加载Vue组件...";
          color: ${isDark ? '#9ca3af' : '#6b7280'};
          font-size: 0.875rem;
          font-style: italic;
        }

        /* Vue组件加载完成后隐藏占位符样式 */
        .vue-component-placeholder:has(> *) {
          min-height: auto;
          background: transparent;
          border: none;
        }

        .vue-component-placeholder:has(> *)::before {
          display: none;
        }

        /* Vue错误样式 */
        .vue-error {
          background: ${isDark ? '#dc262620' : '#fee2e2'};
          border: 1px solid ${isDark ? '#dc2626' : '#fca5a5'};
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
          color: ${isDark ? '#f87171' : '#dc2626'};
          font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
          font-size: 0.875rem;
        }

        .vue-error::before {
          content: "❌ ";
          margin-right: 0.5rem;
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .vue-markdown-content {
            font-size: 14px;
          }
        }
      `}</style>

      <div ref={contentRef} className={`vue-markdown-content ${className}`}>
        {/* 渲染处理后的HTML，Vue组件会通过useEffect动态插入 */}
        <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      </div>
    </>
  )
}

export default VueMarkdownRenderer 