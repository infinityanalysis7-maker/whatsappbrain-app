'use client'

import React, { useRef } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'light' | 'dark' | 'green'
  hover?: boolean
  glow?: boolean
  borderBeam?: boolean
  interactive?: boolean
}

export function GlassCard({
  children,
  className,
  variant = 'light',
  hover = true,
  glow = false,
  borderBeam = false,
  interactive = true,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !interactive) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 30
    const rotateY = (centerX - x) / 30

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  }

  const variants = {
    light: 'bg-white/80 backdrop-blur-xl border border-white/20',
    dark: 'bg-gray-900/60 backdrop-blur-xl border border-white/10',
    green: 'bg-gradient-to-br from-emerald-500/5 to-teal-500/5 backdrop-blur-xl border border-emerald-500/20',
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative rounded-2xl transition-all duration-300 ease-out',
        variants[variant],
        hover && 'hover:shadow-xl hover:shadow-emerald-500/10',
        glow && 'animate-glow',
        borderBeam && 'border-beam',
        className
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  )
}
