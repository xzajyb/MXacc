import React, { useMemo, useEffect, useState } from 'react'
import MarkdownIt from 'markdown-it'
import markdownItContainer from 'markdown-it-container'
import markdownItEmoji from 'markdown-it-emoji'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItIns from 'markdown-it-ins'
import markdownItMark from 'markdown-it-mark'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import markdownItTaskLists from 'markdown-it-task-lists'
import { useTheme } from '@/contexts/ThemeContext'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, AlertTriangle, Info, CheckCircle, Lightbulb, ExternalLink } from 'lucide-react'

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
}

const VueMarkdownRenderer: React.FC<VueMarkdownRendererProps> = ({ content, className = '' }) => {
  const { isDark } = useTheme()
  const [copiedBlocks, setCopiedBlocks] = useState<Set<string>>(new Set())
  const [vueComponents, setVueComponents] = useState<VueComponentData[]>([])

  // 创建markdown-it实例
  const md = useMemo(() => {
    const markdownIt = new MarkdownIt({
      html: true,
      xhtmlOut: true,
      breaks: false,
      langPrefix: 'language-',
      linkify: true,
      typographer: true,
    })

    // 添加插件
    markdownIt
      .use(markdownItEmoji)
      .use(markdownItFootnote)
      .use(markdownItIns)
      .use(markdownItMark)
      .use(markdownItSub)
      .use(markdownItSup)
      .use(markdownItTaskLists, { enabled: true })

    // 添加容器插件（支持 ::: tip ::: warning 等）
    markdownIt
      .use(markdownItContainer, 'tip', {
        render: (tokens: any, idx: number) => {
          const token = tokens[idx]
          if (token.nesting === 1) {
            const title = token.info.trim().slice(3).trim() || 'TIP'
            return `<div class="custom-container tip"><p class="custom-container-title"><svg class="icon"><use href="#icon-lightbulb"></use></svg>${title}</p>\n`
          } else {
            return `</div>\n`
          }
        }
      })
      .use(markdownItContainer, 'warning', {
        render: (tokens: any, idx: number) => {
          const token = tokens[idx]
          if (token.nesting === 1) {
            const title = token.info.trim().slice(7).trim() || 'WARNING'
            return `<div class="custom-container warning"><p class="custom-container-title"><svg class="icon"><use href="#icon-warning"></use></svg>${title}</p>\n`
          } else {
            return `</div>\n`
          }
        }
      })
      .use(markdownItContainer, 'danger', {
        render: (tokens: any, idx: number) => {
          const token = tokens[idx]
          if (token.nesting === 1) {
            const title = token.info.trim().slice(6).trim() || 'DANGER'
            return `<div class="custom-container danger"><p class="custom-container-title"><svg class="icon"><use href="#icon-danger"></use></svg>${title}</p>\n`
          } else {
            return `</div>\n`
          }
        }
      })
      .use(markdownItContainer, 'info', {
        render: (tokens: any, idx: number) => {
          const token = tokens[idx]
          if (token.nesting === 1) {
            const title = token.info.trim().slice(4).trim() || 'INFO'
            return `<div class="custom-container info"><p class="custom-container-title"><svg class="icon"><use href="#icon-info"></use></svg>${title}</p>\n`
          } else {
            return `</div>\n`
          }
        }
      })

    // 自定义代码块渲染
    const defaultCodeInlineRender = markdownIt.renderer.rules.code_inline || ((tokens, idx) => tokens[idx].content)
    markdownIt.renderer.rules.code_inline = (tokens, idx, options, env, renderer) => {
      const token = tokens[idx]
      return `<code class="inline-code">${token.content}</code>`
    }

    // 自定义代码块渲染
    const defaultFenceRender = markdownIt.renderer.rules.fence || ((tokens, idx, options, env, renderer) => {
      return renderer.renderToken(tokens, idx, options)
    })

    markdownIt.renderer.rules.fence = (tokens, idx, options, env, renderer) => {
      const token = tokens[idx]
      const info = token.info ? token.info.trim() : ''
      const langMatch = info.match(/^(\w+)/)
      const lang = langMatch ? langMatch[1] : ''
      
      // 生成唯一ID
      const blockId = `code-block-${idx}-${Math.random().toString(36).substr(2, 9)}`
      
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
        <pre class="code-content"><code class="language-${lang}">${token.content}</code></pre>
      </div>`
    }

    return markdownIt
  }, [])

  // 处理Vue组件语法
  const processVueComponents = (html: string) => {
    // 处理Vue指令和插值语法
    return html
      .replace(/v-for="([^"]+)"/g, (match, content) => {
        return `data-v-for="${content}"`
      })
      .replace(/v-if="([^"]+)"/g, (match, content) => {
        return `data-v-if="${content}"`
      })
      .replace(/v-model="([^"]+)"/g, (match, content) => {
        return `data-v-model="${content}"`
      })
      .replace(/@click="([^"]+)"/g, (match, content) => {
        return `data-click="${content}"`
      })
      .replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, content) => {
        return `<span class="vue-interpolation" data-content="${content.trim()}">${content.trim()}</span>`
      })
      .replace(/:class="([^"]+)"/g, (match, content) => {
        return `data-dynamic-class="${content}"`
      })
      .replace(/:key="([^"]+)"/g, (match, content) => {
        return `data-key="${content}"`
      })
  }

  // 渲染HTML
  const renderedHtml = useMemo(() => {
    const html = md.render(content)
    return processVueComponents(html)
  }, [content, md])

  // 复制代码功能
  const copyCode = async (blockId: string) => {
    const codeBlock = document.querySelector(`[data-block-id="${blockId}"] .code-content`)
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

  // 注册全局复制函数
  useEffect(() => {
    (window as any).copyCode = copyCode
    return () => {
      delete (window as any).copyCode
    }
  }, [])

  return (
    <>
      {/* 内联样式 */}
      <style>{`
        .vue-markdown-content {
          line-height: 1.7;
          color: ${isDark ? '#e2e8f0' : '#374151'};
        }

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

        .vue-markdown-content p {
          margin: 1em 0;
        }

        .vue-markdown-content ul,
        .vue-markdown-content ol {
          margin: 1em 0;
          padding-left: 1.5rem;
        }

        .vue-markdown-content li {
          margin: 0.25em 0;
        }

        .vue-markdown-content blockquote {
          border-left: 4px solid ${isDark ? '#4f46e5' : '#6366f1'};
          margin: 1em 0;
          padding: 0.5em 1em;
          background: ${isDark ? '#1e293b' : '#f8fafc'};
          color: ${isDark ? '#cbd5e1' : '#64748b'};
        }

        .vue-markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
        }

        .vue-markdown-content th,
        .vue-markdown-content td {
          border: 1px solid ${isDark ? '#374151' : '#d1d5db'};
          padding: 0.5em 1em;
          text-align: left;
        }

        .vue-markdown-content th {
          background: ${isDark ? '#374151' : '#f9fafb'};
          font-weight: 600;
        }

        .inline-code {
          background: ${isDark ? '#374151' : '#f1f5f9'};
          color: ${isDark ? '#e2e8f0' : '#1e293b'};
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        .custom-code-block {
          margin: 1.5em 0;
          border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
          border-radius: 0.5rem;
          overflow: hidden;
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
          font-size: 0.75rem;
          font-weight: 500;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
          text-transform: uppercase;
        }

        .copy-button {
          padding: 0.25rem;
          border: none;
          background: transparent;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
          cursor: pointer;
          border-radius: 0.25rem;
          transition: color 0.2s;
        }

        .copy-button:hover {
          color: ${isDark ? '#e5e7eb' : '#374151'};
        }

        .code-content {
          padding: 1rem;
          background: ${isDark ? '#0f172a' : '#ffffff'};
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .custom-container {
          margin: 1em 0;
          padding: 1rem;
          border-radius: 0.5rem;
          border-left: 4px solid;
        }

        .custom-container.tip {
          background: ${isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)'};
          border-color: #22c55e;
        }

        .custom-container.warning {
          background: ${isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)'};
          border-color: #f59e0b;
        }

        .custom-container.danger {
          background: ${isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'};
          border-color: #ef4444;
        }

        .custom-container.info {
          background: ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
          border-color: #3b82f6;
        }

        .custom-container-title {
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .vue-interpolation {
          background: ${isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'};
          color: ${isDark ? '#c4b5fd' : '#7c3aed'};
          padding: 0.1em 0.3em;
          border-radius: 0.25rem;
          font-weight: 500;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.9em;
        }

        .vue-markdown-content a {
          color: ${isDark ? '#60a5fa' : '#2563eb'};
          text-decoration: none;
        }

        .vue-markdown-content a:hover {
          text-decoration: underline;
        }

        /* Vue组件样式模拟 */
        [data-v-for] {
          border: 1px dashed ${isDark ? '#6366f1' : '#8b5cf6'};
          margin: 0.5rem 0;
          padding: 0.5rem;
          border-radius: 0.25rem;
          background: ${isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(139, 92, 246, 0.03)'};
        }

        [data-v-for]:before {
          content: "v-for: " attr(data-v-for);
          font-size: 0.75rem;
          color: ${isDark ? '#a78bfa' : '#7c3aed'};
          font-family: monospace;
          font-weight: 500;
        }

        [data-click] {
          cursor: pointer;
          transition: background-color 0.2s;
        }

        [data-click]:hover {
          background: ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
        }
      `}</style>

      <div 
        className={`vue-markdown-content ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </>
  )
}

export default VueMarkdownRenderer 