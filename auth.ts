import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const isGoogleConfigured = !!(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET
)

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  debug: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (typeof credentials?.email !== 'string' || typeof credentials?.password !== 'string') {
          return null
        }
        try {
          const { getUserByEmail, saveUser } = await import('@/lib/db')
          const { hashPassword, verifyPassword } = await import('@/lib/auth-helpers')
          const user = await getUserByEmail(credentials.email)
          if (!user) return null
          const { valid, needsRehash } = await verifyPassword(credentials.password, user.password || '')
          if (!valid) return null
          if (needsRehash) {
            const newHash = await hashPassword(credentials.password)
            await saveUser({ ...user, password: newHash })
          }
          return { id: user.email, name: user.businessName, email: user.email }
        } catch (error) {
          console.error('Auth authorize error:', error)
          return null
        }
      },
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
})
