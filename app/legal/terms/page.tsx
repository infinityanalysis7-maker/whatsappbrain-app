import Link from 'next/link'
import { Brain, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — WhatsAppBrain',
  description: 'WhatsAppBrain terms of service. Read our terms and conditions.',
}

export default function TermsOfServicePage() {
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
          <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight mb-3">Terms of Service</h1>
          <p className="text-sm text-wb-soft">Last updated: {lastUpdated}</p>
        </div>

        <div className="max-w-none space-y-8">
          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              By accessing or using WhatsAppBrain (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you are using the Service on behalf of a business, you represent that you have the authority to bind that business to these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">2. Description of Service</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              WhatsAppBrain provides an AI-powered WhatsApp auto-reply service for small businesses. The Service allows you to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed mt-2">
              <li>Configure automated responses to customer WhatsApp messages</li>
              <li>Use AI-generated or custom rules for bot responses</li>
              <li>Monitor conversations through a dashboard</li>
              <li>Receive handoff notifications when customers request human support</li>
              <li>View conversation analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">3. Account Registration</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed">
              <li>You must provide accurate, complete registration information</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 18 years old to create an account</li>
              <li>One account per business. Duplicate accounts may be suspended</li>
              <li>You must not share your account with others</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">4. Free Plan & Limits</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              WhatsAppBrain currently offers a free plan with the following limits:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed mt-2">
              <li>50 conversations per month</li>
              <li>5 bot rules</li>
            </ul>
            <p className="text-sm text-wb-soft leading-relaxed mt-2">
              When limits are reached, the Service will notify customers that a human response is pending. We reserve the right to modify free plan limits with 30 days&apos; notice.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">5. Your Responsibilities</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed mt-2">
              <li>Comply with WhatsApp Business Policy and Meta&apos;s Terms of Service</li>
              <li>Only use the Service for legitimate business communication</li>
              <li>Not send spam, promotional messages, or unsolicited content through the Service</li>
              <li>Not use the Service to impersonate another business or person</li>
              <li>Not attempt to reverse-engineer, decompile, or hack the Service</li>
              <li>Not use the Service to harass, threaten, or abuse customers</li>
              <li>Take responsibility for the content of bot responses you configure</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">6. AI-Generated Content</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              WhatsAppBrain uses AI (powered by Groq) to generate bot responses and business suggestions. You acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed mt-2">
              <li>AI-generated responses may occasionally be inaccurate or inappropriate</li>
              <li>You are responsible for reviewing and approving AI-generated content</li>
              <li>AI-generated pricing suggestions are estimates and should be verified</li>
              <li>We do not guarantee the accuracy of any AI-generated content</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">7. Intellectual Property</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              The Service, including its design, code, and content, is owned by WhatsAppBrain and protected by intellectual property laws. You retain ownership of your business data, conversation content, and bot rules. By using the Service, you grant us a limited license to process your data as necessary to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">8. Limitation of Liability</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed mt-2">
              <li>The Service is provided &quot;as is&quot; without warranties of any kind</li>
              <li>We are not liable for any indirect, incidental, or consequential damages</li>
              <li>Our total liability shall not exceed the amount you paid for the Service in the past 12 months (currently ₹0 for the free plan)</li>
              <li>We are not responsible for missed messages, lost customers, or business losses resulting from Service downtime or errors</li>
              <li>We are not liable for the actions or content of third-party services (Meta, Groq, Resend, Supabase)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">9. Termination</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              You may terminate your account at any time by contacting us or deleting your account from the dashboard. We may suspend or terminate your access if:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-wb-soft leading-relaxed mt-2">
              <li>You violate these Terms</li>
              <li>You use the Service for prohibited activities</li>
              <li>We are required to do so by law</li>
              <li>The Service is discontinued</li>
            </ul>
            <p className="text-sm text-wb-soft leading-relaxed mt-2">
              Upon termination, your data will be deleted within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">10. Changes to Terms</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              We reserve the right to modify these Terms at any time. Material changes will be communicated via email or a notice on the Service. Continued use after changes constitutes acceptance. If you disagree with changes, you should stop using the Service and close your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">11. Governing Law</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Indore, Madhya Pradesh, India.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-wb-ink mb-3">12. Contact</h2>
            <p className="text-sm text-wb-soft leading-relaxed">
              Questions about these Terms? Contact us at:
            </p>
            <div className="mt-3 text-sm text-wb-soft">
              <p>Email: <a href="mailto:legal@whatsappbrain.com" className="text-wb-dark font-medium hover:underline">legal@whatsappbrain.com</a></p>
              <p>Website: <a href="https://whatsappbrain.com" className="text-wb-dark font-medium hover:underline">whatsappbrain.com</a></p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
