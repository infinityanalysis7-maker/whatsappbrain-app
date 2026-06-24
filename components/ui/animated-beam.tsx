'use client'

import React, { useEffect, useRef } from 'react'

interface AnimatedBeamProps {
  className?: string
  duration?: number
  delay?: number
  reverse?: boolean
  pathColor?: string
  gradientStartColor?: string
  gradientStopColor?: string
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  duration = 4,
  delay = 0,
  reverse = false,
  pathColor = 'rgba(37, 211, 102, 0.2)',
  gradientStartColor = 'rgba(37, 211, 102, 0)',
  gradientStopColor = 'rgba(37, 211, 102, 1)',
}) => {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (!pathRef.current) return

    const path = pathRef.current
    const length = path.getTotalLength()

    path.style.strokeDasharray = `${length}`
    path.style.strokeDashoffset = `${length}`

    const animation = path.animate(
      [
        { strokeDashoffset: reverse ? `-${length}` : `${length}` },
        { strokeDashoffset: reverse ? `${length}` : `-${length}` },
      ],
      {
        duration: duration * 1000,
        delay: delay * 1000,
        iterations: Infinity,
        easing: 'linear',
      }
    )

    return () => animation.cancel()
  }, [duration, delay, reverse])

  return (
    <svg className={`absolute pointer-events-none ${className}`} viewBox='0 0 200 200'>
      <defs>
        <linearGradient id='beam-gradient' x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor={gradientStartColor} />
          <stop offset='50%' stopColor={gradientStopColor} />
          <stop offset='100%' stopColor={gradientStartColor} />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        d='M 10,100 Q 100,10 190,100'
        stroke='url(#beam-gradient)'
        strokeWidth='2'
        fill='none'
        opacity='0.8'
      />
    </svg>
  )
}
