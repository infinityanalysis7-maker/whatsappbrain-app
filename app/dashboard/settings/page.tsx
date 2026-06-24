'use client'

import { useState, useEffect } from 'react'
import {
  Bot,
  Bell,
  Clock,
  Languages,
  MessageCircle,
  UserCheck,
  Sparkles,
  Save,
  Check,
  AlertTriangle,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Mail,
  Smartphone,
  MapPin,
  Building2,
  Wand2,
  Brain,
  Settings,
  RefreshCw,
  TrendingUp,
  Users,
  Clock3,
  MessageSquare,
} from 'lucide-react'

/* ─── Settings interfaces ─── */
interface Settings {
  // WhatsApp
  whatsappNumber: string
  // Notifications
  emailNotifications: boolean
  notificationEmail: string
  // Bot Behavior
  aiFallbackEnabled: boolean
  responseLanguage: string
  handoffTriggers: string[]
  businessHours: string
  afterHoursMessage: string
  // AI Auto-Pilot
  autoReplyEnabled: boolean
  smartHandoffEnabled: boolean
  upiEnabled: boolean
  // AI Automation
  autoProfileEnabled: boolean
  smartPricingEnabled: boolean
  autoRuleGeneration: boolean
  sentimentAnalysis: boolean
  smartScheduling: boolean
}

const defaultSettings: Settings = {
  whatsappNumber: '',
  emailNotifications: true,
  notificationEmail: '',
  aiFallbackEnabled: true,
  responseLanguage: 'hinglish',
  handoffTriggers: [
    'talk to owner',
    'speak to human',
    'bhai connect',
    'connect me',
    'owner',
    'call me',
  ],
  businessHours: '',
  afterHoursMessage:
    'Thank you for messaging! We are currently closed. Our team will get back to you during business hours.',
  autoReplyEnabled: true,
  smartHandoffEnabled: true,
  upiEnabled: false,
  // AI Automation defaults
  autoProfileEnabled: true,
  smartPricingEnabled: true,
  autoRuleGeneration: true,
  sentimentAnalysis: true,
  smartScheduling: true,
}

