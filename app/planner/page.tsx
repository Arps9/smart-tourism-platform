"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  Plus,
  X,
  Save,
  HotelIcon,
  UtensilsCrossed,
  Landmark,
  Search,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

type Destination = {
  id: string
  name: string
  state: string
  region: string
  description: string
  average_budget_per_day: number
  image_url: string
}

type Hotel = {
  id: string
  name: string
  category: string
  price_per_night: number
  rating: number
}

type Restaurant = {
  id: string
  name: string
  cuisine_type: string[]
  price_range: string
  rating: number
}

type Attraction = {
  id: string
  name: string
  type: string
  entry_fee: number
  time_required: string
  rating: number
}

type ItineraryDay = {
  day: number
  destination: Destination | null
  hotel: Hotel | null
  restaurants: Restaurant[]
  attractions: Attraction[]
  notes: string
}

export default function PlannerPage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    { day: 1, destination: null, hotel: null, restaurants: [], attractions: [], notes: "" },
  ])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [tripName, setTripName] = useState("My India Trip")
  const [totalBudget, setTotalBudget] = useState(50000)

  const supabase = createClient()

  useEffect(() => {
    loadDestinations()
  }, [])

  const loadDestinations = async () => {
    setLoading(true)
    const { data } = await supabase.from("destinations").select("*").limit(20)
    if (data) setDestinations(data)
    setLoading(false)
  }

  const loadDestinationDetails = async (destinationId: string) => {
    setLoading(true)
    const [{ data: hotelsData }, { data: restaurantsData }, { data: attractionsData }] = await Promise.all([
      supabase.from("hotels").select("*").eq("destination_id", destinationId),
      supabase.from("restaurants").select("*").eq("destination_id", destinationId),
      supabase.from("attractions").select("*").eq("destination_id", destinationId),
    ])

    if (hotelsData) setHotels(hotelsData)
    if (restaurantsData) setRestaurants(restaurantsData)
    if (attractionsData) setAttractions(attractionsData)
    setLoading(false)
  }

  const selectDestination = (destination: Destination) => {
    setSelectedDestination(destination)
    loadDestinationDetails(destination.id)
  }

  const addDay = () => {
    setItinerary([
      ...itinerary,
      {
        day: itinerary.length + 1,
        destination: null,
        hotel: null,
        restaurants: [],
        attractions: [],
        notes: "",
      },
    ])
  }

  const removeDay = (dayIndex: number) => {
    if (itinerary.length === 1) return
    const newItinerary = itinerary.filter((_, index) => index !== dayIndex)
    // Renumber days
    newItinerary.forEach((day, index) => {
      day.day = index + 1
    })
    setItinerary(newItinerary)
  }

  const addToDay = (dayIndex: number, type: "destination" | "hotel" | "restaurant" | "attraction", item: any) => {
    const newItinerary = [...itinerary]
    if (type === "destination") {
      newItinerary[dayIndex].destination = item
    } else if (type === "hotel") {
      newItinerary[dayIndex].hotel = item
    } else if (type === "restaurant") {
      if (!newItinerary[dayIndex].restaurants.find((r) => r.id === item.id)) {
        newItinerary[dayIndex].restaurants.push(item)
      }
    } else if (type === "attraction") {
      if (!newItinerary[dayIndex].attractions.find((a) => a.id === item.id)) {
        newItinerary[dayIndex].attractions.push(item)
      }
    }
    setItinerary(newItinerary)
  }

  const removeFromDay = (dayIndex: number, type: "hotel" | "restaurant" | "attraction", itemId: string) => {
    const newItinerary = [...itinerary]
    if (type === "hotel") {
      newItinerary[dayIndex].hotel = null
    } else if (type === "restaurant") {
      newItinerary[dayIndex].restaurants = newItinerary[dayIndex].restaurants.filter((r) => r.id !== itemId)
    } else if (type === "attraction") {
      newItinerary[dayIndex].attractions = newItinerary[dayIndex].attractions.filter((a) => a.id !== itemId)
    }
    setItinerary(newItinerary)
  }

  const calculateTotalCost = () => {
    return itinerary.reduce((total, day) => {
      let dayCost = 0
      if (day.hotel) dayCost += day.hotel.price_per_night
      day.attractions.forEach((a) => (dayCost += a.entry_fee || 0))
      // Estimate restaurant costs
      dayCost += day.restaurants.length * 500 // Average meal cost
      return total + dayCost
    }, 0)
  }

  const calculateTotalTime = () => {
    return itinerary.reduce((total, day) => {
      let dayHours = 0
      day.attractions.forEach((a) => {
        const hours = Number.parseInt(a.time_required) || 2
        dayHours += hours
      })
      return total + dayHours
    }, 0)
  }

  const filteredDestinations = destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.state.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalCost = calculateTotalCost()
  const totalTime = calculateTotalTime()
  const budgetRemaining = totalBudget - totalCost

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              <span className="font-serif text-2xl font-bold text-foreground">Discover India</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/chat">
                <Button variant="ghost" size="sm">
                  AI Assistant
                </Button>
              </Link>
              <Link href="/packages">
                <Button variant="ghost" size="sm">
                  Packages
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Input
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                className="text-2xl font-serif font-bold border-none p-0 h-auto focus-visible:ring-0"
              />
              <p className="text-muted-foreground">Build your perfect India itinerary</p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Save Itinerary
            </Button>
          </div>

          {/* Budget Summary */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <div className="flex items-center gap-1 text-2xl font-bold">
                      <IndianRupee className="h-5 w-5" />
                      <Input
                        type="number"
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(Number(e.target.value))}
                        className="border-none p-0 h-auto w-32 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Estimated Cost</p>
                <div className="flex items-center gap-1 text-2xl font-bold">
                  <IndianRupee className="h-5 w-5" />
                  <span>{totalCost.toLocaleString("en-IN")}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <div
                  className={`flex items-center gap-1 text-2xl font-bold ${budgetRemaining < 0 ? "text-destructive" : "text-green-600"}`}
                >
                  <IndianRupee className="h-5 w-5" />
                  <span>{budgetRemaining.toLocaleString("en-IN")}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Days</p>
                <div className="flex items-center gap-1 text-2xl font-bold">
                  <Calendar className="h-5 w-5" />
                  <span>{itinerary.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Browse Items */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="font-serif">Browse & Add</CardTitle>
                <CardDescription>Search and add items to your itinerary</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="destinations">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="destinations">
                      <MapPin className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="hotels">
                      <HotelIcon className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="restaurants">
                      <UtensilsCrossed className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="attractions">
                      <Landmark className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="destinations" className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search destinations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {loading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : (
                          filteredDestinations.map((dest) => (
                            <Card
                              key={dest.id}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => selectDestination(dest)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start gap-3">
                                  <img
                                    src={dest.image_url || "/placeholder.svg"}
                                    alt={dest.name}
                                    className="w-16 h-16 rounded object-cover"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm truncate">{dest.name}</h4>
                                    <p className="text-xs text-muted-foreground">{dest.state}</p>
                                    <div className="flex items-center gap-1 text-xs mt-1">
                                      <IndianRupee className="h-3 w-3" />
                                      <span>₹{dest.average_budget_per_day}/day</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="hotels" className="space-y-4">
                    {!selectedDestination ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Select a destination first</p>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {hotels.map((hotel) => (
                            <Card key={hotel.id} className="cursor-pointer hover:shadow-md transition-shadow">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold text-sm">{hotel.name}</h4>
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {hotel.category}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-xs mt-1">
                                      <IndianRupee className="h-3 w-3" />
                                      <span>₹{hotel.price_per_night}/night</span>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      // Add to current day or first day
                                      addToDay(0, "hotel", hotel)
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>

                  <TabsContent value="restaurants" className="space-y-4">
                    {!selectedDestination ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Select a destination first</p>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {restaurants.map((restaurant) => (
                            <Card key={restaurant.id} className="cursor-pointer hover:shadow-md transition-shadow">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold text-sm">{restaurant.name}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {restaurant.cuisine_type?.join(", ")}
                                    </p>
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {restaurant.price_range}
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => addToDay(0, "restaurant", restaurant)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>

                  <TabsContent value="attractions" className="space-y-4">
                    {!selectedDestination ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Select a destination first</p>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {attractions.map((attraction) => (
                            <Card key={attraction.id} className="cursor-pointer hover:shadow-md transition-shadow">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold text-sm">{attraction.name}</h4>
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {attraction.type}
                                    </Badge>
                                    <div className="flex items-center gap-2 text-xs mt-1 text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <IndianRupee className="h-3 w-3" />₹{attraction.entry_fee || 0}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {attraction.time_required}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => addToDay(0, "attraction", attraction)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Itinerary Builder */}
          <div className="lg:col-span-2 space-y-4">
            {itinerary.map((day, dayIndex) => (
              <Card key={day.day}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold">
                        {day.day}
                      </div>
                      <div>
                        <CardTitle className="font-serif">Day {day.day}</CardTitle>
                        {day.destination && <CardDescription>{day.destination.name}</CardDescription>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDay(dayIndex)}
                      disabled={itinerary.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Destination */}
                  {!day.destination ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Select a destination from the sidebar</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <img
                        src={day.destination.image_url || "/placeholder.svg"}
                        alt={day.destination.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{day.destination.name}</h4>
                        <p className="text-sm text-muted-foreground">{day.destination.state}</p>
                      </div>
                    </div>
                  )}

                  {/* Hotel */}
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <HotelIcon className="h-4 w-4" />
                      Accommodation
                    </Label>
                    {day.hotel ? (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{day.hotel.name}</p>
                          <p className="text-xs text-muted-foreground">₹{day.hotel.price_per_night}/night</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromDay(dayIndex, "hotel", day.hotel!.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No hotel selected</p>
                    )}
                  </div>

                  {/* Attractions */}
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Landmark className="h-4 w-4" />
                      Attractions ({day.attractions.length})
                    </Label>
                    {day.attractions.length > 0 ? (
                      <div className="space-y-2">
                        {day.attractions.map((attraction) => (
                          <div key={attraction.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <p className="font-medium text-sm">{attraction.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ₹{attraction.entry_fee || 0} • {attraction.time_required}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromDay(dayIndex, "attraction", attraction.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No attractions added</p>
                    )}
                  </div>

                  {/* Restaurants */}
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <UtensilsCrossed className="h-4 w-4" />
                      Dining ({day.restaurants.length})
                    </Label>
                    {day.restaurants.length > 0 ? (
                      <div className="space-y-2">
                        {day.restaurants.map((restaurant) => (
                          <div key={restaurant.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <p className="font-medium text-sm">{restaurant.name}</p>
                              <p className="text-xs text-muted-foreground">{restaurant.cuisine_type?.join(", ")}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromDay(dayIndex, "restaurant", restaurant.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No restaurants added</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button onClick={addDay} variant="outline" className="w-full border-dashed border-2 bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Day
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
