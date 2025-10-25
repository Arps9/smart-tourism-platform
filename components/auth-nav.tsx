"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { User, LogOut, Sparkles } from "lucide-react"

export function AuthNav() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return <Skeleton className="h-10 w-32" />
  }

  if (user) {
    return (
      <>
        <Link href="/dashboard">
          <Button size="sm" variant="outline" className="bg-transparent">
            <User className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          onClick={logout}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </>
    )
  }

  return (
    <>
      <Link href="/auth/login">
        <Button size="sm" variant="outline" className="bg-transparent">
          Sign In
        </Button>
      </Link>
      <Link href="/chat">
        <Button size="sm" className="gradient-india text-white hover:opacity-90 shadow-md">
          <Sparkles className="h-4 w-4 mr-2" />
          Try AI Assistant
        </Button>
      </Link>
    </>
  )
}
