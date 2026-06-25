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
        // Fire-and-forget: don't block sign-in on DB operations.
        // Supabase writes are best-effort — the user gets a session either way.
        const email = user.email.toLowerCase()
        const name = user.name || 'Google User'
        import('@/lib/db').then(async ({ getUserByEmail, createUser, createDefaultProfileIfNotExists }) => {
          try {
            const crypto = await import('crypto')
            const { hashPassword } = await import('@/lib/auth-helpers')

            console.log('🔍 Checking user:', email)
            const existingUser = await getUserByEmail(email)
            console.log('🔍 Existing user:', existingUser ? 'FOUND' : 'NOT FOUND')

            if (!existingUser) {
              const randomPass = crypto.randomBytes(16).toString('hex')
              console.log('🔍 Creating user...')
              await createUser({
                email,
                password: await hashPassword(randomPass),
                businessName: name,
                whatsapp: '9999999999',
                city: 'New Delhi',
                plan: 'free',
              })
              console.log('✅ User created')
            }

            console.log('🔍 Creating profile...')
            await createDefaultProfileIfNotExists(email)
            console.log('✅ Profile done')
          } catch (error) {
            console.error('❌ SUPABASE ERROR:', error)
          }
        }).catch(error => console.error('❌ signIn background task failed:', error))
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
})
