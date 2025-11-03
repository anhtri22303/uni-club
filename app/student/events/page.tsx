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
import { usePagination } from "@/hooks/use-pagination"
import { useState } from "react"
import { Calendar, Users, Trophy, Layers, History } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { safeLocalStorage } from "@/lib/browser-utils"
import { useClubEvents, useClubs, useMyEventRegistrations } from "@/hooks/use-query-hooks"
import { timeObjectToString, registerForEvent } from "@/service/eventApi"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useQueryClient } from "@tanstack/react-query"

// Import data
import clubs from "@/src/data/clubs.json"

export default function MemberEventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [userClubIds, setUserClubIds] = useState<number[]>([])
  const router = useRouter()
  // ✅ MỚI: State để quản lý việc chọn club
  // const [selectedClubId, setSelectedClubId] = useState<string>("all") // 'all' là giá trị mặc định
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null) // Bắt đầu là null
  const [userClubsDetails, setUserClubsDetails] = useState<any[]>([]) // Để lưu {id, name}
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [registeringEventId, setRegisteringEventId] = useState<number | null>(null)
  const [showRegisteredOnly, setShowRegisteredOnly] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<any>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()



  // Get user's club IDs from localStorage
  useEffect(() => {
    try {
      const saved = safeLocalStorage.getItem("uniclub-auth")
      console.log("Events page - Raw localStorage data:", saved)
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log("Events page - Parsed localStorage data:", parsed)

        if (parsed.clubIds && Array.isArray(parsed.clubIds)) {
          const clubIdNumbers = parsed.clubIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
          console.log("Events page - Setting userClubIds to:", clubIdNumbers)
          setUserClubIds(clubIdNumbers)
        } else if (parsed.clubId) {
          const clubIdNumber = Number(parsed.clubId)
          console.log("Events page - Setting userClubIds from single clubId to:", [clubIdNumber])
          setUserClubIds([clubIdNumber])
        }
      }
    } catch (error) {
      console.error("Failed to get clubIds from localStorage:", error)
    }
  }, [])

  // ✅ USE REACT QUERY - automatically filters by clubIds
  const { data: eventsData = [], isLoading: loading } = useClubEvents(userClubIds)
  const { data: clubsData = [] } = useClubs()
  const { data: myRegistrations = [] } = useMyEventRegistrations()

  // ✅ CẬP NHẬT: useEffect để lấy chi tiết club VÀ set default
  useEffect(() => {
    if (userClubIds.length > 0 && clubsData.length > 0) {
      // Lọc danh sách 'all clubs' để chỉ lấy những club mà user tham gia
      // const details = clubsData.filter((club: any) => userClubIds.includes(club.id))
      const details = userClubIds
        .map((id) => clubsData.find((club: any) => club.id === id))
        .filter(Boolean) // Loại bỏ (filter out) bất kỳ club nào không tìm thấy (undefined)
      setUserClubsDetails(details as any[])
      // Chỉ đặt nếu 'details' có và 'selectedClubId' chưa được set (vẫn là null)
      if (details.length > 0 && selectedClubId === null) {
        setSelectedClubId(String(details[0].id))
      }
    }
  }, [userClubIds, clubsData]) // Chạy lại khi 3 danh sách này sẵn sàng

  const filteredEvents = eventsData.filter(
    (event) =>
      (event.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.hostClub?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      clubsData.find((c: any) => c.id === event.hostClub?.id)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clubs.find((c) => c.id === event.hostClub?.id)?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Helper function to check if event is registered
  const isEventRegistered = (eventId: number) => {
    return myRegistrations.some((reg) => reg.eventId === eventId)
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

  const finalFilteredEvents = filteredEvents.filter((event) => {
    if (!selectedClubId) {
      return false
    }
    // Lọc theo club ID đã chọn (bỏ qua "all")
    if (String(event.hostClub?.id) !== selectedClubId) {
      return false
    }

    // Filter by registered events only if showRegisteredOnly is true
    if (showRegisteredOnly && !isEventRegistered(event.id)) {
      return false
    }

    // Default: Show future PENDING and APPROVED events (hide expired/completed and rejected)
    const isExpired = isEventExpired(event)
    const isFutureEvent = event.date && new Date(event.date) >= new Date(new Date().toDateString())
    
    // By default, only show future events that are PENDING or APPROVED
    const expiredFilter = activeFilters["expired"]
    if (expiredFilter === "hide") {
      // Hide expired events (including COMPLETED status)
      if (isExpired) return false
      // Hide rejected events
      if (event.status === "REJECTED") return false
      // Only show APPROVED or PENDING_UNISTAFF events
      if (event.status !== "APPROVED" && event.status !== "PENDING_UNISTAFF" && event.status !== "ONGOING") return false
      // Only show future or today's events
      if (!isFutureEvent) return false
    } else if (expiredFilter === "only") {
      if (!isExpired) return false
    } else if (expiredFilter === "show") {
      // Show all events regardless of expiration
      if (event.status !== "APPROVED" && event.status !== "PENDING_UNISTAFF" && event.status !== "COMPLETED" && event.status !== "ONGOING") {
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

  const getEventStatus = (eventDate: string) => {
    const now = new Date()
    const event = new Date(eventDate)
    if (event < now) return "past"
    if (event.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) return "upcoming"
    return "future"
  }

  const handleEventDetail = (eventId: string) => {
    router.push(`/student/events/${eventId}`)
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
      // Refetch registrations after successful registration
      queryClient.invalidateQueries({ queryKey: ["events", "my-registrations"] })
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
              <h1 className="text-3xl font-bold">Events</h1>
              <p className="text-muted-foreground">
                Discover upcoming events from your clubs
                {userClubIds.length > 0 && (
                  <span className="text-xs text-muted-foreground/70 ml-2">
                    (Showing events from club{userClubIds.length > 1 ? 's' : ''} {userClubIds.join(', ')})
                  </span>
                )}
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

          {/* ✅ CẬP NHẬT: Thêm dropdown chọn club */}
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

            {/* Dropdown chọn Club */}
            {userClubIds.length > 0 && (
              <Select
                value={selectedClubId || ""}
                onValueChange={(value) => {
                  setSelectedClubId(value)
                  setCurrentPage(1) // Reset về trang 1 khi đổi filter
                }}
              >
                <SelectTrigger className="w-full sm:w-[240px]">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a club" />
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
                  {filteredEvents.length === 0 && eventsData.length > 0
                    ? "Try adjusting your search terms"
                    : "Your clubs haven't posted any events yet"}
                </p>
              </div>
            ) : (
              paginatedEvents.map((event) => {
                const status = getEventStatus(event.date)
                
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
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{event.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            {event.hostClub?.name || "Unknown Club"}
                          </CardDescription>
                        </div>
                        {event.status === "COMPLETED" ? (
                          <Badge variant="outline" className="bg-blue-900 text-white border-blue-900 font-semibold">
                            <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                            COMPLETED
                          </Badge>
                        ) : event.status === "ONGOING" ? (
                          <Badge variant="default" className="bg-purple-600 text-white border-purple-600 font-semibold">
                            <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                            ONGOING
                          </Badge>
                        ) : event.status === "APPROVED" ? (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-500 font-semibold">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                            {status === "past" ? "Past" : status === "upcoming" ? "Soon" : "Approved"}
                          </Badge>
                        ) : event.status === "PENDING_UNISTAFF" ? (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-500 font-semibold">
                            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>
                            PENDING APPROVAL
                          </Badge>
                        ) : event.status === "REJECTED" ? (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-500 font-semibold">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
                            REJECTED
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-400">
                            {event.status}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>

                        {(event.startTime && event.endTime) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Trophy className="h-4 w-4" />
                            {timeObjectToString(event.startTime)} - {timeObjectToString(event.endTime)}
                          </div>
                        )}

                          <Button
                            className="w-full"
                            variant="default"
                            disabled={registeringEventId === event.id || event.status === "COMPLETED" || isEventRegistered(event.id)}
                            onClick={() => handleRegisterClick(event)}
                          >
                            {registeringEventId === event.id 
                              ? "Registering..." 
                              : isEventRegistered(event.id) 
                                ? "Already Registered" 
                                : event.status === "COMPLETED" 
                                  ? "Ended" 
                                  : "Register"}
                          </Button>
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
            events={eventsData}
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
                                {registration.clubName}
                              </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant="outline" 
                                className={
                                  registration.status === "ATTENDED" 
                                    ? "bg-green-100 text-green-700 border-green-500" 
                                    : registration.status === "REGISTERED"
                                    ? "bg-blue-100 text-blue-700 border-blue-500"
                                    : registration.status === "ABSENT"
                                    ? "bg-red-100 text-red-700 border-red-500"
                                    : "bg-gray-100 text-gray-700 border-gray-400"
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
                              {new Date(registration.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Trophy className="h-4 w-4" />
                              {registration.committedPoints} points committed
                            </div>
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
                        <Trophy className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
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
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
