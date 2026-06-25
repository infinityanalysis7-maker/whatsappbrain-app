import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const isGoogleConfigured = true

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
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
