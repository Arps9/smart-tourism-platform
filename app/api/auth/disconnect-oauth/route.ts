import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json()

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    // Get user from session
    const { data: session } = await supabase.from("user_sessions").select("user_id").eq("token", sessionToken).single()

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 401 })
    }

    // Delete OAuth provider
    const { error } = await supabase
      .from("oauth_providers")
      .delete()
      .eq("user_id", session.user_id)
      .eq("provider", provider)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, message: `${provider} disconnected` })
  } catch (error) {
    console.error("[v0] Disconnect OAuth error:", error)
    return NextResponse.json({ error: "Failed to disconnect provider" }, { status: 500 })
  }
}