/* ─── Toggle Switch ─── */
function Toggle({
  enabled,
  onToggle,
  disabled,
}: {
  enabled: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-wb-green/50 focus:ring-offset-2 ${
        enabled ? 'bg-wb-green' : 'bg-gray-200'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

/* ─── Section Card ─── */
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  gradient = false,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
  gradient?: boolean
}) {
  return (
    <div className={`bg-white/95 backdrop-blur-sm border rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300 hover:shadow-lg ${
      gradient ? 'border-wb-green/30 bg-gradient-to-br from-wb-green/[0.03] to-transparent' : 'border-wb-line/60'
    }`}>
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
          gradient 
            ? 'bg-gradient-to-br from-wb-green to-wb-dark text-white' 
            : 'bg-wb-bg border border-wb-line/60 text-wb-soft'
        }`}>
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-wb-ink">{title}</h2>
          <p className="text-sm text-wb-soft mt-1">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

/* ─── Info box ─── */
function InfoBox({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' | 'success' }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-wb-green/5 border-wb-green/20 text-wb-dark',
  }
  const icons = {
    info: Info,
    warning: AlertTriangle,
    success: Check,
  }
  const Icon = icons[type]
  return (
    <div className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm ${styles[type]}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

/* ─── Main page ─── */
export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [newTrigger, setNewTrigger] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [aiStatus, setAiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wb_settings')
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) })
      }
    } catch {}

    // Check AI status
    fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ai-status' }),
    })
      .then((r) => r.json())
      .then((d) => setAiStatus(d.configured ? 'connected' : 'disconnected'))
      .catch(() => setAiStatus('disconnected'))
  }, [])

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    try {
      localStorage.setItem('wb_settings', JSON.stringify(settings))
      const userStr = localStorage.getItem('wb_user')
      const userId = userStr ? JSON.parse(userStr).email : null
      if (userId) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, settings }),
        }).catch(() => {})
      }
      setSaveMessage('All settings saved successfully!')
      setHasUnsavedChanges(false)
      setTimeout(() => setSaveMessage(null), 3000)
    } catch {
      setSaveMessage('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const addTrigger = () => {
    const t = newTrigger.trim().toLowerCase()
    if (t && !settings.handoffTriggers.includes(t)) {
      update({ handoffTriggers: [...settings.handoffTriggers, t] })
      setNewTrigger('')
    }
  }

  const removeTrigger = (trigger: string) => {
    update({ handoffTriggers: settings.handoffTriggers.filter((t) => t !== trigger) })
  }

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 pb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Configuration</p>
          <h1 className="font-serif text-3xl text-wb-ink tracking-tight">Settings</h1>
          <p className="text-wb-soft mt-2 leading-relaxed max-w-xl">
            Control how your bot behaves, when it hands off to you, and what language it uses. Changes take effect immediately.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {aiStatus === 'checking' && (
            <span className="text-sm text-wb-soft bg-wb-bg border border-wb-line rounded-xl px-4 py-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              Checking AI...
            </span>
          )}
          {aiStatus === 'connected' && (
            <span className="text-sm text-wb-dark bg-wb-green/10 border border-wb-green/20 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-wb-green opacity-40 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-wb-green" />
              </span>
              AI Connected
            </span>
          )}
          {aiStatus === 'disconnected' && (
            <span className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              AI Offline
            </span>
          )}
        </div>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
            saveMessage.includes('success')
              ? 'bg-wb-green/10 border border-wb-green/30 text-wb-dark'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {saveMessage.includes('success') ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {saveMessage}
        </div>
      )}

      {/* ─── AI Auto-Pilot Section ─── */}
      <SectionCard
        icon={Wand2}
        title="AI Auto-Pilot"
        description="Core behavior — how the bot handles messages and when it asks for help"
        gradient
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wb-green to-wb-dark flex items-center justify-center shrink-0 shadow-md">
                <Zap className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-wb-ink">Auto-Reply to Everything</p>
                <p className="text-xs text-wb-soft mt-0.5 max-w-sm">
                  Bot replies to every message using your profile data. If it doesn't have an answer, it politely tells the customer to wait for you.
                </p>
              </div>
            </div>
            <Toggle enabled={settings.autoReplyEnabled} onToggle={() => update({ autoReplyEnabled: !settings.autoReplyEnabled })} />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-wb-line to-transparent" />

          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wb-green to-wb-dark flex items-center justify-center shrink-0 shadow-md">
                <UserCheck className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-wb-ink">Smart Handoff</p>
                <p className="text-xs text-wb-soft mt-0.5 max-w-sm">
                  When a customer types phrases like "talk to owner" or "connect me", the bot pauses and emails you immediately.
                </p>
              </div>
            </div>
            <Toggle enabled={settings.smartHandoffEnabled} onToggle={() => update({ smartHandoffEnabled: !settings.smartHandoffEnabled })} />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-wb-line to-transparent" />

          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wb-green to-wb-dark flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-wb-ink">AI Fallback</p>
                <p className="text-xs text-wb-soft mt-0.5 max-w-sm">
                  When no rule matches a question, the AI uses your business profile to generate a helpful reply instead of staying silent.
                </p>
              </div>
            </div>
            <Toggle enabled={settings.aiFallbackEnabled} onToggle={() => update({ aiFallbackEnabled: !settings.aiFallbackEnabled })} />
          </div>
        </div>
      </SectionCard>

      {/* ─── AI Automation Section ─── */}
      <SectionCard
        icon={Brain}
        title="Smart Automation"
        description="Background AI features that improve your bot over time"
        gradient
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                <Users className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-wb-ink">Auto Profile Generation</p>
                <p className="text-xs text-wb-soft mt-0.5 max-w-sm">
                  AI fills in your business profile details from onboarding data, so you don't have to type everything manually.
                </p>
              </div>
            </div>
            <Toggle enabled={settings.autoProfileEnabled} onToggle={() => update({ autoProfileEnabled: !settings.autoProfileEnabled })} />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-wb-line to-transparent" />

          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-wb-ink">Smart Pricing Suggestions</p>
                <p className="text-xs text-wb-soft mt-0.5 max-w-sm">
                  AI looks at market rates in your city and suggests competitive prices when you add new services.
                </p>
              </div>
            </div>
            <Toggle enabled={settings.smartPricingEnabled} onToggle={() => update({ smartPricingEnabled: !settings.smartPricingEnabled })} />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-wb-line to-transparent" />

          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-md">
                <RefreshCw className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-wb-ink">Auto Rule Generation</p>
                <p className="text-xs text-wb-soft mt-0.5 max-w-sm">
                  When you update your profile, bot rules auto-update to match. No manual editing needed.
                </p>
              </div>
            </div>
            <Toggle enabled={settings.autoRuleGeneration} onToggle={() => update({ autoRuleGeneration: !settings.autoRuleGeneration })} />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-wb-line to-transparent" />

          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shrink-0 shadow-md">
                <MessageSquare className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-wb-ink">Sentiment Analysis</p>
                <p className="text-xs text-wb-soft mt-0.5 max-w-sm">
                  AI detects if a customer is frustrated or urgent, and adjusts its tone to be more empathetic.
                </p>
              </div>
            </div>
            <Toggle enabled={settings.sentimentAnalysis} onToggle={() => update({ sentimentAnalysis: !settings.sentimentAnalysis })} />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-wb-line to-transparent" />

          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
                <Clock3 className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-wb-ink">Smart Scheduling</p>
                <p className="text-xs text-wb-soft mt-0.5 max-w-sm">
                  When customers ask to book, AI suggests available time slots based on your hours.
                </p>
              </div>
            </div>
            <Toggle enabled={settings.smartScheduling} onToggle={() => update({ smartScheduling: !settings.smartScheduling })} />
          </div>
        </div>
      </SectionCard>

      {/* ─── Quick Setup Section ─── */}
      <SectionCard
        icon={Smartphone}
        title="WhatsApp Number"
        description="The number customers message to reach your bot"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-wb-ink mb-1.5">
              WhatsApp Business Number
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 border-wb-line rounded-l-lg bg-gray-50 text-wb-soft text-sm font-medium">
                +91
              </span>
              <input
                type="tel"
                value={settings.whatsappNumber}
                onChange={(e) => update({ whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="flex-1 px-4 py-2.5 border border-wb-line rounded-r-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none text-sm"
                placeholder="9876543210"
                maxLength={10}
              />
            </div>
            <p className="text-xs text-wb-soft mt-1.5">
              This is the number customers will find and message on WhatsApp.
            </p>
          </div>

          <InfoBox type="info">
            <strong>How it works:</strong> Customers send a WhatsApp message to this number. Our AI reads it, checks your business profile, and replies automatically within 3 seconds.
          </InfoBox>
        </div>
      </SectionCard>

      {/* ─── Response Style Section ─── */}
      <SectionCard
        icon={Languages}
        title="Response Style"
        description="Language, tone, and business hours for your bot"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-wb-ink mb-1.5">Reply Language</label>
            <select
              value={settings.responseLanguage}
              onChange={(e) => update({ responseLanguage: e.target.value })}
              className="w-full px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none text-sm bg-white"
            >
              <option value="hinglish">Hinglish (English + Hindi mix) — Recommended</option>
              <option value="english">English only</option>
              <option value="hindi">Hindi only</option>
              <option value="auto">Auto-detect (match customer language)</option>
            </select>
            <p className="text-xs text-wb-soft mt-1.5">
              Hinglish works best for most Indian businesses. The bot mixes Hindi and English naturally, matching how customers actually type.
            </p>
          </div>

          <div className="h-px bg-wb-line/60" />

          <div>
            <label className="block text-sm font-medium text-wb-ink mb-1.5">
              Business Hours
              <span className="text-wb-soft font-normal ml-1">(for after-hours auto-reply)</span>
            </label>
            <input
              type="text"
              value={settings.businessHours}
              onChange={(e) => update({ businessHours: e.target.value })}
              className="w-full px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none text-sm"
              placeholder="Mon-Sat 9 AM to 8 PM"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {['Mon-Sat 9 AM – 8 PM', 'Mon-Sun 10 AM – 10 PM', 'Tue-Sun 11 AM – 9 PM'].map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => update({ businessHours: preset })}
                    className="text-xs px-3 py-1.5 bg-wb-bg border border-wb-line rounded-full hover:border-wb-green/40 transition"
                  >
                    {preset}
                  </button>
                )
              )}
            </div>
          </div>

          {settings.businessHours && (
            <div>
              <label className="block text-sm font-medium text-wb-ink mb-1.5">
                After Hours Message
              </label>
              <textarea
                rows={3}
                value={settings.afterHoursMessage}
                onChange={(e) => update({ afterHoursMessage: e.target.value })}
                className="w-full px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none resize-none text-sm"
              />
              <p className="text-xs text-wb-soft mt-1.5">
                Sent automatically when a customer messages outside your business hours.
              </p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ─── Handoff Triggers Section ─── */}
      <SectionCard
        icon={MessageCircle}
        title="Handoff Triggers"
        description="Phrases that make the bot pause and email you"
      >
        <div className="space-y-4">
          <p className="text-sm text-wb-soft">
            When a customer types any of these phrases, the AI immediately hands over to you and sends you an email.
          </p>
          <div className="flex flex-wrap gap-2">
            {settings.handoffTriggers.map((trigger) => (
              <span
                key={trigger}
                className="inline-flex items-center gap-1.5 bg-wb-bg border border-wb-line/60 text-wb-ink text-sm px-3 py-1.5 rounded-lg"
              >
                {trigger}
                <button
                  onClick={() => removeTrigger(trigger)}
                  className="text-wb-soft hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTrigger()
                }
              }}
              className="flex-1 px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none text-sm"
              placeholder="Add a trigger word..."
            />
            <button
              type="button"
              onClick={addTrigger}
              disabled={!newTrigger.trim()}
              className="px-4 py-2.5 bg-wb-bg border border-wb-line rounded-lg text-sm font-medium text-wb-dark hover:bg-wb-green/10 hover:border-wb-green/30 transition-colors disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ─── Notifications Section ─── */}
      <SectionCard
        icon={Bell}
        title="Email Alerts"
        description="Notifications when a customer needs to talk to you"
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <p className="text-sm font-semibold text-wb-ink">Email Alerts</p>
              <p className="text-xs text-wb-soft mt-0.5">
                Receive an email when a customer requests to talk to you
              </p>
            </div>
            <Toggle
              enabled={settings.emailNotifications}
              onToggle={() => update({ emailNotifications: !settings.emailNotifications })}
            />
          </div>

          {settings.emailNotifications && (
            <div>
              <label className="block text-sm font-medium text-wb-ink mb-1.5">
                Your Email Address
              </label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-wb-soft" />
                <input
                  type="email"
                  value={settings.notificationEmail}
                  onChange={(e) => update({ notificationEmail: e.target.value })}
                  className="flex-1 px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none text-sm"
                  placeholder="you@yourbusiness.com"
                />
              </div>
              <p className="text-xs text-wb-soft mt-1.5">
                We send a simple email with the customer's name, phone number, and last message.
              </p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ─── Advanced Toggle (Developer Section) ─── */}
      <div className="border border-wb-line/40 rounded-2xl overflow-hidden bg-white/50">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-wb-bg/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-500" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-wb-ink">Developer Settings</h2>
              <p className="text-xs text-wb-soft">API keys and technical configuration (for developers only)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-wb-soft bg-gray-100 px-2 py-1 rounded-full">Advanced</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-wb-soft" />
            ) : (
              <ChevronDown className="w-4 h-4 text-wb-soft" />
            )}
          </div>
        </button>

        {showAdvanced && (
          <div className="px-6 pb-6 pt-2 border-t border-wb-line/40 space-y-6">
            <InfoBox type="warning">
              <strong>For developers only.</strong> These settings are only needed if you're connecting your own WhatsApp Business API or custom email provider. Most users don't need to touch these.
            </InfoBox>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-wb-ink mb-1">
                  WhatsApp Access Token
                  <span className="text-wb-soft ml-1 font-normal">(from Meta Developers)</span>
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none font-mono text-sm bg-gray-50"
                  placeholder="EAA..."
                  readOnly
                  onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                  value={process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-wb-ink mb-1">
                  Phone Number ID
                  <span className="text-wb-soft ml-1 font-normal">(from Meta Cloud API)</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none font-mono text-sm bg-gray-50"
                  placeholder="1234567890"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-wb-ink mb-1">
                  Webhook Verify Token
                  <span className="text-wb-soft ml-1 font-normal">(set in Meta Dashboard)</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-wb-bg border border-wb-line/60 rounded-lg px-4 py-2.5 font-mono text-sm text-wb-soft overflow-x-auto">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-wb-ink mb-1">
                  Resend API Key
                  <span className="text-wb-soft ml-1 font-normal">(for email delivery)</span>
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none font-mono text-sm bg-gray-50"
                  placeholder="re_..."
                  readOnly
                />
              </div>
            </div>

            <InfoBox type="info">
              <strong>Need help?</strong> Check the <code className="bg-wb-bg px-1 rounded">SETUP.md</code> file in your project for step-by-step instructions. Or contact support — we'll walk you through it.
            </InfoBox>
          </div>
        )}
      </div>

      {/* ─── Save button ─── */}
      <div className="flex items-center justify-end gap-4 pb-8 pt-4">
        {hasUnsavedChanges && (
          <span className="text-sm text-amber-600 font-semibold flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
            <AlertTriangle className="w-4 h-4" />
            Unsaved changes
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-wb-green to-wb-dark hover:from-wb-dark hover:to-wb-green disabled:bg-gray-300 text-white font-bold px-10 py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-wb-green/20"
        >
          <Save className="w-5 h-5" strokeWidth={2} />
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
