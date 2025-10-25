export const dynamic = "force-dynamic";
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

    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/oauth/github/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/auth/login?error=config_error", request.url))
    }

    // Exchange code for token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/auth/login?error=token_error", request.url))
    }

    // Get user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const userData = await userResponse.json()

    // Get user email if not in profile
    let userEmail = userData.email
    if (!userEmail) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const emails = await emailResponse.json()
      userEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email
    }

    // Create pending verification for phone OTP
    await createOAuthPendingVerification("github", userData.id.toString(), userEmail, userData.name || userData.login)

    // Store OAuth data in session for verification
    const cookieStore = await cookies()
    cookieStore.set(
      "oauth_pending",
      JSON.stringify({
        provider: "github",
        provider_user_id: userData.id.toString(),
        provider_email: userEmail,
        provider_name: userData.name || userData.login,
        access_token: tokenData.access_token,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
      },
    )

    // Redirect to phone verification
    return NextResponse.redirect(new URL(`/auth/oauth-verify-phone?provider=github&otp_sent=true`, request.url))
  } catch (error) {
    console.error("[v0] GitHub callback error:", error)
    return NextResponse.redirect(new URL("/auth/login?error=callback_error", request.url))
  }
}
