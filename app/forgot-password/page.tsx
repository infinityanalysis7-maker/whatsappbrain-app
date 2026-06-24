'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Brain, ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot_password', email }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        if (data.resetToken) {
          setResetToken(data.resetToken)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    setIsResetting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', email, token: resetToken, newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Password reset successful! Redirecting to login...' })
        setTimeout(() => window.location.href = '/login', 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection failed. Please try again.' })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0f1a]">
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-wb-green/40 to-transparent" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-wb-green/10 border border-wb-green/20 mb-4">
            <Brain className="w-6 h-6 text-wb-green" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
            {resetToken ? 'Set New Password' : 'Reset Password'}
          </h1>
          <p className="text-sm text-gray-500">
            {resetToken ? 'Enter your new password below' : 'Enter your email and we\'ll send a reset link'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          {!resetToken ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {message && (
                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-wb-green/10 border border-wb-green/20 text-wb-green'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {message.text}
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-wb-green hover:bg-wb-dark disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Reset Link
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {message && (
                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-wb-green/10 border border-wb-green/20 text-wb-green'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {message.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-gray-600 outline-none focus:ring-2 focus:ring-wb-green/30 focus:border-wb-green/30 transition-all"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-gray-600 outline-none focus:ring-2 focus:ring-wb-green/30 focus:border-wb-green/30 transition-all"
                  placeholder="Repeat your password"
                />
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full bg-wb-green hover:bg-wb-dark disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back to login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-wb-green font-medium hover:text-wb-green/80 transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}
