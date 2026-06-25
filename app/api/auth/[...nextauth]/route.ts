/**
 * Self-contained auth handler — initializes NextAuth directly at request time
 * using dynamic imports. This bypasses auth.ts module-level evaluation which
 * fails on Vercel due to Turbopack build-time evaluation of process.env.
 *
 * auth.ts is kept for type exports (auth, signIn, signOut, isGoogleConfigured)
 * used by other server modules, but the actual NextAuth instance lives here.
 */
import { NextRequest } from 'next/server'

let _handlers: any = null
let _initPromise: Promise<void> | null = null

async function ensureAuth() {
  if (_handlers) return
  if (!_initPromise) {
    _initPromise = (async () => {
      console.error("[auth-route] Initializing NextAuth with dynamic import...")
      const { default: NextAuth } = await import("next-auth")
      const { default: Google } = await import("next-auth/providers/google")

      const result = NextAuth({
        trustHost: true,
        providers: [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ],
        callbacks: {
          async signIn({ user, account }) {
            if (account?.provider === "google" && user?.email) {
              const email = user.email.toLowerCase()
              const name = user.name || "Google User"
              import("@/lib/db")
                .then(async ({ getUserByEmail, createUser, createDefaultProfileIfNotExists }) => {
                  try {
                    const crypto = await import("crypto")
                    const { hashPassword } = await import("@/lib/auth-helpers")
                    const existingUser = await getUserByEmail(email)
                    if (!existingUser) {
                      const randomPass = crypto.randomBytes(16).toString("hex")
                      await createUser({
                        email,
                        password: await hashPassword(randomPass),
                        businessName: name,
                        whatsapp: "9999999999",
                        city: "New Delhi",
                        plan: "free",
                      })
                    }
                    await createDefaultProfileIfNotExists(email)
                  } catch (error) {
                    console.error("❌ SUPABASE ERROR:", error)
                  }
                })
                .catch((error) => console.error("❌ signIn background task failed:", error))
            }
            return true
          },
        },
        pages: { signIn: "/login" },
      })

      _handlers = result.handlers
      console.error("[auth-route] ✅ NextAuth initialized")
    })()
  }
  await _initPromise
}

export async function GET(request: NextRequest) {
  await ensureAuth()
  return _handlers.GET(request)
}

export async function POST(request: NextRequest) {
  await ensureAuth()
  return _handlers.POST(request)
}
