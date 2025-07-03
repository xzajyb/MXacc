import React, { useEffect, useRef, useState } from 'react'

interface VueComponentRendererProps {
  vueCode: string
  componentId: string
  isDark?: boolean
}

declare global {
  interface Window {
    Vue: any
  }
}

const VueComponentRenderer: React.FC<VueComponentRendererProps> = ({ vueCode, componentId, isDark = false }) => {
  const vueContainerRef = useRef<HTMLDivElement>(null)
  const vueAppRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  // 动态加载Vue
  const loadVue = async () => {
    if (window.Vue) return window.Vue

    try {
      // 从CDN加载Vue
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/vue@3/dist/vue.global.js'
      script.onload = () => {
        console.log('Vue loaded successfully')
      }
      document.head.appendChild(script)
      
      // 等待Vue加载完成
      return new Promise((resolve) => {
        const checkVue = setInterval(() => {
          if (window.Vue) {
            clearInterval(checkVue)
            resolve(window.Vue)
          }
        }, 100)
      })
    } catch (e) {
      console.error('Failed to load Vue:', e)
      throw new Error('无法加载Vue运行时')
    }
  }

  // 解析Vue单文件组件
  const parseVueComponent = (code: string) => {
    const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/)
    const scriptMatch = code.match(/<script\s+setup[^>]*>([\s\S]*?)<\/script>/)
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/)

    return {
      template: templateMatch ? templateMatch[1].trim() : '<div>No template found</div>',
      script: scriptMatch ? scriptMatch[1].trim() : '',
      style: styleMatch ? styleMatch[1].trim() : ''
    }
  }

  // 创建安全的setup函数执行器
  const createSetupFunction = (script: string) => {
    // 移除import语句
    const cleanScript = script.replace(/import\s+.*?from\s+['"].*?['"][\s\S]*?$/gm, '')
    
    console.log('Processing script:', cleanScript)

    return function(Vue: any) {
      try {
        // 创建一个新的执行环境
        const setupScope: any = {}
        
        // 添加Vue API到执行环境
        setupScope.ref = Vue.ref
        setupScope.reactive = Vue.reactive
        setupScope.computed = Vue.computed
        setupScope.watch = Vue.watch
        setupScope.onMounted = Vue.onMounted
        setupScope.onUnmounted = Vue.onUnmounted
        setupScope.nextTick = Vue.nextTick
        
                 // 更强大的变量提取逻辑
         const extractVariables = (code: string) => {
           const variables: string[] = []
           
           // 匹配 const/let/var 声明
           const patterns = [
             /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
             // 匹配函数声明
             /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>/g,
             // 匹配解构赋值
             /(?:const|let|var)\s*\{\s*([^}]+)\s*\}/g
           ]
           
           patterns.forEach(pattern => {
             let match
             while ((match = pattern.exec(code)) !== null) {
               if (pattern.source.includes('{')) {
                 // 处理解构赋值
                 const destructured = match[1].split(',').map(v => v.trim().split(':')[0].trim())
                 variables.push(...destructured)
               } else {
                 variables.push(match[1])
               }
             }
           })
           
           // 去重
           return [...new Set(variables)].filter(v => v && !v.includes(' '))
         }
         
         const variableNames = extractVariables(cleanScript)
         console.log('Detected variables:', variableNames)
         
         // 创建setup函数 - 使用更安全的方式
         const setupCode = `
           ${cleanScript}
           
           // 收集所有可能的变量
           const setupResult = {};
           ${variableNames.map(name => 
             `try { if (typeof ${name} !== 'undefined') setupResult.${name} = ${name}; } catch(e) {}`
           ).join('\n           ')}
           
           return setupResult;
         `
         
         console.log('Setup code:', setupCode)
         
         const setupFunction = new Function(
           'ref', 'reactive', 'computed', 'watch', 'onMounted', 'onUnmounted', 'nextTick',
           setupCode
         )
        
        const result = setupFunction(
          setupScope.ref,
          setupScope.reactive, 
          setupScope.computed,
          setupScope.watch,
          setupScope.onMounted,
          setupScope.onUnmounted,
          setupScope.nextTick
        )
        
        console.log('Setup function result:', result)
        return result
        
      } catch (e) {
        console.error('Setup execution error:', e)
        return {}
      }
    }
  }

  // 运行Vue组件
  const runVueComponent = async () => {
    if (!vueContainerRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      // 加载Vue
      const Vue = await loadVue()
      
      // 清理之前的Vue应用
      if (vueAppRef.current) {
        vueAppRef.current.unmount()
        vueAppRef.current = null
      }

      // 清空容器
      vueContainerRef.current.innerHTML = ''

      const { template, script, style } = parseVueComponent(vueCode)
      console.log('Parsed Vue component:', { template, script, style })

      // 创建setup函数
      const setupFunction = createSetupFunction(script)

      // 创建Vue组件对象
      const componentOptions = {
        template: template,
        setup() {
          return setupFunction(Vue)
        }
      }

      // 创建Vue应用实例
      const app = Vue.createApp(componentOptions)
      
      // 挂载Vue应用
      vueAppRef.current = app
      app.mount(vueContainerRef.current)
      
      // 如果有样式，添加到页面
      if (style) {
        const styleElement = document.createElement('style')
        styleElement.textContent = style
        styleElement.setAttribute('data-vue-component', componentId)
        document.head.appendChild(styleElement)
      }

      console.log('Vue component mounted successfully')
      setIsLoading(false)
      setIsRunning(true)
      
    } catch (err) {
      console.error('Vue component mounting error:', err)
      setError(`Vue组件渲染失败: ${(err as Error).message}`)
      setIsLoading(false)
    }
  }

  // 清理函数
  useEffect(() => {
    return () => {
      if (vueAppRef.current) {
        try {
          vueAppRef.current.unmount()
        } catch (e) {
          console.warn('Failed to unmount Vue app:', e)
        }
      }
      
      // 移除样式
      const styleElements = document.querySelectorAll(`[data-vue-component="${componentId}"]`)
      styleElements.forEach(el => el.remove())
    }
  }, [componentId])

  return (
    <div className="vue-component-container">
      {/* Vue组件预览区域 */}
      <div className="vue-component-preview">
        <div className="vue-preview-header">
          <div className="vue-preview-title">
            <span>⚡</span>
            Vue 3 组件预览
          </div>
          <button 
            className="vue-run-button"
            onClick={runVueComponent}
            disabled={isLoading}
          >
            {isLoading ? '运行中...' : isRunning ? '重新运行' : '运行组件'}
          </button>
        </div>
        
        <div className="vue-preview-content">
          {error ? (
            <div className="vue-error">
              {error}
            </div>
          ) : (
            <>
              {!isRunning && (
                <div className="vue-placeholder">
                  点击"运行组件"按钮查看Vue组件效果
                  <small>使用真正的Vue 3运行时渲染</small>
                </div>
              )}
              
              {isRunning && (
                <div className="vue-success-message">
                  ✅ Vue组件运行成功！(Vue 3 CDN运行时)
                </div>
              )}
              
              {/* Vue组件挂载点 */}
              <div 
                ref={vueContainerRef}
                className={`vue-runtime-component ${isRunning ? 'active' : ''}`}
              />
            </>
          )}
        </div>
      </div>

      {/* 代码显示区域 */}
      <div className="vue-code-block">
        <div className="code-block-header">
          <span className="code-lang">vue</span>
          <button 
            className="copy-button"
            onClick={() => navigator.clipboard.writeText(vueCode)}
          >
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
          background: white;
          color: #10b981;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .vue-run-button:hover:not(:disabled) {
          background: #f9fafb;
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
          transition: all 0.3s ease;
        }

        .vue-runtime-component.active {
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

        .vue-error {
          color: #ef4444;
          background: ${isDark ? '#451a1a' : '#fef2f2'};
          padding: 1rem;
          border-radius: 8px;
          border: 2px solid #ef4444;
          font-weight: 600;
        }

        .vue-code-block {
          border-top: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
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