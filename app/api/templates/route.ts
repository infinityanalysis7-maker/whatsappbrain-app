import { NextResponse } from 'next/server'
import { getTemplates, getTemplate, saveTemplate, deleteTemplate, getTemplateCount, DbTemplate } from '@/lib/db'
import { validateUser } from '@/lib/auth-guard'
import { FREE_PLAN_LIMITS } from '@/lib/limits'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const templateId = searchParams.get('templateId')

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    if (templateId) {
      const template = await getTemplate(validUserId, templateId)
      return NextResponse.json({ success: true, template })
    }

    const templates = await getTemplates(validUserId)
    const count = await getTemplateCount(validUserId)
    return NextResponse.json({ success: true, templates, count, limit: FREE_PLAN_LIMITS.templates })
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json({ error: 'Failed to retrieve templates' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, userId } = body

    const auth = await validateUser(req, userId)
    if (!auth.ok) return auth.response
    const validUserId = auth.userId

    if (action === 'create' || action === 'update') {
      const { templateId, name, language, category, body: templateBody, variables } = body
      if (!name || !templateBody) {
        return NextResponse.json({ error: 'Name and body are required' }, { status: 400 })
      }

      // Check limit on create
      if (action === 'create') {
        const count = await getTemplateCount(validUserId)
        if (count >= FREE_PLAN_LIMITS.templates) {
          return NextResponse.json({ error: `Template limit reached (${FREE_PLAN_LIMITS.templates}). Upgrade to add more.` }, { status: 403 })
        }
      }

      // Extract variables from template body ({{variable}} format)
      const extractedVars = templateBody.match(/\{\{(\w+)\}\}/g)?.map((v: string) => v.replace(/\{\{|\}\}/g, '')) || []

      const template: DbTemplate = {
        id: templateId || `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user_id: validUserId,
        name: name.trim(),
        language: language || 'en',
        category: category || 'marketing',
        body: templateBody.trim(),
        variables: variables || extractedVars,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await saveTemplate(template)
      return NextResponse.json({ success: true, template })
    }

    if (action === 'delete') {
      const { templateId } = body
      if (!templateId) {
        return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
      }
      await deleteTemplate(validUserId, templateId)
      return NextResponse.json({ success: true })
    }

    if (action === 'submit_for_approval') {
      const { templateId } = body
      if (!templateId) {
        return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
      }
      const template = await getTemplate(validUserId, templateId)
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      template.status = 'pending'
      template.updatedAt = new Date().toISOString()
      await saveTemplate(template)
      return NextResponse.json({ success: true, template })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json({ error: 'Failed to process template' }, { status: 500 })
  }
}
