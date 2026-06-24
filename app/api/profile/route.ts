import { NextResponse } from 'next/server'
import { getProfile, saveProfile, createDefaultProfileIfNotExists, createAuthenticatedSupabaseClient } from '@/lib/db'
import { validateUser } from '@/lib/auth-guard'
import { getSupabaseJWT } from '@/lib/supabase-jwt'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    // Get JWT token for authenticated Supabase client
    const jwtToken = await getSupabaseJWT()
    if (!jwtToken) {
      // Fallback: create default profile if JWT generation fails
      const profile = await getProfile(validUserId)
      if (!profile) {
        return NextResponse.json({
          success: true,
          profile: await createDefaultProfileIfNotExists(validUserId),
          warning: 'RLS disabled: JWT token unavailable'
        })
      }
      return NextResponse.json({ success: true, profile })
    }

    // Use authenticated client - RLS policies will be enforced
    const supabaseAuth = createAuthenticatedSupabaseClient(jwtToken)
    if (!supabaseAuth) {
      // Fallback to regular getProfile
      const profile = await getProfile(validUserId)
      return NextResponse.json({
        success: true,
        profile: profile || await createDefaultProfileIfNotExists(validUserId),
      })
    }

    // Fetch profile using authenticated client (RLS enforced)
    const { data: profile, error } = await supabaseAuth
      .from('profiles')
      .select('*')
      .eq('user_id', validUserId)
      .single()

    if (error) {
      console.warn('[Profile API] RLS query error:', error.message)
      // If RLS denies access, profile doesn't exist, or database not connected
      const fallbackProfile = await createDefaultProfileIfNotExists(validUserId)
      return NextResponse.json({ success: true, profile: fallbackProfile })
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Get profile API error:', error)
    return NextResponse.json({ error: 'Failed to retrieve profile' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, services, prices, hours, location, policies } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response

    // Get JWT token for authenticated Supabase client
    const jwtToken = await getSupabaseJWT()
    
    const payload = {
      user_id: userId,
      services: services || [],
      prices: prices || {},
      hours: hours || '',
      location: location || '',
      policies: policies || ''
    }

    // If JWT available, use authenticated client (RLS enforced)
    if (jwtToken) {
      const supabaseAuth = createAuthenticatedSupabaseClient(jwtToken)
      if (supabaseAuth) {
        const { error } = await supabaseAuth
          .from('profiles')
          .upsert(payload, { onConflict: 'user_id' })
        
        if (error) {
          console.error('[Profile API] RLS upsert error:', error.message)
          return NextResponse.json({ error: 'Failed to save profile (RLS denied)' }, { status: 403 })
        }
        
        return NextResponse.json({ success: true, profile: payload })
      }
    }

    // Fallback: save locally or to database without RLS
    await saveProfile(payload)
    return NextResponse.json({ success: true, profile: payload })
  } catch (error) {
    console.error('Save profile API error:', error)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
