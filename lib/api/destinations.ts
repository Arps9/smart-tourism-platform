import { getPlacesByCity } from "./places"
import { getWeatherData } from "./weather"

export interface Destination {
  id: string
  name: string
  state: string
  region: string
  description: string
  averageBudgetPerDay: number
  imageUrl: string
  bestTimeToVisit: string
  averageFootfall: string
  weather?: {
    temperature: number
    condition: string
  }
}

// Major Indian cities by region
const INDIAN_CITIES = {
  North: [
    { name: "Delhi", state: "Delhi", budget: 2500 },
    { name: "Jaipur", state: "Rajasthan", budget: 2000 },
    { name: "Agra", state: "Uttar Pradesh", budget: 1800 },
    { name: "Amritsar", state: "Punjab", budget: 1500 },
    { name: "Shimla", state: "Himachal Pradesh", budget: 2200 },
  ],
  South: [
    { name: "Bangalore", state: "Karnataka", budget: 2500 },
    { name: "Chennai", state: "Tamil Nadu", budget: 2000 },
    { name: "Hyderabad", state: "Telangana", budget: 2200 },
    { name: "Kochi", state: "Kerala", budget: 2000 },
    { name: "Mysore", state: "Karnataka", budget: 1800 },
  ],
  West: [
    { name: "Mumbai", state: "Maharashtra", budget: 3500 },
    { name: "Goa", state: "Goa", budget: 2500 },
    { name: "Pune", state: "Maharashtra", budget: 2000 },
    { name: "Ahmedabad", state: "Gujarat", budget: 1800 },
    { name: "Udaipur", state: "Rajasthan", budget: 2200 },
  ],
  East: [
    { name: "Kolkata", state: "West Bengal", budget: 2000 },
    { name: "Bhubaneswar", state: "Odisha", budget: 1800 },
    { name: "Darjeeling", state: "West Bengal", budget: 2200 },
    { name: "Puri", state: "Odisha", budget: 1500 },
  ],
  Northeast: [
    { name: "Guwahati", state: "Assam", budget: 2000 },
    { name: "Shillong", state: "Meghalaya", budget: 2200 },
    { name: "Gangtok", state: "Sikkim", budget: 2500 },
  ],
  Central: [
    { name: "Bhopal", state: "Madhya Pradesh", budget: 1800 },
    { name: "Indore", state: "Madhya Pradesh", budget: 1800 },
    { name: "Nagpur", state: "Maharashtra", budget: 1800 },
  ],
}

const BEST_TIME_MAP: Record<string, string> = {
  North: "October to March",
  South: "November to February",
  West: "November to February",
  East: "October to March",
  Northeast: "October to April",
  Central: "October to March",
}

const FOOTFALL_MAP: Record<string, string> = {
  Delhi: "Very High",
  Mumbai: "Very High",
  Bangalore: "High",
  Jaipur: "High",
  Goa: "Very High",
  Agra: "Very High",
  Kolkata: "High",
  Chennai: "High",
  Hyderabad: "High",
  Kochi: "Medium",
}

export async function getAllDestinations(): Promise<Destination[]> {
  const allDestinations: Destination[] = []

  for (const [region, cities] of Object.entries(INDIAN_CITIES)) {
    for (const city of cities) {
      allDestinations.push({
        id: `${city.name.toLowerCase()}-${region.toLowerCase()}`,
        name: city.name,
        state: city.state,
        region,
        description: `Explore the beautiful city of ${city.name} in ${city.state}`,
        averageBudgetPerDay: city.budget,
        imageUrl: `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(city.name + " India")}`,
        bestTimeToVisit: BEST_TIME_MAP[region] || "October to March",
        averageFootfall: FOOTFALL_MAP[city.name] || "Medium",
      })
    }
  }

  return allDestinations
}

export async function getDestinationById(id: string): Promise<Destination | null> {
  const destinations = await getAllDestinations()
  return destinations.find((d) => d.id === id) || null
}

export async function getDestinationWithDetails(cityName: string) {
  try {
    const [places, weather] = await Promise.all([getPlacesByCity(cityName), getWeatherData(cityName).catch(() => null)])

    return {
      places,
      weather,
    }
  } catch (error) {
    console.error("Error fetching destination details:", error)
    return {
      places: [],
      weather: null,
    }
  }
}
