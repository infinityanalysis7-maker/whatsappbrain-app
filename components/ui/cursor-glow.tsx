'use client'

import React, { useEffect, useRef } from 'react'

export function CursorGlow() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`
        cursorRef.current.style.top = `${e.clientY}px`
        cursorRef.current.style.opacity = '1'
      }
    }

    const handleMouseLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '0'
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div
      ref={cursorRef}
      className='pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300'
      style={{
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37, 211, 102, 0.08) 0%, transparent 70%)',
      }}
    />
  )
}
