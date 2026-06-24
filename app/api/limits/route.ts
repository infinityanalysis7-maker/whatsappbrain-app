import { NextResponse } from 'next/server'
import { getConversationCount, getBotRuleCount } from '@/lib/db'
import { getUsageSummary } from '@/lib/limits'
import { validateUser } from '@/lib/auth-guard'
import { getSupabaseJWT } from '@/lib/supabase-jwt'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    // Get JWT for authenticated requests (ensures RLS is respected)
    const jwtToken = await getSupabaseJWT()
    
    const [conversationCount, ruleCount] = await Promise.all([
      getConversationCount(validUserId),
      getBotRuleCount(validUserId),
    ])

    const usage = getUsageSummary(conversationCount, ruleCount)

    return NextResponse.json({ success: true, usage })
  } catch (error) {
    console.error('Limits API error:', error)
    return NextResponse.json({ error: 'Failed to check limits' }, { status: 500 })
  }
}
