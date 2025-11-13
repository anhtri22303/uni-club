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
import { Calendar, MapPin, Clock, Users, History, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/pagination"
import { CalendarModal } from "@/components/calendar-modal"
import { fetchEvent, registerForEvent, getMyEventRegistrations, timeObjectToString } from "@/service/eventApi"
import { useQueryClient } from "@tanstack/react-query"

export default function PublicEventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [registeringEventId, setRegisteringEventId] = useState<number | null>(null)
  const [showRegisteredOnly, setShowRegisteredOnly] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [myRegistrations, setMyRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch all events and filter PUBLIC only
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        const allEvents = await fetchEvent()
        // Filter only PUBLIC events
        const publicEvents = allEvents.filter((event: any) => event.type === "PUBLIC")
        setEvents(publicEvents)
        
        // Fetch user registrations
        const registrations = await getMyEventRegistrations()
        setMyRegistrations(registrations)
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

  // Filter registrations to only include PUBLIC events
  const publicEventIds = new Set(events.map(e => e.id))
  const publicRegistrations = myRegistrations.filter((r: any) => publicEventIds.has(r.eventId))

  // Counts for legend summary
  const confirmedCount = publicRegistrations.filter((r: any) => r.status === "CONFIRMED").length
  const checkedInCount = publicRegistrations.filter((r: any) => r.status === "CHECKED_IN").length

  // Helper function to check if event is registered
  const isEventRegistered = (eventId: number) => {
    return publicRegistrations.some((reg) => reg.eventId === eventId)
  }

  // Helper function to check if event has expired (past endTime) or is COMPLETED
  const isEventExpired = (event: any) => {
    // COMPLETED status is always considered expired
    if (event.status === "COMPLETED") return true
    
    // Check if date and endTime are present
    if (!event.date || !event.endTime) return false

    try {
      // Get current date/time in Vietnam timezone (UTC+7)
      const now = new Date()
      const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))

      // Parse event date (format: YYYY-MM-DD)
      const [year, month, day] = event.date.split('-').map(Number)

      // Convert endTime to string if it's an object
      const endTimeStr = timeObjectToString(event.endTime)
      
      // Parse endTime (format: HH:MM:SS or HH:MM)
      const [hours, minutes] = endTimeStr.split(':').map(Number)

      // Create event end datetime in Vietnam timezone
      const eventEndDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0)

      // Event is expired if current VN time is past the end time
      return vnTime > eventEndDateTime
    } catch (error) {
      console.error('Error checking event expiration:', error)
      return false
    }
  }

  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({ expired: "hide" })

  const filteredEvents = events.filter((event: any) =>
    (event.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.hostClub?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const finalFilteredEvents = filteredEvents.filter((event: any) => {
    // Filter by registered events only if showRegisteredOnly is true
    if (showRegisteredOnly && !isEventRegistered(event.id)) {
      return false
    }

    // Default: Show future APPROVED events (hide expired/completed and rejected)
    const isExpired = isEventExpired(event)
    const isFutureEvent = event.date && new Date(event.date) >= new Date(new Date().toDateString())
    
    // By default, only show future events that are APPROVED
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
    } else if (expiredFilter === "show") {
      // Show all events regardless of expiration
      if (event.status !== "APPROVED" && event.status !== "COMPLETED" && event.status !== "ONGOING") {
        return false
      }
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

  const handleRegisterClick = (event: any) => {
    console.log("Selected event for registration:", event)
    console.log("commitPointCost:", event.commitPointCost)
    setSelectedEventForRegistration(event)
    setShowConfirmModal(true)
  }

  const handleConfirmRegister = async () => {
    if (!selectedEventForRegistration) return
    
    const eventId = selectedEventForRegistration.id
    setRegisteringEventId(eventId)
    setShowConfirmModal(false)
    
    try {
      const result = await registerForEvent(eventId)
      toast({
        title: "Success",
        description: result.message || "Successfully registered for the event!",
      })
      // Reload registrations
      const registrations = await getMyEventRegistrations()
      setMyRegistrations(registrations)
    } catch (error: any) {
      console.error("Error registering for event:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to register for the event",
        variant: "destructive"
      })
    } finally {
      setRegisteringEventId(null)
      setSelectedEventForRegistration(null)
    }
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
              <Button variant="outline" onClick={() => setShowHistoryModal(true)}>
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

            {/* Toggle button for registered events only */}
            <Button
              variant={showRegisteredOnly ? "default" : "outline"}
              onClick={() => {
                const newShowRegisteredOnly = !showRegisteredOnly
                setShowRegisteredOnly(newShowRegisteredOnly)
                // When switching to "My Registrations", change filter to "show all"
                // When switching back to "All Events", change filter to "hide expired"
                if (newShowRegisteredOnly) {
                  setActiveFilters({ ...activeFilters, expired: "show" })
                } else {
                  setActiveFilters({ ...activeFilters, expired: "hide" })
                }
                setCurrentPage(1)
              }}
              className="whitespace-nowrap"
            >
              <Trophy className="h-4 w-4 mr-2" />
              {showRegisteredOnly ? "All Events" : "My Registrations"}
              {showRegisteredOnly && myRegistrations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {myRegistrations.length}
                </Badge>
              )}
            </Button>
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
                        <Badge variant={event.type === "PUBLIC" ? "default" : "secondary"}>
                          {event.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {event.startTime && event.endTime
                              ? `${timeObjectToString(event.startTime)} - ${timeObjectToString(event.endTime)}`
                              : "Time not set"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.locationName || "Location TBA"}</span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
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
                          {isEventRegistered(event.id) && (
                            <Badge variant="outline" className="border-blue-500 text-blue-500">
                              Registered
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEventDetail(event.id.toString())}
                          >
                            View Details
                          </Button>
                          {!isEventRegistered(event.id) && status !== "Finished" && (
                            <Button
                              className="flex-1"
                              onClick={() => handleRegisterClick(event)}
                              disabled={registeringEventId === event.id}
                            >
                              {registeringEventId === event.id ? "Registering..." : "Register"}
                            </Button>
                          )}
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

          {/* Calendar Modal */}
          <CalendarModal
            open={showCalendarModal}
            onOpenChange={setShowCalendarModal}
            events={events}
            onEventClick={(event) => {
              setShowCalendarModal(false)
              router.push(`/student/events-public/${event.id}`)
            }}
          />

          {/* History Modal */}
          <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>My Event Registrations</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Legend / Status meanings */}
                <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span>Confirmed ({confirmedCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span>Checked In ({checkedInCount})</span>
                    </div>
                  </div>
                </div>
                {publicRegistrations.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p>You haven't registered for any public events yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {publicRegistrations.map((registration) => (
                      <Card key={`${registration.eventId}-${registration.registeredAt}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-semibold">{registration.eventName}</h4>
                              <p className="text-sm text-muted-foreground">{registration.clubName}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{registration.date}</span>
                              </div>
                            </div>
                            <Badge
                              variant={registration.status === "CHECKED_IN" ? "default" : "secondary"}
                              className={
                                registration.status === "CONFIRMED"
                                  ? "bg-green-500"
                                  : registration.status === "CHECKED_IN"
                                  ? "bg-blue-500"
                                  : ""
                              }
                            >
                              {registration.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Registration Confirmation Modal */}
          <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Event Registration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedEventForRegistration && (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-semibold">{selectedEventForRegistration.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedEventForRegistration.hostClub?.name}
                      </p>
                    </div>
                    
                    {selectedEventForRegistration.commitPointCost > 0 && (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                        <p className="text-sm font-medium text-yellow-800">
                          Commitment Required
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          {selectedEventForRegistration.commitPointCost} points will be held as commitment.
                          These points will be returned after successful attendance.
                        </p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowConfirmModal(false)
                      setSelectedEventForRegistration(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirmRegister}
                  >
                    Confirm Registration
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
