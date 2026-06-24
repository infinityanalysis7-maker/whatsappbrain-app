import { NextResponse } from 'next/server'
import { getBotRules, saveBotRules, getBotRuleCount } from '@/lib/db'
import { validateUser } from '@/lib/auth-guard'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    const rules = await getBotRules(validUserId)
    return NextResponse.json({ success: true, rules })
  } catch (error) {
    console.error('Get bot rules API error:', error)
    return NextResponse.json({ error: 'Failed to retrieve bot rules' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, rules } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response

    if (!Array.isArray(rules)) {
      return NextResponse.json({ error: 'Rules must be an array' }, { status: 400 })
    }

    // Map fields
    const formattedRules = rules.map(r => ({
      id: r.id,
      triggers: r.triggers || [],
      reply: r.reply || '',
      category: r.category || 'Other',
      active: r.active !== false,
      aiGenerated: !!r.aiGenerated
    }))

    // Free plan: check rule limit before saving (saveBotRules replaces ALL rules)
    if (formattedRules.length > 5) {
      return NextResponse.json({
        error: 'Free plan limit: maximum 5 bot rules. Upgrade to Pro for unlimited rules.',
        limitReached: true,
        current: formattedRules.length,
        limit: 5,
      }, { status: 403 })
    }

    await saveBotRules(userId, formattedRules)
    return NextResponse.json({ success: true, rules: formattedRules })
  } catch (error) {
    console.error('Save bot rules API error:', error)
    return NextResponse.json({ error: 'Failed to save bot rules' }, { status: 500 })
  }
}
