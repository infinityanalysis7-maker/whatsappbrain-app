import { BusinessProfile } from '@/lib/supabase'

export interface BotRule {
  id: string
  triggers: string[]
  reply: string
  category: string
  active: boolean
  aiGenerated?: boolean
}

export function generateBotRulesFromProfile(profile: {
  services: string[]
  prices: Record<string, string>
  hours: string
  location: string
}): BotRule[] {
  const priceList = Object.entries(profile.prices)
    .map(([service, price]) => `${service}: ₹${price}`)
    .join(', ')

  const servicesList = profile.services.join(', ')
  const ts = Date.now()

  return [
    {
      id: `ai-${ts}-price`,
      category: 'Price',
      triggers: ['price', 'kitna', 'rate', 'cost', 'paisa', 'charges'],
      reply: `Namaste! Here are our prices: ${priceList || 'Please ask for specific service pricing'}.`,
      active: true,
      aiGenerated: true,
    },
    {
      id: `ai-${ts}-hours`,
      category: 'Hours',
      triggers: ['time', 'open', 'hours', 'kab khule ho', 'timing', 'time table'],
      reply: `We are open ${profile.hours}.`,
      active: true,
      aiGenerated: true,
    },
    {
      id: `ai-${ts}-location`,
      category: 'Location',
      triggers: ['where', 'address', 'location', 'kahan hai', 'pata', 'direction'],
      reply: `You can find us at ${profile.location}.`,
      active: true,
      aiGenerated: true,
    },
    {
      id: `ai-${ts}-services`,
      category: 'Menu',
      triggers: ['services', 'kya kya hai', 'what do you offer', 'menu', 'list'],
      reply: `We offer: ${servicesList}. Let us know what you need!`,
      active: true,
      aiGenerated: true,
    },
  ]
}

export async function saveBotRules(rules: BotRule[]): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') return { success: false, error: 'Not in browser' }

  localStorage.setItem('wb_bot_rules', JSON.stringify(rules))

  const userStr = localStorage.getItem('wb_user')
  const userId = userStr ? JSON.parse(userStr).email : null
  if (!userId) return { success: false, error: 'No user found' }

  try {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, rules })
    })
    const data = await res.json()
    if (!data.success) {
      console.error('Failed to sync rules to server:', data.error)
      return { success: false, error: data.error || 'Server sync failed' }
    }
    return { success: true }
  } catch (err) {
    console.error('Failed to sync rules to server:', err)
    return { success: false, error: 'Network error' }
  }
}

export function loadBotRules(): BotRule[] {
  if (typeof window !== 'undefined') {
    try {
      return JSON.parse(localStorage.getItem('wb_bot_rules') || '[]')
    } catch {
      return []
    }
  }
  return []
}

/** Replace AI-generated rules, keep user-created custom rules. */
export function mergeGeneratedRules(newGenerated: BotRule[]): BotRule[] {
  const existing = loadBotRules()
  const custom = existing.filter((r) => !r.aiGenerated)
  return [...newGenerated, ...custom]
}

/** Fresh onboarding — only the 4 generated rules. */
export async function setOnboardingRules(rules: BotRule[]): Promise<{ success: boolean; error?: string }> {
  const result = await saveBotRules(rules)
  if (typeof window !== 'undefined') {
    localStorage.setItem('wb_just_onboarded', 'true')
  }
  return result
}

export function profileToRuleInput(profile: BusinessProfile) {
  return {
    services: profile.services,
    prices: profile.prices,
    hours: profile.hours,
    location: profile.location,
  }
}
