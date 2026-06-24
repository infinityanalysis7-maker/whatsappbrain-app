import React from 'react'
import { cn } from '@/lib/utils'

export const AnimatedGradientText = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <span
      className={cn(
        'inline-block bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient',
        className
      )}
    >
      {children}
    </span>
  )
}
