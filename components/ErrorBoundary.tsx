'use client'

import { useEffect, useState } from 'react'

export default function ErrorBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  const [hasError, setHasError] = useState(false)
  const [errorInfo, setErrorInfo] = useState<string>('')

  useEffect(() => {
    const handler = (error: ErrorEvent) => {
      console.error('Global error caught:', error)
      setHasError(true)
      setErrorInfo(error.message || 'An unexpected error occurred')
    }

    window.addEventListener('error', handler)
    return () => window.removeEventListener('error', handler)
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-wb-ink mb-2">Something went wrong</h1>
          <p className="text-sm text-wb-soft mb-6">
            We're sorry, but an unexpected error occurred. Please refresh the page or try again later.
          </p>
          {errorInfo && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg p-3 mb-4 font-mono">
              {errorInfo}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-wb-green hover:bg-wb-dark text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
