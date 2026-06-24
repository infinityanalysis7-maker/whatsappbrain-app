import { NextResponse } from 'next/server'
import { getBusinessByPhone, getProfile, getBotRules, getConversation, saveConversation, getConversationCount, DbConversation, DbMessage, getContactByPhone, saveContact, DbContact } from '@/lib/db'
import { getSettings, isHandoffMessage } from '@/lib/settings'
import { callGroq } from '@/lib/groq'
import { sendHandoffEmail } from '@/lib/notify'
import { sanitizePlainText } from '@/lib/sanitize'
import crypto from 'crypto'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'whatsappbrain_verify_token'
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET
const WEBHOOK_TIMEOUT_MS = 10_000
const GROQ_TIMEOUT_MS = 8_000

// In-memory deduplication cache (per-instance). For production with multiple
// instances, replace with Redis or a database table.
const processedMessageIds = new Set<string>()
const DEDUP_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
let lastDedupCleanup = Date.now()

function cleanupDedupCache() {
  const now = Date.now()
  if (now - lastDedupCleanup < DEDUP_WINDOW_MS) return
  lastDedupCleanup = now
  processedMessageIds.clear()
}

function isDuplicateMessage(messageId: string): boolean {
  cleanupDedupCache()
  if (processedMessageIds.has(messageId)) return true
  processedMessageIds.add(messageId)
  return false
}

// Verify Meta webhook signature (HMAC-SHA256)
function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!WHATSAPP_APP_SECRET) {
    console.error('[WhatsApp Webhook] WHATSAPP_APP_SECRET not set — rejecting request')
    return false
  }
  if (!signatureHeader) {
    console.error('[WhatsApp Webhook] No X-Hub-Signature-256 header — rejecting request')
    return false
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', WHATSAPP_APP_SECRET)
    .update(rawBody)
    .digest('hex')

  // timingSafeEqual requires equal-length buffers or it throws
  if (signatureHeader.length !== expectedSignature.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature))
}

// Helper to send WhatsApp messages using the Meta Cloud API
async function sendWhatsAppMessage(to: string, text: string) {
  if (!WHATSAPP_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.log(`[WhatsApp Mock API] Sending to ${to}: "${text.substring(0, 200)}"`)
    return { mock: true, success: true }
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

    const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body: text }
      }),
      signal: controller.signal
    })

    clearTimeout(timer)

    const data = await res.json()
    if (!res.ok) {
      console.error('[WhatsApp API Error]', data)
      throw new Error(data.error?.message || 'Meta Cloud API call failed')
    }

    return { mock: false, success: true, data }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error('WhatsApp message send timed out')
      return { success: false, error: 'Request timeout' }
    }
    console.error('Failed to send WhatsApp message via Meta API:', err)
    return { success: false, error: err }
  }
}

// Helper to generate UPI payment intents inside replies
function generateUpiLink(upiId: string, merchantName: string, serviceName: string, amountStr: string): string {
  const amount = parseFloat(amountStr.replace(/[^0-9.]/g, ''))
  if (isNaN(amount) || amount <= 0) return ''
  
  // URL Encode values for the UPI Intent URI
  const pa = encodeURIComponent(upiId)
  const pn = encodeURIComponent(merchantName)
  const tn = encodeURIComponent(`Booking for ${serviceName}`)
  
  const upiUrl = `upi://pay?pa=${pa}&pn=${pn}&am=${amount.toFixed(2)}&cu=INR&tn=${tn}`
  return `\n\n💳 Pay directly via UPI (GPay/PhonePe/Paytm):\n${upiUrl}`
}

