'use client'
import { useState, useEffect } from 'react'
import {
  MessageSquare,
  Bot,
  UserCheck,
  Users,
  Clock,
  TrendingUp,
  Activity,
  BarChart3,
  ArrowRight,
  RefreshCw,
  Inbox,
  Phone,
  Zap,
} from 'lucide-react'

/* ─── Types ─── */
interface AnalyticsData {
  overview: {
    totalConversations: number
    botReplied: number
    totalHandoffs: number
    uniqueCustomers: number
    totalBotMessages: number
    totalCustomerMessages: number
    totalOwnerMessages: number
    avgResponseTimeSec: number
  }
  activityChart: { date: string; label: string; conversations: number; messages: number }[]
  hourlyActivity: { hour: number; label: string; messages: number }[]
  peakHour: number
  recentConversations: {
    customerName: string
    customerPhone: string
    status: string
    messageCount: number
    lastMessage: string
    lastTimestamp: string
  }[]
  ruleCategories: Record<string, number>
}

/* ─── Animated counter ─── */
function AnimatedValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const duration = 800
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(value * eased))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <span className="font-mono tabular-nums tracking-tight">{display.toLocaleString()}{suffix}</span>
}

/* ─── Section divider ─── */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-wb-line to-transparent" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-wb-soft">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-wb-line to-transparent" />
    </div>
  )
}

/* ─── Status badge ─── */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    bot: { bg: 'bg-wb-green/10 border-wb-green/20', text: 'text-wb-dark', label: 'Bot' },
    human_pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Pending' },
    human_active: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Active' },
  }
  const c = config[status] || config.bot
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

