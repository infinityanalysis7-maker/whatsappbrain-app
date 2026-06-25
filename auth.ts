import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const isGoogleConfigured = true

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      checks: ["state"],
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user?.email) {
        try {
          const { getUserByEmail, createUser, createDefaultProfileIfNotExists } = await import('@/lib/db')
          const crypto = await import('crypto')
          const { hashPassword } = await import('@/lib/auth-helpers')

          console.log('🔍 Checking user:', user.email)
          const existingUser = await getUserByEmail(user.email)
          console.log('🔍 Existing user:', existingUser ? 'FOUND' : 'NOT FOUND')

          if (!existingUser) {
            const randomPass = crypto.randomBytes(16).toString('hex')
            console.log('🔍 Creating user...')
            await createUser({
              email: user.email.toLowerCase(),
              password: await hashPassword(randomPass),
              businessName: user.name || 'Google User',
              whatsapp: '9999999999',
              city: 'New Delhi',
              plan: 'free',
            })
            console.log('✅ User created')
          }

          console.log('🔍 Creating profile...')
          await createDefaultProfileIfNotExists(user.email.toLowerCase())
          console.log('✅ Profile done')

        } catch (error) {
          console.error('❌ SUPABASE ERROR:', error)
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
})
