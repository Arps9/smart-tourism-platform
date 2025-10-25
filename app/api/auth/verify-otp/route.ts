import { type NextRequest, NextResponse } from "next/server"
import { verifyOTP, getOrCreateUser, formatPhoneNumber } from "@/lib/supabase/auth-utils"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp, fullName } = await request.json()

    if (!phoneNumber || !otp) {
      return NextResponse.json({ error: "Phone number and OTP are required" }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)

    // Verify OTP
    await verifyOTP(formattedPhone, otp)

    // Get or create user with fullName if provided
    const user = await getOrCreateUser(formattedPhone, fullName)

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        fullName: user.full_name,
        isVerified: user.is_verified,
      },
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify OTP" },
      { status: 400 },
    )
  }
}
