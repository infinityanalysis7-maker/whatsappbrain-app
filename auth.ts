import type { NextAuthConfig } from "next-auth"

// Lazy initialization pattern: avoids Turbopack evaluating NextAuth() at build
// time when process.env.GOOGLE_CLIENT_ID is empty. The test endpoint proved
// that dynamic imports + runtime init work perfectly on Vercel.

let _instance: ReturnType<typeof _init> | null = null

function _init() {
  // Use require() so Turbopack can't evaluate this at build time
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const NextAuth = require("next-auth").default
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Google = require("next-auth/providers/google").default

  console.log("[auth] Initializing NextAuth at request time")
  console.log("[auth] GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "present" : "MISSING")
  console.log("[auth] GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "present" : "MISSING")
  console.log("[auth] AUTH_SECRET:", process.env.AUTH_SECRET ? "present" : "MISSING")

  const authConfig: NextAuthConfig = {
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
  }

  return NextAuth(authConfig)
}

function getAuth() {
  if (!_instance) {
    try {
      _instance = _init()
    } catch (error) {
      console.error("[auth] ❌ Initialization FAILED:", error)
      throw error
    }
  }
  return _instance
}

// Lazy exports: resolve at request time, not build time
export const isGoogleConfigured = true

export const handlers = {
  async GET(request: Request) {
    return getAuth().handlers.GET(request)
  },
  async POST(request: Request) {
    return getAuth().handlers.POST(request)
  },
}

export async function signIn(...args: Parameters<ReturnType<typeof _init>["signIn"]>) {
  return getAuth().signIn(...args)
}

export async function signOut(...args: Parameters<ReturnType<typeof _init>["signOut"]>) {
  return getAuth().signOut(...args)
}

export async function auth(...args: Parameters<ReturnType<typeof _init>["auth"]>) {
  return getAuth().auth(...args)
}
