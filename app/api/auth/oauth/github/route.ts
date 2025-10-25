import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/oauth/github/callback`

    if (!clientId) {
      return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 400 })
    }

    const authUrl = new URL("https://github.com/login/oauth/authorize")
    authUrl.searchParams.append("client_id", clientId)
    authUrl.searchParams.append("redirect_uri", redirectUri)
    authUrl.searchParams.append("scope", "user:email")
    authUrl.searchParams.append("allow_signup", "true")

    return NextResponse.json({ authUrl: authUrl.toString() })
  } catch (error) {
    console.error("[v0] GitHub OAuth error:", error)
    return NextResponse.json({ error: "Failed to initiate GitHub login" }, { status: 500 })
  }
}
