import { NextResponse } from 'next/server'
import { getUserByEmail, createUser, saveUser, createDefaultProfileIfNotExists } from '@/lib/db'
import { sanitizePlainText, isValidEmail, isValidIndianPhone } from '@/lib/sanitize'
import crypto from 'crypto'
import { hashPassword, verifyPassword } from '@/lib/auth-helpers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action } = body

    // Rate limit signup/login attempts (5 per minute per IP)
    if (action === 'signup' || action === 'login') {
      const ip = getClientIp(req)
      const rateLimit = checkRateLimit(`auth:${ip}`, 5, 60_000)
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Too many attempts. Please try again later.' },
          { status: 429 }
        )
      }
    }

    if (action === 'signup') {
      const { businessName, email, password, whatsapp, city } = body
      
      if (!businessName || !email || !password || !whatsapp || !city) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
      }

      const cleanEmail = sanitizePlainText(email.trim().toLowerCase())
      if (!isValidEmail(cleanEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      }

      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }

      const cleanWhatsapp = whatsapp.replace(/\D/g, '')
      if (!isValidIndianPhone(cleanWhatsapp)) {
        return NextResponse.json({ error: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.' }, { status: 400 })
      }

      const cleanBusinessName = sanitizePlainText(businessName.trim())
      const cleanCity = sanitizePlainText(city.trim())

      // Check if user exists
      const existingUser = await getUserByEmail(cleanEmail)
      if (existingUser) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
      }

      const newUser = {
        email: cleanEmail,
        password: await hashPassword(password),
        businessName: cleanBusinessName,
        whatsapp: cleanWhatsapp,
        city: cleanCity,
        plan: 'free'
      }

      await createUser(newUser)
      
      // Create default profile for new user
      await createDefaultProfileIfNotExists(cleanEmail)

      // Exclude password from response
      const { password: _, ...userWithoutPassword } = newUser
      return NextResponse.json({ 
        success: true, 
        user: userWithoutPassword, 
        token: 'wb_sess_' + crypto.randomUUID()
      })
    }

    if (action === 'login') {
      const { email, password } = body

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }

      const cleanEmail = sanitizePlainText(email.trim().toLowerCase())
      if (!isValidEmail(cleanEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      }

      const user = await getUserByEmail(cleanEmail)
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
      }

      const { valid, needsRehash } = await verifyPassword(password, user.password || '')
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
      }

      // Auto-upgrade: re-hash legacy SHA-256 password with bcrypt on successful login
      if (needsRehash) {
        const newHash = await hashPassword(password)
        await saveUser({ ...user, password: newHash })
      }

      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({ 
        success: true, 
        user: userWithoutPassword, 
        token: 'wb_sess_' + crypto.randomUUID()
      })
    }

    if (action === 'google_login') {
      const { email, name } = body

      if (!email || !name) {
        return NextResponse.json({ error: 'Email and Name are required' }, { status: 400 })
      }

      const cleanEmail = sanitizePlainText(email.trim().toLowerCase())
      const cleanName = sanitizePlainText(name.trim())

      if (!isValidEmail(cleanEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      }

      let user = await getUserByEmail(cleanEmail)

      let generatedPassword: string | undefined
      if (!user) {
        // Register a new user automatically
        generatedPassword = crypto.randomBytes(16).toString('hex')
        user = {
          email: cleanEmail,
          password: await hashPassword(generatedPassword),
          businessName: cleanName || 'Google User',
          whatsapp: '9999999999', // Default placeholder — user should update in profile
          city: 'New Delhi', // Default placeholder — user should update in profile
          plan: 'free'
        }
        await createUser(user)
      }

      // Create default profile for new user (safe to call for existing users too)
      await createDefaultProfileIfNotExists(cleanEmail)

      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({ 
        success: true, 
        user: userWithoutPassword, 
        token: 'wb_sess_' + crypto.randomUUID(),
        generatedPassword,
      })
    }

    if (action === 'verify') {
      const { email } = body
      if (!email) {
        return NextResponse.json({ error: 'Email required for verification' }, { status: 400 })
      }

      const cleanEmail = sanitizePlainText(email.trim().toLowerCase())
      if (!isValidEmail(cleanEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      }

      const user = await getUserByEmail(cleanEmail)
      if (user) {
        const { password: _, ...userWithoutPassword } = user
        return NextResponse.json({ success: true, user: userWithoutPassword })
      }

      // User not found in DB — reject
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    if (action === 'forgot_password') {
      const { email } = body
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }

      const cleanEmail = sanitizePlainText(email.trim().toLowerCase())
      if (!isValidEmail(cleanEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      }

      const user = await getUserByEmail(cleanEmail)
      if (!user) {
        // Don't reveal if user exists
        return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' })
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetExpires = Date.now() + 60 * 60 * 1000

      await saveUser({ ...user, resetToken, resetExpires })

      // In production, send email with reset link. For now, return token.
      console.log(`[Auth] Password reset token for ${cleanEmail}: ${resetToken}`)
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a reset link has been sent.',
        // Remove this in production — only for development
        resetToken,
        resetExpires,
      })
    }

    if (action === 'reset_password') {
      const { email, token, newPassword } = body
      if (!email || !token || !newPassword) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }

      const cleanEmail = sanitizePlainText(email.trim().toLowerCase())
      const user = await getUserByEmail(cleanEmail)
      if (!user) {
        return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 })
      }

      if (!user.resetToken || user.resetToken !== token) {
        return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 })
      }

      if (!user.resetExpires || Date.now() > user.resetExpires) {
        return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
      }

      const newHash = await hashPassword(newPassword)
      await saveUser({ ...user, password: newHash, resetToken: null, resetExpires: null })

      return NextResponse.json({ success: true, message: 'Password reset successful. You can now log in.' })
    }

    return NextResponse.json({ error: 'Invalid auth action' }, { status: 400 })
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json({ error: 'Authentication request failed' }, { status: 500 })
  }
}
