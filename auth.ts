import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const isGoogleConfigured = !!(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id'
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = []

if (isGoogleConfigured) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  )
}

providers.push(
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
)

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user?.email) {
        try {
          const { getUserByEmail, createUser, createDefaultProfileIfNotExists } = await import('@/lib/db')
          const crypto = await import('crypto')
          const { hashPassword } = await import('@/lib/auth-helpers')
          const existingUser = await getUserByEmail(user.email)
          if (!existingUser) {
            const randomPass = crypto.randomBytes(16).toString('hex')
            await createUser({
              email: user.email.toLowerCase(),
              password: await hashPassword(randomPass),
              businessName: user.name || 'Google User',
              whatsapp: '9999999999',
              city: 'New Delhi',
              plan: 'free',
            })
          }
          await createDefaultProfileIfNotExists(user.email.toLowerCase())
        } catch (error) {
          console.error('Error creating user/profile on Google sign-in:', error)
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
})
