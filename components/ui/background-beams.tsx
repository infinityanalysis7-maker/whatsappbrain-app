'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export const BackgroundBeams = ({ className }: { className?: string }) => {
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <svg
        className='absolute h-[40rem] w-[40rem] -translate-x-1/2 translate-y-[-10%] [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]'
        xmlns='http://www.w3.org/2000/svg'
      >
        <defs>
          <linearGradient id='beam-gradient' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='rgb(16,185,129)' stopOpacity='0' />
            <stop offset='50%' stopColor='rgb(16,185,129)' stopOpacity='0.3' />
            <stop offset='100%' stopColor='rgb(16,185,129)' stopOpacity='0' />
          </linearGradient>
        </defs>
        <g>
          {[...Array(20)].map((_, i) => (
            <g key={i}>
              <path
                d={`M${-100 + i * 80},404 Q${-50 + i * 80},${300 + Math.sin(i) * 100} ${0 + i * 80},${350 + Math.cos(i) * 50} T${100 + i * 80},${300}`}
                stroke='url(#beam-gradient)'
                strokeWidth='1'
                fill='none'
                opacity='0.3'
              >
                <animate
                  attributeName='stroke-dashoffset'
                  from='1000'
                  to='0'
                  dur={`${8 + i * 0.5}s`}
                  repeatCount='indefinite'
                />
                <animate
                  attributeName='stroke-dasharray'
                  values='0 1000;500 500;0 1000'
                  dur={`${8 + i * 0.5}s`}
                  repeatCount='indefinite'
                />
              </path>
            </g>
          ))}
        </g>
      </svg>
      <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent' />
    </div>
  )
}
