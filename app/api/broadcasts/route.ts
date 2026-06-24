import { NextResponse } from 'next/server'
import { getBroadcasts, getBroadcast, saveBroadcast, deleteBroadcast, getBroadcastCount, getContacts, getTemplate, DbBroadcast } from '@/lib/db'
import { validateUser } from '@/lib/auth-guard'
import { FREE_PLAN_LIMITS } from '@/lib/limits'

// WhatsApp API helper
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

async function sendWhatsAppMessage(to: string, text: string) {
  if (!WHATSAPP_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.log(`[WhatsApp Mock Broadcast] To: ${to} | "${text.substring(0, 100)}"`)
    return { mock: true, success: true }
  }

  try {
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
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Meta API failed')
    return { mock: false, success: true, data }
  } catch (err) {
    console.error('Broadcast send failed:', err)
    return { success: false, error: err }
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const broadcastId = searchParams.get('broadcastId')

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    if (broadcastId) {
      const broadcast = await getBroadcast(validUserId, broadcastId)
      return NextResponse.json({ success: true, broadcast })
    }

    const broadcasts = await getBroadcasts(validUserId)
    const count = await getBroadcastCount(validUserId)
    return NextResponse.json({ success: true, broadcasts, count, limit: FREE_PLAN_LIMITS.broadcasts })
  } catch (error) {
    console.error('Broadcasts GET error:', error)
    return NextResponse.json({ error: 'Failed to retrieve broadcasts' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, userId } = body

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    if (action === 'create') {
      const { name, templateId, message, recipientTags, scheduledAt } = body
      if (!name || !message) {
        return NextResponse.json({ error: 'Name and message are required' }, { status: 400 })
      }

      const count = await getBroadcastCount(validUserId)
      if (count >= FREE_PLAN_LIMITS.broadcasts) {
        return NextResponse.json({ error: `Broadcast limit reached (${FREE_PLAN_LIMITS.broadcasts}). Upgrade to add more.` }, { status: 403 })
      }

      // Count recipients
      const contacts = await getContacts(validUserId)
      const recipients = recipientTags?.length > 0
        ? contacts.filter(c => c.tags.some(t => recipientTags.includes(t)))
        : contacts

      const broadcast: DbBroadcast = {
        id: `bc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user_id: validUserId,
        name: name.trim(),
        templateId,
        message: message.trim(),
        recipientCount: recipients.length,
        sentCount: 0,
        failedCount: 0,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledAt,
        createdAt: new Date().toISOString()
      }

      await saveBroadcast(broadcast)
      return NextResponse.json({ success: true, broadcast, recipientCount: recipients.length })
    }

    if (action === 'send') {
      const { broadcastId } = body
      if (!broadcastId) {
        return NextResponse.json({ error: 'Broadcast ID required' }, { status: 400 })
      }

      const broadcast = await getBroadcast(validUserId, broadcastId)
      if (!broadcast) {
        return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
      }

      // Get contacts to send to
      const contacts = await getContacts(validUserId)
      if (contacts.length === 0) {
        return NextResponse.json({ error: 'No contacts to send to' }, { status: 400 })
      }

      // Update status to sending
      broadcast.status = 'sending'
      await saveBroadcast(broadcast)

      // Send in background (non-blocking)
      let sentCount = 0
      let failedCount = 0

      for (const contact of contacts) {
        // Replace template variables
        let personalizedMessage = broadcast.message
        personalizedMessage = personalizedMessage.replace(/\{\{name\}\}/gi, contact.name)
        personalizedMessage = personalizedMessage.replace(/\{\{phone\}\}/gi, contact.phone)
        Object.entries(contact.customFields).forEach(([key, value]) => {
          personalizedMessage = personalizedMessage.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), value)
        })

        const result = await sendWhatsAppMessage(contact.phone, personalizedMessage)
        if (result.success) sentCount++
        else failedCount++

        // Rate limit: 50ms between messages
        await new Promise(r => setTimeout(r, 50))
      }

      broadcast.sentCount = sentCount
      broadcast.failedCount = failedCount
      broadcast.recipientCount = contacts.length
      broadcast.status = 'completed'
      broadcast.sentAt = new Date().toISOString()
      await saveBroadcast(broadcast)

      return NextResponse.json({ success: true, broadcast, sentCount, failedCount })
    }

    if (action === 'delete') {
      const { broadcastId } = body
      if (!broadcastId) {
        return NextResponse.json({ error: 'Broadcast ID required' }, { status: 400 })
      }
      await deleteBroadcast(validUserId, broadcastId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Broadcasts POST error:', error)
    return NextResponse.json({ error: 'Failed to process broadcast' }, { status: 500 })
  }
}
