import { NextResponse } from 'next/server'
import { isWhatsAppProductionReady, isEmailProductionReady, isDatabaseProductionReady } from '@/lib/env'

interface HealthCheck {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded' | 'mock'
  message: string
}

export async function GET() {
  const checks: HealthCheck[] = []
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'

  // 1. Database check
  if (isDatabaseProductionReady()) {
    checks.push({
      name: 'database',
      status: 'healthy',
      message: 'Supabase is configured with service role key',
    })
  } else if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    overallStatus = 'degraded'
    checks.push({
      name: 'database',
      status: 'degraded',
      message: 'Supabase is configured but missing service role key. Some operations may fail.',
    })
  } else {
    overallStatus = 'degraded'
    checks.push({
      name: 'database',
      status: 'mock',
      message: 'Running with local JSON database fallback. NOT suitable for production.',
    })
  }

  // 2. WhatsApp API check
  if (isWhatsAppProductionReady()) {
    checks.push({
      name: 'whatsapp',
      status: 'healthy',
      message: 'WhatsApp Business API credentials are configured',
    })
  } else {
    checks.push({
      name: 'whatsapp',
      status: 'mock',
      message: 'WhatsApp API not configured — messages will be logged to console only.',
    })
  }

  // 3. Email check
  if (isEmailProductionReady()) {
    checks.push({
      name: 'email',
      status: 'healthy',
      message: 'Resend email notifications are configured',
    })
  } else {
    checks.push({
      name: 'email',
      status: 'mock',
      message: 'Email notifications not configured — handoff alerts will be skipped.',
    })
  }

  // 4. Auth check
  if (process.env.AUTH_SECRET) {
    checks.push({
      name: 'auth',
      status: 'healthy',
      message: 'NextAuth secret is configured',
    })
  } else {
    overallStatus = 'degraded'
    checks.push({
      name: 'auth',
      status: 'degraded',
      message: 'AUTH_SECRET is missing. Session security is compromised.',
    })
  }

  // 5. AI check
  if (process.env.GROQ_API_KEY) {
    checks.push({
      name: 'ai',
      status: 'healthy',
      message: 'Groq AI fallback is configured',
    })
  } else {
    checks.push({
      name: 'ai',
      status: 'mock',
      message: 'Groq AI not configured — using local fallback inference only.',
    })
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: statusCode }
  )
}
