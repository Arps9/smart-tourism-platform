import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyOAuthWithPhone, findOrCreateUserFromOAuth, linkOAuthProvider } from "@/lib/supabase/oauth-utils"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp, provider } = await request.json()

    if (!phoneNumber || !otp || !provider) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get OAuth pending data from cookie
    const cookieStore = await cookies()
    const oauthPendingCookie = cookieStore.get("oauth_pending")

    if (!oauthPendingCookie) {
      return NextResponse.json({ error: "OAuth session expired" }, { status: 400 })
    }

    const oauthData = JSON.parse(oauthPendingCookie.value)

    if (oauthData.provider !== provider) {
      return NextResponse.json({ error: "Provider mismatch" }, { status: 400 })
    }

    // Verify OTP
    await verifyOAuthWithPhone(provider, oauthData.provider_user_id, phoneNumber, otp)

    // Find or create user
    const user = await findOrCreateUserFromOAuth(
      provider,
      oauthData.provider_user_id,
      oauthData.provider_email,
      oauthData.provider_name,
      phoneNumber,
    )

    // Link OAuth provider
    await linkOAuthProvider(
      user.id,
      provider,
      oauthData.provider_user_id,
      oauthData.provider_email,
      oauthData.provider_name,
      oauthData.access_token,
      oauthData.refresh_token,
    )

    // Create session
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    // Create session token
    const { data: session, error: sessionError } = await supabase
      .from("user_sessions")
      .insert({
        user_id: user.id,
        token: Math.random().toString(36).substring(2),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Set session cookie
    const response = NextResponse.json({ success: true, user })

    response.cookies.set("session_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    // Clear OAuth pending cookie
    response.cookies.delete("oauth_pending")

    return response
  } catch (error) {
    console.error("[v0] OAuth verify OTP error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify OTP" },
      { status: 500 },
    )
  }
}
