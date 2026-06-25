import { handlers } from '@/auth'

async function handlerWithLogging(request: Request) {
  try {
    const response = await handlers.GET?.(request) ?? new Response('No handler', { status: 404 })
    return response
  } catch (error: unknown) {
    console.error('[auth-route] FULL ERROR:', JSON.stringify({
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'unknown',
      stack: error instanceof Error ? error.stack : undefined,
    }))
    throw error
  }
}

export async function GET(request: Request) {
  try {
    return await handlers.GET(request)
  } catch (error: unknown) {
    console.error('[auth-route] GET ERROR:', JSON.stringify({
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'unknown',
      stack: error instanceof Error ? error.stack : undefined,
    }))
    throw error
  }
}

export async function POST(request: Request) {
  try {
    return await handlers.POST(request)
  } catch (error: unknown) {
    console.error('[auth-route] POST ERROR:', JSON.stringify({
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'unknown',
      stack: error instanceof Error ? error.stack : undefined,
    }))
    throw error
  }
}
