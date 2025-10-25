"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, LogOut, User, MapIcon, Package, Sparkles, Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg gradient-india flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <span className="font-serif text-2xl font-bold text-gradient-india">Discover India</span>
              </Link>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  const quickActions = [
    {
      icon: Sparkles,
      title: "AI Trip Planner",
      description: "Get personalized itineraries",
      href: "/chat",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: MapIcon,
      title: "Build Itinerary",
      description: "Create custom travel plans",
      href: "/planner",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: Package,
      title: "Browse Packages",
      description: "Explore curated packages",
      href: "/packages",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Calendar,
      title: "My Bookings",
      description: "View your reservations",
      href: "/bookings",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg gradient-india flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="font-serif text-2xl font-bold text-gradient-india">Discover India</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-gradient-india mb-2">
            Welcome, {user.fullName || "Traveler"}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Ready to explore the incredible diversity of India? Let's plan your next adventure.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link key={index} href={action.href}>
                  <Card className="h-full hover:shadow-lg transition-all hover:scale-105 border-border/50 cursor-pointer group">
                    <CardHeader>
                      <div className={`${action.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                        <Icon className={`h-6 w-6 ${action.color}`} />
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* User Info Card */}
        <div className="max-w-2xl">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Phone Number</span>
                <span className="font-semibold">+91 {user.phoneNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Full Name</span>
                <span className="font-semibold">{user.fullName || "Not set"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Verification Status</span>
                <span className="font-semibold text-green-600">Verified</span>
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => router.push("/profile")}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
