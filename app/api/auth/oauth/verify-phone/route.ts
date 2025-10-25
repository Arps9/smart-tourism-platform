import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createOAuthPendingVerification } from "@/lib/supabase/oauth-utils"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, provider } = await request.json()

    if (!phoneNumber || !provider) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate phone number
    const cleaned = phoneNumber.replace(/\D/g, "")
    if (cleaned.length !== 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
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

    // Create OTP for phone verification
    const { otp } = await createOAuthPendingVerification(
      provider,
      oauthData.provider_user_id,
      oauthData.provider_email,
      oauthData.provider_name,
    )

    // In production, send OTP via SMS service
    console.log(`[v0] OTP for ${phoneNumber}: ${otp}`)

    return NextResponse.json({ success: true, message: "OTP sent to your phone" })
  } catch (error) {
    console.error("[v0] OAuth verify phone error:", error)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