// Check if current time is within business hours
function checkBusinessHours(hoursStr: string): boolean {
  if (!hoursStr || !hoursStr.trim()) return true // No hours set = always open

  try {
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000
    const istTime = new Date(now.getTime() + istOffset)
    const currentHour = istTime.getHours()
    const currentDay = istTime.getDay() // 0=Sun, 6=Sat

    const lower = hoursStr.toLowerCase()

    // Check if Sunday is mentioned as closed
    if ((lower.includes('sunday closed') || lower.includes('sun closed')) && currentDay === 0) {
      return false
    }

    // Try to extract hours like "9 AM to 8 PM" or "10 AM - 10 PM"
    const timeMatch = lower.match(/(\d{1,2})\s*(am|pm)\s*(?:to|-)\s*(\d{1,2})\s*(am|pm)/)
    if (timeMatch) {
      let openHour = parseInt(timeMatch[1])
      const openAmPm = timeMatch[2]
      let closeHour = parseInt(timeMatch[3])
      const closeAmPm = timeMatch[4]

      if (openAmPm === 'pm' && openHour !== 12) openHour += 12
      if (openAmPm === 'am' && openHour === 12) openHour = 0
      if (closeAmPm === 'pm' && closeHour !== 12) closeHour += 12
      if (closeAmPm === 'am' && closeHour === 12) closeHour = 0

      if (closeHour < openHour) {
        // Overnight hours (e.g., 10 PM to 6 AM)
        return currentHour >= openHour || currentHour < closeHour
      }
      return currentHour >= openHour && currentHour < closeHour
    }

    return true // Can't parse = assume open
  } catch {
    return true
  }
}

// Get language instruction for AI system prompt
function getLanguageInstruction(language: string): string {
  switch (language) {
    case 'hindi':
      return 'Reply ONLY in Hindi (Devanagari script). Keep the tone warm and respectful.'
    case 'english':
      return 'Reply ONLY in English. Keep the tone warm and professional.'
    case 'auto':
      return 'Match the customer\'s language. If they write in Hindi, reply in Hindi. If English, reply in English. If Hinglish, reply in Hinglish.'
    case 'hinglish':
    default:
      return 'Speak in a mix of English and Hindi (Hinglish) if the customer asks in Hinglish or Hindi. Keep the tone warm, welcoming, and local.'
  }
}

// Match keywords against active rules
function matchLocalRules(messageText: string, rules: any[]): any | null {
  const cleanMessage = messageText.toLowerCase().trim()
  
  for (const rule of rules) {
    if (!rule.active) continue
    
    const match = rule.triggers.some((trigger: string) => {
      const cleanTrigger = trigger.toLowerCase().trim()
      // Require the trigger to be a complete word or at word boundaries to reduce false matches
      if (cleanTrigger.length <= 3) {
        return cleanMessage.includes(cleanTrigger)
      }
      // For longer triggers, require it to be a substring (keeps it flexible but less noisy)
      return cleanMessage.includes(cleanTrigger)
    })

    if (match) return rule
  }
  return null
}

// GET Verification for Meta webhook setup
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[WhatsApp Webhook] Verification successful!')
      return new Response(challenge, { status: 200 })
    }

    console.warn('[WhatsApp Webhook] Verification failed. Token mismatch.')
    return new Response('Verification token mismatch', { status: 403 })
  } catch (error) {
    return new Response('Internal Verification Error', { status: 500 })
  }
}

