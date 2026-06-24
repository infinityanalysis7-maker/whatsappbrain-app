'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  MessageSquare,
  Bot,
  UserCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Zap,
  ShieldCheck,
  BarChart3,
  Activity,
  Inbox,
  Clock,
  Settings,
  CreditCard,
  RefreshCw,
  Users,
  FileText,
  Radio,
  Megaphone,
} from 'lucide-react'
import { loadBotRules } from '@/lib/bot-rules'
import { FREE_PLAN_LIMITS } from '@/lib/limits'

function AnimatedValue({ value, suffix = '' }: { value: string; suffix?: string }) {
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const numeric = parseInt(value.replace(/\D/g, ''), 10) || 0
    if (numeric === 0) {
      setDisplay(value)
      return
    }
    const duration = 800
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(String(Math.round(numeric * eased)))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])

  return (
    <span className="font-mono tabular-nums tracking-tight">
      {display}{suffix}
    </span>
  )
}

export default function DashboardHome() {
  const { data: session } = useSession()
  const [ruleCount, setRuleCount] = useState(0)
  const [activeRules, setActiveRules] = useState(0)
  const [convCount, setConvCount] = useState(0)
  const [usageLoaded, setUsageLoaded] = useState(false)
  const [analytics, setAnalytics] = useState<Record<string, number> | null>(null)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
      const h = ist.getHours()
      const m = String(ist.getMinutes()).padStart(2, '0')
      const period = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      setCurrentTime(`${h12}:${m} ${period} IST`)
    }
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const rules = loadBotRules()
    setRuleCount(rules.length)
    setActiveRules(rules.filter((r) => r.active).length)

    const userId = session?.user?.email
    if (userId) {
      fetch(`/api/limits?userId=${encodeURIComponent(userId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.usage) {
            setConvCount(data.usage.conversations.current)
          }
        })
        .catch(() => {})
        .finally(() => setUsageLoaded(true))

      fetch(`/api/analytics?userId=${encodeURIComponent(userId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.analytics) {
            setAnalytics(data.analytics.overview)
          }
        })
        .catch(() => {})
    } else {
      setUsageLoaded(true)
    }
  }, [session])

  const totalConversations = analytics?.totalConversations ?? 0
  const botReplied = analytics?.botReplied ?? 0
  const totalHandoffs = analytics?.totalHandoffs ?? 0
  const conversionRate = totalConversations > 0
    ? Math.round(((totalConversations - totalHandoffs) / totalConversations) * 100)
    : 0

  const stats = [
    { name: 'Conversations', value: String(totalConversations), suffix: '', sub: 'All time', icon: MessageSquare, gradient: 'from-emerald-500/20 to-teal-500/10', border: 'border-emerald-500/15', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600', glow: 'shadow-emerald-500/5' },
    { name: 'Bot Replied', value: String(botReplied), suffix: '', sub: 'Auto-handled', icon: Bot, gradient: 'from-blue-500/20 to-indigo-500/10', border: 'border-blue-500/15', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600', glow: 'shadow-blue-500/5' },
    { name: 'Handoffs', value: String(totalHandoffs), suffix: '', sub: 'Needs you', icon: UserCheck, gradient: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/15', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600', glow: 'shadow-amber-500/5' },
    { name: 'Conversion', value: String(conversionRate), suffix: '%', sub: 'Success rate', icon: TrendingUp, gradient: 'from-purple-500/20 to-violet-500/10', border: 'border-purple-500/15', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-600', glow: 'shadow-purple-500/5' },
  ]

  return (
    <div className="space-y-0 max-w-6xl mx-auto">
      {/* Page header with time */}
      <div className="pb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Overview</p>
          <h1 className="font-serif text-3xl text-wb-ink tracking-tight">Dashboard</h1>
          <p className="text-wb-soft mt-2 leading-relaxed">
            Your bot is running. Here&apos;s how it&apos;s performing today.
          </p>
        </div>
        {currentTime && (
          <div className="flex items-center gap-2 text-xs text-wb-soft bg-white/60 border border-wb-line/50 rounded-full px-3 py-1.5 self-start sm:self-auto">
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            {currentTime}
          </div>
        )}
      </div>

      {/* Usage warning */}
      {usageLoaded && (convCount >= FREE_PLAN_LIMITS.conversations * 0.8 || ruleCount >= FREE_PLAN_LIMITS.rules) && (
        <div className="py-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="font-medium text-amber-900 text-sm">Approaching free plan limits</p>
              <p className="text-xs text-amber-700 mt-1">
                Conversations: {convCount}/{FREE_PLAN_LIMITS.conversations} · Rules: {ruleCount}/{FREE_PLAN_LIMITS.rules}
              </p>
            </div>
            <Link href="/dashboard/billing" className="text-xs font-medium text-amber-800 bg-amber-100/80 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shrink-0">
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* Upgrade banner */}
      <div className="py-6">
        <div className="banner-gradient rounded-2xl p-6 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.02] blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/10">
                <Sparkles className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-1">Upgrade to Pro</h2>
                <p className="text-white/80 text-sm max-w-md leading-relaxed">
                  Unlimited conversations, AI auto-reply, and advanced analytics. Grow without limits.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/billing"
              className="group/btn inline-flex items-center gap-2 bg-white/95 text-wb-dark font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-white transition-all shrink-0 shadow-lg hover:shadow-xl"
            >
              Coming Soon
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.name}
                className={`bg-gradient-to-br ${stat.gradient} ${stat.border} border rounded-2xl p-5 transition-all duration-300 group cursor-default hover:shadow-lg ${stat.glow} hover:-translate-y-0.5`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-wb-soft uppercase tracking-wide">{stat.name}</p>
                  <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor} transition-all duration-300 group-hover:scale-110`}>
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-3xl font-semibold text-wb-ink mb-1">
                  <AnimatedValue value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-[11px] text-wb-soft">{stat.sub}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bot status + Quick actions */}
      <div className="py-6">
        {ruleCount === 0 ? (
          <div className="section-card p-8 text-center relative overflow-hidden">
            <div className="empty-pattern absolute inset-0 rounded-2xl opacity-30" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-wb-green/5 blur-3xl rounded-full" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-wb-green/15 to-wb-green/5 border border-wb-green/20 flex items-center justify-center mx-auto mb-5">
                <Bot className="w-7 h-7 text-wb-green" strokeWidth={1.5} />
              </div>
              <h2 className="font-serif text-xl text-wb-ink mb-2">No Bot Rules Yet</h2>
              <p className="text-wb-soft text-sm leading-relaxed mb-6 max-w-md mx-auto">
                Set up auto-reply rules so your bot can answer price, hours, and location questions instantly on WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/dashboard/bot-rules"
                  className="inline-flex items-center gap-2 bg-wb-green hover:bg-wb-dark text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-wb-green/20 hover:shadow-lg hover:shadow-wb-green/30"
                >
                  <Zap className="w-4 h-4" strokeWidth={1.5} />
                  Add first bot rule
                </Link>
                <Link
                  href="/dashboard/onboarding"
                  className="inline-flex items-center gap-2 text-wb-soft hover:text-wb-ink font-medium text-sm px-5 py-2.5 rounded-xl border border-wb-line hover:border-wb-green/30 hover:bg-white/60 transition-all"
                >
                  <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                  AI Onboarding
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {/* Bot active card — big hero */}
            <div className="md:col-span-2 section-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-wb-green/5 blur-3xl group-hover:scale-125 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-wb-green/3 blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif text-lg text-wb-ink">Your Bot is Active</h2>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-wb-dark bg-gradient-to-r from-wb-green/15 to-wb-green/5 px-2.5 py-1 rounded-full border border-wb-green/20">
                      <div className="accent-dot" />
                      Live
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wb-green/15 to-wb-green/5 border border-wb-green/15 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-wb-dark" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-sm text-wb-soft mb-5">{activeRules} of {ruleCount} rules running and responding to customers</p>

                {/* Mini rule preview */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {loadBotRules().slice(0, 4).map((rule) => (
                    <span
                      key={rule.id}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        rule.active
                          ? 'bg-wb-green/5 border-wb-green/15 text-wb-dark'
                          : 'bg-wb-bg border-wb-line text-wb-soft'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${rule.active ? 'bg-wb-green' : 'bg-wb-soft/40'}`} />
                      {rule.category}
                    </span>
                  ))}
                </div>

                <div className="h-px bg-gradient-to-r from-wb-line/60 via-wb-line/30 to-transparent mb-4" />
                <Link
                  href="/dashboard/bot-rules"
                  className="text-sm font-medium text-wb-dark hover:text-wb-ink transition-colors inline-flex items-center gap-1.5 group/link"
                >
                  Manage rules
                  <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Quick actions sidebar */}
            <div className="flex flex-col gap-4">
              <div className="section-card p-5 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 blur-2xl group-hover:scale-125 transition-transform duration-500" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                    <BarChart3 className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold text-wb-ink mb-1">Analytics</h3>
                  <p className="text-xs text-wb-soft">Track reply performance.</p>
                </div>
                <Link
                  href="/dashboard/analytics"
                  className="mt-4 pt-3 border-t border-wb-line/40 text-sm font-medium text-wb-dark hover:text-wb-ink transition-colors inline-flex items-center gap-1.5 group/link"
                >
                  View
                  <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/dashboard/conversations"
                  className="section-card p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-wb-green/10 border border-wb-green/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-4 h-4 text-wb-dark" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-semibold text-wb-ink">Chats</span>
                </Link>
                <Link
                  href="/dashboard/contacts"
                  className="section-card p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4 text-blue-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-semibold text-wb-ink">Contacts</span>
                </Link>
                <Link
                  href="/dashboard/broadcasts"
                  className="section-card p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Radio className="w-4 h-4 text-amber-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-semibold text-wb-ink">Broadcasts</span>
                </Link>
                <Link
                  href="/dashboard/templates"
                  className="section-card p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-4 h-4 text-purple-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-semibold text-wb-ink">Templates</span>
                </Link>
                <Link
                  href="/dashboard/campaigns"
                  className="section-card p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Megaphone className="w-4 h-4 text-rose-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-semibold text-wb-ink">Campaigns</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="section-card p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-wb-bg border border-wb-line/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Settings className="w-4 h-4 text-wb-soft" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-semibold text-wb-ink">Settings</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="py-6 pb-4">
        <div className="section-card overflow-hidden">
          <div className="px-6 py-4 border-b border-wb-line/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-wb-soft" strokeWidth={1.5} />
              <h2 className="font-semibold text-wb-ink">Recent Activity</h2>
            </div>
            <span className="text-[11px] text-wb-soft">Last 7 days</span>
          </div>
          <div className="p-10 text-center relative">
            <div className="empty-pattern absolute inset-0 opacity-20" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-wb-bg border border-wb-line/60 flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-6 h-6 text-wb-soft" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-wb-ink mb-1">No activity yet</h3>
              <p className="text-sm text-wb-soft max-w-sm mx-auto leading-relaxed mb-4">
                When customers message your WhatsApp, their conversations and bot replies show up here in real-time.
              </p>
              <div className="inline-flex items-center gap-2 text-xs text-wb-soft bg-wb-bg border border-wb-line/60 rounded-full px-4 py-2">
                <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                Waiting for first customer message
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
