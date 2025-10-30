"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useProfile, useClub, useClubs } from "@/hooks/use-query-hooks"
import { safeLocalStorage } from "@/lib/browser-utils"
import { useEffect, useState, useRef, useCallback } from "react"
import { Send, MessageCircle, Users, Loader2, Building2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import axios from "axios"

interface ChatMessage {
  id: string
  clubId: number
  userId: number
  userName: string
  userAvatar?: string
  message: string
  timestamp: number
}

interface ClubDetails {
  id: number
  name: string
}

export default function StudentChatPage() {
  const { auth } = useAuth()
  const [availableClubIds, setAvailableClubIds] = useState<number[]>([])
  const [availableClubs, setAvailableClubs] = useState<ClubDetails[]>([])
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [latestTimestamp, setLatestTimestamp] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch all clubs data for names
  const { data: allClubsData = [] } = useClubs()

  // Get student's club IDs from localStorage
  useEffect(() => {
    try {
      const saved = safeLocalStorage.getItem("uniclub-auth")
      if (saved) {
        const parsed = JSON.parse(saved)
        
        let clubIdNumbers: number[] = []
        
        // Check for clubIds array first, then fallback to single clubId
        if (parsed.clubIds && Array.isArray(parsed.clubIds)) {
          clubIdNumbers = parsed.clubIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id) && id > 0)
        } else if (parsed.clubId) {
          const singleClubId = Number(parsed.clubId)
          if (!isNaN(singleClubId) && singleClubId > 0) {
            clubIdNumbers = [singleClubId]
          }
        }
        
        console.log("Student Chat - Available club IDs:", clubIdNumbers)
        setAvailableClubIds(clubIdNumbers)
        
        // Auto-select first club if available
        if (clubIdNumbers.length > 0) {
          setSelectedClubId(clubIdNumbers[0])
        }
      }
    } catch (error) {
      console.error("Failed to get clubIds from localStorage:", error)
    }
  }, [])

  // Load club details for dropdown when club IDs and data are available
  useEffect(() => {
    if (availableClubIds.length > 0 && allClubsData.length > 0) {
      const clubDetails = availableClubIds
        .map((id) => {
          const club = allClubsData.find((c: any) => c.id === id)
          return club ? { id: club.id, name: club.name } : null
        })
        .filter((club): club is ClubDetails => club !== null)
      
      console.log("Student Chat - Loaded club details:", clubDetails)
      setAvailableClubs(clubDetails)
    }
  }, [availableClubIds, allClubsData])

  // Fetch user profile and selected club data
  const { data: profile } = useProfile()
  const { data: selectedClub, isLoading: clubLoading } = useClub(selectedClubId || 0, !!selectedClubId)

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!selectedClubId) return

    try {
      const response = await axios.get(`/api/chat/messages?clubId=${selectedClubId}&limit=50`)
      const fetchedMessages = response.data.messages || []
      setMessages(fetchedMessages.reverse()) // Reverse to show oldest first
      if (fetchedMessages.length > 0) {
        setLatestTimestamp(fetchedMessages[0].timestamp)
      }
      setError(null)
      setLoading(false)
      setTimeout(scrollToBottom, 100)
    } catch (error: any) {
      console.error("Error fetching messages:", error)
      if (error.response?.status === 503) {
        setError("Chat service is not configured. Please contact your administrator.")
      } else {
        setError("Failed to load messages. Please try again later.")
      }
      setLoading(false)
    }
  }, [selectedClubId, scrollToBottom])

  // Poll for new messages (realtime updates)
  const pollMessages = useCallback(async () => {
    if (!selectedClubId || latestTimestamp === 0) return

    try {
      const response = await axios.get(
        `/api/chat/poll?clubId=${selectedClubId}&after=${latestTimestamp}`
      )
      const newMessages = response.data.messages || []
      
      if (newMessages.length > 0) {
        setMessages((prev) => [...prev, ...newMessages.reverse()])
        setLatestTimestamp(response.data.latestTimestamp)
        setTimeout(scrollToBottom, 100)
      }
    } catch (error) {
      console.error("Error polling messages:", error)
    }
  }, [selectedClubId, latestTimestamp, scrollToBottom])

  // Initial load - reset when club changes
  useEffect(() => {
    if (selectedClubId) {
      setLoading(true)
      setMessages([])
      setLatestTimestamp(0)
      fetchMessages()
    }
  }, [selectedClubId, fetchMessages])

  // Set up polling interval for realtime updates
  useEffect(() => {
    if (!selectedClubId) return

    const interval = setInterval(() => {
      pollMessages()
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [selectedClubId, pollMessages])

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedClubId || !profile || sending) return

    setSending(true)
    try {
      const response = await axios.post("/api/chat/messages", {
        clubId: selectedClubId,
        message: newMessage.trim(),
        userId: auth.userId,
        userName: (profile as any).fullName || "Unknown User",
        userAvatar: (profile as any).avatarUrl || "/placeholder-user.jpg",
      })

      const sentMessage = response.data.message
      setMessages((prev) => [...prev, sentMessage])
      setLatestTimestamp(sentMessage.timestamp)
      setNewMessage("")
      setError(null)
      setTimeout(scrollToBottom, 100)
    } catch (error: any) {
      console.error("Error sending message:", error)
      if (error.response?.status === 503) {
        setError("Chat service is not configured. Please contact your administrator.")
      } else {
        setError("Failed to send message. Please try again.")
      }
    } finally {
      setSending(false)
    }
  }

  // Handle Enter key to send
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle club selection change
  const handleClubChange = (clubIdStr: string) => {
    const clubId = Number(clubIdStr)
    setSelectedClubId(clubId)
  }

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Show loading state
  if (loading && availableClubIds.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <AppShell>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // Show message when student has no clubs
  if (availableClubIds.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <AppShell>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Club Membership</h3>
                <p className="text-muted-foreground max-w-md">
                  You need to join a club first to access the chat feature. 
                  Visit the Clubs page to find and join clubs!
                </p>
              </div>
            </CardContent>
          </Card>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
          {/* Header with Club Selector */}
          <Card className="border-l-4 border-l-primary shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-semibold">Club Chat</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {availableClubIds.length > 1 ? "Select a club to chat" : "Real-time messaging"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Club Selector - only show if student has multiple clubs */}
                  {availableClubIds.length > 1 && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Select value={selectedClubId?.toString()} onValueChange={handleClubChange}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select a club" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableClubs.map((club) => (
                            <SelectItem key={club.id} value={club.id.toString()}>
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <Badge variant="outline" className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Live</span>
                  </Badge>
                </div>
              </div>
              
              {/* Display selected club name */}
              {selectedClub && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Room: <span className="text-foreground">{selectedClub.name}</span>
                  </p>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Chat Messages */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardContent className="p-0 flex-1 flex flex-col">
              {error && (
                <div className="bg-destructive/10 border-b border-destructive/20 p-3">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}
              
              {loading || clubLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12">
                        <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">
                          No messages yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Be the first to start the conversation!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => {
                          const isOwnMessage = msg.userId === auth.userId
                          return (
                            <div
                              key={msg.id}
                              className={`flex items-start gap-3 ${
                                isOwnMessage ? "flex-row-reverse" : "flex-row"
                              }`}
                            >
                              <Avatar className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={msg.userAvatar} alt={msg.userName} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(msg.userName)}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`flex flex-col max-w-[70%] ${
                                  isOwnMessage ? "items-end" : "items-start"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {isOwnMessage ? "You" : msg.userName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(msg.timestamp)}
                                  </span>
                                </div>
                                <div
                                  className={`rounded-2xl px-4 py-2 ${
                                    isOwnMessage
                                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                                      : "bg-muted text-foreground rounded-tl-sm"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {msg.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t bg-background p-4">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={sending}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        size="icon"
                        className="h-10 w-10 shrink-0"
                      >
                        {sending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

