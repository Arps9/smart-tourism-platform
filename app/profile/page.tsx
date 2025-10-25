"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapPin, ArrowLeft, Loader2, Chrome, Github, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"

interface OAuthProvider {
  id: string
  provider: string
  provider_email: string
  provider_name: string
  created_at: string
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({ fullName: "", email: "" })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [oauthProviders, setOAuthProviders] = useState<OAuthProvider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: "",
      })
      // Fetch OAuth providers
      fetchOAuthProviders()
    }
  }, [user])

  const fetchOAuthProviders = async () => {
    try {
      const response = await fetch("/api/auth/oauth-providers")
      const data = await response.json()
      if (response.ok) {
        setOAuthProviders(data.providers || [])
      }
    } catch (err) {
      console.error("Failed to fetch OAuth providers:", err)
    } finally {
      setLoadingProviders(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile")
      }

      setMessage("Profile updated successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnectOAuth = async (provider: string) => {
    setDisconnecting(provider)
    setMessage("")

    try {
      const response = await fetch("/api/auth/disconnect-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to disconnect provider")
      }

      setMessage(`${provider} disconnected successfully!`)
      setOAuthProviders(oauthProviders.filter((p) => p.provider !== provider))
      setTimeout(() => setMessage(""), 3000)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setDisconnecting(null)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "google":
        return <Chrome className="h-4 w-4" />
      case "github":
        return <Github className="h-4 w-4" />
      default:
        return null
    }
  }

  const getProviderLabel = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1)
  }

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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="max-w-2xl space-y-8">
          <div>
            <h1 className="text-4xl font-bold font-serif text-gradient-india mb-2">Edit Profile</h1>
            <p className="text-muted-foreground">Update your account information</p>
          </div>

          {/* Profile Information Card */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {message && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      message.includes("successfully")
                        ? "bg-green-500/10 text-green-600 border border-green-500/30"
                        : "bg-destructive/10 text-destructive border border-destructive/30"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input type="tel" value={`+91 ${user.phoneNumber}`} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Phone number cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    type="text"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email (Optional)</label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full gradient-india text-white hover:opacity-90 h-11"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* OAuth Providers section */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Manage your OAuth provider connections</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProviders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : oauthProviders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No connected accounts</p>
              ) : (
                <div className="space-y-3">
                  {oauthProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50"
                    >
                      <div className="flex items-center gap-3">
                        {getProviderIcon(provider.provider)}
                        <div>
                          <p className="font-medium">{getProviderLabel(provider.provider)}</p>
                          <p className="text-sm text-muted-foreground">{provider.provider_email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnectOAuth(provider.provider)}
                        disabled={disconnecting === provider.provider}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {disconnecting === provider.provider ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Disconnect
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
