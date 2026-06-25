/**
 * Auth module using truly dynamic imports to bypass Turbopack build-time evaluation.
 *
 * PROVEN: The test endpoint at /api/test-google creates a NextAuth instance using
 * `await import("next-auth")` and it works perfectly on Vercel. The issue is that
 * Turbopack (Next.js 16 default bundler) evaluates static imports and require()
 * calls at build time when process.env.GOOGLE_CLIENT_ID is empty.
 *
 * FIX: Use `await import()` inside async functions that are only called at request
 * time, ensuring env vars are available when NextAuth initializes.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
let _handlers: any = null
let _signIn: any = null
let _signOut: any = null
let _auth: any = null
let _initPromise: Promise<void> | null = null

async function ensureAuth() {
  if (_handlers) return
  if (!_initPromise) {
    _initPromise = doInit()
  }
  await _initPromise
}

async function doInit() {
  console.error("[auth] Initializing NextAuth with dynamic import...")
  console.error("[auth] GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "present" : "MISSING")
  console.error("[auth] GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "present" : "MISSING")
  console.error("[auth] AUTH_SECRET:", process.env.AUTH_SECRET ? "present" : "MISSING")
  console.error("[auth] AUTH_URL:", process.env.AUTH_URL || "MISSING")

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
          // Fire-and-forget: don't block sign-in on DB operations.
          const email = user.email.toLowerCase()
          const name = user.name || "Google User"
          import("@/lib/db")
            .then(
              async ({
                getUserByEmail,
                createUser,
                createDefaultProfileIfNotExists,
              }) => {
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
              }
            )
            .catch((error) =>
              console.error("❌ signIn background task failed:", error)
            )
        }
        return true
      },
    },
    pages: {
      signIn: "/login",
    },
  })

  _handlers = result.handlers
  _signIn = result.signIn
  _signOut = result.signOut
  _auth = result.auth

  console.error("[auth] ✅ NextAuth initialized successfully")
}

export const isGoogleConfigured = true

export const handlers = {
  async GET(request: Request) {
    await ensureAuth()
    return _handlers!.GET(request)
  },
  async POST(request: Request) {
    await ensureAuth()
    return _handlers!.POST(request)
  },
}

export async function signIn(...args: any[]) {
  await ensureAuth()
  return _signIn!(...args)
}

export async function signOut(...args: any[]) {
  await ensureAuth()
  return _signOut!(...args)
}

export async function auth(...args: any[]): Promise<any> {
  await ensureAuth()
  return _auth!(...args)
}
