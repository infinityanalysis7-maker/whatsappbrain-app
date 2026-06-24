'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  RefreshCw,
  Store,
  MapPin,
  IndianRupee,
  Clock,
  FileText,
  Save,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Bot,
  X,
} from 'lucide-react'
import { BusinessProfile, getProfile, saveProfile } from '@/lib/supabase'
import { generateBotRulesFromProfile, mergeGeneratedRules, saveBotRules } from '@/lib/bot-rules'

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-wb-bg border border-wb-line/60 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-wb-soft" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-wb-ink">{title}</h3>
        <p className="text-xs text-wb-soft mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenerateMessage, setRegenerateMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [servicesStr, setServicesStr] = useState('')
  const [pricesStr, setPricesStr] = useState('')
  const [hours, setHours] = useState('')
  const [location, setLocation] = useState('')
  const [policies, setPolicies] = useState('')

  useEffect(() => {
    const userStr = localStorage.getItem('wb_user')
    const userId = userStr ? JSON.parse(userStr).email : 'guest'
    
    getProfile(userId).then(data => {
      if (data) {
        setProfile(data)
        setServicesStr(data.services.join(', '))
        setPricesStr(Object.entries(data.prices).map(([k,v]) => `${k}: ${v}`).join(', '))
        setHours(data.hours)
        setLocation(data.location)
        setPolicies(data.policies)
      }
      setIsLoading(false)
    })
  }, [])

  const buildProfileFromForm = (): BusinessProfile => ({
    services: servicesStr.split(',').map(s => s.trim()).filter(Boolean),
    prices: pricesStr.split(',').reduce((acc, pair) => {
      const [service, price] = pair.split(':').map(s => s.trim())
      if (service && price) acc[service] = price
      return acc
    }, {} as Record<string, string>),
    hours,
    location,
    policies,
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    
    const userStr = localStorage.getItem('wb_user')
    const userId = userStr ? JSON.parse(userStr).email : 'guest'

    const updatedProfile = buildProfileFromForm()
    const result = await saveProfile(userId, updatedProfile)
    if (result.success) {
      setProfile(updatedProfile)
    } else {
      setSaveError(`Failed to save: ${result.error}. Changes saved locally.`)
    }
    setIsSaving(false)
  }

  const handleRegenerateRules = async () => {
    setIsRegenerating(true)
    setRegenerateMessage(null)

    const profileData = buildProfileFromForm()
    const newRules = generateBotRulesFromProfile(profileData)
    const merged = mergeGeneratedRules(newRules)
    saveBotRules(merged)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsRegenerating(false)
    setRegenerateMessage('Bot rules updated from your profile.')
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Data</p>
          <h1 className="font-serif text-3xl text-wb-ink tracking-tight">Business Profile</h1>
        </div>
        <div className="bg-white border border-wb-line/60 rounded-xl p-12 text-center">
          <div className="w-5 h-5 border-2 border-wb-green/30 border-t-wb-green rounded-full animate-spin mx-auto" />
          <p className="text-sm text-wb-soft mt-4">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (isRegenerating) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Data</p>
          <h1 className="font-serif text-3xl text-wb-ink tracking-tight">Business Profile</h1>
        </div>
        <div className="bg-white border border-wb-line/60 rounded-xl p-12 text-center">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-wb-green/20" />
            <div className="absolute inset-0 rounded-full border-4 border-wb-green border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot className="w-6 h-6 text-wb-dark" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="font-serif text-xl text-wb-ink mb-2">Updating your bot rules...</h2>
          <p className="text-sm text-wb-soft">Syncing prices, hours, location, and services</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Data</p>
        <h1 className="font-serif text-3xl text-wb-ink tracking-tight">Business Profile</h1>
        <p className="text-wb-soft mt-2 leading-relaxed max-w-xl">
          This is the single source of truth your AI bot uses to reply to customers. Keep it accurate and up to date.
        </p>
      </div>

      {/* No profile warning */}
      {!profile && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">No profile found</p>
            <p className="text-xs text-amber-700 mt-1">
              Complete{' '}
              <button onClick={() => router.push('/dashboard/onboarding')} className="font-semibold underline">
                AI Onboarding
              </button>{' '}
              for auto-generated rules, or fill out the form below manually.
            </p>
          </div>
        </div>
      )}

      {/* Save error */}
      {saveError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 mb-6">
          <span className="text-sm text-amber-800">{saveError}</span>
          <button onClick={() => setSaveError(null)} className="text-amber-600 hover:text-amber-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success message */}
      {regenerateMessage && (
        <div className="bg-wb-green/10 border border-wb-green/20 rounded-xl p-4 flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-wb-dark" strokeWidth={1.5} />
            <span className="text-sm font-medium text-wb-dark">{regenerateMessage}</span>
          </div>
          <button
            onClick={() => router.push('/dashboard/bot-rules')}
            className="text-xs font-medium text-wb-dark hover:text-wb-ink transition-colors inline-flex items-center gap-1 shrink-0"
          >
            View Bot Rules
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Profile form */}
      <form onSubmit={handleSave} className="bg-white border border-wb-line/60 rounded-xl overflow-hidden">
        
        {/* Services Section */}
        <div className="p-6 md:p-8 border-b border-wb-line/60">
          <SectionHeader
            icon={Store}
            title="Services You Offer"
            subtitle="List every service customers can ask about on WhatsApp"
          />
          <input
            type="text"
            required
            value={servicesStr}
            onChange={(e) => setServicesStr(e.target.value)}
            className="w-full px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none text-sm"
            placeholder="Haircut, Shave, Facial, Beard Trim"
          />
          <p className="text-[11px] text-wb-soft mt-2">
            Comma separated. Use the same names customers would type in a WhatsApp message.
          </p>
        </div>

        {/* Prices Section */}
        <div className="p-6 md:p-8 border-b border-wb-line/60">
          <SectionHeader
            icon={IndianRupee}
            title="Pricing"
            subtitle="Each service and its price — the bot reads these when customers ask costs"
          />
          <textarea
            required
            rows={3}
            value={pricesStr}
            onChange={(e) => setPricesStr(e.target.value)}
            className="w-full px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none resize-none font-mono text-sm"
            placeholder="Haircut: 200, Facial: 500, Shave: 50"
          />
          <p className="text-[11px] text-wb-soft mt-2">
            Format: <code className="bg-wb-bg px-1 rounded">Service Name: Price</code>, separated by commas. The bot replies with exact prices when customers ask.
          </p>
        </div>

        {/* Hours & Location */}
        <div className="p-6 md:p-8 border-b border-wb-line/60">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <SectionHeader
                icon={Clock}
                title="Operating Hours"
                subtitle="When customers can visit or call"
              />
              <input
                type="text"
                required
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none text-sm"
                placeholder="Mon-Sat 9 AM to 8 PM"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Mon-Sat 9 AM – 8 PM', 'Mon-Sun 10 AM – 10 PM', 'Tue-Sun 11 AM – 9 PM'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setHours(preset)}
                    className="text-[11px] px-2.5 py-1 bg-wb-bg border border-wb-line/60 rounded-full hover:border-wb-green/40 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SectionHeader
                icon={MapPin}
                title="Location"
                subtitle={'Your address for "where are you?" questions'}
              />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none text-sm"
                placeholder="123 Main St, Indore"
              />
              <p className="text-[11px] text-wb-soft mt-2">
                Full address with city. Customers often ask "where are you located?" on WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Policies Section */}
        <div className="p-6 md:p-8 border-b border-wb-line/60">
          <SectionHeader
            icon={FileText}
            title="Policies & Extra Info"
            subtitle="Any rules, terms, or details the bot should know"
          />
          <textarea
            rows={2}
            value={policies}
            onChange={(e) => setPolicies(e.target.value)}
            className="w-full px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none resize-none text-sm"
            placeholder="No refunds on products. Booking advance required. Free parking available."
          />
          <p className="text-[11px] text-wb-soft mt-2">
            Optional. Anything the bot should mention when customers ask about refunds, parking, bookings, etc.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 md:p-8 bg-wb-bg/30 flex flex-col sm:flex-row gap-3 justify-between">
          <button
            type="button"
            onClick={handleRegenerateRules}
            disabled={!servicesStr.trim() || !hours.trim() || !location.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-wb-green/30 text-wb-dark hover:bg-wb-green/5 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
            Regenerate Bot Rules
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-wb-green hover:bg-wb-dark disabled:bg-gray-300 text-white font-medium px-6 py-2.5 rounded-lg transition-all text-sm"
          >
            <Save className="w-4 h-4" strokeWidth={1.5} />
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Help text */}
      <div className="mt-6 p-4 bg-white border border-wb-line/60 rounded-xl">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-wb-soft mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-wb-ink mb-1">How this feeds your bot</p>
            <p className="text-xs text-wb-soft leading-relaxed">
              When a customer asks "what services do you offer?" or "how much for a haircut?", the AI reads this profile and replies with the exact information here. Make sure every service, price, and detail is accurate — this is what the bot uses to answer.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
