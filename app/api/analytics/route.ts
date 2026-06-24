import { NextResponse } from 'next/server'
import { getConversations, getBotRules } from '@/lib/db'
import { validateUser } from '@/lib/auth-guard'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    const conversations = await getConversations(validUserId)
    const rules = await getBotRules(validUserId)

    // ─── Basic counts ───
    const totalConversations = conversations.length
    const botReplied = conversations.filter((c) => c.status === 'bot').length
    const humanPending = conversations.filter((c) => c.status === 'human_pending').length
    const humanActive = conversations.filter((c) => c.status === 'human_active').length
    const totalHandoffs = humanPending + humanActive

    // Unique customers
    const uniquePhones = new Set(conversations.map((c) => c.customerPhone))
    const uniqueCustomers = uniquePhones.size

    // ─── Total messages ───
    let totalBotMessages = 0
    let totalCustomerMessages = 0
    let totalOwnerMessages = 0
    conversations.forEach((c) => {
      c.messages.forEach((m) => {
        if (m.sender === 'bot') totalBotMessages++
        else if (m.sender === 'customer') totalCustomerMessages++
        else if (m.sender === 'owner') totalOwnerMessages++
      })
    })

    // ─── Avg response time (bot reply timestamp - customer message timestamp) ───
    let responseTimeSum = 0
    let responseCount = 0
    conversations.forEach((c) => {
      for (let i = 1; i < c.messages.length; i++) {
        const prev = c.messages[i - 1]
        const curr = c.messages[i]
        if (prev.sender === 'customer' && curr.sender === 'bot') {
          const diff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()
          if (diff > 0 && diff < 60000) {
            responseTimeSum += diff
            responseCount++
          }
        }
      }
    })
    const avgResponseTimeMs = responseCount > 0 ? responseTimeSum / responseCount : 0
    const avgResponseTimeSec = Math.round(avgResponseTimeMs / 1000 * 10) / 10

    // ─── Bot resolution rate (conversations fully handled by bot without handoff) ───
    const botResolutionRate = totalConversations > 0
      ? Math.round(((totalConversations - totalHandoffs) / totalConversations) * 100)
      : 0

    // ─── Conversion rate placeholder (requires explicit booking tracking) ───
    // TODO: Track actual bookings/conversions in a separate table for accurate metrics
    const conversionRate = 0

    // ─── Activity by day (last 30 days) ───
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyActivity: Record<string, { conversations: number; messages: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      dailyActivity[key] = { conversations: 0, messages: 0 }
    }

    conversations.forEach((c) => {
      const updatedDate = new Date(c.updated_at)
      if (updatedDate >= thirtyDaysAgo) {
        const key = updatedDate.toISOString().split('T')[0]
        if (dailyActivity[key]) {
          dailyActivity[key].conversations++
          dailyActivity[key].messages += c.messages.length
        }
      }
    })

    const activityChart = Object.entries(dailyActivity).map(([date, data]) => ({
      date,
      label: new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      ...data,
    }))

    // ─── Activity by hour (0-23) ───
    const hourlyActivity: number[] = new Array(24).fill(0)
    conversations.forEach((c) => {
      c.messages.forEach((m) => {
        if (m.sender === 'customer') {
          const hour = new Date(m.timestamp).getHours()
          hourlyActivity[hour]++
        }
      })
    })
    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity))

    // ─── Recent conversations (last 10) ───
    const recentConversations = conversations.slice(0, 10).map((c) => {
      const lastMsg = c.messages[c.messages.length - 1]
      return {
        customerName: c.customerName,
        customerPhone: c.customerPhone,
        status: c.status,
        messageCount: c.messages.length,
        lastMessage: lastMsg?.text?.substring(0, 80) || '',
        lastTimestamp: c.updated_at,
      }
    })

    // ─── Rule usage (count how many rules in each category) ───
    const ruleCategories = rules.reduce(
      (acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalConversations,
          botReplied,
          totalHandoffs,
          uniqueCustomers,
          totalBotMessages,
          totalCustomerMessages,
          totalOwnerMessages,
          avgResponseTimeSec,
          botResolutionRate,
          conversionRate,
        },
        activityChart,
        hourlyActivity: hourlyActivity.map((count, hour) => ({
          hour,
          label: `${hour}:00`,
          messages: count,
        })),
        peakHour,
        recentConversations,
        ruleCategories,
      },
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 })
  }
}
