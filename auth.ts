import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

// Debug: log env var state at module load time
console.log("[auth] Module loading...")
console.log("[auth] GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? `SET (${process.env.GOOGLE_CLIENT_ID.length} chars)` : "MISSING")
console.log("[auth] GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? `SET (${process.env.GOOGLE_CLIENT_SECRET.length} chars)` : "MISSING")
console.log("[auth] AUTH_SECRET:", process.env.AUTH_SECRET ? `SET (${process.env.AUTH_SECRET.length} chars)` : "MISSING")
console.log("[auth] AUTH_URL:", process.env.AUTH_URL || "MISSING")
console.log("[auth] AUTH_GOOGLE_ID:", process.env.AUTH_GOOGLE_ID ? "SET" : "MISSING")
console.log("[auth] AUTH_GOOGLE_SECRET:", process.env.AUTH_GOOGLE_SECRET ? "SET" : "MISSING")

let authConfig: ReturnType<typeof NextAuth>

try {
  authConfig = NextAuth({
    trustHost: true,
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET!,
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

                  console.log("🔍 Checking user:", email)
                  const existingUser = await getUserByEmail(email)
                  console.log(
                    "🔍 Existing user:",
                    existingUser ? "FOUND" : "NOT FOUND"
                  )

                  if (!existingUser) {
                    const randomPass = crypto
                      .randomBytes(16)
                      .toString("hex")
                    console.log("🔍 Creating user...")
                    await createUser({
                      email,
                      password: await hashPassword(randomPass),
                      businessName: name,
                      whatsapp: "9999999999",
                      city: "New Delhi",
                      plan: "free",
                    })
                    console.log("✅ User created")
                  }

                  console.log("🔍 Creating profile...")
                  await createDefaultProfileIfNotExists(email)
                  console.log("✅ Profile done")
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
  console.log("[auth] NextAuth initialized successfully")
} catch (error) {
  console.error("[auth] ❌ NextAuth initialization FAILED:", error)
  throw error
}

export const isGoogleConfigured = true
export const { handlers, signIn, signOut, auth } = authConfig
