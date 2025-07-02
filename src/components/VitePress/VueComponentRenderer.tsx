import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface VueComponentRendererProps {
  vueCode: string
  componentId: string
}

interface VueState {
  [key: string]: any
}

interface VueComponent {
  template: string
  script?: string
  scriptSetup?: string
  style?: string
  state: VueState
  methods: { [key: string]: Function }
  computed: { [key: string]: Function }
  mounted: boolean
}

class VueReactiveState {
  private state: VueState = {}
  private listeners: Set<Function> = new Set()
  private computedCache: { [key: string]: any } = {}
  private methods: { [key: string]: Function } = {}

  constructor() {
    // 创建响应式代理
    this.state = new Proxy({}, {
      set: (target: any, key, value) => {
        const oldValue = target[key as string]
        target[key as string] = value
        
        // 如果值发生变化，清除计算属性缓存并通知监听器
        if (oldValue !== value) {
          this.computedCache = {}
          this.notifyListeners()
        }
        return true
      },
      get: (target: any, key) => {
        return target[key as string]
      }
    })
  }

  // 设置响应式数据
  setReactive(key: string, value: any) {
    (this.state as any)[key] = value
  }

  // 获取状态值
  get(key: string) {
    return (this.state as any)[key]
  }

  // 设置方法
  setMethod(key: string, method: Function) {
    this.methods[key] = method.bind(this)
  }

  // 获取方法
  getMethod(key: string) {
    return this.methods[key]
  }

  // 设置计算属性
  setComputed(key: string, computeFn: Function) {
    Object.defineProperty(this.state, key, {
      get: () => {
        if (!(key in this.computedCache)) {
          this.computedCache[key] = computeFn.call(this)
        }
        return this.computedCache[key]
      },
      enumerable: true,
      configurable: true
    })
  }

  // 添加监听器
  addListener(listener: Function) {
    this.listeners.add(listener)
  }

  // 移除监听器
  removeListener(listener: Function) {
    this.listeners.delete(listener)
  }

  // 通知所有监听器
  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  // 获取所有状态（用于模板渲染）
  getAllState() {
    return { ...this.state, ...this.methods }
  }
}

