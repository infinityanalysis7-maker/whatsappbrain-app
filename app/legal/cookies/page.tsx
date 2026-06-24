import Link from 'next/link'
import { Brain, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Cookie Policy — WhatsAppBrain',
  description: 'WhatsAppBrain cookie policy. Learn how we use cookies and similar technologies.',
}

export default function CookiePolicyPage() {
  const lastUpdated = 'June 24, 2026'

  return (
    <div className="min-h-screen bg-wb-bg">
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
          <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight mb-3">Cookie Policy</h1>
          <p className="text-sm text-wb-soft">Last updated: {lastUpdated}</p>
        </div>

        <div className="max-w-none space-y-8">
          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">1. What Are Cookies?</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, understand how you use the site, and improve your experience.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">2. How WhatsAppBrain Uses Cookies</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              WhatsAppBrain uses a minimal set of cookies and local storage to provide our service:
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-wb-line/60">
                    <th className="text-left py-3 pr-4 font-semibold text-wb-ink">Cookie / Storage</th>
                    <th className="text-left py-3 pr-4 font-semibold text-wb-ink">Purpose</th>
                    <th className="text-left py-3 font-semibold text-wb-ink">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-wb-soft">
                  <tr className="border-b border-wb-line/30">
                    <td className="py-3 pr-4 font-mono text-xs">next-auth.session-token</td>
                    <td className="py-3 pr-4">Authenticates your session when signed in via Google OAuth</td>
                    <td className="py-3">30 days</td>
                  </tr>
                  <tr className="border-b border-wb-line/30">
                    <td className="py-3 pr-4 font-mono text-xs">next-auth.csrf-token</td>
                    <td className="py-3 pr-4">Protects against cross-site request forgery attacks</td>
                    <td className="py-3">Session</td>
                  </tr>
                  <tr className="border-b border-wb-line/30">
                    <td className="py-3 pr-4 font-mono text-xs">localStorage: wb_user</td>
                    <td className="py-3 pr-4">Stores your account information for the dashboard</td>
                    <td className="py-3">Until logout</td>
                  </tr>
                  <tr className="border-b border-wb-line/30">
                    <td className="py-3 pr-4 font-mono text-xs">localStorage: wb_session</td>
                    <td className="py-3 pr-4">Stores session token for authenticated dashboard access</td>
                    <td className="py-3">Until logout</td>
                  </tr>
                  <tr className="border-b border-wb-line/30">
                    <td className="py-3 pr-4 font-mono text-xs">localStorage: wb_bot_rules</td>
                    <td className="py-3 pr-4">Caches your bot rules for faster dashboard loading</td>
                    <td className="py-3">Until cleared</td>
                  </tr>
                  <tr className="border-b border-wb-line/30">
                    <td className="py-3 pr-4 font-mono text-xs">localStorage: wb_settings</td>
                    <td className="py-3 pr-4">Caches your settings preferences</td>
                    <td className="py-3">Until cleared</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">3. Third-Party Cookies</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              WhatsAppBrain does not set third-party advertising or tracking cookies. However, some third-party services we integrate with may use their own cookies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed mt-2">
              <li><strong className="text-wb-ink">Google OAuth</strong> — When you sign in with Google, Google may set cookies for authentication purposes (subject to Google&apos;s own privacy policy)</li>
              <li><strong className="text-wb-ink">Vercel Analytics</strong> — If enabled, may collect anonymized usage data (no personally identifiable information)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">4. Essential vs. Non-Essential Cookies</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              All cookies used by WhatsAppBrain are <strong className="text-wb-ink">strictly necessary</strong> for the operation of the Service. We do not use:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed mt-2">
              <li>Advertising or marketing cookies</li>
              <li>Social media tracking cookies</li>
              <li>Analytics cookies that track personally identifiable information</li>
              <li>Cross-site tracking cookies</li>
            </ul>
            <p className="text-sm text-wb-soft leading-relaxed mt-2">
              Because we only use essential cookies, we do not display a cookie consent banner. These cookies are required for the Service to function properly.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">5. Managing Cookies</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              You can control cookies through your browser settings:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed mt-2">
              <li><strong className="text-wb-ink">Block all cookies</strong> — Note: this may break login and dashboard functionality</li>
              <li><strong className="text-wb-ink">Delete cookies</strong> — This will log you out and clear cached data</li>
              <li><strong className="text-wb-ink">Use private/incognito mode</strong> — Cookies are automatically deleted when you close the window</li>
            </ul>
            <p className="text-sm text-wb-soft leading-relaxed mt-2">
              Most browsers allow you to manage cookies in their settings panel. Refer to your browser&apos;s help documentation for specific instructions.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">6. Changes to This Policy</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated &quot;Last updated&quot; date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">7. Contact Us</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              If you have questions about our use of cookies, please contact us at:
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
