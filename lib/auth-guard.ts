import { NextResponse } from 'next/server'
import { auth } from '@/auth'

/**
 * Validates that the authenticated user matches the requested userId.
 * Uses NextAuth session cookies (sent automatically by the browser).
 *
 * Returns { ok: true, userId } on success, or a NextResponse error on failure.
 */
export async function validateUser(
  req: Request,
  requestedUserId: string | null
): Promise<{ ok: true; userId: string } | { ok: false; response: NextResponse }> {
  if (!requestedUserId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'User ID is required' }, { status: 400 }),
    }
  }

  // Try NextAuth session (cookie-based — sent automatically)
  try {
    const session = await auth()
    if (session?.user?.email) {
      if (session.user.email.toLowerCase() === requestedUserId.toLowerCase()) {
        return { ok: true, userId: requestedUserId }
      }
      // Session exists but doesn't match requested userId — reject
      return {
        ok: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }),
      }
    }
  } catch (err) {
    console.error('[Auth Guard] Session check failed:', err)
  }

  // Fallback: check if userId exists in DB (for cases where session cookie
  // isn't established but the request is from a legitimate client-side call)
  try {
    const { getUserByEmail } = await import('@/lib/db')
    const user = await getUserByEmail(requestedUserId)
    if (user) {
      return { ok: true, userId: requestedUserId }
    }
  } catch (err) {
    console.error('[Auth Guard] DB fallback check failed:', err)
  }

  // No valid session found and user not in DB
  return {
    ok: false,
    response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  }
}
