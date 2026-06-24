import Link from 'next/link'
import { Brain, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — WhatsAppBrain',
  description: 'WhatsAppBrain privacy policy. Learn how we collect, use, and protect your data.',
}

export default function PrivacyPolicyPage() {
  const lastUpdated = 'June 24, 2026'

  return (
    <div className="min-h-screen bg-wb-bg">
      {/* Simple navbar */}
      <nav className="border-b border-wb-line/50 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-wb-green flex items-center justify-center shadow-sm shadow-wb-green/20">
              <Brain className="w-4.5 h-4.5 text-white" strokeWidth={2} />
            </div>
            <span className="font-serif text-xl text-wb-ink tracking-tight">WhatsAppBrain</span>
          </Link>
          <Link href="/" className="text-sm text-wb-soft hover:text-wb-ink transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-sm text-wb-soft">Last updated: {lastUpdated}</p>
        </div>

        <div className="max-w-none space-y-8">
          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">1. Introduction</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              WhatsAppBrain (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our WhatsApp automation service and website at whatsappbrain.com.
            </p>
            <p className="text-sm text-wb-soft leading-relaxed mt-2">
              By using WhatsAppBrain, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">2. Information We Collect</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-wb-ink mb-1">Account Information</h3>
                <p className="text-sm text-wb-soft leading-relaxed">
                  When you create an account, we collect your business name, email address, password (hashed), WhatsApp business number, and city. If you sign up via Google, we receive your name and email from Google OAuth.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-wb-ink mb-1">Business Profile</h3>
                <p className="text-sm text-wb-soft leading-relaxed">
                  Services you offer, pricing, business hours, location, and policies — information you provide to configure your bot.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-wb-ink mb-1">Conversation Data</h3>
                <p className="text-sm text-wb-soft leading-relaxed">
                  We store WhatsApp messages between your customers and your bot, including customer names, phone numbers, message content, and timestamps. This data is used solely to power your auto-reply bot and analytics.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-wb-ink mb-1">Usage Data</h3>
                <p className="text-sm text-wb-soft leading-relaxed">
                  We may collect anonymized usage statistics such as pages visited, features used, and error logs to improve our service.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed">
              <li>To provide and maintain the WhatsAppBrain service</li>
              <li>To process and respond to WhatsApp messages on your behalf</li>
              <li>To generate and deliver analytics about your conversations</li>
              <li>To send handoff email notifications when customers request to speak with you</li>
              <li>To communicate service updates, security alerts, and support messages</li>
              <li>To detect and prevent fraud, abuse, or security issues</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">4. How We Share Your Information</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              We do <strong className="text-wb-ink">not</strong> sell your personal data. We may share information with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed mt-2">
              <li><strong className="text-wb-ink">Meta Platforms</strong> — To deliver WhatsApp messages via the Meta Cloud API</li>
              <li><strong className="text-wb-ink">Groq</strong> — To power AI fallback responses (message content only, not personally identifiable information)</li>
              <li><strong className="text-wb-ink">Resend</strong> — To send handoff email notifications to you</li>
              <li><strong className="text-wb-ink">Supabase</strong> — To store your data securely in our database</li>
              <li><strong className="text-wb-ink">Law enforcement</strong> — When required by applicable law or legal process</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">5. Data Security</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed mt-2">
              <li>HMAC-SHA256 webhook signature verification</li>
              <li>Password hashing (SHA-256)</li>
              <li>Encrypted data storage via Supabase</li>
              <li>HTTPS encryption for all data in transit</li>
              <li>Environment variable isolation for API keys</li>
            </ul>
            <p className="text-sm text-wb-soft leading-relaxed mt-2">
              While we strive to protect your data, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">6. Data Retention</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              We retain your account data and conversation history for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where we are required to retain certain records for legal or legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">7. Your Rights</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your data in a machine-readable format</li>
              <li>Object to processing of your personal data</li>
            </ul>
            <p className="text-sm text-wb-soft leading-relaxed mt-2">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@whatsappbrain.com" className="text-wb-dark font-medium hover:underline">
                privacy@whatsappbrain.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">8. GDPR Compliance</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              If you are located in the European Economic Area (EEA) or the United Kingdom, you have additional rights under the General Data Protection Regulation (GDPR). We process your data based on your consent (when you use our service) and our legitimate interest (to provide and improve the service).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">9. Children&apos;s Privacy</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              WhatsAppBrain is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children under 18. If you believe we have collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">10. Changes to This Policy</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">11. Contact Us</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-3 text-sm text-wb-soft">
              <p>Email: <a href="mailto:privacy@whatsappbrain.com" className="text-wb-dark font-medium hover:underline">privacy@whatsappbrain.com</a></p>
              <p>Website: <a href="https://whatsappbrain.com" className="text-wb-dark font-medium hover:underline">whatsappbrain.com</a></p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