const VueComponentRenderer: React.FC<VueComponentRendererProps> = ({ vueCode, componentId }) => {
  const { isDark } = useTheme()
  const [component, setComponent] = useState<VueComponent | null>(null)
  const [renderedHtml, setRenderedHtml] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)
  const reactiveStateRef = useRef<VueReactiveState | null>(null)

  // 解析Vue组件
  const parseVueComponent = useCallback((code: string): VueComponent => {
    const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/)
    const scriptMatch = code.match(/<script(?!\s+setup)(?:[^>]*)>([\s\S]*?)<\/script>/)
    const scriptSetupMatch = code.match(/<script\s+setup(?:[^>]*)>([\s\S]*?)<\/script>/)
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/)

    return {
      template: templateMatch ? templateMatch[1].trim() : '',
      script: scriptMatch ? scriptMatch[1].trim() : '',
      scriptSetup: scriptSetupMatch ? scriptSetupMatch[1].trim() : '',
      style: styleMatch ? styleMatch[1].trim() : '',
      state: {},
      methods: {},
      computed: {},
      mounted: false
    }
  }, [])

  // 解析Vue 3 script setup
  const parseScriptSetup = useCallback((scriptSetup: string, reactiveState: VueReactiveState) => {
    try {
      // 解析import语句（跳过）
      const cleanScript = scriptSetup.replace(/import\s+.*?from\s+['"].*?['"][\s\S]*?$/gm, '')

      // 解析ref定义
      const refRegex = /const\s+(\w+)\s*=\s*ref\s*\(\s*([^)]+)\s*\)/g
      let match
      while ((match = refRegex.exec(cleanScript)) !== null) {
        const [, varName, value] = match
        try {
          let parsedValue
          if (value.trim().startsWith('"') || value.trim().startsWith("'")) {
            parsedValue = value.trim().slice(1, -1) // 移除引号
          } else if (value.trim() === 'true' || value.trim() === 'false') {
            parsedValue = value.trim() === 'true'
          } else if (!isNaN(Number(value.trim()))) {
            parsedValue = Number(value.trim())
          } else if (value.trim().startsWith('[') && value.trim().endsWith(']')) {
            parsedValue = JSON.parse(value.trim())
          } else if (value.trim().startsWith('{') && value.trim().endsWith('}')) {
            parsedValue = JSON.parse(value.trim())
          } else {
            parsedValue = value.trim()
          }
          reactiveState.setReactive(varName, parsedValue)
        } catch (e) {
          console.warn(`Failed to parse ref ${varName}:`, e)
        }
      }

      // 解析reactive定义
      const reactiveRegex = /const\s+(\w+)\s*=\s*reactive\s*\(\s*(\{[\s\S]*?\})\s*\)/g
      while ((match = reactiveRegex.exec(cleanScript)) !== null) {
        const [, varName, value] = match
        try {
          const parsedValue = new Function('return ' + value)()
          Object.keys(parsedValue).forEach(key => {
            reactiveState.setReactive(`${varName}.${key}`, parsedValue[key])
          })
          reactiveState.setReactive(varName, parsedValue)
        } catch (e) {
          console.warn(`Failed to parse reactive ${varName}:`, e)
        }
      }

      // 解析大数组数据
      const arrayRegex = /const\s+(\w+)\s*=\s*(\[[\s\S]*?\])/g
      while ((match = arrayRegex.exec(cleanScript)) !== null) {
        const [, varName, arrayValue] = match
        try {
          const parsedArray = new Function('return ' + arrayValue)()
          reactiveState.setReactive(varName, parsedArray)
        } catch (e) {
          console.warn(`Failed to parse array ${varName}:`, e)
        }
      }

      // 解析computed属性
      const computedRegex = /const\s+(\w+)\s*=\s*computed\s*\(\s*\(\s*\)\s*=>\s*([\s\S]*?)\s*\)/g
      while ((match = computedRegex.exec(cleanScript)) !== null) {
        const [, varName, computation] = match
        const computeFn = new Function(`
          const state = this.getAllState();
          with(state) {
            return ${computation.trim()};
          }
        `)
        reactiveState.setComputed(varName, computeFn)
      }

      // 解析函数定义
      const functionRegex = /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g
      while ((match = functionRegex.exec(cleanScript)) !== null) {
        const [, funcName, funcBody] = match
        const method = new Function(`
          const state = this.getAllState();
          ${funcBody}
        `)
        reactiveState.setMethod(funcName, method)
      }

    } catch (e) {
      console.error('Failed to parse script setup:', e)
    }
  }, [])

  // 渲染Vue模板
  const renderTemplate = useCallback((template: string, reactiveState: VueReactiveState): string => {
    let processedTemplate = template
    const state = reactiveState.getAllState()

    console.log('Template state:', state) // 调试用

    try {
      // 首先处理插值语法（最重要的修复）
      processedTemplate = processedTemplate.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
        try {
          const cleanExpression = expression.trim()
          console.log(`Evaluating expression: ${cleanExpression}`)
          
          // 创建安全的执行环境
          const evalFunc = new Function(`
            const { ${Object.keys(state).join(', ')} } = arguments[0];
            return ${cleanExpression};
          `)
          const result = evalFunc(state)
          console.log(`Result: ${result}`)
          return String(result || '')
        } catch (e) {
          console.warn(`Failed to evaluate expression: ${expression}`, e)
          return match // 保持原样如果失败
        }
      })

      // 处理v-for指令
      processedTemplate = processedTemplate.replace(
        /(<[^>]+)v-for="([^"]+)"([^>]*>)([\s\S]*?)(<\/[^>]+>)/g,
        (match, startTag, forExpr, middleAttrs, content, endTag) => {
          try {
            const [item, array] = forExpr.split(' in ').map((s: string) => s.trim())
            const arrayData = (state as any)[array]
            
            if (Array.isArray(arrayData)) {
              return arrayData.map((itemData: any, index: number) => {
                let itemHtml = startTag + middleAttrs.replace(/v-for="[^"]*"/, '') + '>' + content + endTag
                
                // 替换item引用
                itemHtml = itemHtml.replace(new RegExp(`\\{\\{\\s*${item}\\s*\\}\\}`, 'g'), String(itemData))
                itemHtml = itemHtml.replace(new RegExp(`\\{\\{\\s*${item}\\.([^}]+)\\s*\\}\\}`, 'g'), 
                  (_, prop) => String((itemData as any)[prop] || ''))
                
                // 处理:key属性
                itemHtml = itemHtml.replace(/:key="[^"]*"/, `data-key="${index}"`)
                
                return itemHtml
              }).join('')
            }
          } catch (e) {
            console.warn('Failed to process v-for:', e)
          }
          return match
        }
      )

      // 处理v-if指令
      processedTemplate = processedTemplate.replace(
        /(<[^>]+)v-if="([^"]+)"([^>]*>[\s\S]*?<\/[^>]+>)/g,
        (match, start, condition, rest) => {
          try {
            const evalCondition = new Function(`
              const { ${Object.keys(state).join(', ')} } = arguments[0];
              return ${condition};
            `)
            const result = evalCondition(state)
            return result ? match.replace(`v-if="${condition}"`, '') : ''
          } catch (e) {
            console.warn('Failed to evaluate v-if condition:', e)
            return match
          }
        }
      )

      // 处理v-model
      processedTemplate = processedTemplate.replace(/v-model="([^"]+)"/g, (match, modelVar) => {
        const value = (state as any)[modelVar] || ''
        return `value="${value}" oninput="window.updateVueData_${componentId}('${modelVar}', this.value)"`
      })

      // 处理事件绑定
      processedTemplate = processedTemplate.replace(
        /@click="([^"]+)"/g,
        (match, methodName) => {
          return `onclick="window.vueMethod_${componentId}_${methodName}()"`
        }
      )

      // 处理动态class绑定
      processedTemplate = processedTemplate.replace(/:class="([^"]+)"/g, (match, classExpr) => {
        try {
          const classFunc = new Function(`
            const { ${Object.keys(state).join(', ')} } = arguments[0];
            return ${classExpr};
          `)
          const classResult = classFunc(state)
          
          if (typeof classResult === 'object') {
            const classes = Object.entries(classResult)
              .filter(([, value]) => value)
              .map(([key]) => key)
              .join(' ')
            return `class="${classes}"`
          }
          return `class="${classResult}"`
        } catch (e) {
          console.warn('Failed to process :class:', e)
          return match
        }
      })

    } catch (e) {
      console.error('Template rendering error:', e)
    }

    return processedTemplate
  }, [componentId])

  // 初始化组件
  useEffect(() => {
    const parsedComponent = parseVueComponent(vueCode)
    setComponent(parsedComponent)
  }, [vueCode, parseVueComponent])

  // 运行Vue组件
  const runComponent = useCallback(() => {
    if (!component) return

    setIsRunning(true)
    
    try {
      // 创建新的响应式状态
      const reactiveState = new VueReactiveState()
      reactiveStateRef.current = reactiveState

      // 解析script setup
      if (component.scriptSetup) {
        parseScriptSetup(component.scriptSetup, reactiveState)
      }

      // 注册v-model更新函数（必须在renderTemplate之前）
      ;(window as any)[`updateVueData_${componentId}`] = (key: string, value: any) => {
        console.log(`Updating ${key} to:`, value)
        reactiveState.setReactive(key, value)
      }

      // 注册全局方法
      const state = reactiveState.getAllState()
      Object.keys(state).forEach(key => {
        if (typeof state[key] === 'function') {
          ;(window as any)[`vueMethod_${componentId}_${key}`] = state[key]
        }
      })

      // 添加响应式监听器
      const updateTemplate = () => {
        const html = renderTemplate(component.template, reactiveState)
        setRenderedHtml(html)
      }

      reactiveState.addListener(updateTemplate)

      // 初始渲染
      updateTemplate()

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

    } catch (e) {
      console.error('Failed to run Vue component:', e)
      setRenderedHtml(`<div class="vue-error">❌ 运行错误: ${(e as Error).message}</div>`)
    }
  }, [component, componentId, parseScriptSetup, renderTemplate])

  // 清理函数
  useEffect(() => {
    return () => {
      // 清理全局方法
      if (typeof window !== 'undefined') {
        Object.keys(window).forEach(key => {
          if (key.includes(`_${componentId}`)) {
            delete (window as any)[key]
          }
        })
      }
      
      // 清理样式
      const styleId = `vue-style-${componentId}`
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [componentId])

  return (
    <div className="vue-component-container">
      {/* Vue组件预览 */}
      <div className="vue-component-preview">
        <div className="vue-preview-header">
          <span className="vue-preview-title">
            🚀 Vue 3 {component?.scriptSetup ? 'Composition' : 'Options'} API
          </span>
          <button 
            className="vue-run-button" 
            onClick={runComponent}
            disabled={!component}
          >
            ▶️ 运行组件
          </button>
        </div>
        <div className="vue-preview-content">
          {!isRunning ? (
            <div className="vue-placeholder">
              👆 点击"运行组件"按钮查看Vue组件效果
              <br/>
              <small>支持完整的Vue 3响应式系统和模板语法</small>
            </div>
          ) : (
            <div className="vue-runtime-component">
              <div className="vue-success-message">
                ✅ Vue组件运行成功！({component?.scriptSetup ? 'Composition' : 'Options'} API)
              </div>
              <div 
                className="vue-component-wrapper" 
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 代码显示 */}
      <div className="vue-component-code">
        <div className="code-block-header">
          <span className="code-lang">vue {component?.scriptSetup ? '(setup)' : '(options)'}</span>
          <button className="copy-button" onClick={() => navigator.clipboard.writeText(vueCode)}>
            <svg className="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
              <path d="m4 16c-1.1 0-2-.9-2-2v-10c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
            </svg>
          </button>
        </div>
        <pre className="code-content">
          <code className="language-vue">{vueCode}</code>
        </pre>
      </div>

      {/* 样式 */}
      <style>{`
        .vue-component-container {
          margin: 2rem 0;
          border: 3px solid ${isDark ? '#059669' : '#10b981'};
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.15);
          background: ${isDark ? '#0f172a' : '#ffffff'};
        }

        .vue-component-preview {
          background: ${isDark ? '#0f172a' : '#f0fdf4'};
          border-bottom: 3px solid ${isDark ? '#059669' : '#10b981'};
        }

        .vue-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, ${isDark ? '#059669' : '#10b981'}, ${isDark ? '#047857' : '#065f46'});
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
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .vue-run-button:hover:not(:disabled) {
          background: ${isDark ? '#f3f4f6' : '#f9fafb'};
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .vue-run-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .vue-preview-content {
          padding: 1.5rem;
          min-height: 150px;
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
          line-height: 1.6;
        }

        .vue-placeholder small {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .vue-runtime-component {
          animation: fadeInUp 0.4s ease-out;
        }

        .vue-success-message {
          background: linear-gradient(135deg, ${isDark ? '#064e3b' : '#d1fae5'}, ${isDark ? '#065f46' : '#a7f3d0'});
          color: ${isDark ? '#34d399' : '#047857'};
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-weight: 600;
          border: 2px solid ${isDark ? '#10b981' : '#059669'};
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .vue-component-wrapper {
          background: ${isDark ? '#1e293b' : '#ffffff'};
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid ${isDark ? '#334155' : '#e2e8f0'};
        }

        .vue-error {
          color: #ef4444;
          background: ${isDark ? '#451a1a' : '#fef2f2'};
          padding: 1rem;
          border-radius: 8px;
          border: 2px solid #ef4444;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
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
          background: ${isDark ? '#111827' : '#ffffff'};
          color: ${isDark ? '#e2e8f0' : '#1f2937'};
          overflow-x: auto;
        }

        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        @media (max-width: 768px) {
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
    </div>
  )
}

export default VueComponentRenderer 