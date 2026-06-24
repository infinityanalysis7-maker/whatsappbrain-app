'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'alive' | 'brutalist'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'alive', toggleTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('alive')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('wb_theme') as Theme | null
    if (saved === 'brutalist' || saved === 'alive') {
      setTheme(saved)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('wb_theme', theme)
  }, [theme, mounted])

  const toggleTheme = () => setTheme(t => t === 'alive' ? 'brutalist' : 'alive')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
