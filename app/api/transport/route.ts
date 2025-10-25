export const dynamic = "force-dynamic"; // ✅ Prevents static rendering warning

import { type NextRequest, NextResponse } from "next/server";
import { getTransportOptions } from "@/lib/api/transport";

export async function GET(request: NextRequest) {
  try {
    // ✅ Extract query params safely
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // ✅ Validate inputs
    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: "Missing 'from' or 'to' parameter" },
        { status: 400 }
      );
    }

    // ✅ Fetch data from your custom transport API logic
    const transport = await getTransportOptions(from, to);

    return NextResponse.json({
      success: true,
      from,
      to,
      data: transport,
    });
  } catch (error) {
    console.error("Transport API route error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transport data" },
      { status: 500 }
    );
  }
}
