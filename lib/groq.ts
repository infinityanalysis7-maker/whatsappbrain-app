const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
/** llama3-8b-8192 was decommissioned — use current Groq model */
export const GROQ_MODEL = 'llama-3.1-8b-instant'
const GROQ_TIMEOUT_MS = 10_000

interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export function isGroqConfigured(): boolean {
  const key = process.env.GROQ_API_KEY
  return !!(key && key !== 'your_groq_api_key' && key.startsWith('gsk_'))
}

export async function callGroq(
  messages: GroqMessage[],
  options?: { json?: boolean; temperature?: number }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!isGroqConfigured()) {
    throw new Error('GROQ_API_KEY not configured')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS)

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: options?.temperature ?? 0.3,
        ...(options?.json ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq API error (${res.status}): ${err}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty Groq response')
    return content
  } catch (err: any) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      throw new Error('Groq API request timed out after 10s')
    }
    throw err
  }
}

export function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(cleaned) as T
}
