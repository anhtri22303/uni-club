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
import { Send, MessageCircle, Users, Loader2, Building2, Trash2, X, Reply } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import axios from "axios"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ChatMessage {
  id: string
  clubId: number
  userId: number
  userName: string
  userAvatar?: string
  message: string
  timestamp: number
  replyTo?: {
    id: string
    userName: string
    message: string
  }
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
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [oldestTimestamp, setOldestTimestamp] = useState<number | null>(null)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesTopRef = useRef<HTMLDivElement>(null)

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
      const reversedMessages = fetchedMessages.reverse() // Reverse to show oldest first
      setMessages(reversedMessages)
      
      if (fetchedMessages.length > 0) {
        setLatestTimestamp(fetchedMessages[0].timestamp)
        setOldestTimestamp(reversedMessages[0].timestamp)
      }
      
      // If we got less than requested, there are no more messages
      setHasMoreMessages(fetchedMessages.length >= 50)
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

  // Load more older messages
  const loadMoreMessages = useCallback(async () => {
    if (!selectedClubId || !oldestTimestamp || loadingMore || !hasMoreMessages) return

    setLoadingMore(true)
    try {
      const response = await axios.get(
        `/api/chat/messages?clubId=${selectedClubId}&limit=30&before=${oldestTimestamp}`
      )
      const olderMessages = response.data.messages || []
      
      if (olderMessages.length > 0) {
        const reversedOlder = olderMessages.reverse()
        
        // Prepend older messages to the beginning
        setMessages((prev) => [...reversedOlder, ...prev])
        setOldestTimestamp(reversedOlder[0].timestamp)
        
        // If we got less than requested, no more messages available
        if (olderMessages.length < 30) {
          setHasMoreMessages(false)
        }
      } else {
        setHasMoreMessages(false)
      }
    } catch (error) {
      console.error("Error loading more messages:", error)
    } finally {
      setLoadingMore(false)
    }
  }, [selectedClubId, oldestTimestamp, loadingMore, hasMoreMessages])

  // Poll for new messages (realtime updates)
  const pollMessages = useCallback(async () => {
    if (!selectedClubId || latestTimestamp === 0) return

    try {
      const response = await axios.get(
        `/api/chat/poll?clubId=${selectedClubId}&after=${latestTimestamp}`
      )
      const newMessages = response.data.messages || []
      
      if (newMessages.length > 0) {
        // Prevent duplicates by checking message IDs
        setMessages((prev) => {
          const existingIds = new Set(prev.map(m => m.id))
          const uniqueNewMessages = newMessages
            .reverse()
            .filter((msg: ChatMessage) => !existingIds.has(msg.id))
          
          if (uniqueNewMessages.length === 0) return prev
          return [...prev, ...uniqueNewMessages]
        })
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
      setOldestTimestamp(null)
      setHasMoreMessages(true)
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
    const messageToSend = newMessage.trim()
    const replyData = replyingTo ? {
      id: replyingTo.id,
      userName: replyingTo.userName,
      message: replyingTo.message
    } : undefined
    
    setNewMessage("") // Clear input immediately for better UX
    setReplyingTo(null) // Clear reply state
    
    try {
      const response = await axios.post("/api/chat/messages", {
        clubId: selectedClubId,
        message: messageToSend,
        userId: auth.userId,
        userName: (profile as any).fullName || "Unknown User",
        userAvatar: (profile as any).avatarUrl || "/placeholder-user.jpg",
        replyTo: replyData,
      })

      const sentMessage = response.data.message
      
      // Add message only if it doesn't exist already
      setMessages((prev) => {
        const exists = prev.some(m => m.id === sentMessage.id)
        if (exists) return prev
        return [...prev, sentMessage]
      })
      
      setLatestTimestamp(sentMessage.timestamp)
      setError(null)
      setTimeout(scrollToBottom, 100)
    } catch (error: any) {
      console.error("Error sending message:", error)
      // Restore message and reply state on error
      setNewMessage(messageToSend)
      setReplyingTo(replyData ? replyingTo : null)
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

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedClubId || deleting) return

    setDeleting(true)
    try {
      await axios.delete("/api/chat/messages", {
        data: {
          clubId: selectedClubId,
          messageId: messageId,
          userId: auth.userId,
        },
      })

      // Remove message from local state
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      setMessageToDelete(null)
      setError(null)
    } catch (error: any) {
      console.error("Error deleting message:", error)
      if (error.response?.status === 403) {
        setError("You can only delete your own messages.")
      } else {
        setError("Failed to delete message. Please try again.")
      }
    } finally {
      setDeleting(false)
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
            <CardContent className="pt-6 px-4 md:px-6">
              <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                <MessageCircle className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50 mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-semibold mb-2">No Club Membership</h3>
                <p className="text-xs md:text-sm text-muted-foreground max-w-md px-4">
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
        <div className="space-y-3 md:space-y-4 h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)] flex flex-col">
          {/* Header with Club Selector */}
          <Card className="border-l-4 border-l-primary shadow-md">
            <CardHeader className="p-4 md:pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl md:text-2xl font-semibold truncate">Club Chat</CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
                      {availableClubIds.length > 1 ? "Select a club to chat" : "Real-time messaging"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                  {/* Club Selector - only show if student has multiple clubs */}
                  {availableClubIds.length > 1 && (
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground hidden sm:block" />
                      <Select value={selectedClubId?.toString()} onValueChange={handleClubChange}>
                        <SelectTrigger className="w-[140px] sm:w-[180px] md:w-[200px] h-8 md:h-9 text-xs md:text-sm">
                          <SelectValue placeholder="Select a club" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableClubs.map((club) => (
                            <SelectItem key={club.id} value={club.id.toString()} className="text-xs md:text-sm">
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs">Live</span>
                  </Badge>
                </div>
              </div>
              
              {/* Display selected club name */}
              {selectedClub && availableClubIds.length === 1 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">
                    Current Room: <span className="text-foreground">{selectedClub.name}</span>
                  </p>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Chat Messages */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
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
                  {/* Messages Container with ScrollArea */}
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full p-3 md:p-4" ref={scrollAreaRef}>
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-8 md:py-12 px-4">
                          <MessageCircle className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50 mb-3 md:mb-4" />
                          <p className="text-base md:text-lg font-medium text-muted-foreground">
                            No messages yet
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground mt-2">
                            Be the first to start the conversation!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 md:space-y-4">
                          {/* Load more button at top */}
                          <div ref={messagesTopRef} className="flex justify-center py-2">
                            {hasMoreMessages && !loadingMore && messages.length >= 50 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={loadMoreMessages}
                                className="text-xs h-8 md:h-9"
                              >
                                Load older messages
                              </Button>
                            )}
                            {loadingMore && (
                              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                                <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                <span className="hidden sm:inline">Loading older messages...</span>
                                <span className="sm:hidden">Loading...</span>
                              </div>
                            )}
                            {!hasMoreMessages && messages.length >= 50 && (
                              <p className="text-xs text-muted-foreground">
                                No more messages to load
                              </p>
                            )}
                          </div>
                          
                          {messages.map((msg) => {
                            const isOwnMessage = msg.userId === auth.userId
                            return (
                              <div
                                key={msg.id}
                                className={`flex items-start gap-2 md:gap-3 group ${
                                  isOwnMessage ? "flex-row-reverse" : "flex-row"
                                }`}
                              >
                                <Avatar className="h-7 w-7 md:h-8 md:w-8 border-2 border-background shrink-0">
                                  <AvatarImage src={msg.userAvatar} alt={msg.userName} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] md:text-xs">
                                    {getInitials(msg.userName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div
                                  className={`flex flex-col max-w-[75%] sm:max-w-[70%] ${
                                    isOwnMessage ? "items-end" : "items-start"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                                    <span className="text-[10px] md:text-xs font-medium text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                                      {isOwnMessage ? "You" : msg.userName}
                                    </span>
                                    <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                                      {formatTime(msg.timestamp)}
                                    </span>
                                  </div>
                                  <div className="relative">
                                    <div
                                      className={`rounded-2xl px-3 py-2 md:px-4 ${
                                        isOwnMessage
                                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                                          : "bg-muted text-foreground rounded-tl-sm"
                                      }`}
                                    >
                                      {/* Replied message reference */}
                                      {msg.replyTo && (
                                        <div
                                          className={`mb-2 pb-2 border-l-2 pl-2 text-[10px] md:text-xs opacity-80 ${
                                            isOwnMessage
                                              ? "border-primary-foreground/30"
                                              : "border-primary/30"
                                          }`}
                                        >
                                          <div className="flex items-center gap-1 mb-0.5">
                                            <Reply className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                            <span className="font-medium">{msg.replyTo.userName}</span>
                                          </div>
                                          <p className="line-clamp-2 break-words">
                                            {msg.replyTo.message}
                                          </p>
                                        </div>
                                      )}
                                      <p className="text-xs md:text-sm whitespace-pre-wrap break-words">
                                        {msg.message}
                                      </p>
                                    </div>
                                    {/* Action buttons */}
                                    <div
                                      className={`absolute -top-2 ${
                                        isOwnMessage ? "-left-[4.5rem]" : "-right-[4.5rem]"
                                      } flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}
                                    >
                                      {/* Reply button - for all messages */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                                        onClick={() => setReplyingTo(msg)}
                                        title="Reply to message"
                                      >
                                        <Reply className="h-3.5 w-3.5" />
                                      </Button>
                                      {/* Delete button - only for own messages */}
                                      {isOwnMessage && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                          onClick={() => setMessageToDelete(msg.id)}
                                          title="Delete message"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Message Input */}
                  <div className="border-t bg-background p-3 md:p-4">
                    {/* Reply indicator */}
                    {replyingTo && (
                      <div className="mb-2 flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Reply className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Replying to {replyingTo.userId === auth.userId ? "yourself" : replyingTo.userName}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                            {replyingTo.message}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => setReplyingTo(null)}
                          title="Cancel reply"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={replyingTo ? "Type your reply..." : "Type your message..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={sending}
                        className="flex-1 text-sm md:text-base"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        size="icon"
                        className="h-9 w-9 md:h-10 md:w-10 shrink-0"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 md:h-5 md:w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Message?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this message? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => messageToDelete && handleDeleteMessage(messageToDelete)}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppShell>
    </ProtectedRoute>
  )
}

