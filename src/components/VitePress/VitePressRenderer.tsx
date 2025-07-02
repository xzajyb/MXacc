import React, { useState, useMemo, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '@/contexts/ThemeContext'
import { Copy, Check, Search, RotateCcw } from 'lucide-react'

interface VitePressRendererProps {
  content: string
  className?: string
}

// Vue组件转React组件的示例实现
const VueComponentRenderer: React.FC<{ content: string }> = ({ content }) => {
  // 解析Vue模板中的数据
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedQualities, setSelectedQualities] = useState<string[]>([])
  const [sources, setSources] = useState({
    enchantmentTable: false,
    villager: false,
    chest: false
  })

  // 示例数据
  const enchants = [
    {
      id: 1,
      name: '锋利',
      description: '增加近战武器的伤害',
      quality: 'common',
      items: ['剑', '斧'],
      enchantmentTable: true,
      villager: true,
      chest: false
    },
    {
      id: 2,
      name: '火焰附加',
      description: '使武器造成火焰伤害',
      quality: 'uncommon',
      items: ['剑'],
      enchantmentTable: true,
      villager: false,
      chest: true
    },
    {
      id: 3,
      name: '抢夺',
      description: '增加物品掉落数量',
      quality: 'rare',
      items: ['剑'],
      enchantmentTable: true,
      villager: true,
      chest: true
    },
    {
      id: 4,
      name: '经验修补',
      description: '使用经验值修复物品耐久',
      quality: 'epic',
      items: ['所有工具', '武器', '盔甲'],
      enchantmentTable: false,
      villager: true,
      chest: true
    }
  ]

  const qualities = [
    { value: 'common', label: '普通' },
    { value: 'uncommon', label: '罕见' },
    { value: 'rare', label: '稀有' },
    { value: 'epic', label: '史诗' }
  ]

  const toggleQuality = (quality: string) => {
    setSelectedQualities(prev => 
      prev.includes(quality) 
        ? prev.filter(q => q !== quality)
        : [...prev, quality]
    )
  }

  const getQualityLabel = (quality: string) => {
    return qualities.find(q => q.value === quality)?.label || quality
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedQualities([])
    setSources({
      enchantmentTable: false,
      villager: false,
      chest: false
    })
  }

  const filteredEnchants = useMemo(() => {
    return enchants.filter(enchant => {
      // 搜索过滤
      const matchesSearch = !searchQuery || 
        enchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enchant.description.toLowerCase().includes(searchQuery.toLowerCase())

      // 品质过滤
      const matchesQuality = selectedQualities.length === 0 || 
        selectedQualities.includes(enchant.quality)

      // 来源过滤
      const matchesSource = !sources.enchantmentTable && !sources.villager && !sources.chest ||
        (sources.enchantmentTable && enchant.enchantmentTable) ||
        (sources.villager && enchant.villager) ||
        (sources.chest && enchant.chest)

      return matchesSearch && matchesQuality && matchesSource
    })
  }, [searchQuery, selectedQualities, sources])

  const qualityStyles = {
    common: 'bg-gray-100 text-gray-800 border-gray-300',
    uncommon: 'bg-green-100 text-green-800 border-green-300',
    rare: 'bg-blue-100 text-blue-800 border-blue-300',
    epic: 'bg-purple-100 text-purple-800 border-purple-300'
  }

  const qualityButtonStyles = {
    common: 'border-gray-300 text-gray-700 hover:bg-gray-100',
    uncommon: 'border-green-300 text-green-700 hover:bg-green-100',
    rare: 'border-blue-300 text-blue-700 hover:bg-blue-100',
    epic: 'border-purple-300 text-purple-700 hover:bg-purple-100'
  }

  return (
    <div className="vue-component-wrapper p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* 控制区域 */}
      <div className="controls mb-6">
        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索附魔名称或描述..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 过滤器 */}
        <div className="filters space-y-4">
          {/* 品质过滤 */}
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">品质：</label>
            <div className="quality-filters flex flex-wrap gap-2">
              {qualities.map(quality => (
                <button
                  key={quality.value}
                  onClick={() => toggleQuality(quality.value)}
                  className={`px-3 py-1 text-sm border rounded-lg transition-colors ${
                    selectedQualities.includes(quality.value)
                      ? `${qualityButtonStyles[quality.value as keyof typeof qualityButtonStyles]} bg-opacity-20 font-medium`
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {quality.label}
                </button>
              ))}
            </div>
          </div>

          {/* 来源过滤 */}
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">获取方式：</label>
            <div className="source-filters flex flex-wrap gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sources.enchantmentTable}
                  onChange={(e) => setSources(prev => ({ ...prev, enchantmentTable: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">⚔️ 附魔台</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sources.villager}
                  onChange={(e) => setSources(prev => ({ ...prev, villager: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">🧑 村民</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sources.chest}
                  onChange={(e) => setSources(prev => ({ ...prev, chest: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">📦 宝箱</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="enchant-stats mb-4 text-sm text-gray-600 dark:text-gray-400">
        找到 <span className="font-medium text-blue-600">{filteredEnchants.length}</span> 个附魔（共 {enchants.length} 个）
        {selectedQualities.length > 0 && (
          <span className="ml-2">
            | 品质：
            {selectedQualities.map(q => (
              <span
                key={q}
                className={`inline-block ml-1 px-2 py-0.5 text-xs rounded-full border ${qualityStyles[q as keyof typeof qualityStyles]}`}
              >
                {getQualityLabel(q)}
              </span>
            ))}
          </span>
        )}
      </div>

      {/* 附魔网格 */}
      <div className="enchant-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filteredEnchants.map(enchant => (
          <div
            key={enchant.id}
            className={`enchant-card p-4 border rounded-lg transition-all hover:shadow-md ${qualityStyles[enchant.quality as keyof typeof qualityStyles]}`}
          >
            {/* 附魔头部 */}
            <div className="enchant-header flex items-center justify-between mb-2">
              <h3 className="enchant-name font-semibold text-lg">{enchant.name}</h3>
              <div className={`enchant-quality px-2 py-1 text-xs rounded-full border ${qualityStyles[enchant.quality as keyof typeof qualityStyles]}`}>
                {getQualityLabel(enchant.quality)}
              </div>
            </div>

            {/* 描述 */}
            <div className="enchant-description text-sm mb-3 opacity-90">
              {enchant.description}
            </div>

            {/* 元信息 */}
            <div className="enchant-meta space-y-2 text-xs">
              <div className="meta-item">
                <strong>可附魔物品：</strong>
                <span className="ml-1">{enchant.items.join('、')}</span>
              </div>
              <div className="meta-item">
                <strong>获取方式：</strong>
                <div className="source-icons inline-flex ml-1 space-x-1">
                  {enchant.enchantmentTable && (
                    <span className="source-icon" title="可通过附魔台获取">⚔️</span>
                  )}
                  {enchant.villager && (
                    <span className="source-icon" title="可通过村民交易获取">🧑</span>
                  )}
                  {enchant.chest && (
                    <span className="source-icon" title="可通过宝箱获取">📦</span>
                  )}
                  {!enchant.enchantmentTable && !enchant.villager && !enchant.chest && (
                    <span className="source-icon">✨ 特殊</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 无结果提示 */}
      {filteredEnchants.length === 0 && (
        <div className="no-results text-center py-12">
          <div className="no-results-icon text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">未找到匹配的附魔</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">请尝试调整筛选条件</p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RotateCcw size={16} className="mr-2" />
            重置所有筛选器
          </button>
        </div>
      )}
    </div>
  )
}

// 增强版代码块组件
const EnhancedCodeBlock: React.FC<{ children: string; language?: string; filename?: string }> = ({ 
  children, 
  language = 'text', 
  filename 
}) => {
  const { isDark } = useTheme()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

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
          showLineNumbers={true}
        >
          {children.trim()}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

const VitePressRenderer: React.FC<VitePressRendererProps> = ({ content, className = '' }) => {
  const [inlineStyles, setInlineStyles] = useState<string>('')

  // 检测Vue组件内容
  const isVueComponent = useMemo(() => {
    return content.includes('v-model') || 
           content.includes('v-for') || 
           content.includes('@click') ||
           content.includes('{{') ||
           content.includes('<template>') ||
           content.includes('<script>') ||
           content.includes('<style>') ||
           content.includes('class="controls"')
  }, [content])

  // 如果是Vue组件，使用特殊渲染器
  if (isVueComponent) {
    return (
      <div className={`vitepress-content ${className}`}>
        <VueComponentRenderer content={content} />
        {inlineStyles && (
          <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />
        )}
      </div>
    )
  }

  // 解析普通markdown
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      // 处理代码块
      if (line.startsWith('```')) {
        const match = line.match(/^```(\w+)?\s*(?:\[([^\]]+)\])?/)
        const language = match?.[1] || 'text'
        const filename = match?.[2]
        
        i++
        const codeLines = []
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i])
          i++
        }
        
        elements.push(
          <EnhancedCodeBlock 
            key={elements.length}
            language={language}
            filename={filename}
          >
            {codeLines.join('\n')}
          </EnhancedCodeBlock>
        )
        i++
        continue
      }

      // 处理标题
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1
        const text = line.replace(/^#+\s*/, '').trim()
        const id = `heading-${i}-${text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '-')}`
        
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
          <Tag key={elements.length} id={id} className={classes[level as keyof typeof classes]}>
            {text}
          </Tag>
        )
        i++
        continue
      }

      // 处理普通段落
      if (line.trim()) {
        // 处理内联格式
        const processInlineFormatting = (text: string) => {
          // 粗体
          text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          // 斜体
          text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
          // 代码
          text = text.replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
          // 链接
          text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="link">$1</a>')
          
          return text
        }

        elements.push(
          <p 
            key={elements.length} 
            className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: processInlineFormatting(line) }}
          />
        )
      }

      i++
    }

    return elements
  }

  useEffect(() => {
    // 添加内联样式到head
    if (inlineStyles) {
      const styleElement = document.createElement('style')
      styleElement.textContent = inlineStyles
      document.head.appendChild(styleElement)
      return () => {
        document.head.removeChild(styleElement)
      }
    }
  }, [inlineStyles])

  return (
    <div className={`vitepress-content prose prose-lg max-w-none ${className}`}>
      {parseMarkdown(content)}
      
      <style jsx>{`
        .vitepress-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.7;
        }
        
        .inline-code {
          background: rgba(27, 31, 35, 0.05);
          border-radius: 3px;
          font-size: 85%;
          padding: 0.2em 0.4em;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        
        .link {
          color: #0969da;
          text-decoration: none;
        }
        
        .link:hover {
          text-decoration: underline;
        }
        
        .vue-component-wrapper {
          border: 1px solid #e1e5e9;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  )
}

export default VitePressRenderer 