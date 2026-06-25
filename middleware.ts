import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  // Only redirect unauthenticated users away from dashboard
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    const signInUrl = new URL("/login", req.nextUrl.origin)
    return NextResponse.redirect(signInUrl)
  }
})

// CRITICAL: This matcher prevents Next.js 16 from auto-detecting the auth
// export and applying it to ALL routes (which was causing 307 redirects on
// every API route like /api/health, /api/diagnostic, etc.)
export const config = {
  matcher: ["/dashboard/:path*"]
}
