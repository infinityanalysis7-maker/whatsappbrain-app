import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface TestResults {
  env: {
    clientId: string
    clientSecret: string
    authSecret: string
    authUrl: string
  }
  oidc: { status: number; ok: boolean; issuer?: string; authorization_endpoint?: string } | { error: string }
  provider: { id: string; name: string; ok: boolean } | { error: string; name: string }
  nextauth: { ok: boolean; hasHandlers: boolean } | { error: string; name: string }
}

export async function GET() {
  const results: TestResults = {
    env: { clientId: "", clientSecret: "", authSecret: "", authUrl: "" },
    oidc: { status: 0, ok: false },
    provider: { error: "", name: "" },
    nextauth: { error: "", name: "" },
  }

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
    const oidcResult: TestResults["oidc"] = { status: res.status, ok: res.ok }
    if (res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json()
      oidcResult.issuer = data.issuer
      oidcResult.authorization_endpoint = data.authorization_endpoint
    }
    results.oidc = oidcResult
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
        (await import("next-auth/providers/google")).default({
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
