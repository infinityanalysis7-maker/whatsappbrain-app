'use client'

import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

export const CardSpotlight = ({
  children,
  className,
  radius = 350,
  color = 'rgba(37, 211, 102, 0.08)',
  variant = 'light',
}: {
  children: React.ReactNode
  className?: string
  radius?: number
  color?: string
  variant?: 'light' | 'dark'
}) => {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleMouseEnter = () => setOpacity(1)
  const handleMouseLeave = () => setOpacity(0)

  const variants = {
    light: 'border-wb-line/60 bg-white/90 backdrop-blur-sm',
    dark: 'border-white/10 bg-gray-900/60 backdrop-blur-sm',
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg',
        variants[variant],
        variant === 'light' ? 'hover:border-wb-green/25 hover:shadow-wb-green/10' : 'hover:border-white/20',
        className
      )}
    >
      <div
        className='pointer-events-none absolute -inset-px transition duration-300'
        style={{
          opacity,
          background: `radial-gradient ${radius}px circle at ${position.x}px ${position.y}px, ${color}, transparent 40%)`,
        }}
      />
      {children}
    </div>
  )
}
