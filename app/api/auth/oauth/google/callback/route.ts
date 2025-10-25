import { type NextRequest, NextResponse } from "next/server"
import { createOAuthPendingVerification } from "@/lib/supabase/oauth-utils"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(new URL(`/auth/login?error=${error}`, request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/auth/login?error=no_code", request.url))
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/oauth/google/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/auth/login?error=config_error", request.url))
    }

    // Exchange code for token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/auth/login?error=token_error", request.url))
    }

    // Get user info
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const userData = await userResponse.json()

    // Create pending verification for phone OTP
    const { otp } = await createOAuthPendingVerification("google", userData.id, userData.email, userData.name)

    // Store OAuth data in session for verification
    const cookieStore = await cookies()
    cookieStore.set(
      "oauth_pending",
      JSON.stringify({
        provider: "google",
        provider_user_id: userData.id,
        provider_email: userData.email,
        provider_name: userData.name,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
      },
    )

    // Redirect to phone verification
    return NextResponse.redirect(new URL(`/auth/oauth-verify-phone?provider=google&otp_sent=true`, request.url))
  } catch (error) {
    console.error("[v0] Google callback error:", error)
    return NextResponse.redirect(new URL("/auth/login?error=callback_error", request.url))
  }
}
