import { NextResponse } from 'next/server'
import { getConversations, getConversation, saveConversation } from '@/lib/db'
import { validateUser } from '@/lib/auth-guard'

// Send message via Meta Cloud API
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

async function sendWhatsAppMessage(to: string, text: string) {
  if (!WHATSAPP_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.log(`[WhatsApp Mock API Manual Send] Sending to ${to}: "${text}"`)
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
    if (!res.ok) {
      console.error('[WhatsApp Manual API Error]', data)
      throw new Error(data.error?.message || 'Meta Cloud API call failed')
    }

    return { mock: false, success: true, data }
  } catch (err) {
    console.error('Failed to send WhatsApp message via Meta API:', err)
    return { success: false, error: err }
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const customerPhone = searchParams.get('customerPhone')

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    if (customerPhone) {
      const conversation = await getConversation(validUserId, customerPhone)
      return NextResponse.json({ success: true, conversation })
    }

    const conversations = await getConversations(validUserId)
    return NextResponse.json({ success: true, conversations })
  } catch (error) {
    console.error('Conversations GET error:', error)
    return NextResponse.json({ error: 'Failed to retrieve conversations' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, userId, customerPhone } = body

    if (!userId || !customerPhone) {
      return NextResponse.json({ error: 'User ID and Customer Phone are required' }, { status: 400 })
    }

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response

    const conversation = await getConversation(userId, customerPhone)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (action === 'send_message') {
      const { text } = body
      if (!text?.trim()) {
        return NextResponse.json({ error: 'Message text required' }, { status: 400 })
      }

      // Append manual reply
      const newMsg = {
        sender: 'owner' as const,
        text: text.trim(),
        timestamp: new Date().toISOString()
      }

      conversation.messages.push(newMsg)
      conversation.updated_at = newMsg.timestamp
      
      // Auto-switch status to human_active when the owner manually sends a message!
      // This is a great premium UX: as soon as the owner types a reply, the bot steps back.
      conversation.status = 'human_active'

      await saveConversation(conversation)
      
      // Call Meta WhatsApp API
      await sendWhatsAppMessage(customerPhone, text.trim())

      return NextResponse.json({ success: true, conversation })
    }

    if (action === 'update_status') {
      const { status } = body
      if (!['bot', 'human_pending', 'human_active'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      conversation.status = status
      conversation.updated_at = new Date().toISOString()
      
      await saveConversation(conversation)
      return NextResponse.json({ success: true, conversation })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Conversations POST error:', error)
    return NextResponse.json({ error: 'Failed to process conversation update' }, { status: 500 })
  }
}
