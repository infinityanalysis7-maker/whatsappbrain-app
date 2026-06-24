import { NextResponse } from 'next/server'
import { getCampaigns, getCampaign, saveCampaign, deleteCampaign, getCampaignCount, getContacts, DbCampaign } from '@/lib/db'
import { validateUser } from '@/lib/auth-guard'
import { FREE_PLAN_LIMITS } from '@/lib/limits'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const campaignId = searchParams.get('campaignId')

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    if (campaignId) {
      const campaign = await getCampaign(validUserId, campaignId)
      return NextResponse.json({ success: true, campaign })
    }

    const campaigns = await getCampaigns(validUserId)
    const count = await getCampaignCount(validUserId)
    return NextResponse.json({ success: true, campaigns, count, limit: FREE_PLAN_LIMITS.campaigns })
  } catch (error) {
    console.error('Campaigns GET error:', error)
    return NextResponse.json({ error: 'Failed to retrieve campaigns' }, { status: 500 })
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
      const { name, type, templateId, message, recipientTags, scheduledAt, recurring } = body
      if (!name || !message) {
        return NextResponse.json({ error: 'Name and message are required' }, { status: 400 })
      }

      const count = await getCampaignCount(validUserId)
      if (count >= FREE_PLAN_LIMITS.campaigns) {
        return NextResponse.json({ error: `Campaign limit reached (${FREE_PLAN_LIMITS.campaigns}). Upgrade to add more.` }, { status: 403 })
      }

      const campaign: DbCampaign = {
        id: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user_id: validUserId,
        name: name.trim(),
        type: type || 'broadcast',
        templateId,
        message: message.trim(),
        recipientTags: recipientTags || [],
        scheduledAt,
        recurring,
        status: scheduledAt ? 'active' : 'draft',
        stats: { sent: 0, delivered: 0, read: 0, replied: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await saveCampaign(campaign)
      return NextResponse.json({ success: true, campaign })
    }

    if (action === 'update') {
      const { campaignId, name, type, message, recipientTags, scheduledAt, recurring, status } = body
      if (!campaignId) {
        return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })
      }

      const campaign = await getCampaign(validUserId, campaignId)
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      if (name) campaign.name = name.trim()
      if (type) campaign.type = type
      if (message) campaign.message = message.trim()
      if (recipientTags) campaign.recipientTags = recipientTags
      if (scheduledAt) campaign.scheduledAt = scheduledAt
      if (recurring !== undefined) campaign.recurring = recurring
      if (status) campaign.status = status

      await saveCampaign(campaign)
      return NextResponse.json({ success: true, campaign })
    }

    if (action === 'delete') {
      const { campaignId } = body
      if (!campaignId) {
        return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })
      }
      await deleteCampaign(validUserId, campaignId)
      return NextResponse.json({ success: true })
    }

    if (action === 'get_recipient_count') {
      const { recipientTags } = body
      const contacts = await getContacts(validUserId)
      const recipients = recipientTags?.length > 0
        ? contacts.filter(c => c.tags.some(t => recipientTags.includes(t)))
        : contacts
      return NextResponse.json({ success: true, count: recipients.length })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Campaigns POST error:', error)
    return NextResponse.json({ error: 'Failed to process campaign' }, { status: 500 })
  }
}
