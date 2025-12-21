"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarModal } from "@/components/calendar-modal"
import { EventDateTimeDisplay } from "@/components/event-date-time-display"
import { usePagination } from "@/hooks/use-pagination"
import { useState } from "react"
import { Calendar, Users, Ticket, Layers, History, X, Gift } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { safeSessionStorage } from "@/lib/browser-utils"
import { useClubEvents, useClubs, useMyEventRegistrations, useEventsByClubId } from "@/hooks/use-query-hooks"
import {
  timeObjectToString,
  registerForEvent,
  cancelEventRegistration,
  isMultiDayEvent,
  formatEventDateRange,
  getEventDurationDays,
  getEventStartTime,
  getEventEndTime,
  isEventExpired as isEventExpiredUtil
} from "@/service/eventApi"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useQueryClient } from "@tanstack/react-query"
import { fetchProfile, type UserProfile } from "@/service/userApi"

// Import data
import clubs from "@/src/data/clubs.json"

export default function MemberEventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [userClubIds, setUserClubIds] = useState<number[]>([])
  const router = useRouter()
  //    MỚI: State để quản lý việc chọn club
  // const [selectedClubId, setSelectedClubId] = useState<string>("all") // 'all' là giá trị mặc định
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null) // Bắt đầu là null
  const [userClubsDetails, setUserClubsDetails] = useState<any[]>([]) // Để lưu {id, name}
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [registeringEventId, setRegisteringEventId] = useState<number | null>(null)
  const [showRegisteredOnly, setShowRegisteredOnly] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<any>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedEventForCancellation, setSelectedEventForCancellation] = useState<any>(null)
  const [cancellingEventId, setCancellingEventId] = useState<number | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()



  // Read selectedClubId from sessionStorage on mount
  useEffect(() => {
    const savedClubId = safeSessionStorage.getItem("student-events-selected-club-id")
    if (savedClubId) {
      setSelectedClubId(savedClubId)
    }
  }, [])

  // Get user's club IDs from API fetchProfile
  useEffect(() => {
    const fetchUserClubs = async () => {
      try {
        const profile: UserProfile | null = await fetchProfile()
        
        if (!profile) {
          console.error("Failed to fetch profile: Profile data is null")
          setUserClubIds([])
          return
        }

        const clubs = profile?.clubs || []
        if (clubs && Array.isArray(clubs) && clubs.length > 0) {
          const clubIds = clubs.map((club: any) => club.clubId)
          setUserClubIds(clubIds)
        } else {
          setUserClubIds([])
        }
      } catch (error) {
        console.error("Failed to fetch profile for club IDs:", error)
        setUserClubIds([])
      }
    }

    fetchUserClubs()
  }, [])

  // Fetch club data and registrations
  const { data: clubsData = [] } = useClubs()
  const { data: myRegistrations = [] } = useMyEventRegistrations()
  // Counts for legend summary
  const confirmedCount = (myRegistrations || []).filter((r: any) => r.status === "CONFIRMED" || r.status === "REGISTERED").length
  const checkedInCount = (myRegistrations || []).filter((r: any) => r.status === "CHECKED_IN" || r.status === "ATTENDED").length
  const rewardedCount = (myRegistrations || []).filter((r: any) => r.status === "REWARDED").length
  const noShowCount = (myRegistrations || []).filter((r: any) => r.status === "NO_SHOW").length

  //    CẬP NHẬT: useEffect để lấy chi tiết club VÀ set default
  useEffect(() => {
    if (userClubIds.length > 0 && clubsData.length > 0) {
      // Lọc danh sách 'all clubs' để chỉ lấy những club mà user tham gia
      // const details = clubsData.filter((club: any) => userClubIds.includes(club.id))
      const details = userClubIds
        .map((id) => clubsData.find((club: any) => club.id === id))
        .filter(Boolean) // Loại bỏ (filter out) bất kỳ club nào không tìm thấy (undefined)
      setUserClubsDetails(details as any[])
      
      // Check if there's a saved club ID in sessionStorage
      const savedClubId = safeSessionStorage.getItem("student-events-selected-club-id")
      
      // Only set default if no saved value and selectedClubId is null
      if (details.length > 0 && selectedClubId === null && !savedClubId) {
        const firstClubId = String(details[0].id)
        setSelectedClubId(firstClubId)
        safeSessionStorage.setItem("student-events-selected-club-id", firstClubId)
      }
      
      // Validate saved club ID is still valid (user still a member)
      if (savedClubId && !userClubIds.includes(Number(savedClubId))) {
        // Saved club is no longer valid, reset to first club
        if (details.length > 0) {
          const firstClubId = String(details[0].id)
          setSelectedClubId(firstClubId)
          safeSessionStorage.setItem("student-events-selected-club-id", firstClubId)
        }
      }
    }
  }, [userClubIds, clubsData, selectedClubId]) // Chạy lại khi 3 danh sách này sẵn sàng

  //    USE REACT QUERY to fetch events for the SELECTED club only
  const selectedClubIdNumber = selectedClubId ? Number(selectedClubId) : null
  const { data: selectedClubEvents = [], isLoading: selectedClubLoading } = useEventsByClubId(
    selectedClubIdNumber || 0,
    !!selectedClubIdNumber
  )

  // Store all events for calendar (without filter)
  const allClubEvents = selectedClubEvents

  // Helper function to sort events by date and time (newest to oldest)
  const sortEventsByDateTime = (eventList: any[]) => {
    return eventList.sort((a: any, b: any) => {
      // Parse dates for comparison - support both multi-day and single-day events
      // For multi-day, use first day's date (startDate)
      let dateAStr = a.startDate || a.date || "1970-01-01"
      let dateBStr = b.startDate || b.date || "1970-01-01"
      
      // If event has days array, use first day's date
      if (a.days && a.days.length > 0) dateAStr = a.days[0].date
      if (b.days && b.days.length > 0) dateBStr = b.days[0].date

      const dateA = new Date(dateAStr)
      const dateB = new Date(dateBStr)

      // Compare dates first (newest first)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime()
      }

      // If dates are equal, compare times (latest startTime first)
      const timeAStr = timeObjectToString(a.startTime) || a.time || "00:00"
      const timeBStr = timeObjectToString(b.startTime) || b.time || "00:00"

      // Convert time strings to comparable format (HH:MM to minutes)
      const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(":").map(Number)
        return hours * 60 + minutes
      }

      return parseTime(timeBStr) - parseTime(timeAStr)
    })
  }

  // Use selectedClubEvents instead of eventsData for filtering
  const filteredEvents = sortEventsByDateTime(
    selectedClubEvents.filter(
      (event: any) =>
        (event.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.hostClub?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        clubsData.find((c: any) => c.id === event.hostClub?.id)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clubs.find((c) => c.id === event.hostClub?.id)?.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  )

  // Helper function to check if event is registered
  const isEventRegistered = (eventId: number) => {
    return myRegistrations.some((reg) => reg.eventId === eventId)
  }

  // Helper function to check if event is full (reached maxCheckInCount)
  const isEventFull = (event: any) => {
    const maxCheckInCount = event.maxCheckInCount ?? 0
    const currentCheckInCount = event.currentCheckInCount ?? 0
    return maxCheckInCount > 0 && currentCheckInCount >= maxCheckInCount
  }

  // Use isEventExpired from eventApi.ts which supports both single-day and multi-day events
  const isEventExpired = isEventExpiredUtil

  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({ expired: "hide" })

  const finalFilteredEvents = filteredEvents.filter((event: any) => {
    // PRIVATE event filter: Only show PRIVATE events if user is a member of the host club
    if (event.type === "PRIVATE") {
      const hostClubId = event.hostClub?.id
      if (!hostClubId || !userClubIds.includes(hostClubId)) {
        return false // Hide PRIVATE events from clubs the user is not a member of
      }
    }

    // Filter by registered events only if showRegisteredOnly is true
    if (showRegisteredOnly && !isEventRegistered(event.id)) {
      return false
    }

    // Default: Show future PENDING and APPROVED events (hide expired/completed and rejected)
    const isExpired = isEventExpired(event)
    // For multi-day events, check if last day is today or future
    // For single-day events, check if event date is today or future
    let isFutureEvent = false
    if (event.days && event.days.length > 0) {
      // Multi-day: check if last day is today or future
      const lastDay = event.days[event.days.length - 1]
      isFutureEvent = lastDay.date && new Date(lastDay.date) >= new Date(new Date().toDateString())
    } else {
      // Single-day: check if event date is today or future
      const eventDate = event.startDate || event.date
      isFutureEvent = eventDate && new Date(eventDate) >= new Date(new Date().toDateString())
    }

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

  // Time-aware status similar to club-leader/events
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
    router.push(`/student/events/${eventId}`)
  }

  const handleRegisterClick = (event: any) => {
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
      // Refetch registrations after successful registration
      queryClient.invalidateQueries({ queryKey: ["events", "my-registrations"] })
    } catch (error: any) {
      console.error("Error registering for event:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.error || error?.response?.data?.message || "Failed to register for the event",
        variant: "destructive"
      })
    } finally {
      setRegisteringEventId(null)
      setSelectedEventForRegistration(null)
    }
  }

  const handleCancelClick = (event: any) => {
    setSelectedEventForCancellation(event)
    setShowCancelModal(true)
  }

  const handleConfirmCancel = async () => {
    if (!selectedEventForCancellation) return

    const eventId = selectedEventForCancellation.id
    setCancellingEventId(eventId)
    setShowCancelModal(false)

    try {
      const result = await cancelEventRegistration(eventId)
      toast({
        title: "Success",
        description: result.message || "Successfully cancelled event registration!",
      })
      // Refetch registrations after successful cancellation
      queryClient.invalidateQueries({ queryKey: ["events", "my-registrations"] })
    } catch (error: any) {
      console.error("Error cancelling registration:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.error || error?.response?.data?.message || "Failed to cancel registration",
        variant: "destructive"
      })
    } finally {
      setCancellingEventId(null)
      setSelectedEventForCancellation(null)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Events</h1>
              <p className="text-muted-foreground">
                Discover upcoming events from your clubs

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

          {/* Thêm dropdown chọn club */}
          <div className="flex flex-wrap gap-4">
            {/* Search Bar Wrapper */}
            <div className="relative max-w-sm flex-1 min-w-[200px]">
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                // Thêm pr-10 để tránh chữ bị nút X che
                className="pr-10 w-full bg-white border-slate-300"
              />

              {/* Nút Clear Search */}
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => {
                    setSearchTerm("")
                    setCurrentPage(1) // Reset về trang 1 khi xóa tìm kiếm
                  }}
                  // Style: Tuyệt đối bên phải, hover chuyển màu Primary + chữ trắng
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-slate-400 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>


            {/* Dropdown chọn Club */}
            {userClubIds.length > 0 && (
              <Select
                value={selectedClubId || ""}
                onValueChange={(value) => {
                  setSelectedClubId(value)
                  safeSessionStorage.setItem("student-events-selected-club-id", value)
                  setCurrentPage(1) // Reset về trang 1 khi đổi filter
                }}
              >
                <SelectTrigger className="w-full sm:w-[250px] border-slate-300 bg-white">
                  <div className="flex items-center gap-2 flex-1 min-w-0 text-left">
                    <Layers className="h-4 w-4 text-muted-foreground shrink-0" />

                    <span className="truncate flex-1 text-left">
                      <SelectValue placeholder="Select a club" />
                    </span>

                  </div>
                </SelectTrigger>

                <SelectContent>
                  {/* <SelectItem value="all">All My Clubs</SelectItem> */}
                  {userClubsDetails.map((club) => (
                    <SelectItem key={club.id} value={String(club.id)}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Dropdown lọc sự kiện hết hạn */}
            <Select
              value={activeFilters["expired"] || "hide"}
              onValueChange={(v) => {
                setActiveFilters({ ...activeFilters, expired: v })
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] border-slate-300 bg-white">
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
              // className="whitespace-nowrap border-slate-300"
              className={`whitespace-nowrap ${showRegisteredOnly ? "" : "bg-white border-slate-300"}`}
            >
              <Ticket className="h-4 w-4 mr-2" />
              {showRegisteredOnly ? "All Events" : "My Registrations"}
              {showRegisteredOnly && myRegistrations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {myRegistrations.length}
                </Badge>
              )}
            </Button>
          </div>


          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {selectedClubLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground">Loading events...</div>
              </div>
            ) : userClubIds.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No club membership found</h3>
                <p className="text-muted-foreground">You need to join a club first to see events</p>
              </div>
            ) : paginatedEvents.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground">
                  {filteredEvents.length === 0 && selectedClubEvents.length > 0
                    ? "Try adjusting your search terms"
                    : "Your clubs haven't posted any events yet"}
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
                } else if (event.status === "PENDING_UNISTAFF") {
                  borderColor = "border-l-4 border-l-yellow-500"
                } else if (event.status === "REJECTED") {
                  borderColor = "border-l-4 border-l-red-500"
                }

                return (
                  <Card key={event.id} className={`hover:shadow-md transition-shadow ${borderColor}`}>
                    <CardHeader>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg line-clamp-2" title={event.name}>{event.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3 shrink-0" />
                              <span className="truncate">{event.hostClub?.name || "Unknown Club"}</span>
                            </CardDescription>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-start gap-2">
                          <Badge
                            variant="outline"
                            className={
                              event.type === "PRIVATE"
                                ? "bg-purple-100 text-purple-700 border-purple-300 shrink-0"
                                : "bg-blue-100 text-blue-700 border-blue-300 shrink-0"
                            }
                          >
                            {event.type || "UNKNOWN"}
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                            <Ticket className="h-3 w-3" />
                            {(event.commitPointCost ?? 0)} pts
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

                          {event.status === "COMPLETED" ? (
                            <Badge variant="outline" className="bg-blue-900 text-white border-blue-900 font-semibold text-xs">
                              <span className="inline-block w-2 h-2 rounded-full bg-white mr-1"></span>
                              COMPLETED
                            </Badge>
                          ) : event.status === "ONGOING" ? (
                            <Badge variant="default" className="bg-purple-600 text-white border-purple-600 font-semibold text-xs">
                              <span className="inline-block w-2 h-2 rounded-full bg-white mr-1"></span>
                              ONGOING
                            </Badge>
                          ) : event.status === "APPROVED" ? (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-500 font-semibold text-xs">
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                              {event.status}
                            </Badge>
                          ) : event.status === "PENDING_COCLUB" ? (
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-500 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700 font-semibold text-[10px] sm:text-xs">
                              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1"></span>
                              <span className="hidden sm:inline">PENDING CO-CLUB</span>
                              <span className="sm:hidden">CO-CLUB</span>
                            </Badge>
                          ) : event.status === "PENDING_UNISTAFF" ? (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700 font-semibold text-[10px] sm:text-xs">
                              <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                              <span className="hidden sm:inline">PENDING UNI-STAFF</span>
                              <span className="sm:hidden">UNI-STAFF</span>
                            </Badge>
                          ) : event.status === "REJECTED" ? (
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-500 font-semibold text-xs">
                              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                              REJECTED
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600 text-xs">
                              {event.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

                        <EventDateTimeDisplay event={event} variant="compact" />

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            className="flex-1 w-full"
                            variant="outline"
                            onClick={() => handleEventDetail(String(event.id))}
                          >
                            View Detail
                          </Button>
                          {event.type !== "PUBLIC" && (
                            <div className="flex gap-2 flex-1">
                              <Button
                                className="flex-1 w-full text-xs sm:text-sm"
                                variant="default"
                                disabled={registeringEventId === event.id || event.status === "COMPLETED" || isExpired || isEventRegistered(event.id) || isEventFull(event)}
                                onClick={() => handleRegisterClick(event)}
                              >
                                {registeringEventId === event.id
                                  ? "Registering..."
                                  : isEventRegistered(event.id)
                                    ? "Registered"
                                    : isEventFull(event)
                                      ? "Full"
                                      : event.status === "COMPLETED" || isExpired
                                        ? "Ended"
                                        : "Register"}
                              </Button>
                              {isEventRegistered(event.id) && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="shrink-0"
                                  disabled={cancellingEventId === event.id || event.status === "COMPLETED" || isExpired}
                                  onClick={() => handleCancelClick(event)}
                                  title="Cancel Registration"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
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
            events={allClubEvents}
            onEventClick={(event) => {
              setShowCalendarModal(false)
              router.push(`/student/events/${event.id}`)
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
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-500 dark:border-blue-700"
                      >
                        CONFIRMED
                      </Badge>
                      <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                        {confirmedCount}
                      </Badge>
                      <span>Registered successfully.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-500 dark:border-green-700"
                      >
                        CHECKED_IN
                      </Badge>
                      <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                        {checkedInCount}
                      </Badge>
                      <span>Checked in fully (attendance recorded).</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-500 dark:border-emerald-700"
                      >
                        REWARDED
                      </Badge>
                      <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                        {rewardedCount}
                      </Badge>
                      <span>Completed & rewarded with points.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600"
                      >
                        NO_SHOW
                      </Badge>
                      <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                        {noShowCount}
                      </Badge>
                      <span>Did not attend.</span>
                    </div>
                  </div>
                </div>
                {myRegistrations.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No registrations yet</h3>
                    <p className="text-muted-foreground">You haven't registered for any events yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRegistrations.map((registration) => (
                      <Card key={registration.eventId} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base mb-1">{registration.eventName}</CardTitle>
                              <CardDescription className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {registration.hostClubName}
                              </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  registration.status === "REWARDED"
                                    ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-500 dark:border-emerald-700"
                                    : registration.status === "ATTENDED"
                                      ? "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-500 dark:border-green-700"
                                      : registration.status === "CHECKED_IN"
                                        ? "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-500 dark:border-green-700"
                                        : registration.status === "REGISTERED"
                                          ? "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-500 dark:border-blue-700"
                                          : registration.status === "CONFIRMED"
                                            ? "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-500 dark:border-blue-700"
                                            : registration.status === "ABSENT" || registration.status === "NO_SHOW"
                                              ? "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-500 dark:border-red-700"
                                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600"
                                }
                              >
                                {registration.status}
                              </Badge>
                              {registration.attendanceLevel && registration.attendanceLevel !== "NONE" && (
                                <Badge variant="secondary" className="text-xs">
                                  {registration.attendanceLevel}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {registration.startDate && registration.endDate ? (
                                registration.startDate === registration.endDate ? (
                                  new Date(registration.startDate).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                ) : (
                                  `${new Date(registration.startDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })} - ${new Date(registration.endDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}`
                                )
                              ) : "Invalid Date"}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Ticket className="h-4 w-4" />
                              {registration.committedPoints || 0} points committed
                            </div>
                            {/* Extra note for key statuses */}
                            {(registration.status === "CONFIRMED" || registration.status === "CHECKED_IN") && (
                              <div className="col-span-2 text-xs text-muted-foreground">
                                {registration.status === "CONFIRMED"
                                  ? "You have registered for this event. Be sure to attend on time."
                                  : "Your check-in was recorded successfully."}
                              </div>
                            )}
                            <div className="col-span-2 text-xs text-muted-foreground">
                              Registered: {new Date(registration.registeredAt).toLocaleString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
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
                    <div className="text-center">
                      <h3 className="font-semibold text-lg mb-2">
                        {selectedEventForRegistration.name}
                      </h3>
                      <div className="text-muted-foreground text-sm mb-4">
                        {selectedEventForRegistration.hostClub?.name}
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Ticket className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                        <div className="space-y-2 text-sm">
                          <p className="font-semibold text-yellow-900">
                            Point Cost: {selectedEventForRegistration.commitPointCost || 0} points
                          </p>
                          <p className="text-yellow-800">
                            <strong>{selectedEventForRegistration.commitPointCost || 0} points</strong> will be received back along with bonus points if you fully participate in the event.
                          </p>
                          <p className="text-yellow-800">
                            Otherwise, they will be <strong>lost and not refunded</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
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

          {/* Cancellation Confirmation Modal */}
          <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cancel Event Registration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedEventForCancellation && (
                  <>
                    <div className="text-center">
                      <h3 className="font-semibold text-lg mb-2">
                        {selectedEventForCancellation.name}
                      </h3>
                      <div className="text-muted-foreground text-sm mb-4">
                        {selectedEventForCancellation.hostClub?.name}
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-red-800">
                        Are you sure you want to cancel your registration for this event?
                      </p>
                      <p className="text-sm text-red-800 font-semibold">
                        Your committed points will be refunded.
                      </p>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowCancelModal(false)
                      setSelectedEventForCancellation(null)
                    }}
                  >
                    Keep Registration
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleConfirmCancel}
                  >
                    Cancel Registration
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
