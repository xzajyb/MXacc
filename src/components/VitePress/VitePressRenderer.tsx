import React, { useState, useEffect, useMemo } from 'react'
import MarkdownIt from 'markdown-it'
import { useTheme } from '@/contexts/ThemeContext'

export interface TocItem {
  id: string
  title: string
  level: number
  anchor: string
}

interface VitePressRendererProps {
  content: string
  className?: string
  onTocUpdate?: (toc: TocItem[]) => void
}

const VitePressRenderer: React.FC<VitePressRendererProps> = ({ 
  content, 
  className = '', 
  onTocUpdate 
}) => {
  const { isDark } = useTheme()

  // 配置 markdown-it 实例
  const md = useMemo(() => {
    const mdInstance = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: false
    })

    // 自定义标题渲染器以添加锚点
    const originalHeadingOpen = mdInstance.renderer.rules.heading_open || function(tokens, idx, options, env, renderer) {
      return renderer.renderToken(tokens, idx, options)
    }

    mdInstance.renderer.rules.heading_open = function(tokens, idx, options, env, renderer) {
      const token = tokens[idx]
      const level = parseInt(token.tag.substring(1))
      const next = tokens[idx + 1]
      const title = next && next.type === 'inline' ? next.content : ''
      const anchor = `heading-${idx}-${title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')}`
      
      token.attrSet('id', anchor)
      token.attrSet('class', `vp-heading level-${level}`)
      
      return originalHeadingOpen(tokens, idx, options, env, renderer)
    }

    return mdInstance
  }, [])

  // 提取样式
  const extractStyles = (text: string) => {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
    const styles: string[] = []
    let cleanedText = text
    let match

    while ((match = styleRegex.exec(text)) !== null) {
      styles.push(match[1])
      cleanedText = cleanedText.replace(match[0], '')
    }

    return { styles, cleanedText }
  }

  // 提取目录
  const extractToc = (htmlContent: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    
    const toc: TocItem[] = []
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1))
      const title = heading.textContent || ''
      const id = heading.id || `heading-${index}-${title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')}`
      
      if (title && level <= 4) {
        toc.push({
          id,
          title,
          level,
          anchor: `#${id}`
        })
      }
    })
    
    return toc
  }

  // 渲染内容
  const renderedContent = useMemo(() => {
    const { styles, cleanedText } = extractStyles(content)
    
    // 处理 Callout 语法
    const processedText = cleanedText
      .replace(/^:::\s*(tip|warning|danger|info|note)\s*$/gm, '<div class="vp-custom-block $1">')
      .replace(/^:::$/gm, '</div>')
    
    const htmlContent = md.render(processedText)
    
    // 提取目录
    const toc = extractToc(htmlContent)
    if (onTocUpdate) {
      onTocUpdate(toc)
    }
    
    return { htmlContent, styles }
  }, [content, md, onTocUpdate])

  return (
    <div className={`vitepress-content ${isDark ? 'dark' : ''} ${className}`}>
      {/* 注入样式 */}
      {renderedContent.styles.map((style, index) => (
        <style key={`custom-style-${index}`} dangerouslySetInnerHTML={{ __html: style }} />
      ))}
      
      {/* VitePress 核心样式 */}
      <style dangerouslySetInnerHTML={{ __html: `
        .vitepress-content {
          max-width: none;
          line-height: 1.7;
          font-size: 16px;
          color: #213547;
        }
        
        .vitepress-content.dark {
          color: rgba(255, 255, 255, 0.87);
        }
        
        .vitepress-content h1,
        .vitepress-content h2,
        .vitepress-content h3,
        .vitepress-content h4 {
          position: relative;
          font-weight: 600;
          outline: none;
          scroll-margin-top: 80px;
        }
        
        .vitepress-content h1 {
          letter-spacing: -0.02em;
          line-height: 40px;
          font-size: 28px;
          margin: 40px 0 24px;
          color: #213547;
        }
        
        .vitepress-content h2 {
          margin: 48px 0 16px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
          letter-spacing: -0.02em;
          line-height: 32px;
          font-size: 24px;
          color: #213547;
        }
        
        .vitepress-content h3 {
          margin: 32px 0 12px;
          letter-spacing: -0.01em;
          line-height: 28px;
          font-size: 20px;
          color: #213547;
        }
        
        .vitepress-content h4 {
          margin: 24px 0 8px;
          line-height: 24px;
          font-size: 18px;
          color: #213547;
        }
        
        .vitepress-content.dark h1,
        .vitepress-content.dark h2,
        .vitepress-content.dark h3,
        .vitepress-content.dark h4 {
          color: rgba(255, 255, 255, 0.87);
        }
        
        .vitepress-content.dark h2 {
          border-bottom-color: #2e2e32;
        }
        
        .vitepress-content p {
          margin: 16px 0;
          line-height: 28px;
        }
        
        .vitepress-content blockquote {
          margin: 20px 0;
          border-left: 4px solid #e2e8f0;
          padding-left: 16px;
          color: #576574;
        }
        
        .vitepress-content.dark blockquote {
          border-left-color: #2e2e32;
          color: rgba(235, 235, 235, 0.6);
        }
        
        .vitepress-content ul,
        .vitepress-content ol {
          padding-left: 1.25rem;
          margin: 16px 0;
        }
        
        .vitepress-content li {
          margin: 4px 0;
        }
        
        .vitepress-content table {
          border-collapse: collapse;
          margin: 20px 0;
          width: 100%;
        }
        
        .vitepress-content th,
        .vitepress-content td {
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          text-align: left;
        }
        
        .vitepress-content th {
          font-weight: 600;
          background-color: #f1f5f9;
        }
        
        .vitepress-content.dark th,
        .vitepress-content.dark td {
          border-color: #2e2e32;
        }
        
        .vitepress-content.dark th {
          background-color: #1e1e20;
        }
        
        .vitepress-content pre {
          padding: 16px;
          margin: 16px 0;
          background-color: #f6f6f7;
          border-radius: 8px;
          overflow-x: auto;
          font-family: 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .vitepress-content.dark pre {
          background-color: #161618;
        }
        
        .vitepress-content code {
          background-color: rgba(175, 184, 193, 0.2);
          padding: 2px 4px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace;
          font-size: 14px;
        }
        
        .vitepress-content.dark code {
          background-color: rgba(101, 117, 133, 0.16);
        }
        
        .vitepress-content pre code {
          background-color: transparent;
          padding: 0;
        }
        
        .vp-custom-block {
          margin: 16px 0;
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 16px 16px 8px;
          line-height: 24px;
          font-size: 14px;
          color: #576574;
        }
        
        .vp-custom-block.tip {
          border-color: #42b883;
          background-color: #f0f9ff;
        }
        
        .vp-custom-block.warning {
          border-color: #e7c000;
          background-color: #fffbeb;
        }
        
        .vp-custom-block.danger {
          border-color: #cc0000;
          background-color: #fef2f2;
        }
        
        .vp-custom-block.info {
          border-color: #0969da;
          background-color: #f0f9ff;
        }
        
        .vitepress-content.dark .vp-custom-block.tip {
          background-color: rgba(66, 184, 131, 0.1);
        }
        
        .vitepress-content.dark .vp-custom-block.warning {
          background-color: rgba(231, 192, 0, 0.1);
        }
        
        .vitepress-content.dark .vp-custom-block.danger {
          background-color: rgba(204, 0, 0, 0.1);
        }
        
        .vitepress-content.dark .vp-custom-block.info {
          background-color: rgba(9, 105, 218, 0.1);
        }
        
        .vitepress-content a {
          color: #3eaf7c;
          text-decoration: none;
          transition: opacity 0.25s;
        }
        
        .vitepress-content a:hover {
          text-decoration: underline;
        }
      `}} />
      
      {/* 渲染内容 */}
      <div dangerouslySetInnerHTML={{ __html: renderedContent.htmlContent }} />
    </div>
  )
}

export default VitePressRenderer 