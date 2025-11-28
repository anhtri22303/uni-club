"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Calendar, MapPin, Clock, Users, History, Gift } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/pagination"
import { CalendarModal } from "@/components/calendar-modal"
import { fetchEvent, getMyEvents, timeObjectToString, isEventExpired as isEventExpiredUtil } from "@/service/eventApi"
import { EventDateTimeDisplay } from "@/components/event-date-time-display"

export default function PublicEventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [myEvents, setMyEvents] = useState<any[]>([])
  const [myEventsLoading, setMyEventsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch all events and filter PUBLIC only
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        const allEvents = await fetchEvent()
        // Filter only PUBLIC events
        const publicEvents = allEvents.filter((event: any) => event.type === "PUBLIC")
        setAllEvents(publicEvents) // Store all public events for calendar
        setEvents(publicEvents)
      } catch (error) {
        console.error("Failed to load public events:", error)
        toast({
          title: "Error",
          description: "Failed to load public events",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [toast])

  // Load my events when opening history modal
  const loadMyEvents = async () => {
    try {
      setMyEventsLoading(true)
      const events = await getMyEvents()
      setMyEvents(events)
    } catch (error) {
      console.error("Failed to load my events:", error)
      toast({
        title: "Error",
        description: "Failed to load your events",
        variant: "destructive"
      })
    } finally {
      setMyEventsLoading(false)
    }
  }

  // Open history modal and load data
  const handleOpenHistory = () => {
    setShowHistoryModal(true)
    loadMyEvents()
  }

  // Use isEventExpired from eventApi.ts which supports both single-day and multi-day events
  const isEventExpired = isEventExpiredUtil

  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({ expired: "hide" })

  const filteredEvents = events.filter((event: any) =>
    (event.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.hostClub?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const finalFilteredEvents = filteredEvents.filter((event: any) => {
    // Default: Show future APPROVED events (hide expired/completed and rejected)
    const isExpired = isEventExpired(event)
    const eventDate = event.startDate || event.date
    const isFutureEvent = eventDate && new Date(eventDate) >= new Date(new Date().toDateString())
    
    // By default, only show future events that are APPROVED, ONGOING, or COMPLETED
    const expiredFilter = activeFilters["expired"]
    if (expiredFilter === "hide") {
      // Hide expired events (including COMPLETED status)
      if (isExpired) return false
      // Hide rejected events
      if (event.status === "REJECTED") return false
      // Only show APPROVED or ONGOING events
      if (event.status !== "APPROVED" && event.status !== "ONGOING") return false
      // Only show future or today's events
      if (!isFutureEvent) return false
    } else if (expiredFilter === "only") {
      if (!isExpired) return false
      // Only show APPROVED, ONGOING, or COMPLETED events
      if (event.status !== "APPROVED" && event.status !== "ONGOING" && event.status !== "COMPLETED") return false
    } else if (expiredFilter === "show") {
      // Show all events regardless of expiration
      // Only show APPROVED, ONGOING, or COMPLETED events (exclude REJECTED, PENDING, etc.)
      if (event.status !== "APPROVED" && event.status !== "ONGOING" && event.status !== "COMPLETED") return false
    }
    
    return true
  })

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData: paginatedEvents,
    setCurrentPage,
    setPageSize,
  } = usePagination({
    data: finalFilteredEvents,
    initialPageSize: 6,
  })

  // Time-aware status
  const getEventStatus = (event: any) => {
    // Nếu event.status là ONGOING thì bắt buộc phải là "Now"
    if (event?.status === "ONGOING") return "Now"
    
    if (!event?.date) return "Finished"
    const now = new Date()
    const startTimeStr = timeObjectToString(event.startTime || event.time)
    const endTimeStr = timeObjectToString(event.endTime)
    const [startHour = "00", startMinute = "00"] = (startTimeStr || "00:00").split(":")
    const [year, month, day] = event.date.split("-").map(Number)
    const eventStart = new Date(year, month - 1, day, Number(startHour), Number(startMinute), 0, 0)
    let eventEnd = eventStart
    if (endTimeStr) {
      const [endHour = "00", endMinute = "00"] = endTimeStr.split(":")
      eventEnd = new Date(year, month - 1, day, Number(endHour), Number(endMinute), 0, 0)
    } else {
      eventEnd = new Date(eventStart.getTime() + 2 * 60 * 60 * 1000)
    }
    const start = eventStart.getTime()
    const end = eventEnd.getTime()
    if (now.getTime() < start) {
      if (start - now.getTime() < 7 * 24 * 60 * 60 * 1000) return "Soon"
      return "Future"
    }
    if (now.getTime() >= start && now.getTime() <= end) return "Now"
    return "Finished"
  }

  const handleEventDetail = (eventId: string) => {
    router.push(`/student/events-public/${eventId}`)
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Public Events</h1>
              <p className="text-muted-foreground">
                Discover upcoming public events from all clubs
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleOpenHistory}>
                <History className="h-4 w-4 mr-2" /> History
              </Button>
              <Button variant="outline" onClick={() => setShowCalendarModal(true)}>
                <Calendar className="h-4 w-4 mr-2" /> Calendar View
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="max-w-sm flex-1 min-w-[200px]"
            />

            {/* Dropdown lọc sự kiện hết hạn */}
            <Select
              value={activeFilters["expired"] || "hide"}
              onValueChange={(v) => {
                setActiveFilters({ ...activeFilters, expired: v })
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hide">Hide Expired</SelectItem>
                <SelectItem value="show">Show All</SelectItem>
                <SelectItem value="only">Only Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground">Loading events...</div>
              </div>
            ) : paginatedEvents.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground">
                  {filteredEvents.length === 0 && events.length > 0
                    ? "Try adjusting your search terms"
                    : "No public events available yet"}
                </p>
              </div>
            ) : (
              paginatedEvents.map((event: any) => {
                const isExpired = isEventExpired(event)
                const status = isExpired ? "Finished" : getEventStatus(event)
                
                // Determine border color based on event status
                let borderColor = ""
                if (event.status === "COMPLETED") {
                  borderColor = "border-l-4 border-l-blue-900"
                } else if (event.status === "APPROVED") {
                  borderColor = "border-l-4 border-l-green-500"
                } else if (event.status === "ONGOING") {
                  borderColor = "border-l-4 border-l-purple-500"
                }

                return (
                  <Card key={event.id} className={`hover:shadow-md transition-shadow ${borderColor}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="line-clamp-2">{event.name}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{event.hostClub?.name || "Unknown Club"}</span>
                          </div>
                        </div>
                        {/* Status Badge (Soon/Now/Future) at top right */}
                        <Badge
                          variant={
                            status === "Now"
                              ? "default"
                              : status === "Soon"
                              ? "secondary"
                              : "outline"
                          }
                          className={
                            status === "Now"
                              ? "bg-green-500"
                              : status === "Soon"
                              ? "bg-yellow-500"
                              : ""
                          }
                        >
                          {status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <EventDateTimeDisplay event={event} variant="compact" />
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.locationName || "Location TBA"}</span>
                        </div>

                        {/* Event Type and Status Badges at bottom left */}
                        <div className="flex items-center gap-2 pt-2">
                          <Badge variant={event.type === "PUBLIC" ? "default" : "secondary"}>
                            {event.type}
                          </Badge>
                          <Badge variant="outline">
                            {event.status}
                          </Badge>
                          <Badge variant="default" className="flex items-center gap-1 shrink-0 bg-emerald-600 hover:bg-emerald-700">
                            <Gift className="h-3 w-3" />
                            {(() => {
                              const budgetPoints = event.budgetPoints ?? 0
                              const maxCheckInCount = event.maxCheckInCount ?? 1
                              const receivePoint = maxCheckInCount > 0 ? Math.floor(budgetPoints / maxCheckInCount) : 0
                              return receivePoint
                            })()} pts
                          </Badge>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEventDetail(event.id.toString())}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
            pageSizeOptions={[6, 12, 24, 48]}
          />

          {/* History Modal */}
          <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>My Events Joined</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {myEventsLoading ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <div className="text-muted-foreground">Loading your events...</div>
                  </div>
                ) : myEvents.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p>You haven't joined for any events yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myEvents.map((event) => {
                      const status = event.status
                      let borderColor = ""
                      if (status === "COMPLETED") {
                        borderColor = "border-l-4 border-l-blue-900"
                      } else if (status === "APPROVED") {
                        borderColor = "border-l-4 border-l-green-500"
                      } else if (status === "ONGOING") {
                        borderColor = "border-l-4 border-l-purple-500"
                      } else if (status === "PENDING_UNISTAFF") {
                        borderColor = "border-l-4 border-l-yellow-500"
                      }

                      return (
                        <Card key={event.id} className={`hover:shadow-md transition-shadow ${borderColor}`}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                  <h4 className="font-semibold line-clamp-2">{event.name}</h4>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    <span>{event.hostClub?.name || "Unknown Club"}</span>
                                  </div>
                                </div>
                                <Badge variant={event.type === "PUBLIC" ? "default" : "secondary"}>
                                  {event.type}
                                </Badge>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{event.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {event.startTime && event.endTime
                                      ? `${timeObjectToString(event.startTime)} - ${timeObjectToString(event.endTime)}`
                                      : "Time not set"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{event.locationName || "Location TBA"}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <Badge variant="outline">{status}</Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setShowHistoryModal(false)
                                    router.push(`/student/events-public/${event.id}`)
                                  }}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Calendar Modal */}
          <CalendarModal
            open={showCalendarModal}
            onOpenChange={setShowCalendarModal}
            events={allEvents}
            onEventClick={(event) => {
              setShowCalendarModal(false)
              router.push(`/student/events-public/${event.id}`)
            }}
          />
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
