import { z } from 'zod'

/**
 * Environment variable validation schema.
 * Fails fast at startup if required variables are missing or malformed.
 */
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),

  // Auth
  AUTH_SECRET: z.string().min(32).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // AI
  GROQ_API_KEY: z.string().startsWith('gsk_').optional(),

  // WhatsApp Business API
  WHATSAPP_ACCESS_TOKEN: z.string().min(10).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(5).optional(),
  WHATSAPP_APP_SECRET: z.string().min(10).optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().min(8).default('whatsappbrain_verify_token'),

  // Email (optional)
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  RESEND_DOMAIN: z.string().optional(),
  NOTIFICATION_EMAIL: z.string().email().optional(),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
    }
    // Don't throw in development so the app can still start with mock mode
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed. Check logs above.')
    }
  }

  return result.success ? result.data : undefined
}

export const validatedEnv = validateEnv()

/** Check if production WhatsApp credentials are configured */
export function isWhatsAppProductionReady(): boolean {
  return !!(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_APP_SECRET
  )
}

/** Check if email notifications are configured */
export function isEmailProductionReady(): boolean {
  return !!(
    process.env.RESEND_API_KEY &&
    process.env.RESEND_DOMAIN &&
    process.env.NOTIFICATION_EMAIL
  )
}

/** Check if Supabase is configured for production */
export function isDatabaseProductionReady(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