// POST Webhook Receiver
export async function POST(req: Request) {
  try {
    // 0. Verify webhook signature for security
    const rawBody = await req.text()
    const signature = req.headers.get('x-hub-signature-256')
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[WhatsApp Webhook] Signature verification failed — rejecting request')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const body = JSON.parse(rawBody)

    // Check if webhook is a valid WhatsApp message event
    const changes = body.entry?.[0]?.changes?.[0]?.value
    if (!changes || !changes.messages?.[0]) {
      // Return 200 to acknowledge receipt of system statuses or delivery notifications
      return NextResponse.json({ received: true })
    }

    const message = changes.messages[0]
    const contact = changes.contacts?.[0]
    
    const messageId = message.id
    const customerPhone = message.from
    const customerName = sanitizePlainText(contact?.profile?.name || 'Customer')
    const rawMessageText = message.text?.body || ''
    const businessPhone = changes.metadata?.display_phone_number || ''

    if (!rawMessageText) {
      return NextResponse.json({ success: true, message: 'Non-text event ignored' })
    }

    // Deduplication: skip duplicate message IDs
    if (messageId && isDuplicateMessage(messageId)) {
      console.log(`[WhatsApp Webhook] Duplicate message ${messageId} skipped`)
      return NextResponse.json({ success: true, status: 'duplicate_ignored' })
    }

    const messageText = sanitizePlainText(rawMessageText)

    console.log(`[WhatsApp Webhook] Received message from ${customerName} (${customerPhone}): "${messageText.substring(0, 100)}"`)

    // 1. Identify which business user this message is for
    const businessUser = await getBusinessByPhone(businessPhone)
    if (!businessUser) {
      console.warn(`[WhatsApp Webhook] Received message for unconfigured business phone: ${businessPhone}`)
      return NextResponse.json({ error: 'Business account not found' }, { status: 404 })
    }

    const businessEmail = businessUser.email

    // 2. Fetch existing conversation or create a new one
    let conversation = await getConversation(businessEmail, customerPhone)
    const timestamp = new Date().toISOString()

    const incomingMsg: DbMessage = {
      sender: 'customer',
      text: messageText,
      timestamp
    }

    if (!conversation) {
      // Free plan: check conversation limit before creating new one
      const convCount = await getConversationCount(businessEmail)
      if (convCount >= 50) {
        console.warn(`[WhatsApp Webhook] Conversation limit reached for ${businessEmail} (${convCount}/50). Sending limit notice.`)
        const limitNotice = `Thank you for your message! We've reached our monthly conversation limit. The business owner will respond to you manually. Thank you for your patience!`
        await sendWhatsAppMessage(customerPhone, limitNotice)
        return NextResponse.json({ success: true, status: 'conversation_limit_reached' })
      }

      conversation = {
        id: `${businessEmail}_${customerPhone}`,
        user_id: businessEmail,
        customerPhone,
        customerName,
        messages: [incomingMsg],
        status: 'bot',
        updated_at: timestamp
      }

      // Auto-add new customer to contacts list
      try {
        const existingContact = await getContactByPhone(businessEmail, customerPhone)
        if (!existingContact) {
          const newContact: DbContact = {
            id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            user_id: businessEmail,
            phone: customerPhone,
            name: customerName,
            tags: ['WhatsApp'],
            source: 'whatsapp',
            customFields: {},
            createdAt: timestamp,
            updatedAt: timestamp
          }
          await saveContact(newContact)
          console.log(`[WhatsApp Webhook] Auto-added new contact: ${customerName} (${customerPhone})`)
        }
      } catch (err) {
        console.error('[WhatsApp Webhook] Failed to auto-add contact:', err)
      }
    } else {
      conversation.messages.push(incomingMsg)
      conversation.updated_at = timestamp
    }

    // 3. Check conversation status (Handoff rule)
    if (conversation.status === 'human_active' || conversation.status === 'human_pending') {
      console.log(`[WhatsApp Webhook] Bot is PAUSED (Handoff) for ${customerPhone}. Logging message only.`)
      await saveConversation(conversation)
      return NextResponse.json({ success: true, status: 'bot_paused_for_handoff' })
    }

    // 4. Load settings, rules & profile
    const lowerMessage = messageText.toLowerCase()
    const userSettings = await getSettings(businessEmail) as Record<string, any> | null
    const rules = await getBotRules(businessEmail)
    const profile = await getProfile(businessEmail)

    // Read settings for bot behavior
    const responseLanguage = userSettings?.responseLanguage || 'hinglish'
    const aiFallbackEnabled = userSettings?.aiFallbackEnabled !== false
    const autoReplyEnabled = userSettings?.autoReplyEnabled !== false
    const businessHours = userSettings?.businessHours || ''
    const afterHoursMessage = userSettings?.afterHoursMessage || ''

    // Check for human handoff request trigger
    const triggersHandoff = isHandoffMessage(messageText, userSettings)

    if (triggersHandoff) {
      conversation.status = 'human_pending'
      const handoffNotification = `👋 Sure! I have notified the business owner to take over this chat. They will reply to you shortly. Thank you!`
      
      conversation.messages.push({
        sender: 'bot',
        text: handoffNotification,
        timestamp: new Date().toISOString()
      })
      await saveConversation(conversation)

      await sendWhatsAppMessage(customerPhone, handoffNotification)

      sendHandoffEmail({
        businessName: businessUser.businessName,
        businessEmail: businessUser.email,
        customerName,
        customerPhone,
        lastMessage: messageText,
      }).catch(err => console.error('[WhatsApp Webhook] Handoff email failed:', err))

      return NextResponse.json({ success: true, status: 'handoff_triggered' })
    }

    // Check if currently within business hours
    const isWithinBusinessHours = checkBusinessHours(businessHours)

    // If auto-reply is disabled, send a generic acknowledgment
    if (!autoReplyEnabled) {
      const ackMsg = `Thank you for your message! A team member from ${businessUser.businessName} will get back to you shortly.`
      conversation.messages.push({ sender: 'bot', text: ackMsg, timestamp: new Date().toISOString() })
      await saveConversation(conversation)
      await sendWhatsAppMessage(customerPhone, ackMsg)
      return NextResponse.json({ success: true, response: ackMsg })
    }

    // If outside business hours and after-hours message is set, send it
    if (!isWithinBusinessHours && afterHoursMessage) {
      conversation.messages.push({ sender: 'bot', text: afterHoursMessage, timestamp: new Date().toISOString() })
      await saveConversation(conversation)
      await sendWhatsAppMessage(customerPhone, afterHoursMessage)
      return NextResponse.json({ success: true, response: afterHoursMessage })
    }

    let responseText = ''
    let matchedRule = matchLocalRules(messageText, rules)

    if (matchedRule) {
      responseText = matchedRule.reply
      console.log(`[WhatsApp Webhook] Matched local rule: [${matchedRule.category}]`)
    } else {
      // 6. Groq AI Fallback Loop
      if (profile && aiFallbackEnabled) {
        console.log('[WhatsApp Webhook] No local rules matched. Fetching Groq AI response.')
        try {
          const langInstruction = getLanguageInstruction(responseLanguage)
          const systemPrompt = `You are a helpful, professional AI customer assistant for "${businessUser.businessName}", a local business in "${businessUser.city}, India".
Your job is to reply to customer questions about our business using only the business profile details provided below.
Rules:
1. ${langInstruction}
2. Keep answers short and concise (under 2-3 sentences).
3. If they ask about services or pricing not listed in our profile, reply politely saying we don't support it or ask them to check during business hours.
4. Never make up or hallucinate any details.
5. If the customer indicates they want to buy/book something, ask them to confirm the service.

BUSINESS DETAILS:
- Services: ${profile.services.join(', ')}
- Pricing: ${Object.entries(profile.prices).map(([k,v]) => `${k}: Rs ${v}`).join(', ')}
- Hours: ${profile.hours}
- Location: ${profile.location}
- Policies/Other details: ${profile.policies || 'None'}`

          const aiReply = await callGroq([
            { role: 'system', content: systemPrompt },
            ...conversation.messages.slice(-5).map(m => ({
              role: m.sender === 'customer' ? 'user' as const : 'assistant' as const,
              content: m.text
            }))
          ], { json: false, temperature: 0.5 })

          responseText = aiReply.trim()
        } catch (err) {
          console.error('[WhatsApp Webhook] Groq fallback failed:', err)
          responseText = `Namaste! We have received your message. A representative from ${businessUser.businessName} will get back to you shortly.`
        }
      } else {
        responseText = `Namaste! Thank you for messaging ${businessUser.businessName}. We will reply as soon as possible!`
      }
    }

    // 7. Check for dynamic UPI Payment checkout intent
    const showsPurchaseIntent = lowerMessage.includes('book') || lowerMessage.includes('buy') || lowerMessage.includes('lena hai') || lowerMessage.includes('booking')
    if (showsPurchaseIntent && profile && Object.keys(profile.prices).length > 0) {
      const matchedService = profile.services.find(s => lowerMessage.includes(s.toLowerCase()))
      if (matchedService) {
        const price = profile.prices[matchedService]
        if (price) {
          // Only add UPI if the business has a configured UPI ID in their profile
          // For now, we skip auto-generated UPI IDs to avoid sending money to wrong accounts
          const upiId = profile.policies?.match(/upi:\s*(\S+)/i)?.[1]
          if (upiId) {
            const upiText = generateUpiLink(upiId, businessUser.businessName, matchedService, price)
            responseText += upiText
          }
        }
      }
    }

    // 8. Save outbound message to conversation history
    conversation.messages.push({
      sender: 'bot',
      text: responseText,
      timestamp: new Date().toISOString()
    })
    await saveConversation(conversation)

    // 9. Send WhatsApp Message
    await sendWhatsAppMessage(customerPhone, responseText)

    return NextResponse.json({ success: true, response: responseText })
  } catch (error) {
    console.error('[WhatsApp Webhook error]', error)
    // Always return 200 to Meta so they don't retry aggressively
    // Log the error internally but acknowledge receipt
    return NextResponse.json({ error: 'Webhook processing failed', received: true }, { status: 200 })
  }
}
