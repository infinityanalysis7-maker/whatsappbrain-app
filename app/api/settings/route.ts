import { NextResponse } from 'next/server'
import { getSettings, setSettings } from '@/lib/settings'
import { validateUser } from '@/lib/auth-guard'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    const settings = await getSettings(validUserId)
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Get settings API error:', error)
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, settings } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response

    setSettings(userId, settings)
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Save settings API error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
