import { NextResponse } from 'next/server'
import { isGoogleConfigured } from '@/auth'

export async function GET() {
  return NextResponse.json({
    auth_secret_exists: !!process.env.AUTH_SECRET,
    auth_secret_length: process.env.AUTH_SECRET?.length || 0,
    auth_secret_first_10: process.env.AUTH_SECRET?.slice(0, 10) + '...',
    auth_url: process.env.AUTH_URL,
    auth_trust_host: process.env.AUTH_TRUST_HOST,
    google_client_id_exists: !!process.env.GOOGLE_CLIENT_ID,
    google_client_id_length: process.env.GOOGLE_CLIENT_ID?.length || 0,
    google_client_id_first_20: process.env.GOOGLE_CLIENT_ID?.slice(0, 20) + '...',
    google_client_secret_exists: !!process.env.GOOGLE_CLIENT_SECRET,
    google_client_secret_length: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    isGoogleConfigured: isGoogleConfigured,
    node_env: process.env.NODE_ENV,
    supabase_url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    groq_exists: !!process.env.GROQ_API_KEY,
    whatsapp_token_exists: !!process.env.WHATSAPP_ACCESS_TOKEN,
    whatsapp_phone_exists: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    whatsapp_app_secret_exists: !!process.env.WHATSAPP_APP_SECRET,
  })
}
