import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeContextType } from '@/types'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark' | 'auto') || 'auto'
    }
    return 'auto'
  })

  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = window.document.documentElement

    // 移除之前的主题类
    root.classList.remove('light', 'dark')

    if (theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
      setIsDark(systemTheme === 'dark')
    } else {
      root.classList.add(theme)
      setIsDark(theme === 'dark')
    }

    // 保存到localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  // 监听系统主题变化
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        root.classList.add(systemTheme)
        setIsDark(systemTheme === 'dark')
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  const handleSetTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: handleSetTheme,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 