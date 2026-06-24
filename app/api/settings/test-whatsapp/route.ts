import { NextResponse } from 'next/server'

interface TestResult {
  step: string
  status: 'pass' | 'fail' | 'skip'
  message: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { accessToken, phoneNumberId, webhookUrl, verifyToken } = body

    const results: TestResult[] = []

    // Step 1: Check Access Token
    if (!accessToken || !accessToken.trim()) {
      results.push({
        step: 'Access Token',
        status: 'fail',
        message: 'Access Token is empty. Get one from Meta App Dashboard → WhatsApp → API Setup.',
      })
      return NextResponse.json({ success: false, results })
    }

    results.push({ step: 'Access Token', status: 'pass', message: 'Token format looks valid.' })

    // Step 2: Validate Access Token against Meta API
    try {
      const tokenRes = await fetch(`https://graph.facebook.com/v21.0/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const tokenData = await tokenRes.json()

      if (tokenRes.ok && tokenData.id) {
        results.push({
          step: 'Token Validity',
          status: 'pass',
          message: `Token is valid. App ID: ${tokenData.id}`,
        })
      } else {
        const errMsg = tokenData.error?.message || 'Unknown error'
        results.push({
          step: 'Token Validity',
          status: 'fail',
          message: `Token is invalid or expired. ${errMsg}`,
        })
        return NextResponse.json({ success: false, results })
      }
    } catch {
      results.push({
        step: 'Token Validity',
        status: 'fail',
        message: 'Could not reach Meta API. Check your internet connection.',
      })
      return NextResponse.json({ success: false, results })
    }

    // Step 3: Validate Phone Number ID
    if (!phoneNumberId || !phoneNumberId.trim()) {
      results.push({
        step: 'Phone Number',
        status: 'fail',
        message: 'Phone Number ID is empty. Find it in Meta App Dashboard → WhatsApp → API Setup.',
      })
      return NextResponse.json({ success: false, results })
    }

    try {
      const phoneRes = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=verified_name,quality_rating`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const phoneData = await phoneRes.json()

      if (phoneRes.ok && phoneData.verified_name) {
        results.push({
          step: 'Phone Number',
          status: 'pass',
          message: `Connected to "${phoneData.verified_name}"${phoneData.quality_rating ? ` (Quality: ${phoneData.quality_rating})` : ''}`,
        })
      } else {
        const errMsg = phoneData.error?.message || 'Phone number not found'
        results.push({
          step: 'Phone Number',
          status: 'fail',
          message: `Phone Number ID invalid. ${errMsg}`,
        })
        return NextResponse.json({ success: false, results })
      }
    } catch {
      results.push({
        step: 'Phone Number',
        status: 'fail',
        message: 'Could not verify phone number. Please try again.',
      })
      return NextResponse.json({ success: false, results })
    }

    // Step 4: Check Webhook URL reachability
    if (webhookUrl) {
      try {
        const token = verifyToken || 'whatsappbrain_verify_token'
        const webhookRes = await fetch(`${webhookUrl}?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=test123`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
        })
        if (webhookRes.ok) {
          const text = await webhookRes.text()
          if (text === 'test123') {
            results.push({
              step: 'Webhook',
              status: 'pass',
              message: 'Webhook is reachable and responding correctly.',
            })
          } else {
            results.push({
              step: 'Webhook',
              status: 'fail',
              message: `Webhook responded but verification failed. Response: ${text.substring(0, 100)}`,
            })
          }
        } else {
          results.push({
            step: 'Webhook',
            status: 'fail',
            message: `Webhook returned status ${webhookRes.status}.`,
          })
        }
      } catch {
        results.push({
          step: 'Webhook',
          status: 'fail',
          message: 'Webhook is not reachable. Make sure your app is deployed and the URL is correct.',
        })
      }
    } else {
      results.push({
        step: 'Webhook',
        status: 'skip',
        message: 'Webhook URL not available (running locally?).',
      })
    }

    const allPassed = results.every((r) => r.status === 'pass' || r.status === 'skip')
    return NextResponse.json({ success: allPassed, results })
  } catch (error) {
    console.error('Test WhatsApp connection error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}
