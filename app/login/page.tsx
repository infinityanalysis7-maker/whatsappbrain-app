'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Brain, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react'
import GoogleMockPopup from '@/components/GoogleMockPopup'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isGoogleOpen, setIsGoogleOpen] = useState(false)
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data) => setGoogleConfigured(data.googleConfigured === true))
      .catch(() => setGoogleConfigured(false))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Invalid email or password.')
      } else {
        // Wait briefly for session to update, then navigate regardless
        let attempts = 0
        while (attempts < 10 && status !== 'authenticated') {
          await new Promise(r => setTimeout(r, 100))
          attempts++
        }
        // Force navigation — dashboard layout will re-verify the session
        window.location.href = '/dashboard'
      }
    } catch {
      setError('Connection failed. Please check if server is running.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (googleConfigured) {
      setError('')
      await signIn('google', { callbackUrl: '/dashboard' })
    } else {
      setIsGoogleOpen(true)
    }
  }

  const handleMockGoogleSelect = async (googleUser: { name: string; email: string }) => {
    setIsGoogleOpen(false)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'google_login', email: googleUser.email, name: googleUser.name }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const result = await signIn('credentials', { email: googleUser.email, password: data.generatedPassword, redirect: false })
        if (!result?.error) {
          let attempts = 0
          while (attempts < 20 && status !== 'authenticated') {
            await new Promise(r => setTimeout(r, 100))
            attempts++
          }
          router.push('/dashboard')
        } else {
          setError('Failed to log in after Google auth.')
        }
      } else {
        setError(data.error || 'Failed to authenticate with Google.')
      }
    } catch {
      setError('Connection failed. Please check if server is running.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0f1a]">
      {/* Subtle top accent */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-wb-green/40 to-transparent" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-wb-green/10 border border-wb-green/20 mb-4">
            <Brain className="w-6 h-6 text-wb-green" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">WhatsAppBrain</h1>
          <p className="text-sm text-gray-500">Log in to your dashboard</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-gray-600 outline-none focus:ring-2 focus:ring-wb-green/30 focus:border-wb-green/30 transition-all"
                placeholder="you@business.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-gray-600 outline-none focus:ring-2 focus:ring-wb-green/30 focus:border-wb-green/30 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-wb-green hover:bg-wb-dark disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 mt-1"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Log In
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="checkbox" className="rounded border-white/10 bg-white/[0.04] text-wb-green focus:ring-wb-green/30" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-wb-green transition-colors">
                Forgot password?
              </Link>
            </div>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-gray-600">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] text-white font-medium py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            {googleConfigured === false && (
              <p className="text-center text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                Google OAuth not configured — using demo mode.
              </p>
            )}
          </form>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-wb-green font-medium hover:text-wb-green/80 transition-colors">
            Sign up
          </Link>
        </p>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-5 mt-8">
          {[
            { icon: Shield, text: 'Encrypted' },
            { icon: Zap, text: 'Instant Setup' },
            { icon: Sparkles, text: 'AI-Powered' },
          ].map((badge) => (
            <div key={badge.text} className="flex items-center gap-1.5 text-xs text-gray-600">
              <badge.icon className="w-3 h-3" strokeWidth={1.5} />
              {badge.text}
            </div>
          ))}
        </div>
      </div>

      <GoogleMockPopup isOpen={isGoogleOpen} onClose={() => setIsGoogleOpen(false)} onSelect={handleMockGoogleSelect} />
    </div>
  )
}
