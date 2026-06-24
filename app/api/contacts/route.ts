import { NextResponse } from 'next/server'
import { getContacts, getContact, saveContact, deleteContact, getContactCount, DbContact } from '@/lib/db'
import { validateUser } from '@/lib/auth-guard'
import { FREE_PLAN_LIMITS } from '@/lib/limits'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const contactId = searchParams.get('contactId')
    const phone = searchParams.get('phone')

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    if (contactId) {
      const contact = await getContact(validUserId, contactId)
      return NextResponse.json({ success: true, contact })
    }

    if (phone) {
      const { getContactByPhone } = await import('@/lib/db')
      const contact = await getContactByPhone(validUserId, phone)
      return NextResponse.json({ success: true, contact })
    }

    const contacts = await getContacts(validUserId)
    const count = await getContactCount(validUserId)
    return NextResponse.json({ success: true, contacts, count, limit: FREE_PLAN_LIMITS.contacts })
  } catch (error) {
    console.error('Contacts GET error:', error)
    return NextResponse.json({ error: 'Failed to retrieve contacts' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, userId } = body

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    if (action === 'create' || action === 'upsert') {
      const { phone, name, email, tags, notes, customFields, source } = body
      if (!phone || !name) {
        return NextResponse.json({ error: 'Phone and name are required' }, { status: 400 })
      }

      // Check limit
      const count = await getContactCount(validUserId)
      if (count >= FREE_PLAN_LIMITS.contacts) {
        return NextResponse.json({ error: `Contact limit reached (${FREE_PLAN_LIMITS.contacts}). Upgrade to add more.` }, { status: 403 })
      }

      // Check if contact already exists by phone
      const { getContactByPhone } = await import('@/lib/db')
      const existing = await getContactByPhone(validUserId, phone)

      const contact: DbContact = {
        id: existing?.id || `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user_id: validUserId,
        phone: phone.replace(/\D/g, '').slice(-10),
        name: name.trim(),
        email: email || undefined,
        tags: tags || [],
        notes: notes || '',
        customFields: customFields || {},
        source: source || 'manual',
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await saveContact(contact)
      return NextResponse.json({ success: true, contact })
    }

    if (action === 'delete') {
      const { contactId } = body
      if (!contactId) {
        return NextResponse.json({ error: 'Contact ID required' }, { status: 400 })
      }
      await deleteContact(validUserId, contactId)
      return NextResponse.json({ success: true })
    }

    if (action === 'bulk_create') {
      const { contacts: newContacts } = body
      if (!Array.isArray(newContacts)) {
        return NextResponse.json({ error: 'Contacts array required' }, { status: 400 })
      }

      const count = await getContactCount(validUserId)
      const remaining = FREE_PLAN_LIMITS.contacts - count
      if (remaining <= 0) {
        return NextResponse.json({ error: `Contact limit reached (${FREE_PLAN_LIMITS.contacts}). ${newContacts.length} contacts were not added.` }, { status: 403 })
      }

      const created = []
      const skipped = []
      const toCreate = newContacts.slice(0, remaining)

      for (const c of toCreate) {
        if (!c.phone || !c.name) {
          skipped.push({ ...c, reason: 'Missing phone or name' })
          continue
        }

        const { getContactByPhone } = await import('@/lib/db')
        const existing = await getContactByPhone(validUserId, c.phone)
        const contact: DbContact = {
          id: existing?.id || `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          user_id: validUserId,
          phone: c.phone.replace(/\D/g, '').slice(-10),
          name: c.name.trim(),
          email: c.email,
          tags: c.tags || [],
          notes: c.notes || '',
          customFields: c.customFields || {},
          source: c.source || 'csv',
          createdAt: existing?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        await saveContact(contact)
        created.push(contact)
      }

      if (newContacts.length > remaining) {
        skipped.push(...newContacts.slice(remaining).map((c: any) => ({ ...c, reason: 'Limit reached' })))
      }

      return NextResponse.json({ success: true, created: created.length, skipped: skipped.length, total: count + created.length })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Contacts POST error:', error)
    return NextResponse.json({ error: 'Failed to process contact' }, { status: 500 })
  }
}
