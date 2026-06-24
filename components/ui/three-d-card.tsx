'use client'

import React, { createContext, useContext, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const MouseEnterContext = createContext<[boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined>(undefined)

export const CardContainer = ({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode
  className?: string
  containerClassName?: string
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMouseEnter, setIsMouseEnter] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const { left, top, width, height } = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - left - width / 2) / 25
    const y = (e.clientY - top - height / 2) / 25
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`
  }

  const handleMouseEnter = () => {
    setIsMouseEnter(true)
  }

  const handleMouseLeave = () => {
    if (!containerRef.current) return
    setIsMouseEnter(false)
    containerRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)'
  }

  return (
    <MouseEnterContext.Provider value={[isMouseEnter, setIsMouseEnter]}>
      <div
        className={cn('flex items-center justify-center perspective-1000', containerClassName)}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'relative flex items-center justify-center transition-all duration-200 ease-out preserve-3d',
            className
          )}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  )
}

export const CardBody = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div className={cn('h-full w-full preserve-3d', className)}>{children}</div>
  )
}

export const CardItem = ({
  as: Component = 'div',
  children,
  className,
  translateZ = 0,
  ...rest
}: {
  as?: React.ElementType
  children: React.ReactNode
  className?: string
  translateZ?: number | string
  [key: string]: any
}) => {
  const context = useContext(MouseEnterContext)
  if (!context) throw new Error('CardItem must be used within CardContainer')
  const [isMouseEnter] = context

  const transformString = isMouseEnter
    ? `translateZ(${translateZ}px)`
    : 'translateZ(0px)'

  return (
    <Component
      className={cn('transition-transform duration-300 ease-out', className)}
      style={{ transform: transformString }}
      {...rest}
    >
      {children}
    </Component>
  )
}
