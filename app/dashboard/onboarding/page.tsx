'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bot,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Store,
  MapPin,
  IndianRupee,
  Clock,
  Brain,
  TrendingUp,
} from 'lucide-react'
import { BusinessProfile, saveProfile } from '@/lib/supabase'
import { generateBotRulesFromProfile, setOnboardingRules } from '@/lib/bot-rules'

interface MarketRate {
  service: string
  min: number
  max: number
  suggested: number
}

const STEPS = [
  { id: 'business', label: 'Business & Services' },
  { id: 'location', label: 'Location' },
  { id: 'prices', label: 'Prices' },
  { id: 'hours', label: 'Hours' },
  { id: 'launch', label: 'Launch' },
]

function AiBubble({ children, icon: Icon = Bot }: { children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="mb-6 p-5 bg-gradient-to-br from-wb-green/5 to-wb-bg rounded-xl border border-wb-green/20 shadow-sm transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-wb-green to-wb-dark rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-wb-green/30">
          <Icon size={18} className="text-white" strokeWidth={2} />
        </div>
        <div className="text-wb-ink pt-1 flex-1 leading-relaxed text-[15px]">{children}</div>
      </div>
    </div>
  )
}

function ThinkingState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-wb-green/10 to-wb-bg border border-wb-green/30 rounded-xl mb-4 shadow-sm">
      <div className="relative">
        <Loader2 className="w-5 h-5 text-wb-green animate-spin" strokeWidth={2} />
        <div className="absolute inset-0 w-5 h-5 border-2 border-wb-green/20 rounded-full" />
      </div>
      <p className="text-sm text-wb-ink font-medium">{message}</p>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const [businessType, setBusinessType] = useState('')
  const [suggestedServices, setSuggestedServices] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [customService, setCustomService] = useState('')

  const [location, setLocation] = useState('')
  const [marketRates, setMarketRates] = useState<MarketRate[]>([])
  const [prices, setPrices] = useState<Record<string, string>>({})

  const [hours, setHours] = useState('')

  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [aiMessageType, setAiMessageType] = useState<'success' | 'warning' | 'error'>('success')
  const [aiConnected, setAiConnected] = useState<boolean | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [profileSummary, setProfileSummary] = useState<string | null>(null)

  // Auto-suggest debounce refs
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFetchRef = useRef<string>('')

  useEffect(() => {
    fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ai-status' }),
    })
      .then((r) => r.json())
      .then((d) => setAiConnected(d.configured === true))
      .catch(() => setAiConnected(false))
  }, [])

  // Generate profile summary when all data is available
  useEffect(() => {
    if (businessType && selectedServices.length > 0 && location && hours) {
      const summary = generateProfileSummary()
      setProfileSummary(summary)
    }
  }, [businessType, selectedServices, location, hours])

  const generateProfileSummary = () => {
    const servicesText = selectedServices.slice(0, 3).join(', ')
    const moreCount = selectedServices.length - 3
    const servicesDisplay = moreCount > 0 ? `${servicesText} +${moreCount} more` : servicesText
    
    return `${businessType} business in ${location} offering ${servicesDisplay}. Open ${hours}.`
  }

  const resetServiceSuggestions = useCallback(() => {
    setSuggestedServices([])
    setSelectedServices([])
    setAiMessage(null)
  }, [])

  const fetchServices = useCallback(async (type: string) => {
    const trimmed = type.trim()
    if (!trimmed || trimmed.length < 2) return
    if (lastFetchRef.current === trimmed) return
    lastFetchRef.current = trimmed

    setAiLoading('services')
    setAiMessage(null)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest-services', businessType: trimmed }),
      })
      const data = await res.json()

      if (data.message) {
        setAiMessage(data.message)
        setAiMessageType(
          data.source === 'ai' ? 'success' : data.needsApiKey ? 'warning' : data.source === 'none' ? 'warning' : 'warning'
        )
      }

      if (data.services?.length) {
        setSuggestedServices(data.services)
        setSelectedServices(data.services.slice(0, Math.min(3, data.services.length)))
      } else if (data.source === 'none') {
        resetServiceSuggestions()
      }
    } catch {
      setAiMessage('Network error — check your connection and try again, or add services manually.')
      setAiMessageType('error')
    } finally {
      setAiLoading(null)
    }
  }, [])

  const handleBusinessTypeChange = (value: string) => {
    setBusinessType(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length > 2) {
      debounceRef.current = setTimeout(() => {
        fetchServices(value)
      }, 600)
    } else {
      resetServiceSuggestions()
    }
  }

  const fetchMarketRates = async () => {
    if (!location.trim() || selectedServices.length === 0) return
    setAiLoading('rates')
    setAiMessage(null)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'market-rates',
          services: selectedServices,
          location: location.trim(),
          businessType: businessType.trim(),
        }),
      })
      const data = await res.json()

      if (data.message) {
        setAiMessage(data.message)
        setAiMessageType(data.source === 'ai' ? 'success' : 'warning')
      }

      if (data.rates?.length) {
        setMarketRates(data.rates)
        const newPrices: Record<string, string> = {}
        data.rates.forEach((r: MarketRate) => {
          newPrices[r.service] = String(r.suggested)
        })
        setPrices(newPrices)
      }
    } catch {
      setAiMessage('Could not fetch market rates. Enter prices manually on the next step.')
      setAiMessageType('error')
    } finally {
      setAiLoading(null)
    }
  }

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    )
  }

  const addCustomService = () => {
    const s = customService.trim()
    if (!s || selectedServices.includes(s)) return
    setSelectedServices((prev) => [...prev, s])
    if (!suggestedServices.includes(s)) {
      setSuggestedServices((prev) => [...prev, s])
    }
    setCustomService('')
  }

  const canProceed = () => {
    switch (step) {
      case 0:
        return businessType.trim().length > 1 && selectedServices.length > 0
      case 1:
        return location.trim().length > 2
      case 2:
        return selectedServices.every((s) => prices[s]?.trim())
      case 3:
        return hours.trim().length > 3
      default:
        return true
    }
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
      setAiMessage(null)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
      setAiMessage(null)
    }
  }

  const handleLaunch = async () => {
    setIsGenerating(true)

    const profile: BusinessProfile = {
      services: selectedServices,
      prices,
      hours,
      location,
      policies: '',
    }

    const userStr = localStorage.getItem('wb_user')
    const userId = userStr ? JSON.parse(userStr).email : 'guest'
    await saveProfile(userId, profile)

    const rules = generateBotRulesFromProfile(profile)
    setOnboardingRules(rules)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    router.push('/dashboard/bot-rules')
  }

  if (isGenerating) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-3xl border-4 border-wb-green/20" />
          <div className="absolute inset-0 rounded-3xl border-4 border-wb-green border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-wb-green to-wb-dark rounded-2xl flex items-center justify-center shadow-xl">
              <Bot className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-wb-ink mb-3">Generating your AI bot...</h2>
        <p className="text-wb-soft mt-3 text-lg">Creating 4 smart auto-reply rules from your business profile</p>
        <div className="flex justify-center gap-3 mt-8">
          {['Price', 'Hours', 'Location', 'Services'].map((label, i) => (
            <span
              key={label}
              className="text-sm px-4 py-2 bg-gradient-to-r from-wb-green/20 to-wb-bg text-wb-dark border border-wb-green/30 rounded-xl font-semibold shadow-sm animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="mb-8">
        <div className="flex justify-between mb-3 gap-1">
          {STEPS.map((s, idx) => (
            <div
              key={s.id}
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                idx < step ? 'bg-wb-green' : idx === step ? 'bg-gradient-to-r from-wb-green to-wb-dark' : 'bg-wb-line'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step < STEPS.length ? 'bg-wb-green text-white' : 'bg-wb-green/20 text-wb-dark'
          }`}>
            {step + 1}
          </div>
          <p className="text-sm text-wb-soft font-medium">
            {STEPS[step].label}
          </p>
        </div>
      </div>

      <div className="bg-white border border-wb-line rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300">

        {step === 0 && (
          <div className="transition-all duration-300">
            <AiBubble icon={Store}>
              Tell me about your business. I'll suggest services, prices, and auto-reply rules based on what you type. Start with your business type — for example "salon", "clinic", "restaurant", or "repair shop".
            </AiBubble>

            <input
              autoFocus
              type="text"
              value={businessType}
              onChange={(e) => handleBusinessTypeChange(e.target.value)}
              placeholder="e.g., construction, salon, clinic, mobile repair"
              className="w-full px-4 py-3 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none mb-3"
            />

            {aiConnected === false && (
              <div className="flex items-start gap-2.5 p-3 mb-3 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>
                  AI mode off — add <code className="bg-amber-100/80 px-1 rounded">GROQ_API_KEY</code> to{' '}
                  <code className="bg-amber-100/80 px-1 rounded">whatsappbrain-app/.env.local</code> for smart
                  suggestions on any business. Free at console.groq.com
                </span>
              </div>
            )}

            {aiConnected === true && (
              <div className="flex items-center gap-2 mb-3 text-xs text-wb-dark">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-wb-green opacity-40 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-wb-green" />
                </span>
                AI connected — suggestions appear automatically as you type
              </div>
            )}

            {businessType.trim().length > 1 && !suggestedServices.length && aiLoading !== 'services' && aiConnected !== false && (
              <p className="text-xs text-wb-soft mb-3 italic">
                Type at least 3 characters and wait a moment for AI suggestions...
              </p>
            )}

            {aiLoading === 'services' && (
              <ThinkingState message="AI is thinking about popular services in India..." />
            )}

            {aiMessage && step === 0 && (
              <p
                className={`text-sm rounded-lg px-4 py-2.5 mb-4 border ${
                  aiMessageType === 'success'
                    ? 'text-wb-dark bg-wb-green/10 border-wb-green/20'
                    : aiMessageType === 'warning'
                      ? 'text-amber-900 bg-amber-50 border-amber-200/80'
                      : 'text-red-800 bg-red-50 border-red-200'
                }`}
              >
                {aiMessage}
              </p>
            )}

            {suggestedServices.length > 0 && (
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-wb-green" />
                  <p className="text-sm font-semibold text-wb-ink">Select your services:</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedServices.map((service) => (
                    <label
                      key={service}
                      onClick={() => toggleService(service)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedServices.includes(service)
                          ? 'border-wb-green bg-gradient-to-r from-wb-green/10 to-wb-bg shadow-sm'
                          : 'border-wb-line hover:border-wb-green/40 hover:bg-wb-green/5'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                        selectedServices.includes(service)
                          ? 'bg-wb-green text-white'
                          : 'border-2 border-wb-line'
                      }`}>
                        {selectedServices.includes(service) && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                      </div>
                      <span className="text-sm text-wb-ink font-medium">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomService()}
                placeholder="Add a custom service"
                className="flex-1 px-4 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green outline-none text-sm"
              />
              <button
                onClick={addCustomService}
                disabled={!customService.trim()}
                className="px-4 py-2.5 bg-wb-bg border border-wb-line rounded-lg text-sm font-medium hover:bg-wb-line/50 disabled:opacity-40 transition"
              >
                Add
              </button>
            </div>

            {selectedServices.length > 0 && (
              <p className="text-xs text-wb-soft mt-3">
                {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="transition-all duration-300">
            <AiBubble icon={MapPin}>
              Where is your {businessType} located? I'll look up market rates for {selectedServices.slice(0, 3).join(', ')}{selectedServices.length > 3 ? '...' : ''} in your area to suggest competitive prices.
            </AiBubble>

            <input
              autoFocus
              type="text"
              value={location}
              onChange={(e) => {
                const val = e.target.value
                setLocation(val)
                if (debounceRef.current) clearTimeout(debounceRef.current)
                if (val.trim().length > 3 && selectedServices.length > 0) {
                  debounceRef.current = setTimeout(() => {
                    fetchMarketRates()
                  }, 800)
                }
              }}
              placeholder="e.g., 123 MG Road, Indore"
              className="w-full px-4 py-3 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none mb-3"
            />

            {location.trim().length > 3 && !marketRates.length && aiLoading !== 'rates' && aiConnected !== false && (
              <p className="text-xs text-wb-soft mb-3 italic">
                AI is analyzing local market rates... type your full address for best results.
              </p>
            )}

            {aiLoading === 'rates' && (
              <ThinkingState message={`AI is researching prices in ${location.split(',').pop()?.trim() || location}...`} />
            )}

            {aiMessage && step === 1 && (
              <p
                className={`text-sm rounded-lg px-4 py-2.5 mb-4 border ${
                  aiMessageType === 'success'
                    ? 'text-wb-dark bg-wb-green/10 border-wb-green/20'
                    : aiMessageType === 'warning'
                      ? 'text-amber-900 bg-amber-50 border-amber-200/80'
                      : 'text-red-800 bg-red-50 border-red-200'
                }`}
              >
                {aiMessage}
              </p>
            )}

            {marketRates.length > 0 && (
              <div className="rounded-xl border border-wb-line overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-wb-green/10 to-wb-bg px-4 py-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-wb-green" />
                  <span className="text-xs font-semibold text-wb-dark uppercase tracking-wide">Market rate preview</span>
                </div>
                {marketRates.map((rate) => (
                  <div
                    key={rate.service}
                    className="flex items-center justify-between px-4 py-3.5 border-t border-wb-line text-sm hover:bg-wb-green/5 transition-colors"
                  >
                    <span className="text-wb-ink font-medium">{rate.service}</span>
                    <span className="text-wb-soft">
                      ₹{rate.min} – ₹{rate.max}{' '}
                      <span className="text-wb-dark font-bold bg-wb-green/10 px-2 py-0.5 rounded-full">(₹{rate.suggested})</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="transition-all duration-300">
            <AiBubble icon={IndianRupee}>
              {marketRates.length
                ? "I've filled in prices based on local market rates. Adjust any that don't match your actual prices — your bot will use these exact amounts when customers ask."
                : 'Set your prices for each service. The bot will reply with these exact amounts when customers ask "kitna hai?" or "how much?".'}
            </AiBubble>

            <div className="space-y-3">
              {selectedServices.map((service) => {
                const rate = marketRates.find((r) => r.service === service)
                return (
                  <div key={service} className="flex items-center gap-3">
                    <label className="flex-1 text-sm text-wb-ink font-medium truncate">{service}</label>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-wb-soft text-sm">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={prices[service] || ''}
                        onChange={(e) =>
                          setPrices((prev) => ({ ...prev, [service]: e.target.value }))
                        }
                        placeholder={rate ? String(rate.suggested) : '0'}
                        className="w-full pl-7 pr-3 py-2.5 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green outline-none text-sm"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="transition-all duration-300">
            <AiBubble icon={Clock}>
              Almost done! What are your operating hours? The bot will tell customers when you're open and automatically send an after-hours message when you're closed.
            </AiBubble>

            <input
              autoFocus
              type="text"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g., Mon-Sat 9 AM to 8 PM, Sunday closed"
              className="w-full px-4 py-3 border border-wb-line rounded-lg focus:ring-2 focus:ring-wb-green focus:border-transparent outline-none"
            />

            <div className="flex flex-wrap gap-2 mt-3">
              {['Mon-Sat 9 AM – 8 PM', 'Mon-Sun 10 AM – 10 PM', 'Tue-Sun 11 AM – 9 PM'].map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => setHours(preset)}
                    className="text-xs px-3 py-1.5 bg-wb-bg border border-wb-line rounded-full hover:border-wb-green/40 transition"
                  >
                    {preset}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="transition-all duration-300">
            <AiBubble icon={Rocket}>
              Everything looks good. I'll create 4 auto-reply rules from your profile — one each for prices, hours, location, and services. Your bot will start replying to customers the moment someone messages your WhatsApp.
            </AiBubble>

            <div className="space-y-3 mb-6">
              <div className="p-4 bg-gradient-to-r from-wb-bg to-white rounded-xl border border-wb-line shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Store className="w-4 h-4 text-wb-green" />
                  <p className="text-xs font-semibold text-wb-dark uppercase tracking-wide">Services</p>
                </div>
                <p className="text-sm text-wb-ink font-medium">{selectedServices.join(', ')}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-wb-bg to-white rounded-xl border border-wb-line shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-wb-green" />
                  <p className="text-xs font-semibold text-wb-dark uppercase tracking-wide">Location</p>
                </div>
                <p className="text-sm text-wb-ink font-medium">{location}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-wb-bg to-white rounded-xl border border-wb-line shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <IndianRupee className="w-4 h-4 text-wb-green" />
                  <p className="text-xs font-semibold text-wb-dark uppercase tracking-wide">Prices</p>
                </div>
                <p className="text-sm text-wb-ink font-medium">
                  {Object.entries(prices).map(([k, v]) => `${k}: ₹${v}`).join(' · ')}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-wb-bg to-white rounded-xl border border-wb-line shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-wb-green" />
                  <p className="text-xs font-semibold text-wb-dark uppercase tracking-wide">Hours</p>
                </div>
                <p className="text-sm text-wb-ink font-medium">{hours}</p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-wb-green/10 to-wb-bg border border-wb-green/30 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-wb-green to-wb-dark flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-lg text-wb-ink font-bold">Your bot will be ready in seconds!</p>
                  <p className="text-sm text-wb-soft">4 smart rules auto-generated from your profile</p>
                </div>
              </div>
              
              {profileSummary && (
                <div className="mt-4 p-4 bg-white/80 rounded-xl border border-wb-green/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-wb-green" />
                    <span className="text-xs font-semibold text-wb-dark uppercase tracking-wide">AI Profile Summary</span>
                  </div>
                  <p className="text-sm text-wb-ink">{profileSummary}</p>
                </div>
              )}
              
              <div className="flex justify-center gap-2 mt-4">
                {['Price', 'Hours', 'Location', 'Services'].map((label, i) => (
                  <span
                    key={label}
                    className="text-xs px-3 py-1.5 bg-white/80 text-wb-dark border border-wb-green/20 rounded-full font-medium shadow-sm"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-6 py-3.5 border-2 border-wb-line rounded-xl text-wb-soft hover:bg-wb-bg hover:border-wb-green/30 transition-all duration-300 font-semibold"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
              Back
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-wb-green to-wb-dark hover:from-wb-dark hover:to-wb-green disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-wb-green/20"
            >
              Next
              <ChevronRight className="w-5 h-5" strokeWidth={2} />
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              className="flex-1 bg-gradient-to-r from-wb-green to-wb-dark hover:from-wb-dark hover:to-wb-green text-white font-bold py-4 rounded-xl transition-all duration-300 inline-flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:shadow-wb-green/30"
            >
              <Rocket className="w-5 h-5" strokeWidth={2} />
              Launch My Bot
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
