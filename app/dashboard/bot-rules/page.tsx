'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Bot,
  Lightbulb,
  MessageCircle,
  Clock,
  MapPin,
  Tag,
  X,
  CheckCircle2,
} from 'lucide-react'
import { BotRule, loadBotRules, saveBotRules } from '@/lib/bot-rules'
import { FREE_PLAN_LIMITS } from '@/lib/limits'

const CATEGORIES = ['Price', 'Hours', 'Location', 'Menu', 'Booking', 'Other']

const categoryIcons: Record<string, typeof Tag> = {
  Price: Tag,
  Hours: Clock,
  Location: MapPin,
  Menu: MessageCircle,
  Booking: CheckCircle2,
  Other: Bot,
}

const CategoryBadge = ({ category }: { category: string }) => {
  const colors: Record<string, string> = {
    Price: 'bg-blue-50/80 text-blue-800 border-blue-200/60',
    Hours: 'bg-purple-50/80 text-purple-800 border-purple-200/60',
    Location: 'bg-amber-50/80 text-amber-800 border-amber-200/60',
    Menu: 'bg-rose-50/80 text-rose-800 border-rose-200/60',
    Booking: 'bg-wb-green/10 text-wb-dark border-wb-green/25',
    Other: 'bg-stone-50 text-stone-700 border-stone-200',
  }
  const Icon = categoryIcons[category] || Tag
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${colors[category] || colors.Other}`}>
      <Icon className="w-3 h-3" strokeWidth={1.5} />
      {category}
    </span>
  )
}

const AiGeneratedBadge = () => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-wb-green/10 text-wb-dark border border-wb-green/25">
    <Sparkles className="w-3 h-3" strokeWidth={1.5} />
    AI Generated
  </span>
)

function ToggleSwitch({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-green/40 ${
        active ? 'bg-wb-green' : 'bg-stone-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function RuleCard({
  rule,
  onEdit,
  onToggle,
  onDelete,
}: {
  rule: BotRule
  onEdit: (rule: BotRule) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="group bg-white/90 backdrop-blur-sm border border-wb-line/80 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-wb-green/15 transition-all duration-300">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={rule.category} />
            {rule.aiGenerated && <AiGeneratedBadge />}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-wb-soft hidden sm:inline">{rule.active ? 'Active' : 'Paused'}</span>
              <ToggleSwitch active={rule.active} onChange={() => onToggle(rule.id)} />
            </div>
            <button
              onClick={() => onEdit(rule)}
              className="p-2 rounded-lg text-wb-soft hover:text-wb-ink hover:bg-wb-bg border border-transparent hover:border-wb-line transition-all duration-200"
              aria-label="Edit rule"
            >
              <Pencil className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => onDelete(rule.id)}
              className="p-2 rounded-lg text-wb-soft hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-200"
              aria-label="Delete rule"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-wb-soft font-semibold mb-2">Triggers</p>
            <div className="flex flex-wrap gap-1.5">
              {rule.triggers.map((trigger) => (
                <span
                  key={trigger}
                  className="px-2.5 py-1 bg-wb-bg/80 border border-wb-line/70 text-wb-ink text-xs rounded-md font-mono"
                >
                  {trigger}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-wb-soft font-semibold mb-2">Reply</p>
            <p className="text-wb-ink text-sm leading-relaxed bg-wb-bg/60 p-4 rounded-xl border border-wb-line/50">
              {rule.reply}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const PRO_TIPS = [
  {
    icon: MessageCircle,
    text: 'Use Hinglish keywords (kitna, time, kahan) — customers rarely type perfect English on WhatsApp.',
  },
  {
    icon: Clock,
    text: 'Keep replies under 3–4 lines. Long messages get ignored. Ask them to call if they need more.',
  },
  {
    icon: CheckCircle2,
    text: 'End booking replies with a clear question like "Which time suits you?" to keep conversations moving.',
  },
  {
    icon: Sparkles,
    text: 'Updated your profile? Hit "Regenerate Bot Rules" on Business Profile to sync your AI rules.',
  },
]

export default function BotRulesPage() {
  const [rules, setRules] = useState<BotRule[]>([])
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [testMessage, setTestMessage] = useState('')
  const [testResult, setTestResult] = useState<{ matched: boolean; rule?: BotRule } | null>(null)

  const [formData, setFormData] = useState({
    triggers: '',
    reply: '',
    category: 'Price',
  })

  useEffect(() => {
    const userStr = localStorage.getItem('wb_user')
    const userId = userStr ? JSON.parse(userStr).email : null
    
    if (userId) {
      fetch(`/api/rules?userId=${encodeURIComponent(userId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.rules && data.rules.length > 0) {
            setRules(data.rules)
            localStorage.setItem('wb_bot_rules', JSON.stringify(data.rules))
          } else {
            setRules(loadBotRules())
          }
        })
        .catch(() => {
          setRules(loadBotRules())
        })
    } else {
      setRules(loadBotRules())
    }

    if (localStorage.getItem('wb_just_onboarded') === 'true') {
      setShowWelcomeBanner(true)
      localStorage.removeItem('wb_just_onboarded')
    }
  }, [])

  const persistRules = async (newRules: BotRule[]) => {
    setRules(newRules)
    setSyncError(null)
    const result = await saveBotRules(newRules)
    if (!result.success) {
      setSyncError(`Sync failed: ${result.error}. Changes saved locally.`)
    }
  }

  const aiRules = rules.filter((r) => r.aiGenerated)
  const customRules = rules.filter((r) => !r.aiGenerated)
  const atRuleLimit = rules.length >= FREE_PLAN_LIMITS.rules

  const handleOpenAddForm = () => {
    if (atRuleLimit) {
      setLimitReached(true)
      return
    }
    setEditingRuleId(null)
    setFormData({ triggers: '', reply: '', category: 'Price' })
    setIsFormOpen(true)
  }

  const handleOpenEditForm = (rule: BotRule) => {
    setEditingRuleId(rule.id)
    setFormData({
      triggers: rule.triggers.join(', '),
      reply: rule.reply,
      category: rule.category,
    })
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingRuleId(null)
  }

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault()

    const triggersArray = formData.triggers
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)

    if (triggersArray.length === 0 || !formData.reply) return

    if (editingRuleId) {
      persistRules(
        rules.map((rule) =>
          rule.id === editingRuleId
            ? { ...rule, ...formData, triggers: triggersArray }
            : rule
        )
      )
    } else {
      const newRule: BotRule = {
        id: Date.now().toString(),
        triggers: triggersArray,
        reply: formData.reply,
        category: formData.category,
        active: true,
        aiGenerated: false,
      }
      persistRules([...rules, newRule])
    }

    handleCloseForm()
  }

  const toggleRuleStatus = (id: string) => {
    persistRules(rules.map((rule) => (rule.id === id ? { ...rule, active: !rule.active } : rule)))
  }

  const deleteRule = (id: string) => {
    persistRules(rules.filter((rule) => rule.id !== id))
    setDeleteConfirmId(null)
  }

  const handleTestMessage = () => {
    if (!testMessage.trim()) return
    const lower = testMessage.toLowerCase()
    const matched = rules.find(r => r.active && r.triggers.some(t => lower.includes(t.toLowerCase())))
    setTestResult(matched ? { matched: true, rule: matched } : { matched: false })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-serif text-lg text-wb-ink mb-2">Delete this rule?</h3>
            <p className="text-sm text-wb-soft mb-5">This can't be undone. The bot will stop responding to messages that match this rule.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-wb-soft hover:text-wb-ink border border-wb-line rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteRule(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Delete Rule
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wb-soft mb-2">Automation</p>
          <h1 className="font-serif text-3xl text-wb-ink tracking-tight">Bot Rules</h1>
          <p className="text-wb-soft mt-2">Manage how your AI replies to specific customer questions.</p>
        </div>
        {!isFormOpen && rules.length > 0 && (
          <button
            onClick={handleOpenAddForm}
            disabled={atRuleLimit}
            className="inline-flex items-center gap-2 bg-wb-green hover:bg-wb-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-wb-green/15 shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            {atRuleLimit ? 'Rule Limit Reached' : 'Add Custom Rule'}
          </button>
        )}
      </div>

      {/* Sync error */}
      {syncError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex items-center justify-between">
          <span>{syncError}</span>
          <button onClick={() => setSyncError(null)} className="text-amber-600 hover:text-amber-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rule limit warning */}
      {limitReached && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm mb-1">Free plan limit: maximum {FREE_PLAN_LIMITS.rules} bot rules</p>
            <p className="text-xs text-amber-700">
              You&apos;ve reached the free plan limit. Upgrade to Pro for unlimited rules — coming soon!
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="shrink-0 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            View Plans
          </Link>
        </div>
      )}

      {/* Rule usage indicator */}
      {!isFormOpen && rules.length > 0 && !limitReached && (
        <div className="flex items-center gap-3 text-xs text-wb-soft">
          <div className="flex-1 h-1.5 bg-wb-line/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                atRuleLimit ? 'bg-amber-500' : 'bg-wb-green'
              }`}
              style={{ width: `${Math.min((rules.length / FREE_PLAN_LIMITS.rules) * 100, 100)}%` }}
            />
          </div>
          <span className="font-mono tabular-nums">
            {rules.length} / {FREE_PLAN_LIMITS.rules} rules
          </span>
        </div>
      )}

      {showWelcomeBanner && aiRules.length > 0 && (
        <div className="animate-slide-down bg-gradient-to-r from-wb-green/10 via-wb-green/5 to-transparent border border-wb-green/25 rounded-2xl p-5 md:p-6 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-wb-green/15 border border-wb-green/25 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-wb-dark" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-serif text-lg text-wb-ink">Your AI bot is ready!</h2>
            <p className="text-sm text-wb-soft mt-1 leading-relaxed">
              {aiRules.length} rules generated from your profile. They&apos;re active and ready to reply on WhatsApp.
            </p>
          </div>
        </div>
      )}

      {!showWelcomeBanner && aiRules.length > 0 && (
        <div className="bg-white/70 border border-wb-line/80 rounded-xl px-5 py-4 text-sm text-wb-ink flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-wb-dark shrink-0" strokeWidth={1.5} />
          Your AI bot is ready! <span className="font-semibold">{aiRules.length} rules</span> generated from your profile.
        </div>
      )}

      {isFormOpen && (
        <div className="animate-slide-down bg-white/95 backdrop-blur-sm border border-wb-line rounded-2xl p-6 md:p-8 shadow-lg shadow-stone-200/40">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl text-wb-ink">
              {editingRuleId ? 'Edit Rule' : 'Create Custom Rule'}
            </h2>
            <button
              onClick={handleCloseForm}
              className="p-2 rounded-lg text-wb-soft hover:text-wb-ink hover:bg-wb-bg transition-colors"
              aria-label="Close form"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          <form onSubmit={handleSaveRule} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-wb-ink mb-1.5">
                Trigger Keywords <span className="text-wb-soft font-normal">(comma separated)</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={formData.triggers}
                onChange={(e) => setFormData({ ...formData, triggers: e.target.value })}
                className="w-full px-4 py-2.5 border border-wb-line rounded-xl focus:ring-2 focus:ring-wb-green/30 focus:border-wb-green/40 outline-none transition-shadow"
                placeholder="price, cost, kitna, how much"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-wb-ink mb-1.5">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-wb-line rounded-xl focus:ring-2 focus:ring-wb-green/30 focus:border-wb-green/40 outline-none bg-white transition-shadow"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-wb-ink mb-1.5">Reply Message</label>
              <textarea
                required
                rows={4}
                value={formData.reply}
                onChange={(e) => setFormData({ ...formData, reply: e.target.value })}
                className="w-full px-4 py-2.5 border border-wb-line rounded-xl focus:ring-2 focus:ring-wb-green/30 focus:border-wb-green/40 outline-none resize-none transition-shadow"
                placeholder="Namaste! Our facial starts at ₹699. Would you like to book an appointment?"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-5 py-2.5 border border-wb-line text-wb-ink font-medium rounded-xl hover:bg-wb-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-wb-green hover:bg-wb-dark text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Save Rule
              </button>
            </div>
          </form>
        </div>
      )}

      {!isFormOpen && rules.length === 0 && (
        <div className="bg-white/80 backdrop-blur-sm border border-wb-line rounded-2xl p-8 md:p-16 text-center shadow-sm">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 rounded-2xl bg-wb-bg border border-wb-line rotate-6" />
            <div className="absolute inset-0 rounded-2xl bg-white border border-wb-line shadow-sm flex items-center justify-center -rotate-3">
              <Bot className="w-9 h-9 text-wb-soft" strokeWidth={1.5} />
            </div>
          </div>
          <h3 className="font-serif text-2xl text-wb-ink mb-3">No Rules Yet</h3>
          <p className="text-wb-soft max-w-md mx-auto mb-8 leading-relaxed">
            Complete AI Onboarding to auto-generate rules, or add your first custom rule manually.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard/onboarding"
              className="inline-flex items-center gap-2 bg-wb-green hover:bg-wb-dark text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Start AI Onboarding
            </Link>
            <button
              onClick={handleOpenAddForm}
              className="inline-flex items-center gap-2 text-wb-soft hover:text-wb-ink font-medium px-5 py-3 rounded-xl border border-wb-line hover:border-wb-green/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Custom Rule
            </button>
          </div>
        </div>
      )}

      {!isFormOpen && aiRules.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-[11px] font-semibold text-wb-soft uppercase tracking-[0.2em]">AI Generated Rules</h2>
          {aiRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={handleOpenEditForm}
              onToggle={toggleRuleStatus}
              onDelete={setDeleteConfirmId}
            />
          ))}

          <button
            onClick={handleOpenAddForm}
            className="w-full py-3.5 border border-dashed border-wb-line hover:border-wb-green/35 hover:bg-wb-green/5 rounded-xl text-wb-soft hover:text-wb-dark font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Add Custom Rule
          </button>
        </div>
      )}

      {!isFormOpen && customRules.length > 0 && (
        <div className="space-y-4">
          {aiRules.length > 0 && (
            <h2 className="text-[11px] font-semibold text-wb-soft uppercase tracking-[0.2em]">Custom Rules</h2>
          )}
          {customRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={handleOpenEditForm}
              onToggle={toggleRuleStatus}
              onDelete={setDeleteConfirmId}
            />
          ))}
        </div>
      )}

      {/* Test message section */}
      {!isFormOpen && rules.length > 0 && (
        <div className="section-card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-wb-dark" strokeWidth={1.5} />
            <h3 className="font-serif text-lg text-wb-ink">Test Your Rules</h3>
          </div>
          <p className="text-sm text-wb-soft mb-4">
            Type a message like a customer would send and see which rule matches. This helps you verify your triggers work correctly.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => { setTestMessage(e.target.value); setTestResult(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleTestMessage()}
              placeholder='Try: "kitna hai" or "kahan hai" or "time kya hai"'
              className="flex-1 px-4 py-2.5 border border-wb-line rounded-xl focus:ring-2 focus:ring-wb-green/30 focus:border-wb-green/40 outline-none text-sm"
            />
            <button
              onClick={handleTestMessage}
              disabled={!testMessage.trim()}
              className="px-5 py-2.5 bg-wb-bg border border-wb-line rounded-xl text-sm font-medium hover:bg-wb-line/50 disabled:opacity-40 transition-colors"
            >
              Test
            </button>
          </div>
          {testResult && (
            <div className={`mt-3 p-3 rounded-xl text-sm ${testResult.matched ? 'bg-wb-green/10 border border-wb-green/20 text-wb-dark' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
              {testResult.matched ? (
                <div>
                  <span className="font-semibold">Matched:</span> "{testResult.rule!.triggers.join(', ')}" → <span className="font-medium">{testResult.rule!.category}</span> rule
                  <p className="text-xs text-wb-soft mt-1 truncate">Reply: {testResult.rule!.reply}</p>
                </div>
              ) : (
                <span>No active rule matches this message. The AI fallback would handle it.</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pro Tips */}
      {!isFormOpen && rules.length > 0 && (
        <div className="border border-wb-line/80 bg-white/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 mt-4">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-5 h-5 text-wb-dark" strokeWidth={1.5} />
            <h3 className="font-serif text-lg text-wb-ink">Pro Tips for Better Replies</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {PRO_TIPS.map((tip, i) => {
              const Icon = tip.icon
              return (
                <div key={i} className="flex gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-wb-bg border border-wb-line/70 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-wb-soft" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-wb-soft leading-relaxed pt-0.5">{tip.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
