import { createServerClient } from "@supabase/ssr"

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables")
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

// Store pending OAuth verification
export async function createOAuthPendingVerification(
  provider: string,
  providerUserId: string,
  providerEmail: string,
  providerName: string,
) {
  const supabase = getSupabaseClient()
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  const { data, error } = await supabase
    .from("oauth_pending_verification")
    .upsert({
      provider,
      provider_user_id: providerUserId,
      provider_email: providerEmail,
      provider_name: providerName,
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
      is_verified: false,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating OAuth pending verification:", error)
    throw error
  }

  return { otp, expiresAt, data }
}

// Get pending OAuth verification
export async function getPendingOAuthVerification(provider: string, providerUserId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("oauth_pending_verification")
    .select("*")
    .eq("provider", provider)
    .eq("provider_user_id", providerUserId)
    .single()

  if (error && error.code !== "PGRST116") {
    throw error
  }

  return data
}

// Verify OAuth with phone OTP
export async function verifyOAuthWithPhone(
  provider: string,
  providerUserId: string,
  phoneNumber: string,
  otpCode: string,
) {
  const supabase = getSupabaseClient()

  // Get pending verification
  const { data: pending, error: fetchError } = await supabase
    .from("oauth_pending_verification")
    .select("*")
    .eq("provider", provider)
    .eq("provider_user_id", providerUserId)
    .single()

  if (fetchError || !pending) {
    throw new Error("OAuth verification not found")
  }

  // Check if expired
  if (new Date(pending.expires_at) < new Date()) {
    throw new Error("OTP has expired")
  }

  // Verify OTP
  if (pending.otp_code !== otpCode) {
    throw new Error("Invalid OTP code")
  }

  // Update phone number and mark as verified
  const { error: updateError } = await supabase
    .from("oauth_pending_verification")
    .update({
      phone_number: phoneNumber,
      is_verified: true,
    })
    .eq("id", pending.id)

  if (updateError) {
    throw updateError
  }

  return pending
}

// Link OAuth provider to user
export async function linkOAuthProvider(
  userId: string,
  provider: string,
  providerUserId: string,
  providerEmail: string,
  providerName: string,
  accessToken?: string,
  refreshToken?: string,
) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("oauth_providers")
    .upsert({
      user_id: userId,
      provider,
      provider_user_id: providerUserId,
      provider_email: providerEmail,
      provider_name: providerName,
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error linking OAuth provider:", error)
    throw error
  }

  return data
}

// Get user's OAuth providers
export async function getUserOAuthProviders(userId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("oauth_providers").select("*").eq("user_id", userId)

  if (error) {
    throw error
  }

  return data || []
}

// Find or create user from OAuth
export async function findOrCreateUserFromOAuth(
  provider: string,
  providerUserId: string,
  providerEmail: string,
  providerName: string,
  phoneNumber?: string,
) {
  const supabase = getSupabaseClient()

  // Check if OAuth provider already linked
  const { data: existingProvider, error: providerError } = await supabase
    .from("oauth_providers")
    .select("user_id")
    .eq("provider", provider)
    .eq("provider_user_id", providerUserId)
    .single()

  if (providerError && providerError.code !== "PGRST116") {
    throw providerError
  }

  if (existingProvider) {
    // OAuth already linked to a user
    const { data: user } = await supabase.from("users").select("*").eq("id", existingProvider.user_id).single()
    return user
  }

  // Check if user exists by email
  const { data: existingUser, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("email", providerEmail)
    .single()

  if (userError && userError.code !== "PGRST116") {
    throw userError
  }

  let user = existingUser

  // Create new user if doesn't exist
  if (!user) {
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email: providerEmail,
        full_name: providerName,
        phone_number: phoneNumber,
        is_verified: !!phoneNumber, // Mark as verified if phone provided
      })
      .select()
      .single()

    if (createError) throw createError
    user = newUser
  }

  // Link OAuth provider
  await linkOAuthProvider(user.id, provider, providerUserId, providerEmail, providerName)

  return user
}