/* ─── Bar chart (CSS-based) ─── */
function ActivityBarChart({ data }: { data: AnalyticsData['activityChart'] }) {
  const maxVal = Math.max(...data.map((d) => d.messages), 1)
  // Show every 5th label to avoid crowding
  const labelInterval = Math.ceil(data.length / 8)

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-wb-line/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-serif text-lg text-wb-ink">Activity</h3>
          <p className="text-xs text-wb-soft mt-0.5">Messages per day (last 30 days)</p>
        </div>
      </div>
      <div className="flex items-end gap-[3px] h-40">
        {data.map((d, i) => {
          const height = maxVal > 0 ? (d.messages / maxVal) * 100 : 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-wb-ink text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {d.label}: {d.messages} messages
              </div>
              <div
                className="w-full rounded-t bg-wb-green/70 hover:bg-wb-green transition-colors min-h-[2px]"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              {i % labelInterval === 0 && (
                <span className="text-[9px] text-wb-soft -rotate-45 origin-top-left whitespace-nowrap mt-1">
                  {d.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Hourly heatmap ─── */
function HourlyHeatmap({ data, peakHour }: { data: AnalyticsData['hourlyActivity']; peakHour: number }) {
  const maxVal = Math.max(...data.map((d) => d.messages), 1)

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-wb-line/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-serif text-lg text-wb-ink">Peak Hours</h3>
          <p className="text-xs text-wb-soft mt-0.5">When your customers message most</p>
        </div>
        <span className="text-xs text-wb-soft bg-wb-bg border border-wb-line/60 rounded-full px-3 py-1">
          Peak: {peakHour}:00
        </span>
      </div>
      <div className="grid grid-cols-12 gap-1.5">
        {data.map((d) => {
          const intensity = maxVal > 0 ? d.messages / maxVal : 0
          return (
            <div key={d.hour} className="flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-wb-ink text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {d.label}: {d.messages} messages
              </div>
              <div
                className={`w-full aspect-square rounded-md transition-all ${
                  d.hour === peakHour ? 'ring-2 ring-wb-green ring-offset-1' : ''
                }`}
                style={{
                  backgroundColor:
                    intensity === 0
                      ? 'var(--color-wb-bg)'
                      : `rgba(37, 211, 102, ${0.15 + intensity * 0.85})`,
                }}
              />
              {d.hour % 3 === 0 && (
                <span className="text-[9px] text-wb-soft">{d.hour}</span>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-1.5 text-[10px] text-wb-soft">
          <div className="w-3 h-3 rounded-sm bg-wb-bg border border-wb-line/40" /> Low
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-wb-soft">
          <div className="w-3 h-3 rounded-sm bg-wb-green/40" /> Medium
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-wb-soft">
          <div className="w-3 h-3 rounded-sm bg-wb-green" /> High
        </div>
      </div>
    </div>
  )
}

/* ─── Donut chart (SVG-based) ─── */
function DonutChart({
  segments,
}: {
  segments: { label: string; value: number; color: string }[]
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-wb-soft">
        No data yet
      </div>
    )
  }
  const radius = 50
  const circumference = 2 * Math.PI * radius
  let cumulative = 0

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 120 120" className="w-28 h-28 shrink-0">
        {segments.map((seg, i) => {
          const pct = seg.value / total
          const dash = pct * circumference
          const offset = cumulative * circumference
          cumulative += pct
          return (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="transition-all duration-500"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
            />
          )
        })}
        <text x="60" y="56" textAnchor="middle" className="fill-wb-ink text-[18px] font-semibold font-mono">
          {total}
        </text>
        <text x="60" y="70" textAnchor="middle" className="fill-wb-soft text-[8px]">
          total
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-wb-soft">{seg.label}</span>
            <span className="font-mono text-wb-ink font-medium ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Empty state ─── */
function EmptyState() {
  return (
    <div className="space-y-8">
      <div className="pb-4">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Analytics</p>
        <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Analytics</h1>
        <p className="text-wb-soft mt-2 max-w-xl leading-relaxed">
          See how your bot is performing, when customers message most, and which rules get used.
        </p>
      </div>
      <div className="bg-white border border-wb-line/60 rounded-xl p-8 md:p-14 text-center">
        <div className="w-16 h-16 rounded-2xl bg-wb-bg border border-wb-line/60 flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="w-8 h-8 text-wb-soft" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-2xl text-wb-ink mb-3">No Analytics Yet</h2>
        <p className="text-sm text-wb-soft leading-relaxed max-w-md mx-auto mb-6">
          Once customers start messaging your WhatsApp bot, you'll see conversation counts, response times, peak hours, and which bot rules fire most — all updated in real-time.
        </p>
        <div className="inline-flex items-center gap-2 text-xs text-wb-soft bg-wb-bg border border-wb-line/60 rounded-full px-4 py-2">
          <Clock className="w-3.5 h-3.5" />
          Waiting for first customer message
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ─── */
export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAnalytics = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    try {
      const userStr = localStorage.getItem('wb_user')
      const userId = userStr ? JSON.parse(userStr).email : null
      if (!userId) return

      const res = await fetch(`/api/analytics?userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      if (data.success) {
        setAnalytics(data.analytics)
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // Auto-refresh every 30s
    const interval = setInterval(() => fetchAnalytics(), 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="pb-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wb-soft mb-2">Analytics</p>
          <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Analytics</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white/90 border border-wb-line/60 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-wb-line/40 rounded w-24 mb-4" />
              <div className="h-8 bg-wb-line/30 rounded w-16 mb-2" />
              <div className="h-3 bg-wb-line/20 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) return <EmptyState />

  const { overview, activityChart, hourlyActivity, peakHour, recentConversations, ruleCategories } = analytics

  const hasData = overview.totalConversations > 0
  if (!hasData) return <EmptyState />

  const botPct = overview.totalConversations > 0
    ? Math.round((overview.botReplied / overview.totalConversations) * 100)
    : 0
  const handoffPct = overview.totalConversations > 0
    ? Math.round((overview.totalHandoffs / overview.totalConversations) * 100)
    : 0

  const statCards = [
    {
      name: 'Total Conversations',
      value: overview.totalConversations,
      sub: 'All time',
      icon: MessageSquare,
    },
    {
      name: 'Bot Replied',
      value: overview.botReplied,
      sub: `${botPct}% auto-handled`,
      icon: Bot,
    },
    {
      name: 'Human Handoff',
      value: overview.totalHandoffs,
      sub: `${handoffPct}% needed help`,
      icon: UserCheck,
    },
    {
      name: 'Unique Customers',
      value: overview.uniqueCustomers,
      sub: 'Distinct contacts',
      icon: Users,
    },
  ]

  const performanceSegments = [
    { label: 'Bot replied', value: overview.botReplied, color: '#25D366' },
    { label: 'Human handoff', value: overview.totalHandoffs, color: '#F59E0B' },
  ]

  const ruleSegments = Object.entries(ruleCategories).map(([cat, count], i) => ({
    label: cat,
    value: count,
    color: ['#25D366', '#128C7E', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'][i % 6],
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Analytics</p>
          <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Analytics</h1>
          <p className="text-wb-soft mt-2 max-w-xl leading-relaxed">
            See how your bot is performing, when customers message most, and which rules get used.
          </p>
        </div>
        <button
          onClick={() => fetchAnalytics(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-sm text-wb-soft hover:text-wb-ink border border-wb-line hover:border-wb-green/30 rounded-xl px-4 py-2 transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          Refresh
        </button>
      </div>

      <SectionDivider label="Overview" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="group relative bg-white/90 backdrop-blur-sm p-5 md:p-6 rounded-2xl border border-wb-line/70 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-wb-green/25 transition-all duration-300 ease-out overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-wb-green/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-wb-soft font-medium">{stat.name}</p>
                  <div className="w-9 h-9 rounded-lg bg-wb-bg/80 border border-wb-line/60 flex items-center justify-center text-wb-soft group-hover:text-wb-dark group-hover:border-wb-green/30 group-hover:bg-wb-green/5 transition-all duration-300">
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-3xl font-semibold text-wb-ink mb-1">
                  <AnimatedValue value={stat.value} />
                </p>
                <p className="text-xs text-wb-soft">{stat.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-wb-line/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-wb-green/10 border border-wb-green/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-wb-dark" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-wb-ink font-mono">
              {overview.avgResponseTimeSec > 0 ? `${overview.avgResponseTimeSec}s` : '<1s'}
            </p>
            <p className="text-xs text-wb-soft">Avg. bot response time</p>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-wb-line/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-wb-green/10 border border-wb-green/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-wb-dark" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-wb-ink font-mono">
              {overview.totalBotMessages.toLocaleString()}
            </p>
            <p className="text-xs text-wb-soft">Bot messages sent</p>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-wb-line/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-wb-green/10 border border-wb-green/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-wb-dark" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-wb-ink font-mono">
              {overview.totalCustomerMessages.toLocaleString()}
            </p>
            <p className="text-xs text-wb-soft">Customer messages received</p>
          </div>
        </div>
      </div>

      <SectionDivider label="Trends" />

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <ActivityBarChart data={activityChart} />
        </div>
        <div className="lg:col-span-2">
          <HourlyHeatmap data={hourlyActivity} peakHour={peakHour} />
        </div>
      </div>

      <SectionDivider label="Performance" />

      {/* Performance breakdown */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Bot vs Handoff */}
        <div className="bg-white/90 backdrop-blur-sm border border-wb-line/60 rounded-2xl p-6 shadow-sm">
          <h3 className="font-serif text-lg text-wb-ink mb-1">Reply Distribution</h3>
          <p className="text-xs text-wb-soft mb-6">Bot handled vs human handoff</p>
          <DonutChart segments={performanceSegments} />
        </div>

        {/* Rule categories */}
        <div className="bg-white/90 backdrop-blur-sm border border-wb-line/60 rounded-2xl p-6 shadow-sm">
          <h3 className="font-serif text-lg text-wb-ink mb-1">Rule Categories</h3>
          <p className="text-xs text-wb-soft mb-6">Which bot rules fire most often</p>
          {ruleSegments.length > 0 ? (
            <DonutChart segments={ruleSegments} />
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-wb-soft">
              No rules configured yet
            </div>
          )}
        </div>
      </div>

      <SectionDivider label="Conversations" />

      {/* Recent conversations */}
      <div className="bg-white/90 backdrop-blur-sm border border-wb-line/70 rounded-2xl shadow-sm ring-1 ring-black/[0.02] overflow-hidden">
        <div className="px-6 py-4 border-b border-wb-line/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-wb-soft" strokeWidth={1.5} />
            <h3 className="font-serif text-lg text-wb-ink">Recent Conversations</h3>
          </div>
          <span className="text-xs text-wb-soft font-medium">Last 10</span>
        </div>
        {recentConversations.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-wb-bg border border-wb-line/70 flex items-center justify-center mx-auto mb-5">
              <Inbox className="w-6 h-6 text-wb-soft" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-lg text-wb-ink mb-2">No conversations yet</h3>
            <p className="text-sm text-wb-soft max-w-sm mx-auto leading-relaxed">
              Conversations will appear here once customers start messaging your WhatsApp bot.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-wb-line/40">
            {recentConversations.map((conv, i) => {
              const timeAgo = getTimeAgo(conv.lastTimestamp)
              return (
                <div key={i} className="px-6 py-4 hover:bg-wb-bg/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-wb-green/10 border border-wb-green/20 flex items-center justify-center text-wb-dark text-sm font-bold shrink-0">
                        {conv.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-wb-ink text-sm truncate">
                            {conv.customerName}
                          </span>
                          <StatusBadge status={conv.status} />
                        </div>
                        <p className="text-xs text-wb-soft truncate max-w-md">{conv.lastMessage}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-wb-soft">{timeAgo}</p>
                      <p className="text-[10px] text-wb-soft/60 mt-0.5">{conv.messageCount} msgs</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Helper: time ago ─── */
function getTimeAgo(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
