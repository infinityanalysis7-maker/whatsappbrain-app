import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

// Minimal config for debugging - strip everything to isolate Configuration error
console.log("[auth] Initializing NextAuth...")
console.log("[auth] GOOGLE_CLIENT_ID present:", !!process.env.GOOGLE_CLIENT_ID)
console.log("[auth] GOOGLE_CLIENT_SECRET present:", !!process.env.GOOGLE_CLIENT_SECRET)
console.log("[auth] AUTH_SECRET present:", !!process.env.AUTH_SECRET)
console.log("[auth] AUTH_URL:", process.env.AUTH_URL)

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
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
  pages: {
    signIn: "/login",
  },
})

export const isGoogleConfigured = true
