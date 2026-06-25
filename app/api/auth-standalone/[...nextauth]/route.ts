/**
 * Standalone auth handler — completely bypasses auth.ts to test whether
 * Turbopack is the root cause. Uses the EXACT same pattern as /api/test-google
 * which is proven to work.
 */
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  process.stderr.write('[STANDALONE-AUTH] GET called\n')

  try {
    const { default: NextAuth } = await import('next-auth')
    const { default: Google } = await import('next-auth/providers/google')

    const auth = NextAuth({
      trustHost: true,
      providers: [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ],
      pages: {
        signIn: '/login',
      },
      callbacks: {
        async signIn({ user, account }) {
          if (account?.provider === 'google' && user?.email) {
            const email = user.email.toLowerCase()
            const name = user.name || 'Google User'
            import('@/lib/db').then(async ({ getUserByEmail, createUser, createDefaultProfileIfNotExists }) => {
              try {
                const crypto = await import('crypto')
                const { hashPassword } = await import('@/lib/auth-helpers')
                const existingUser = await getUserByEmail(email)
                if (!existingUser) {
                  const randomPass = crypto.randomBytes(16).toString('hex')
                  await createUser({ email, password: await hashPassword(randomPass), businessName: name, whatsapp: '9999999999', city: 'New Delhi', plan: 'free' })
                }
                await createDefaultProfileIfNotExists(email)
              } catch (error) {
                console.error('❌ SUPABASE ERROR:', error)
              }
            }).catch((error) => console.error('❌ signIn background task failed:', error))
          }
          return true
        },
      },
    })

    return auth.handlers.GET(request)
  } catch (error) {
    process.stderr.write(`[STANDALONE-AUTH] ERROR: ${error instanceof Error ? error.message : String(error)}\n`)
    return new Response('Auth handler error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { default: NextAuth } = await import('next-auth')
    const { default: Google } = await import('next-auth/providers/google')

    const auth = NextAuth({
      trustHost: true,
      providers: [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ],
      pages: { signIn: '/login' },
      callbacks: {
        async signIn({ user, account }) {
          if (account?.provider === 'google' && user?.email) {
            const email = user.email.toLowerCase()
            const name = user.name || 'Google User'
            import('@/lib/db').then(async ({ getUserByEmail, createUser, createDefaultProfileIfNotExists }) => {
              try {
                const crypto = await import('crypto')
                const { hashPassword } = await import('@/lib/auth-helpers')
                const existingUser = await getUserByEmail(email)
                if (!existingUser) {
                  const randomPass = crypto.randomBytes(16).toString('hex')
                  await createUser({ email, password: await hashPassword(randomPass), businessName: name, whatsapp: '9999999999', city: 'New Delhi', plan: 'free' })
                }
                await createDefaultProfileIfNotExists(email)
              } catch (error) {
                console.error('❌ SUPABASE ERROR:', error)
              }
            }).catch((error) => console.error('❌ signIn background task failed:', error))
          }
          return true
        },
      },
    })

    return auth.handlers.POST(request)
  } catch (error) {
    return new Response('Auth handler error', { status: 500 })
  }
}
