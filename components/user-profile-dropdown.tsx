"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, LogOut, Settings, History, Plus } from "lucide-react"

interface Trip {
  id: string
  name: string
  start_date: string
  end_date: string
  destination_ids: string[]
}

export function UserProfileDropdown() {
  const { user, loading, logout } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripsLoading, setTripsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchUserTrips()
    }
  }, [isOpen, user])

  const fetchUserTrips = async () => {
    setTripsLoading(true)
    try {
      const response = await fetch("/api/user/trips")
      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips || [])
      }
    } catch (error) {
      console.error("Failed to fetch trips:", error)
    } finally {
      setTripsLoading(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-10 w-10 rounded-full" />
  }

  if (!user) {
    return null
  }

  const initials =
    user.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ||
    user.phoneNumber?.slice(-2).toUpperCase() ||
    "U"

  const recentTrips = trips.slice(0, 3)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="gradient-india text-white font-semibold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* User Info Section */}
        <div className="bg-gradient-india p-4 text-white rounded-t-lg">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-12 w-12 border-2 border-white">
              <AvatarFallback className="bg-white/20 text-white font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user.fullName || "Traveler"}</p>
              <p className="text-xs text-white/80 truncate">{user.phoneNumber}</p>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <div className="flex-1 bg-white/10 rounded px-2 py-1 text-center">
              <p className="font-semibold">{trips.length}</p>
              <p className="text-white/70">Trips</p>
            </div>
            <div className="flex-1 bg-white/10 rounded px-2 py-1 text-center">
              <p className="font-semibold">{new Set(trips.flatMap((t) => t.destination_ids || [])).size}</p>
              <p className="text-white/70">Destinations</p>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="m-0" />

        {/* Recent Trips Section */}
        <div className="p-3 max-h-48 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2 px-1">
            <History className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground">RECENT TRIPS</p>
          </div>

          {tripsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : recentTrips.length > 0 ? (
            <div className="space-y-2">
              {recentTrips.map((trip) => (
                <Link key={trip.id} href={`/dashboard/trip/${trip.id}`}>
                  <div className="p-2 rounded hover:bg-muted transition-colors cursor-pointer">
                    <p className="text-sm font-medium truncate">{trip.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {trip.start_date &&
                        new Date(trip.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      {trip.end_date &&
                        ` - ${new Date(trip.end_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No trips yet</p>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Quick Actions */}
        <div className="p-2">
          <Link href="/planner">
            <DropdownMenuItem className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              <span>Plan New Trip</span>
            </DropdownMenuItem>
          </Link>

          <Link href="/dashboard">
            <DropdownMenuItem className="cursor-pointer">
              <MapPin className="h-4 w-4 mr-2" />
              <span>View All Trips</span>
            </DropdownMenuItem>
          </Link>

          <Link href="/profile">
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
          </Link>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={() => {
              setIsOpen(false)
              logout()
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Logout</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
