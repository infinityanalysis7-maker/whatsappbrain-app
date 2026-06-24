import { auth } from '@/auth'
import jwt from 'jsonwebtoken'

/**
 * Generate a Supabase-compatible JWT token from the NextAuth session.
 * This token is used with RLS policies to authenticate Supabase requests.
 * 
 * RLS Policy Example:
 * CREATE POLICY "Users access own data" ON profiles
 *   USING (auth.uid()::text = user_id);
 */
export async function getSupabaseJWT(): Promise<string | null> {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return null
    }

    // Supabase JWT secret - MUST match your Supabase JWT secret
    const jwtSecret = process.env.SUPABASE_JWT_SECRET
    if (!jwtSecret) {
      console.warn('[getSupabaseJWT] SUPABASE_JWT_SECRET not configured. RLS may not work.')
      return null
    }

    // Create JWT compatible with Supabase RLS
    // Supabase checks: auth.uid() for 'sub' claim
    const token = jwt.sign(
      {
        // 'sub' is the user ID - Supabase uses this for auth.uid()
        sub: session.user.email,
        email: session.user.email,
        // Standard JWT claims
        aud: 'authenticated',
        role: 'authenticated',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      },
      jwtSecret,
      { algorithm: 'HS256' }
    )

    return token
  } catch (error) {
    console.error('[getSupabaseJWT] Failed to generate JWT:', error)
    return null
  }
}

/**
 * Extract the user ID from the current session.
 * Used to validate RLS requests.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await auth()
    return session?.user?.email || null
  } catch {
    return null
  }
}

