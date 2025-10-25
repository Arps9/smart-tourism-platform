import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/oauth/google/callback`

    if (!clientId) {
      return NextResponse.json({ error: "Google OAuth not configured" }, { status: 400 })
    }

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.append("client_id", clientId)
    authUrl.searchParams.append("redirect_uri", redirectUri)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("scope", "openid email profile")
    authUrl.searchParams.append("access_type", "offline")

    return NextResponse.json({ authUrl: authUrl.toString() })
  } catch (error) {
    console.error("[v0] Google OAuth error:", error)
    return NextResponse.json({ error: "Failed to initiate Google login" }, { status: 500 })
  }
}
