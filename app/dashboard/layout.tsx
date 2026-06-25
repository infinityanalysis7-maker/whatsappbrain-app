'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Sparkles,
  User,
  Bot,
  MessageSquare,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
  Brain,
  ChevronRight,
  Users,
  FileText,
  Radio,
  Megaphone,
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Onboarding', href: '/dashboard/onboarding', icon: Sparkles },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Bot Rules', href: '/dashboard/bot-rules', icon: Bot },
  { name: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { name: 'Templates', href: '/dashboard/templates', icon: FileText },
  { name: 'Broadcasts', href: '/dashboard/broadcasts', icon: Radio },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hasRules, setHasRules] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated' || !session?.user?.email) {
      router.push('/login')
      return
    }

    let cancelled = false
    const maxRetries = 3
    const retryDelay = 2000

    async function verifyWithRetry(attempt: number): Promise<void> {
      if (cancelled || attempt > maxRetries) return

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)

        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', email: session!.user!.email }),
          signal: controller.signal,
        })
        clearTimeout(timeout)

        const data = await res.json()
        if (!cancelled && data.success && data.user) {
          setUser(data.user)
        } else if (!cancelled && attempt < maxRetries) {
          // Retry — Supabase might be cold-starting
          await new Promise(r => setTimeout(r, retryDelay))
          await verifyWithRetry(attempt + 1)
        } else if (!cancelled) {
          signOut({ callbackUrl: '/login', redirect: true })
        }
      } catch {
        if (!cancelled && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, retryDelay))
          await verifyWithRetry(attempt + 1)
        } else if (!cancelled) {
          signOut({ callbackUrl: '/login', redirect: true })
        }
      }
    }

    verifyWithRetry(0)

    // Check if user has any bot rules
    fetch(`/api/rules?userId=${encodeURIComponent(session.user.email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.rules && data.rules.length > 0) {
          setHasRules(true)
        }
      })
      .catch(() => {})

    // Safety: if session is stuck loading for >30s, force redirect to login
    const sessionTimeout = setTimeout(() => {
      if (!user) router.push('/login')
    }, 30_000)
    return () => { cancelled = true; clearTimeout(sessionTimeout) }
  }, [session, status, router])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  if (status === 'loading' || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center alive-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-xl bg-wb-green/10 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 rounded-xl bg-wb-green/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-wb-green" strokeWidth={1.5} />
            </div>
          </div>
          <span className="text-sm font-medium text-wb-soft">Loading your workspace...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen alive-bg flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-60 sidebar-alive z-40
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-wb-line/40">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-wb-green/20 blur-sm group-hover:blur-md transition-all" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-wb-green to-wb-dark flex items-center justify-center shadow-md">
                <Brain className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
            </div>
            <div>
              <span className="font-serif text-lg text-wb-ink tracking-tight block leading-none">WhatsAppBrain</span>
              <span className="text-[10px] text-wb-soft tracking-wide">AI Auto-Reply Bot</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  ${isActive
                    ? 'active bg-gradient-to-r from-wb-green/10 to-wb-green/5 text-wb-dark'
                    : 'text-wb-soft hover:text-wb-ink hover:bg-white/60'
                  }
                `}
              >
                <item.icon
                  className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-wb-green' : ''}`}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-wb-green shadow-sm shadow-wb-green/50" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="px-3 mb-2">
          <ThemeToggle />
        </div>

        {/* User */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-wb-line/40">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wb-green/20 to-wb-dark/10 border border-wb-green/20 flex items-center justify-center">
                <span className="text-sm font-bold text-wb-dark">
                  {user.businessName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-wb-green border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-wb-ink truncate">{user.businessName}</p>
              <p className="text-[11px] text-wb-soft truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-wb-soft hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-wb-line/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-wb-bg border border-wb-line/60 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-wb-ink" /> : <Menu className="w-5 h-5 text-wb-ink" />}
            </button>
            <div>
              <h2 className="text-lg font-semibold text-wb-ink tracking-tight">{user.businessName}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${
              hasRules
                ? 'text-wb-dark bg-gradient-to-r from-wb-green/10 to-wb-green/5 border-wb-green/15'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}>
              <div className={hasRules ? 'accent-dot' : 'w-1.5 h-1.5 rounded-full bg-amber-500'} />
              {hasRules ? 'Bot Active' : 'No Rules'}
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-wb-green/15 to-wb-dark/10 border border-wb-green/15 flex items-center justify-center">
              <span className="text-sm font-bold text-wb-dark">
                {user.businessName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
