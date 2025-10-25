export const dynamic = "force-dynamic"; // ✅ Prevent static pre-rendering

import { NextResponse } from "next/server";

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || "";

export async function GET(request: Request) {
  try {
    // ✅ Parse city from URL parameters
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    // ✅ Validate inputs
    if (!city) {
      return NextResponse.json(
        { success: false, error: "City parameter required" },
        { status: 400 }
      );
    }

    // ✅ Check API key
    if (!GEOAPIFY_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Geoapify API key not configured" },
        { status: 500 }
      );
    }

    // ✅ Step 1: Get city coordinates (Geoapify Geocoding API)
    const geocodeResponse = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city)},India&apiKey=${GEOAPIFY_API_KEY}`
    );

    if (!geocodeResponse.ok) {
      throw new Error("Failed to geocode city");
    }

    const geocodeData = await geocodeResponse.json();
    if (!geocodeData.features || geocodeData.features.length === 0) {
      return NextResponse.json(
        { success: false, error: "City not found" },
        { status: 404 }
      );
    }

    const [lon, lat] = geocodeData.features[0].geometry.coordinates;

    // ✅ Step 2: Fetch weather data (Open-Meteo API or similar)
    // You can replace with your preferred weather API if needed.
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );

    if (!weatherResponse.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const weatherData = await weatherResponse.json();

    const current = weatherData.current_weather;

    // ✅ Step 3: Structure the response
    const weatherInfo = {
      city,
      coordinates: { lat, lon },
      temperature: current?.temperature ?? "N/A",
      windspeed: current?.windspeed ?? "N/A",
      winddirection: current?.winddirection ?? "N/A",
      weathercode: current?.weathercode ?? "N/A",
      time: current?.time ?? new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: weatherInfo,
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
