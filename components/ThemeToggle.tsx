'use client'
import { useTheme } from '@/components/ThemeProvider'
import { Hammer, Leaf } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-wb-soft hover:text-wb-ink hover:bg-white/60"
      title={theme === 'alive' ? 'Switch to Brutalist' : 'Switch to Alive'}
    >
      {theme === 'alive' ? (
        <Hammer className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
      ) : (
        <Leaf className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
      )}
      <span className="flex-1 text-left">{theme === 'alive' ? 'Brutalist' : 'Alive'}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-mono ${
        theme === 'alive'
          ? 'border-wb-line text-wb-soft'
          : 'border-black text-black bg-white'
      }`}>
        {theme === 'alive' ? 'RAW' : 'SOFT'}
      </span>
    </button>
  )
}
