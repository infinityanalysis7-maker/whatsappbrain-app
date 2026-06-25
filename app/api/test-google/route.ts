import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const results: Record<string, unknown> = {}
  
  // Test 1: Check env vars
  results.env = {
    clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.length} chars` : "MISSING",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? `${process.env.GOOGLE_CLIENT_SECRET.length} chars` : "MISSING",
    authSecret: process.env.AUTH_SECRET ? `${process.env.AUTH_SECRET.length} chars` : "MISSING",
    authUrl: process.env.AUTH_URL || "MISSING",
  }
  
  // Test 2: Fetch Google OIDC discovery
  try {
    const res = await fetch("https://accounts.google.com/.well-known/openid-configuration")
    results.oidc = { status: res.status, ok: res.ok }
    if (res.ok) {
      const data = await res.json() as Record<string, string>
      results.oidc.issuer = data.issuer
      results.oidc.authorization_endpoint = data.authorization_endpoint
    }
  } catch (e: unknown) {
    results.oidc = { error: e instanceof Error ? e.message : String(e) }
  }
  
  // Test 3: Try to create Google provider
  try {
    const Google = (await import("next-auth/providers/google")).default
    const provider = Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })
    results.provider = { id: provider.id, name: provider.name, ok: true }
  } catch (e: unknown) {
    results.provider = { error: e instanceof Error ? e.message : String(e), name: e instanceof Error ? e.name : "unknown" }
  }
  
  // Test 4: Try NextAuth initialization
  try {
    const { default: NextAuth } = await import("next-auth")
    const config = NextAuth({
      providers: [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID || "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
      ],
    })
    results.nextauth = { ok: true, hasHandlers: !!config.handlers }
  } catch (e: unknown) {
    results.nextauth = { error: e instanceof Error ? e.message : String(e), name: e instanceof Error ? e.name : "unknown" }
  }
  
  return NextResponse.json(results, { status: 200 })
}
