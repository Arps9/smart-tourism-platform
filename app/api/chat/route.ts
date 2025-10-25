import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

// Helper function to extract information from user message
function analyzeUserMessage(message: string) {
  const lowerMessage = message.toLowerCase()

  // Extract budget
  const budgetMatch = message.match(/(\d+(?:,\d+)*)\s*(?:rs|rupees|inr|₹)?/i)
  const budget = budgetMatch ? Number.parseInt(budgetMatch[1].replace(/,/g, "")) : null

  // Extract duration
  const durationMatch = message.match(/(\d+)\s*(?:day|days|week|weeks)/i)
  let duration = durationMatch ? Number.parseInt(durationMatch[1]) : null
  if (lowerMessage.includes("week")) {
    duration = duration ? duration * 7 : null
  }

  // Detect regions
  const regions = {
    north: ["north", "delhi", "jaipur", "agra", "rajasthan", "himachal", "ladakh", "kashmir", "punjab"],
    south: ["south", "kerala", "goa", "bangalore", "chennai", "hyderabad", "karnataka", "tamil nadu"],
    east: ["east", "kolkata", "darjeeling", "sikkim", "odisha", "west bengal"],
    west: ["west", "mumbai", "gujarat", "maharashtra", "pune"],
    central: ["central", "madhya pradesh", "bhopal"],
    northeast: ["northeast", "assam", "meghalaya", "manipur", "nagaland"],
  }

  let detectedRegion = null
  for (const [region, keywords] of Object.entries(regions)) {
    if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
      detectedRegion = region.charAt(0).toUpperCase() + region.slice(1)
      break
    }
  }

  // Detect interests
  const interests = []
  if (lowerMessage.match(/beach|sea|coast|ocean/)) interests.push("beaches")
  if (lowerMessage.match(/mountain|hill|trek|hiking|adventure/)) interests.push("mountains")
  if (lowerMessage.match(/temple|spiritual|religious|pilgrimage/)) interests.push("spiritual")
  if (lowerMessage.match(/food|cuisine|culinary|restaurant/)) interests.push("food")
  if (lowerMessage.match(/history|heritage|culture|monument/)) interests.push("heritage")
  if (lowerMessage.match(/wildlife|safari|nature|forest/)) interests.push("wildlife")
  if (lowerMessage.match(/party|nightlife|club/)) interests.push("nightlife")

  // Detect travel style
  let travelStyle = "Mid-range"
  if (lowerMessage.match(/budget|cheap|affordable|backpack/)) travelStyle = "Budget"
  if (lowerMessage.match(/luxury|premium|5\s*star|expensive/)) travelStyle = "Luxury"

  // Detect intent
  let intent = "general"
  if (lowerMessage.match(/itinerary|plan|trip|schedule/)) intent = "itinerary"
  if (lowerMessage.match(/recommend|suggest|where|destination/)) intent = "recommendation"
  if (lowerMessage.match(/weather|climate|season|temperature/)) intent = "weather"
  if (lowerMessage.match(/hotel|stay|accommodation|lodge/)) intent = "accommodation"
  if (lowerMessage.match(/food|restaurant|eat|cuisine/)) intent = "food"

  return {
    budget,
    duration,
    region: detectedRegion,
    interests,
    travelStyle,
    intent,
  }
}

