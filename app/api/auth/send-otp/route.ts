import { type NextRequest, NextResponse } from "next/server"
import { createOTP, validatePhoneNumber, formatPhoneNumber } from "@/lib/supabase/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    // Validate phone number
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)

    try {
      const { otp } = await createOTP(formattedPhone)

      // TODO: In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      // For now, log the OTP (remove in production)
      console.log(`[DEV] OTP for ${formattedPhone}: ${otp}`)

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
        // Remove in production - only for development
        ...(process.env.NODE_ENV === "development" && { otp }),
      })
    } catch (dbError) {
      console.error("[v0] Database error in createOTP:", dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : "Database error"
      return NextResponse.json({ error: `Failed to create OTP: ${errorMessage}` }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Send OTP error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to send OTP"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
