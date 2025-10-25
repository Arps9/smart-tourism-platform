"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Send, Sparkles, Loader2, Calendar, IndianRupee, MapIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function ChatPage() {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: inputValue,
    }

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      // Update messages with the response
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("[v0] Chat error:", error)
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt)
  }

  const suggestedPrompts = [
    "I want to visit Rajasthan for 5 days with a budget of ₹30,000",
    "Suggest beach destinations in India for December",
    "Plan a spiritual journey covering Varanasi and Rishikesh",
    "I love adventure activities, where should I go in summer?",
  ]

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
              <Link href="/planner">
                <Button variant="ghost" size="sm">
                  <MapIcon className="h-4 w-4 mr-2" />
                  Trip Planner
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

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-12rem)] flex flex-col">
              <CardHeader className="border-b border-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="font-serif">AI Travel Assistant</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tell me about your travel preferences and I'll create a personalized itinerary for you
                </p>
              </CardHeader>

              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Sparkles className="h-12 w-12 text-primary mb-4" />
                    <h3 className="font-serif text-xl font-semibold mb-2">Start Your Journey</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Ask me anything about traveling in India. I can help you find destinations, plan itineraries, and
                      provide budget estimates.
                    </p>
                    <div className="grid gap-2 w-full max-w-md">
                      {suggestedPrompts.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="text-left justify-start h-auto py-3 px-4 bg-transparent"
                          onClick={() => handleSuggestedPrompt(prompt)}
                        >
                          <span className="text-sm">{prompt}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}
                        >
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              components={{
                                // Custom styling for markdown elements
                                h3: ({ children }) => (
                                  <h3 className="text-base font-semibold mt-3 mb-2 first:mt-0">{children}</h3>
                                ),
                                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                ul: ({ children }) => <ul className="mb-2 space-y-1">{children}</ul>,
                                li: ({ children }) => <li className="text-sm">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <div className="border-t border-border p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask me about destinations, itineraries, or travel tips..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Sidebar with Tips */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-serif">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Best Time</p>
                    <p className="text-xs text-muted-foreground">October to March is ideal for most of India</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <IndianRupee className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Budget Planning</p>
                    <p className="text-xs text-muted-foreground">₹2,000-5,000 per day covers most destinations</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <MapIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Travel Style</p>
                    <p className="text-xs text-muted-foreground">Tell me if you prefer budget, mid-range, or luxury</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-serif">Popular Regions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">North India</Badge>
                  <Badge variant="outline">South India</Badge>
                  <Badge variant="outline">Northeast</Badge>
                  <Badge variant="outline">West Coast</Badge>
                  <Badge variant="outline">Himalayas</Badge>
                  <Badge variant="outline">Beaches</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-3">Want more control over your itinerary?</p>
                <Link href="/planner">
                  <Button className="w-full bg-transparent" variant="outline">
                    <MapIcon className="h-4 w-4 mr-2" />
                    Try Manual Planner
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
