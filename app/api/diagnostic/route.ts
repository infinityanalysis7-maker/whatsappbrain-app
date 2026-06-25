import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    google_client_id: process.env.GOOGLE_CLIENT_ID || 'MISSING',
    google_client_id_length: process.env.GOOGLE_CLIENT_ID?.length || 0,
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET ? 'SET (hidden)' : 'MISSING',
    google_client_secret_length: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    auth_secret: process.env.AUTH_SECRET ? 'SET (hidden)' : 'MISSING',
    auth_secret_length: process.env.AUTH_SECRET?.length || 0,
    auth_url: process.env.AUTH_URL || 'MISSING',
    node_env: process.env.NODE_ENV,
    all_google_env: Object.keys(process.env).filter(k => k.includes('GOOGLE')).join(', ') || 'NONE',
    all_auth_env: Object.keys(process.env).filter(k => k.includes('AUTH')).join(', ') || 'NONE',
  })
}
