import { updateSession } from "@/lib/supabase/middleware"
import { protectRoute } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const authResponse = await protectRoute(request)
  if (authResponse.status !== 200) {
    return authResponse
  }

  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