// Generate response based on analysis
async function generateResponse(userMessage: string, analysis: any, supabase: any) {
  const { budget, duration, region, interests, travelStyle, intent } = analysis

  // Build query based on analysis
  let query = supabase.from("destinations").select("*")

  if (region) {
    query = query.eq("region", region)
  }

  if (budget && duration) {
    const budgetPerDay = Math.floor(budget / duration)
    query = query.lte("average_budget_per_day", budgetPerDay)
  }

  const { data: destinations } = await query.limit(5)

  if (!destinations || destinations.length === 0) {
    return {
      role: "assistant",
      content: `I'd love to help you plan your India trip! To give you the best recommendations, could you tell me more about:

- Your budget (approximate total or per day)
- How many days you're planning to travel
- Which region interests you (North, South, East, West, Northeast)
- Your interests (beaches, mountains, heritage, food, adventure, etc.)

For example: "I want to visit North India for 7 days with a budget of ₹50,000. I love heritage sites and food!"`,
    }
  }

  // Generate response based on intent
  if (intent === "itinerary" && duration) {
    // Generate detailed itinerary
    const selectedDests = destinations.slice(0, Math.min(3, destinations.length))
    const daysPerDest = Math.floor(duration / selectedDests.length)

    let itineraryText = `🗺️ **${duration}-Day India Itinerary** (${travelStyle} Travel)\n\n`
    itineraryText += `**Budget**: ₹${budget?.toLocaleString("en-IN") || "Flexible"}\n`
    itineraryText += `**Destinations**: ${selectedDests.map((d) => d.name).join(", ")}\n\n`

    let currentDay = 1
    for (const dest of selectedDests) {
      itineraryText += `### ${dest.name} (Days ${currentDay}-${currentDay + daysPerDest - 1})\n\n`
      itineraryText += `${dest.description}\n\n`
      itineraryText += `**Budget per day**: ₹${dest.average_budget_per_day?.toLocaleString("en-IN")}\n`
      itineraryText += `**Best time**: ${dest.best_time_to_visit}\n`
      itineraryText += `**Activities**: ${dest.popular_activities?.join(", ")}\n\n`

      // Get hotels and attractions
      const [{ data: hotels }, { data: attractions }] = await Promise.all([
        supabase.from("hotels").select("*").eq("destination_id", dest.id).eq("category", travelStyle).limit(2),
        supabase.from("attractions").select("*").eq("destination_id", dest.id).limit(3),
      ])

      if (hotels && hotels.length > 0) {
        itineraryText += `**Recommended Stay**: ${hotels[0].name} (₹${hotels[0].price_per_night}/night)\n\n`
      }

      if (attractions && attractions.length > 0) {
        itineraryText += `**Must-visit**:\n`
        attractions.forEach((attr) => {
          itineraryText += `- ${attr.name}${attr.entry_fee ? ` (₹${attr.entry_fee})` : ""}\n`
        })
        itineraryText += `\n`
      }

      currentDay += daysPerDest
    }

    itineraryText += `\n💡 **Tip**: Use our manual planner to customize this itinerary further!`

    return {
      role: "assistant",
      content: itineraryText,
    }
  } else {
    // General recommendations
    let responseText = `✨ **Perfect destinations for you:**\n\n`

    for (const dest of destinations.slice(0, 3)) {
      responseText += `### ${dest.name}\n`
      responseText += `${dest.description}\n\n`
      responseText += `- **Region**: ${dest.region}\n`
      responseText += `- **Budget**: ₹${dest.average_budget_per_day?.toLocaleString("en-IN")}/day\n`
      responseText += `- **Best time**: ${dest.best_time_to_visit}\n`
      responseText += `- **Footfall**: ${dest.average_footfall}\n`
      responseText += `- **Activities**: ${dest.popular_activities?.slice(0, 3).join(", ")}\n\n`
    }

    responseText += `\nWould you like me to create a detailed itinerary for any of these destinations? Just let me know your travel dates and I'll plan it out!`

    return {
      role: "assistant",
      content: responseText,
    }
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const supabase = await createClient()

    // Get the last user message
    const lastMessage = messages[messages.length - 1]
    const userMessage = lastMessage.content

    // Analyze the user message
    const analysis = analyzeUserMessage(userMessage)

    // Generate response
    const response = await generateResponse(userMessage, analysis, supabase)

    // Return response in the expected format
    return new Response(
      JSON.stringify({
        messages: [...messages, response],
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Chat error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to process chat message",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
