export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's recent trips
    const { data: trips, error } = await supabase
      .from("user_itineraries")
      .select("id, name, start_date, end_date, destination_ids")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching trips:", error)
      return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 })
    }

    return NextResponse.json({ trips: trips || [] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
