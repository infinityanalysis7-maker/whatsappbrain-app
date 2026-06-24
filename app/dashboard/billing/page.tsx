'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Check,
  ArrowLeft,
  Clock,
  MessageSquare,
  Bot,
  BarChart3,
  Headphones,
  Palette,
  Infinity,
} from 'lucide-react'
import { FREE_PLAN_LIMITS } from '@/lib/limits'

const PRO_FEATURES = [
  { icon: MessageSquare, text: 'Unlimited conversations', detail: 'No cap on customer chats' },
  { icon: Bot, text: 'Unlimited bot rules', detail: 'Create as many auto-reply rules as you need' },
  { icon: Sparkles, text: 'AI fallback replies', detail: 'Answers questions not covered by your rules' },
  { icon: BarChart3, text: 'Full analytics dashboard', detail: 'See trends, peak hours, and performance' },
  { icon: Headphones, text: 'Priority support', detail: 'Get help within 2 hours instead of 24' },
  { icon: Palette, text: 'Custom branding', detail: 'Remove WhatsAppBrain branding from replies' },
]

export default function Billing() {
  const [convCount, setConvCount] = useState(0)
  const [ruleCount, setRuleCount] = useState(0)

  useEffect(() => {
    const userStr = localStorage.getItem('wb_user')
    const userId = userStr ? JSON.parse(userStr).email : null
    if (!userId) return

    fetch(`/api/limits?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.usage) {
          setConvCount(data.usage.conversations.current)
        }
      })
      .catch(() => {})

    fetch(`/api/rules?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.rules) {
          setRuleCount(data.rules.length)
        }
      })
      .catch(() => {})
  }, [])

  const convPct = Math.min((convCount / FREE_PLAN_LIMITS.conversations) * 100, 100)
  const rulePct = Math.min((ruleCount / FREE_PLAN_LIMITS.rules) * 100, 100)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="pb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-wb-soft hover:text-wb-ink transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Dashboard
        </Link>
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Plan</p>
        <h1 className="font-serif text-3xl text-wb-ink tracking-tight">Billing</h1>
        <p className="text-wb-soft mt-2 leading-relaxed">
          Manage your plan, track usage, and upgrade when you're ready.
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-wb-line/60 rounded-xl p-6 md:p-8 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-wb-soft mb-1">Current Plan</p>
            <h2 className="text-xl font-semibold text-wb-ink">Free</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-wb-green/10 text-wb-dark border border-wb-green/20">
            <span className="w-1.5 h-1.5 rounded-full bg-wb-green" />
            Active
          </span>
        </div>

        <div className="h-px bg-wb-line/60 mb-5" />

        {/* Usage limits */}
        <div className="space-y-4 mb-5">
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-wb-soft">Conversations</span>
              <span className="font-mono text-wb-ink">{convCount} / {FREE_PLAN_LIMITS.conversations}</span>
            </div>
            <div className="h-1.5 bg-wb-bg rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${convPct >= 80 ? 'bg-amber-500' : 'bg-wb-green'}`}
                style={{ width: `${convPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-wb-soft">Bot Rules</span>
              <span className="font-mono text-wb-ink">{ruleCount} / {FREE_PLAN_LIMITS.rules}</span>
            </div>
            <div className="h-1.5 bg-wb-bg rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${rulePct >= 80 ? 'bg-amber-500' : 'bg-wb-green'}`}
                style={{ width: `${rulePct}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-sm text-wb-soft leading-relaxed">
          You're on the Free plan with 50 conversations and 5 bot rules per month. Enough to test your bot with real customers.
        </p>
      </div>

      {/* Pro Plan */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-wb-green via-[#1ebe72] to-wb-dark p-6 md:p-8 text-white">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">Pro Plan</span>
          </div>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-semibold">₹499</span>
            <span className="text-white/60 text-sm">/month</span>
          </div>

          <div className="space-y-3 mb-8">
            {PRO_FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-white/80" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{feature.text}</p>
                    <p className="text-xs text-white/60 mt-0.5">{feature.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/10">
            <Clock className="w-5 h-5 text-white/70 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-semibold">Coming Soon</p>
              <p className="text-xs text-white/70 mt-0.5">
                Payment integration is under development. We'll notify you when it's ready.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 space-y-4">
        <h2 className="text-sm font-semibold text-wb-ink">Frequently Asked Questions</h2>
        
        <div className="bg-white border border-wb-line/60 rounded-xl p-5">
          <h3 className="text-sm font-medium text-wb-ink mb-1">What happens when I hit 50 conversations?</h3>
          <p className="text-xs text-wb-soft leading-relaxed">
            Your bot keeps running but stops auto-replying to new customers. Existing conversations continue normally. Upgrade to Pro to remove the limit.
          </p>
        </div>

        <div className="bg-white border border-wb-line/60 rounded-xl p-5">
          <h3 className="text-sm font-medium text-wb-ink mb-1">Do conversations reset each month?</h3>
          <p className="text-xs text-wb-soft leading-relaxed">
            Yes. The counter resets on the 1st of each month. A "conversation" is one unique customer chat thread, not individual messages.
          </p>
        </div>

        <div className="bg-white border border-wb-line/60 rounded-xl p-5">
          <h3 className="text-sm font-medium text-wb-ink mb-1">Can I cancel anytime?</h3>
          <p className="text-xs text-wb-soft leading-relaxed">
            Pro isn't live yet, but when it launches — yes. No contracts, no lock-in. Cancel from your dashboard anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
