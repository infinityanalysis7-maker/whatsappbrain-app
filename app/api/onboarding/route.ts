import { NextResponse } from 'next/server'
import { callGroq, parseJson, isGroqConfigured } from '@/lib/groq'
import { inferServicesForBusiness, estimateMarketRates, formatBusinessLabel } from '@/lib/ai-fallback'

export interface BotRuleDraft {
  triggers: string[]
  reply: string
  category: string
}

const SERVICES_SYSTEM = `You are an expert on Indian small businesses and local services.
Given ANY business type (even unusual ones like construction, astrologer, mobile repair shop), return the 5 most common services that business offers to customers in India.
Use short, clear service names (2-4 words). Be specific to that industry — never use generic names like "Basic Service" or "Premium Service".
Respond ONLY with valid JSON: {"services": ["Service 1", "Service 2", "Service 3", "Service 4", "Service 5"]}`

const RATES_SYSTEM = `You are an expert on Indian local market pricing (INR).
Given services and a city/area in India, return realistic 2024-2026 price ranges in rupees.
Respond ONLY with valid JSON: {"rates": [{"service": "Exact service name", "min": 500, "max": 2000, "suggested": 1200}]}
Use integers only. One entry per service. suggested should be the typical mid-market price.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'suggest-services') {
      const { businessType } = body as { businessType: string }
      const type = businessType?.trim()
      if (!type) {
        return NextResponse.json({ error: 'Business type required' }, { status: 400 })
      }

      const label = formatBusinessLabel(type)

      if (isGroqConfigured()) {
        try {
          const raw = await callGroq(
            [
              { role: 'system', content: SERVICES_SYSTEM },
              {
                role: 'user',
                content: `Business type: "${type}"
Examples of good output for "construction company": Residential Construction, Commercial Building, Renovation, Interior Finishing, Structural Repair
Examples for "salon": Haircut, Hair Colour, Facial, Shave, Head Massage
Now return the top 5 services for: ${type}`,
              },
            ],
            { json: true, temperature: 0.2 }
          )
          const parsed = parseJson<{ services: string[] }>(raw)
          const services = (parsed.services ?? [])
            .map((s) => String(s).trim())
            .filter(Boolean)
            .slice(0, 5)

          if (services.length >= 3) {
            return NextResponse.json({
              services,
              source: 'ai',
              message: `Here are the top services for ${label} businesses in India. Select what you offer!`,
            })
          }
        } catch (err) {
          console.error('[onboarding] Groq suggest-services failed:', err)
        }
      }

      const inferred = inferServicesForBusiness(type)
      if (inferred) {
        return NextResponse.json({
          services: inferred,
          source: isGroqConfigured() ? 'fallback' : 'offline',
          message: isGroqConfigured()
            ? `AI was temporarily unavailable. Showing known services for ${label} — you can edit or add more.`
            : `Showing suggested services for ${label}. Add GROQ_API_KEY in .env.local for AI suggestions for any business type.`,
        })
      }

      return NextResponse.json({
        services: [],
        source: 'none',
        needsApiKey: !isGroqConfigured(),
        message: isGroqConfigured()
          ? `Could not generate services for "${label}". Try a more specific name (e.g. "construction company") or add services manually below.`
          : `Add your free Groq API key to .env.local for AI suggestions on any business type. For now, add your services manually below.`,
      })
    }

    if (action === 'market-rates') {
      const { services, location, businessType } = body as {
        services: string[]
        location: string
        businessType?: string
      }
      if (!services?.length || !location?.trim()) {
        return NextResponse.json({ error: 'Services and location required' }, { status: 400 })
      }

      const serviceList = services.join(', ')
      const city = location.trim()

      if (isGroqConfigured()) {
        try {
          const raw = await callGroq(
            [
              { role: 'system', content: RATES_SYSTEM },
              {
                role: 'user',
                content: `Business: ${businessType || 'local business'}
Location: ${city}, India
Services: ${serviceList}
Return realistic INR prices for each service in this city.`,
              },
            ],
            { json: true, temperature: 0.2 }
          )
          const parsed = parseJson<{
            rates: { service: string; min: number; max: number; suggested: number }[]
          }>(raw)
          const rates = (parsed.rates ?? []).filter((r) => r.service && r.suggested > 0)
          if (rates.length > 0) {
            return NextResponse.json({
              rates,
              source: 'ai',
              message: `Market rates for ${city} loaded. Adjust anything that doesn't match your pricing.`,
            })
          }
        } catch (err) {
          console.error('[onboarding] Groq market-rates failed:', err)
        }
      }

      return NextResponse.json({
        rates: estimateMarketRates(services, city),
        source: isGroqConfigured() ? 'fallback' : 'offline',
        message: isGroqConfigured()
          ? `Estimated rates for ${city} — please verify and adjust.`
          : `Estimated rates for ${city}. Add GROQ_API_KEY for AI-powered local pricing.`,
      })
    }

    if (action === 'ai-status') {
      return NextResponse.json({
        configured: isGroqConfigured(),
        model: 'llama-3.1-8b-instant',
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Onboarding API error:', error)
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 })
  }
}
