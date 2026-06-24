'use client'

import React, { useRef } from 'react'
import { cn } from '@/lib/utils'

export const GlareCard = ({
  children,
  className,
  variant = 'light',
}: {
  children: React.ReactNode
  className?: string
  variant?: 'light' | 'dark'
}) => {
  const divRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 20
    const rotateY = (centerX - x) / 20

    divRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    divRef.current.style.setProperty('--glare-x', `${x}px`)
    divRef.current.style.setProperty('--glare-y', `${y}px`)
  }

  const handleMouseLeave = () => {
    if (!divRef.current) return
    divRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  }

  const variants = {
    light: 'border-wb-line/60 bg-white/90 backdrop-blur-sm',
    dark: 'border-white/10 bg-gray-900/80 backdrop-blur-xl',
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative rounded-2xl border transition-all duration-200 ease-out hover:shadow-lg',
        variants[variant],
        variant === 'light' ? 'hover:border-wb-green/25 hover:shadow-wb-green/10' : 'hover:border-white/20 hover:shadow-white/5',
        className
      )}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className='pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300'
        style={{
          background: variant === 'light'
            ? 'radial-gradient(circle at var(--glare-x) var(--glare-y), rgba(37, 211, 102, 0.08) 0%, transparent 60%)'
            : 'radial-gradient(circle at var(--glare-x) var(--glare-y), rgba(255,255,255,0.1) 0%, transparent 60%)',
        }}
      />
      {children}
    </div>
  )
}
