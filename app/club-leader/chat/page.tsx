"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useProfile, useClub } from "@/hooks/use-query-hooks"
import { getClubIdFromToken } from "@/service/clubApi"
import { useEffect, useState, useRef, useCallback } from "react"
import { Send, MessageCircle, Users, Loader2, Trash2, X, Reply, Smile, Pin } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import axios from "axios"
import { EmojiPicker } from "@/components/emoji-picker"
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
  isPinned?: boolean
  pinnedBy?: number
  pinnedAt?: number
  replyTo?: {
    id: string
    userName: string
    message: string
  }
  reactions?: {
    [emoji: string]: {
      count: number
      userIds: number[]
    }
  }
}

interface ChatMessagesResponse {
  messages: ChatMessage[]
  latestTimestamp?: number
}

interface ChatMessageResponse {
  message: ChatMessage
}

interface ChatSuccessResponse {
  success: boolean
  message?: ChatMessage
}

export default function ClubLeaderChatPage() {
  const { auth } = useAuth()
  const [clubId, setClubId] = useState<number | null>(null)
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

  // Get clubId from token
  useEffect(() => {
    const id = getClubIdFromToken()
    if (id) {
      setClubId(id)
    }
  }, [])

  // Fetch user profile and club data
  const { data: profile } = useProfile()
  const { data: managedClub, isLoading: clubLoading } = useClub(clubId || 0, !!clubId)

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!clubId) return

    try {
      const response = await axios.get<ChatMessagesResponse>(`/api/chat/messages?clubId=${clubId}&limit=50`)
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
        setError("Chat service is not configured. Please set up Upstash Redis credentials.")
      } else {
        setError("Failed to load messages. Please try again later.")
      }
      setLoading(false)
    }
  }, [clubId, scrollToBottom])

  // Load more older messages
  const loadMoreMessages = useCallback(async () => {
    if (!clubId || !oldestTimestamp || loadingMore || !hasMoreMessages) return

    setLoadingMore(true)
    try {
      const response = await axios.get<ChatMessagesResponse>(
        `/api/chat/messages?clubId=${clubId}&limit=30&before=${oldestTimestamp}`
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
  }, [clubId, oldestTimestamp, loadingMore, hasMoreMessages])

  // Poll for new messages (realtime updates)
  const pollMessages = useCallback(async () => {
    if (!clubId || latestTimestamp === 0) return

    try {
      const response = await axios.get<ChatMessagesResponse>(
        `/api/chat/poll?clubId=${clubId}&after=${latestTimestamp}`
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
        if (response.data.latestTimestamp) {
          setLatestTimestamp(response.data.latestTimestamp)
        }
        setTimeout(scrollToBottom, 100)
      }
    } catch (error) {
      console.error("Error polling messages:", error)
    }
  }, [clubId, latestTimestamp, scrollToBottom])

  // Initial load
  useEffect(() => {
    if (clubId) {
      fetchMessages()
    }
  }, [clubId, fetchMessages])

  // Set up polling interval for realtime updates
  useEffect(() => {
    if (!clubId) return

    const interval = setInterval(() => {
      pollMessages()
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [clubId, pollMessages])

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !clubId || !profile || sending) return

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
      const response = await axios.post<ChatMessageResponse>("/api/chat/messages", {
        clubId,
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
    if (!clubId || deleting) return

    setDeleting(true)
    try {
      await axios({
        method: 'delete',
        url: "/api/chat/messages",
        data: {
          clubId: clubId,
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

  // Handle emoji reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!clubId) return

    try {
      const response = await axios.post<ChatSuccessResponse>("/api/chat/reactions", {
        clubId,
        messageId,
        userId: auth.userId,
        emoji,
      })

      // Update the message with new reactions in local state
      if (response.data.success && response.data.message) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? response.data.message! : msg
          )
        )
      }
    } catch (error: any) {
      console.error("Error toggling reaction:", error)
      setError("Failed to react to message. Please try again.")
    }
  }

  // Handle pin/unpin message
  const handlePinMessage = async (messageId: string) => {
    if (!clubId) return

    try {
      const response = await axios.post<ChatSuccessResponse>("/api/chat/pin", {
        clubId,
        messageId,
        userId: auth.userId,
      })

      // Update the messages with the new pin status
      if (response.data.success) {
        // Fetch fresh messages to get the updated pin states
        const messagesResponse = await axios.get<ChatMessagesResponse>(
          `/api/chat/messages?clubId=${clubId}&limit=50`
        )
        const fetchedMessages = messagesResponse.data.messages || []
        const reversedMessages = fetchedMessages.reverse() // Reverse to show oldest first
        setMessages(reversedMessages)
      }
    } catch (error: any) {
      console.error("Error toggling pin:", error)
      setError("Failed to pin message. Please try again.")
    }
  }

  // Handle emoji insert into message input
  const handleEmojiInsert = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
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

  if (loading || clubLoading) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-3 md:space-y-4 h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)] flex flex-col">
          {/* Header */}
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
                      ROOM: {managedClub?.name || "Loading..."}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs">Live</span>
                </Badge>
              </div>
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
              
              {/* Pinned Message Display */}
              {messages.some(msg => msg.isPinned) && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 p-3">
                  {messages.filter(msg => msg.isPinned).map(pinnedMsg => (
                    <div key={pinnedMsg.id} className="flex items-start gap-2">
                      <Pin className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-amber-900 dark:text-amber-400">
                            Pinned Message
                          </span>
                          <span className="text-xs text-amber-700 dark:text-amber-500">
                            by {pinnedMsg.userName}
                          </span>
                        </div>
                        <p className="text-sm text-amber-900 dark:text-amber-300 line-clamp-2 break-words whitespace-pre-wrap">
                          {pinnedMsg.message}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 hover:bg-amber-200 dark:hover:bg-amber-900/40"
                        onClick={() => handlePinMessage(pinnedMsg.id)}
                        title="Unpin message"
                      >
                        <X className="h-3.5 w-3.5 text-amber-700 dark:text-amber-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

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
                                {/* Reactions display */}
                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {Object.entries(msg.reactions).map(([emoji, data]) => {
                                      const hasReacted = auth.userId ? data.userIds.includes(Number(auth.userId)) : false
                                      return (
                                        <button
                                          key={emoji}
                                          onClick={() => handleReaction(msg.id, emoji)}
                                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
                                            hasReacted
                                              ? "bg-primary/20 border border-primary/40"
                                              : "bg-muted border border-border hover:bg-muted/80"
                                          }`}
                                          title={`${data.count} reaction${data.count > 1 ? "s" : ""}`}
                                        >
                                          <span className="text-sm">{emoji}</span>
                                          <span className="text-[10px] font-medium">{data.count}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                                
                                {/* Action buttons */}
                                <div
                                  className={`absolute -top-2 ${
                                    isOwnMessage ? "-left-[8rem]" : "-right-[8rem]"
                                  } flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}
                                >
                                  {/* Emoji reaction picker */}
                                  <EmojiPicker
                                    onEmojiSelect={(emoji) => handleReaction(msg.id, emoji)}
                                    trigger={
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 hover:bg-accent/50"
                                        title="React with emoji"
                                      >
                                        <Smile className="h-3.5 w-3.5" />
                                      </Button>
                                    }
                                    side="top"
                                    align={isOwnMessage ? "end" : "start"}
                                  />
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
                                  {/* Pin button - for all messages */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-7 w-7 ${
                                      msg.isPinned
                                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                                        : "hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-600 dark:hover:text-amber-500"
                                    }`}
                                    onClick={() => handlePinMessage(msg.id)}
                                    title={msg.isPinned ? "Unpin message" : "Pin message"}
                                  >
                                    <Pin className="h-3.5 w-3.5" />
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
                  <EmojiPicker 
                    onEmojiSelect={handleEmojiInsert}
                    side="top"
                    align="start"
                  />
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

