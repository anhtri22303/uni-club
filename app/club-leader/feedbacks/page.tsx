"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getFeedbackByClubId, Feedback } from "@/service/feedbackApi"
import { getClubIdFromToken } from "@/service/clubApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Star, Search, Calendar, MessageSquare, ChevronDown, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

interface EventFeedbackGroup {
  eventId: number
  eventName: string
  feedbacks: Feedback[]
  averageRating: number
  totalFeedbacks: number
}

export default function ClubLeaderFeedbacksPage() {
  const { auth } = useAuth()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [selectedRating, setSelectedRating] = useState<string>("all")
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch feedbacks
  useEffect(() => {
    const fetchFeedbacks = async () => {
      const clubId = getClubIdFromToken()
      
      if (!clubId) {
        toast({
          title: "Error",
          description: "Club ID not found",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getFeedbackByClubId(clubId)
        setFeedbacks(data)
      } catch (error) {
        console.error("Error fetching feedbacks:", error)
        toast({
          title: "Error",
          description: "Failed to load feedbacks",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFeedbacks()
  }, [])

  // Group feedbacks by event
  const groupedFeedbacks = useMemo(() => {
    const groups = new Map<number, EventFeedbackGroup>()

    feedbacks.forEach((feedback) => {
      if (!groups.has(feedback.eventId)) {
        groups.set(feedback.eventId, {
          eventId: feedback.eventId,
          eventName: feedback.eventName,
          feedbacks: [],
          averageRating: 0,
          totalFeedbacks: 0,
        })
      }

      const group = groups.get(feedback.eventId)!
      group.feedbacks.push(feedback)
    })

    // Calculate averages
    groups.forEach((group) => {
      group.totalFeedbacks = group.feedbacks.length
      const sum = group.feedbacks.reduce((acc, f) => acc + f.rating, 0)
      group.averageRating = sum / group.totalFeedbacks
    })

    return Array.from(groups.values())
  }, [feedbacks])

  // Get unique events for filter
  const uniqueEvents = useMemo(() => {
    return groupedFeedbacks.map((group) => ({
      id: group.eventId,
      name: group.eventName,
    }))
  }, [groupedFeedbacks])

  // Filter grouped feedbacks
  const filteredGroups = useMemo(() => {
    return groupedFeedbacks.filter((group) => {
      const matchesEvent =
        selectedEvent === "all" || group.eventId.toString() === selectedEvent

      const matchesRating =
        selectedRating === "all" ||
        group.feedbacks.some((f) => f.rating.toString() === selectedRating)

      const matchesSearch =
        group.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.feedbacks.some(
          (f) =>
            f.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.comment.toLowerCase().includes(searchTerm.toLowerCase())
        )

      return matchesEvent && matchesRating && matchesSearch
    })
  }, [groupedFeedbacks, searchTerm, selectedEvent, selectedRating])

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage)
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredGroups.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredGroups, currentPage])

  // Toggle event expansion
  const toggleEventExpansion = (eventId: number) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(eventId)) {
        newSet.delete(eventId)
      } else {
        newSet.add(eventId)
      }
      return newSet
    })
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedEvent, selectedRating])

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (feedbacks.length === 0) return 0
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0)
    return (sum / feedbacks.length).toFixed(1)
  }, [feedbacks])

  // Total feedbacks count
  const totalFeedbacksCount = useMemo(() => {
    return filteredGroups.reduce((acc, group) => acc + group.totalFeedbacks, 0)
  }, [filteredGroups])

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading feedbacks...</p>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Club Feedbacks</h1>
          <p className="text-muted-foreground">
            View and manage feedback from club events
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Feedbacks
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFeedbacksCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating}</div>
              <div className="mt-1">{renderStars(Math.round(Number(averageRating)))}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Events with Feedback
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueEvents.length}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by member, event, or comment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Event Filter */}
            <div className="space-y-2">
              <Label htmlFor="event">Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger id="event">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {uniqueEvents.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Select value={selectedRating} onValueChange={setSelectedRating}>
                <SelectTrigger id="rating">
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events with Feedbacks */}
      <Card>
        <CardHeader>
          <CardTitle>Events & Feedbacks</CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedGroups.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No feedbacks found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or wait for members to submit feedback
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedGroups.map((group) => {
                  const isExpanded = expandedEvents.has(group.eventId)

                  return (
                    <Card key={group.eventId} className="overflow-hidden">
                      {/* Event Header - Clickable */}
                      <div
                        className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => toggleEventExpansion(group.eventId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate">
                                {group.eventName}
                              </h3>
                              <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-1">
                                  {renderStars(Math.round(group.averageRating))}
                                  <span className="text-sm font-medium ml-1">
                                    {group.averageRating.toFixed(1)}
                                  </span>
                                </div>
                                <Badge variant="secondary">
                                  {group.totalFeedbacks} {group.totalFeedbacks === 1 ? "feedback" : "feedbacks"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Feedbacks List - Expandable */}
                      {isExpanded && (
                        <div className="border-t bg-muted/30">
                          <div className="p-4 space-y-3">
                            {group.feedbacks.map((feedback) => (
                              <Card key={feedback.feedbackId} className="bg-background">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    {/* Rating and Date */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        {renderStars(feedback.rating)}
                                        <span className="text-sm font-medium">
                                          {feedback.rating}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(feedback.createdAt), "MMM dd, yyyy")}
                                      </div>
                                    </div>

                                    {/* Comment */}
                                    <p className="text-sm text-foreground">
                                      {feedback.comment}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredGroups.length)} of{" "}
                    {filteredGroups.length} events
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first page, last page, current page, and pages around current
                          return (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1
                          )
                        })
                        .map((page, idx, arr) => {
                          // Add ellipsis if there's a gap
                          const prevPage = arr[idx - 1]
                          const showEllipsis = prevPage && page - prevPage > 1

                          return (
                            <div key={page} className="flex items-center">
                              {showEllipsis && (
                                <span className="px-2 text-muted-foreground">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </div>
                          )
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
