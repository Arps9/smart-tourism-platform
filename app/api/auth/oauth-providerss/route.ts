import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  try {
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

    // Get OAuth providers
    const { data: providers, error } = await supabase.from("oauth_providers").select("*").eq("user_id", session.user_id)

    if (error) {
      throw error
    }

    return NextResponse.json({ providers: providers || [] })
  } catch (error) {
    console.error("[v0] Get OAuth providers error:", error)
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 })
  }
}
