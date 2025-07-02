import React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '@/contexts/ThemeContext'
import { Copy, Check, ExternalLink, AlertTriangle, Info, CheckCircle, Lightbulb } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

interface CodeBlockProps {
  children: string
  language?: string
  filename?: string
  highlight?: string
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, language = 'text', filename, highlight }) => {
  const { isDark } = useTheme()
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const highlightedLines = highlight?.split(',').map(line => {
    if (line.includes('-')) {
      const [start, end] = line.split('-').map(Number)
      return Array.from({ length: end - start + 1 }, (_, i) => start + i)
    }
    return [parseInt(line)]
  }).flat() || []

  return (
    <div className="relative group my-4">
      {filename && (
        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-mono text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 rounded-t-lg">
          {filename}
        </div>
      )}
      <div className="relative">
        <button
          onClick={copyToClipboard}
          className="absolute top-3 right-3 z-10 p-2 bg-gray-800 dark:bg-gray-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="复制代码"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <SyntaxHighlighter
          language={language}
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            borderRadius: filename ? '0 0 0.5rem 0.5rem' : '0.5rem',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
          wrapLines={true}
          lineProps={(lineNumber: number) => ({
            style: {
              backgroundColor: highlightedLines.includes(lineNumber) 
                ? isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                : 'transparent'
            }
          })}
          showLineNumbers={true}
        >
          {children.trim()}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

const CalloutBox: React.FC<{ type: 'tip' | 'warning' | 'danger' | 'info', children: string }> = ({ type, children }) => {
  const configs = {
    tip: {
      icon: <Lightbulb size={16} />,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    warning: {
      icon: <AlertTriangle size={16} />,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    danger: {
      icon: <AlertTriangle size={16} />,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-600 dark:text-red-400'
    },
    info: {
      icon: <Info size={16} />,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-600 dark:text-blue-400'
    }
  }

  const config = configs[type]

  return (
    <div className={`my-4 p-4 rounded-lg border-l-4 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start space-x-3">
        <div className={config.iconColor}>
          {config.icon}
        </div>
        <div className={`${config.textColor} text-sm leading-relaxed`}>
          {children}
        </div>
      </div>
    </div>
  )
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      // 代码块
      if (line.startsWith('```')) {
        const match = line.match(/^```(\w+)?\s*(?:\[([^\]]+)\])?\s*(?:\{([^}]+)\})?/)
        const language = match?.[1] || 'text'
        const filename = match?.[2]
        const highlight = match?.[3]
        
        i++
        const codeLines = []
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i])
          i++
        }
        
        elements.push(
          <CodeBlock 
            key={elements.length}
            language={language}
            filename={filename}
            highlight={highlight}
          >
            {codeLines.join('\n')}
          </CodeBlock>
        )
        i++
        continue
      }

      // 标题
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1
        const text = line.replace(/^#+\s*/, '')
        const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        
        const Tag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements
        const classes = {
          1: 'text-4xl font-bold mt-8 mb-6 text-gray-900 dark:text-white',
          2: 'text-3xl font-semibold mt-6 mb-4 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2',
          3: 'text-2xl font-medium mt-5 mb-3 text-gray-700 dark:text-gray-200',
          4: 'text-xl font-medium mt-4 mb-2 text-gray-700 dark:text-gray-200',
          5: 'text-lg font-medium mt-3 mb-2 text-gray-600 dark:text-gray-300',
          6: 'text-base font-medium mt-2 mb-1 text-gray-600 dark:text-gray-300'
        }
        
        elements.push(
          <Tag key={elements.length} id={id} className={classes[level as keyof typeof classes] || classes[6]}>
            {text}
          </Tag>
        )
        i++
        continue
      }

      // Callout 框
      if (line.match(/^:::\s*(tip|warning|danger|info)/)) {
        const type = line.match(/^:::\s*(tip|warning|danger|info)/)?.[1] as 'tip' | 'warning' | 'danger' | 'info'
        i++
        const calloutLines = []
        while (i < lines.length && !lines[i].startsWith(':::')) {
          calloutLines.push(lines[i])
          i++
        }
        
        elements.push(
          <CalloutBox key={elements.length} type={type}>
            {calloutLines.join('\n')}
          </CalloutBox>
        )
        i++
        continue
      }

      // 表格
      if (line.includes('|') && line.trim() !== '') {
        const tableLines = [line]
        i++
        while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
          tableLines.push(lines[i])
          i++
        }
        
        if (tableLines.length > 1) {
          const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h)
          const rows = tableLines.slice(2).map(row => 
            row.split('|').map(cell => cell.trim()).filter(cell => cell)
          )
          
          elements.push(
            <div key={elements.length} className="my-6 overflow-x-auto">
              <table className="min-w-full border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    {headers.map((header, idx) => (
                      <th key={idx} className="px-4 py-2 text-left font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
          continue
        }
      }

      // 列表
      if (line.match(/^[\s]*[-*+]\s+/) || line.match(/^[\s]*\d+\.\s+/)) {
        const listLines = [line]
        i++
        while (i < lines.length && (lines[i].match(/^[\s]*[-*+]\s+/) || lines[i].match(/^[\s]*\d+\.\s+/) || lines[i].match(/^[\s]*$/))) {
          if (lines[i].trim() !== '') {
            listLines.push(lines[i])
          }
          i++
        }
        
        const isOrdered = line.match(/^[\s]*\d+\.\s+/)
        const Tag = isOrdered ? 'ol' : 'ul'
        const listClass = isOrdered ? 'list-decimal list-inside' : 'list-disc list-inside'
        
        elements.push(
          <Tag key={elements.length} className={`my-4 space-y-2 ${listClass} text-gray-700 dark:text-gray-300`}>
            {listLines.map((listLine, idx) => {
              const text = listLine.replace(/^[\s]*[-*+\d.]\s+/, '')
              return <li key={idx} className="leading-relaxed">{text}</li>
            })}
          </Tag>
        )
        continue
      }

      // 引用
      if (line.startsWith('>')) {
        const quoteLines = [line]
        i++
        while (i < lines.length && lines[i].startsWith('>')) {
          quoteLines.push(lines[i])
          i++
        }
        
        const quoteText = quoteLines.map(l => l.replace(/^>\s*/, '')).join('\n')
        elements.push(
          <blockquote key={elements.length} className="my-4 pl-4 border-l-4 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 italic">
            {quoteText}
          </blockquote>
        )
        continue
      }

      // 链接处理
      const processLinks = (text: string) => {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
        const parts = []
        let lastIndex = 0
        let match

        while ((match = linkRegex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index))
          }
          
          const [, linkText, url] = match
          const isExternal = url.startsWith('http')
          
          parts.push(
            <a
              key={match.index}
              href={url}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              {linkText}
              {isExternal && <ExternalLink size={12} />}
            </a>
          )
          
          lastIndex = match.index + match[0].length
        }
        
        if (lastIndex < text.length) {
          parts.push(text.slice(lastIndex))
        }
        
        return parts
      }

      // 段落
      if (line.trim() !== '') {
        elements.push(
          <p key={elements.length} className="my-3 leading-relaxed text-gray-700 dark:text-gray-300">
            {processLinks(line)}
          </p>
        )
      } else {
        elements.push(<br key={elements.length} />)
      }
      
      i++
    }

    return elements
  }

  return (
    <div className={`vitepress-markdown ${className}`}>
      {parseMarkdown(content)}
    </div>
  )
}

export default MarkdownRenderer 