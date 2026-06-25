import { handlers } from '@/auth'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return await handlers.GET(request)
  } catch (error: unknown) {
    console.error('[auth-route] GET ERROR:', error instanceof Error ? error.message : String(error))
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handlers.POST(request)
  } catch (error: unknown) {
    console.error('[auth-route] POST ERROR:', error instanceof Error ? error.message : String(error))
    throw error
  }
}
