const RESEND_API_KEY = process.env.RESEND_API_KEY
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL // Where to send alerts

export const isEmailConfigured = !!(
  RESEND_API_KEY &&
  RESEND_API_KEY.startsWith('re_') &&
  NOTIFICATION_EMAIL
)

interface HandoffEmailParams {
  businessName: string
  businessEmail: string
  customerName: string
  customerPhone: string
  lastMessage: string
}

export async function sendHandoffEmail(params: HandoffEmailParams): Promise<boolean> {
  if (!isEmailConfigured) {
    console.log('[Notify] Email not configured — skipping handoff notification')
    return false
  }

  const { businessName, businessEmail, customerName, customerPhone, lastMessage } = params

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `WhatsAppBrain <notifications@${process.env.RESEND_DOMAIN || 'whatsappbrain.com'}>`,
        to: [NOTIFICATION_EMAIL],
        subject: `🚨 Customer needs you: ${customerName} from ${businessName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #25D366, #128C7E); border-radius: 12px; padding: 24px; color: white; margin-bottom: 20px;">
              <h1 style="margin: 0 0 8px 0; font-size: 22px;">Customer Requested Handoff</h1>
              <p style="margin: 0; opacity: 0.9; font-size: 14px;">${customerName} wants to talk to you directly</p>
            </div>

            <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #666; width: 120px;">Customer</td>
                  <td style="padding: 6px 0; font-weight: 600;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;">Phone</td>
                  <td style="padding: 6px 0; font-weight: 600;">+${customerPhone}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;">Business</td>
                  <td style="padding: 6px 0; font-weight: 600;">${businessName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666; vertical-align: top;">Last Message</td>
                  <td style="padding: 6px 0; background: white; border-radius: 6px; border: 1px solid #e8e0cf; padding: 10px;">"${lastMessage}"</td>
                </tr>
              </table>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 13px; color: #856404;">
                <strong>⚡ Quick Action:</strong> Open your WhatsAppBrain dashboard to reply to this customer, or reply directly on WhatsApp.
              </p>
            </div>

            <p style="text-align: center; font-size: 12px; color: #999;">
              Sent by WhatsAppBrain • Your AI WhatsApp Assistant
            </p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('[Notify] Resend API error:', error)
      return false
    }

    console.log(`[Notify] Handoff email sent to ${NOTIFICATION_EMAIL} for ${customerName}`)
    return true
  } catch (err) {
    console.error('[Notify] Failed to send handoff email:', err)
    return false
  }
}
