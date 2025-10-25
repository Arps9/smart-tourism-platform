import { createClient } from "./server"

// Generate a random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Validate phone number format (Indian format)
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\D/g, ""))
}

// Format phone number to standard format
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 10) {
    return `+91${cleaned}`
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`
  }
  return phone
}

// Create OTP and store in database
export async function createOTP(phoneNumber: string) {
  try {
    const supabase = await createClient()

    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // First, delete any existing unverified OTP for this phone
    try {
      await supabase.from("otp_verifications").delete().eq("phone_number", phoneNumber).eq("is_verified", false)
    } catch (deleteException) {
      // Log but don't fail - old OTP deletion is not critical
      console.error(
        "[v0] Warning: Could not delete old OTP:",
        deleteException instanceof Error ? deleteException.message : "Unknown error",
      )
    }

    // Create new OTP
    const { data, error } = await supabase
      .from("otp_verifications")
      .insert({
        phone_number: phoneNumber,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create OTP: ${error.message}`)
    }

    return { otp, expiresAt }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] createOTP failed:", errorMessage)
    throw error
  }
}

// Verify OTP
export async function verifyOTP(phoneNumber: string, otpCode: string) {
  const supabase = await createClient()

  // Get the OTP record
  const { data: otpRecord, error: fetchError } = await supabase
    .from("otp_verifications")
    .select("*")
    .eq("phone_number", phoneNumber)
    .eq("is_verified", false)
    .single()

  if (fetchError || !otpRecord) {
    throw new Error("OTP not found or expired")
  }

  // Check if OTP is expired
  if (new Date(otpRecord.expires_at) < new Date()) {
    throw new Error("OTP has expired")
  }

  // Check attempts
  if (otpRecord.attempts >= otpRecord.max_attempts) {
    throw new Error("Maximum OTP attempts exceeded")
  }

  // Verify OTP code
  if (otpRecord.otp_code !== otpCode) {
    // Increment attempts
    await supabase
      .from("otp_verifications")
      .update({ attempts: otpRecord.attempts + 1 })
      .eq("id", otpRecord.id)

    throw new Error("Invalid OTP code")
  }

  // Mark OTP as verified
  await supabase.from("otp_verifications").update({ is_verified: true }).eq("id", otpRecord.id)

  return true
}

// Get or create user
export async function getOrCreateUser(phoneNumber: string, fullName?: string) {
  const supabase = await createClient()

  // Check if user exists
  let { data: user, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("phone_number", phoneNumber)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    throw fetchError
  }

  // Create user if doesn't exist
  if (!user) {
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        phone_number: phoneNumber,
        full_name: fullName || "",
        is_verified: true,
      })
      .select()
      .single()

    if (createError) throw createError
    user = newUser
  } else {
    // Update verification status
    await supabase.from("users").update({ is_verified: true }).eq("id", user.id)
  }

  return user
}
