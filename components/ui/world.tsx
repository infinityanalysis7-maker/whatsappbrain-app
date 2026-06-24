'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export const World = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg
        className='absolute animate-spin-slow'
        viewBox='0 0 200 200'
        xmlns='http://www.w3.org/2000/svg'
      >
        <defs>
          <linearGradient id='globe-gradient' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='rgb(16,185,129)' stopOpacity='0.2' />
            <stop offset='50%' stopColor='rgb(16,185,129)' stopOpacity='0.1' />
            <stop offset='100%' stopColor='rgb(16,185,129)' stopOpacity='0.2' />
          </linearGradient>
        </defs>
        <circle cx='100' cy='100' r='90' stroke='url(#globe-gradient)' strokeWidth='0.5' fill='none' />
        <ellipse cx='100' cy='100' rx='90' ry='40' stroke='url(#globe-gradient)' strokeWidth='0.5' fill='none' />
        <ellipse cx='100' cy='100' rx='40' ry='90' stroke='url(#globe-gradient)' strokeWidth='0.5' fill='none' />
        <ellipse cx='100' cy='100' rx='65' ry='90' stroke='url(#globe-gradient)' strokeWidth='0.5' fill='none' />
      </svg>
      <div className='relative z-10'>{children}</div>
    </div>
  )
}
