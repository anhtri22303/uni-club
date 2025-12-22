// file: admin/events/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/modal"
import { QRModal } from "@/components/qr-modal"
import { CalendarModal } from "@/components/calendar-modal"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Plus, Ticket, ChevronLeft, ChevronRight, Eye, Filter, X, Gift, BarChart3, MapPin } from "lucide-react"
import { QrCode } from "lucide-react"
import QRCode from "qrcode"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAdminEvents, AdminEvent, FetchAdminEventsParams } from "@/service/adminApi/adminEventApi"
import { createEvent, eventQR, timeObjectToString, isEventExpired as isEventExpiredUtil } from "@/service/eventApi"
import { EventDateTimeDisplay } from "@/components/event-date-time-display"
import { PhaseSelectionModal } from "@/components/phase-selection-modal"
import { PublicEventQRButton } from "@/components/public-event-qr-button"
import { fetchLocation, Location } from "@/service/locationApi"
import { useQuery } from "@tanstack/react-query"

// Helper mới để format thời gian ISO
const formatIsoTime = (isoString: string) => {
  if (!isoString) return "N/A"
  try {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return "Invalid Time"
  }
}

// Định nghĩa kiểu cho bộ lọc
type EventFilters = {
  status?: string
  type?: string
  date?: string
}

export default function AdminEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [allEvents, setAllEvents] = useState<AdminEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  // --- Query để lấy danh sách Locations ---
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: () => fetchLocation({ page: 0, size: 9999 }), // Lấy tất cả locations
    select: (data) => data.content, // Chỉ lấy mảng 'content' từ response
    staleTime: 1000 * 60 * 5, // Cache 5 phút
  })

  // State cho pagination (server-side)
  const [currentPage, setCurrentPage] = useState(0) // API dùng 0-indexed
  const [paginationInfo, setPaginationInfo] = useState({
    totalPages: 0,
    totalElements: 0,
    first: true,
    last: true,
  })
  // hiển thị số lượng thẻ trong 1 trang
  const PAGE_SIZE = 16

  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<EventFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  // Add fullscreen and environment states (cho QR Modal)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeEnvironment, setActiveEnvironment] = useState<'local' | 'prod' | 'mobile'>('prod')

  // Use isEventExpired from eventApi.ts which supports both single-day and multi-day events
  const isEventExpired = (event: AdminEvent) => isEventExpiredUtil(event as any)

  // Helper function to check if event is active (ONGOING and within date/time range)
  const isEventActive = (event: any) => {
    // COMPLETED status means event has ended
    if (event.status === "COMPLETED") return false

    // Must be ONGOING
    if (event.status !== "ONGOING") return false

    // Must not be expired
    if (isEventExpired(event)) return false

    // For multi-day events, check if any day exists
    // For single-day events, check date/endTime
    const hasValidDate = (event.days && event.days.length > 0) || (event.date && event.endTime)
    if (!hasValidDate) return false

    return true
  }

  // --- Logic Fetch Data ---
  const loadEvents = async (page: number, keyword: string, filters: EventFilters) => {
    setIsLoading(true)
    try {
      // Xây dựng params động
      const params: FetchAdminEventsParams = {
        page,
        size: PAGE_SIZE,
        keyword: keyword || undefined,
        // Chỉ thêm filter nếu nó có giá trị và không phải "all"
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
        date: filters.date || undefined,
      }

      const data = await fetchAdminEvents(params)

      setEvents(data.content)
      setPaginationInfo({
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        first: data.first,
        last: data.last,
      })
    } catch (error) {
      console.error("Failed to load events:", error)
      toast({ title: "Error fetching events", description: "Could not load events from server.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect để fetch data khi page hoặc search term thay đổi
  useEffect(() => {
    loadEvents(currentPage, searchTerm, activeFilters)
  }, [currentPage, searchTerm, activeFilters])

  // Normalize events data to ensure compatibility with EventDateTimeDisplay component
  const normalizedEvents = events.map((event) => {
    // Keep all existing fields including days, startDate, endDate for multi-day events
    let date = event.date
    let startTimeStr = event.startTime
    let endTimeStr = event.endTime
    let startDateStr = event.startDate
    let endDateStr = event.endDate

    // If startTime is an ISO string like "2025-12-17T21:30:00", extract date and time
    if (event.startTime && event.startTime.includes('T')) {
      const startDate = new Date(event.startTime)
      if (!date && !event.startDate) {
        // Only set date if it's not a multi-day event (no startDate/endDate)
        date = startDate.toISOString().split('T')[0] // Extract YYYY-MM-DD
      }
      startTimeStr = startDate.toTimeString().substring(0, 8) // Extract HH:MM:SS
      
      // If this looks like a multi-day event (has endTime different date), extract startDate
      if (!startDateStr) {
        startDateStr = startDate.toISOString().split('T')[0]
      }
    }

    // If endTime is an ISO string, extract time
    if (event.endTime && event.endTime.includes('T')) {
      const endDate = new Date(event.endTime)
      endTimeStr = endDate.toTimeString().substring(0, 8) // Extract HH:MM:SS
      
      // Extract endDate for multi-day events
      if (!endDateStr) {
        endDateStr = endDate.toISOString().split('T')[0]
      }
    }

    // Generate days array if we have startDate and endDate but no days array
    let daysArray = event.days
    if (!daysArray && startDateStr && endDateStr && startDateStr !== endDateStr) {
      // This is a multi-day event without days array, generate it
      const days = []
      const currentDate = new Date(startDateStr)
      const lastDate = new Date(endDateStr)
      let dayId = 1
      
      while (currentDate <= lastDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        days.push({
          id: dayId++,
          date: dateStr,
          startTime: startTimeStr?.substring(0, 5) || "09:00", // HH:MM format
          endTime: endTimeStr?.substring(0, 5) || "17:00",
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
      daysArray = days
    }

    const normalized = {
      ...event, // Spread all original event fields first
      title: event.title || event.name || "Untitled Event",
      name: event.name || event.title || "Untitled Event",
      type: event.type || "PUBLIC", // Default to PUBLIC if no type specified
      // Keep multi-day event fields: days, startDate, endDate (if they exist)
      days: daysArray, // Important: preserve or generate days array for multi-day detection
      startDate: startDateStr, // First day date
      endDate: endDateStr, // Last day date
      // Legacy single-day fields
      date,
      startTime: startTimeStr,
      endTime: endTimeStr,
      time: startTimeStr, // Legacy field
      // Explicitly preserve budgetPoints and maxCheckInCount
      budgetPoints: event.budgetPoints ?? 0,
      maxCheckInCount: event.maxCheckInCount ?? 1,
    }

    // Debug: log event data to console
    if (process.env.NODE_ENV === 'development') {
      console.log('Event:', normalized.title, 'Type:', normalized.type, 'BudgetPoints:', normalized.budgetPoints, 'MaxCheckIn:', normalized.maxCheckInCount, 'Points per person:', Math.floor(normalized.budgetPoints / normalized.maxCheckInCount))
    }

    return normalized
  })

  // Load all events for calendar view (without pagination)
  const loadAllEventsForCalendar = async () => {
    try {
      const data = await fetchAdminEvents({
        page: 0,
        size: 9999, // Load all events
      })
      setAllEvents(data.content)
    } catch (error) {
      console.error("Failed to load all events for calendar:", error)
    }
  }

  // Load all events for calendar on mount
  useEffect(() => {
    loadAllEventsForCalendar()
  }, [])

  // --- Các state cho Modals ---
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null)
  const [showPhaseModal, setShowPhaseModal] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrLink, setQrLink] = useState<string>("")
  const [qrRotations, setQrRotations] = useState<string[]>([])
  const [visibleIndex, setVisibleIndex] = useState(0)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState<string>('')
  const ROTATION_INTERVAL_MS = 30 * 1000
  const VARIANTS = 3
  const [countdown, setCountdown] = useState(() => Math.floor(ROTATION_INTERVAL_MS / 1000))

  useEffect(() => {
    if (!showQrModal) {
      setCountdown(Math.floor(ROTATION_INTERVAL_MS / 1000))
      setDisplayedIndex(0)
      setIsFading(false)
      return
    }
    setCountdown(Math.floor(ROTATION_INTERVAL_MS / 1000))

    const regenerateQR = async () => {
      if (!selectedEvent?.id || !selectedPhase) return

      try {
        const { token } = await eventQR(selectedEvent.id, selectedPhase)

        const prodUrl = `https://uniclub.id.vn/student/checkin/${selectedPhase}/${token}`

        const styleVariants = [
          { color: { dark: '#000000', light: '#FFFFFF' }, margin: 1 },
          { color: { dark: '#111111', light: '#FFFFFF' }, margin: 2 },
          { color: { dark: '#222222', light: '#FFFFFF' }, margin: 0 },
        ]

        const prodQrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) =>
          QRCode.toDataURL(prodUrl, styleVariants[i % styleVariants.length])
        )
        const prodQrVariants = await Promise.all(prodQrVariantsPromises)

        setQrRotations(prodQrVariants)
        setQrLink(prodUrl)
        setVisibleIndex((i) => i + 1)
      } catch (err) {
        console.error('Failed to regenerate QR code:', err)
      }
    }

    const rotId = setInterval(() => {
      regenerateQR()
      setCountdown(Math.floor(ROTATION_INTERVAL_MS / 1000))
    }, ROTATION_INTERVAL_MS)

    const cntId = setInterval(() => {
      setCountdown((s) => (s <= 1 ? Math.floor(ROTATION_INTERVAL_MS / 1000) : s - 1))
    }, 1000)

    return () => {
      clearInterval(rotId)
      clearInterval(cntId)
    }
  }, [showQrModal, selectedEvent, selectedPhase])

  useEffect(() => {
    if (!showQrModal) return
    setIsFading(true)
    const t = setTimeout(() => {
      setDisplayedIndex(visibleIndex)
      setIsFading(false
      )
    }, 300)
    return () => clearTimeout(t)
  }, [visibleIndex, showQrModal])

  // --- Logic Create Modal ---
  const [formData, setFormData] = useState({
    clubId: 1, // TODO: Thay bằng club selector
    name: "",
    description: "",
    type: "PUBLIC",
    date: "",
    registrationDeadline: "",
    startTime: "09:00:00",
    endTime: "11:00:00",
    // locationName: "",
    locationId: "",
    maxCheckInCount: 100,
  })

  // Pagination handlers - Thêm window.scrollTo
  const goPrev = () => {
    setCurrentPage(Math.max(0, currentPage - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const goNext = () => {
    setCurrentPage(Math.min(paginationInfo.totalPages - 1, currentPage + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => setFormData({
    clubId: 1, // TODO: Thay bằng club selector
    name: "",
    description: "",
    type: "PUBLIC",
    date: "",
    registrationDeadline: "",
    startTime: "09:00:00",
    endTime: "11:00:00",
    // locationName: "",
    locationId: "",
    maxCheckInCount: 100
  })

  const handleCreate = async () => {
    if (!formData.name || !formData.date || !formData.registrationDeadline || !formData.startTime || !formData.endTime || !formData.locationId) {
      toast({ title: "Missing Information", description: "Please fill in all required fields", variant: "destructive" })
      return
    }
    try {
      const hostClubId = Number(formData.clubId)

      const startTime = formData.startTime.substring(0, 5)
      const endTime = formData.endTime.substring(0, 5)

      const payload: any = {
        hostClubId,
        name: formData.name,
        description: formData.description,
        type: formData.type as "PUBLIC" | "PRIVATE",
        date: formData.date,
        registrationDeadline: formData.registrationDeadline,
        startTime: startTime,
        endTime: endTime,
        // locationId: 1, // Default location
        locationId: Number(formData.locationId),
        maxCheckInCount: formData.maxCheckInCount,
        commitPointCost: 0,
      }
      const res: any = await createEvent(payload)
      toast({ title: "Event Created", description: "Event created successfully" })
      setShowCreateModal(false)

      // Refresh events list
      resetForm()
      // Tải lại trang đầu tiên
      if (currentPage === 0) {
        loadEvents(0, searchTerm, activeFilters)
      } else {
        setCurrentPage(0)
      }

    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error?.response?.data?.error || error?.response?.data?.message || "Failed to create event",
        variant: "destructive"
      })
    }
  }

  // --- Các handlers cho Filter ---
  const handleFilterChange = (filterKey: keyof EventFilters, value: any) => {
    setActiveFilters((prev) => ({ ...prev, [filterKey]: value }))
    setCurrentPage(0) // Reset về trang đầu khi đổi filter
  }
  const clearFilters = () => {
    setActiveFilters({})
    setSearchTerm("")
    setCurrentPage(0)
  }
  const hasActiveFilters = Object.values(activeFilters).some(v => v && v !== "all") || Boolean(searchTerm)

  // --- Logic QR Modal (handlePhaseConfirm, handleDownloadQR, handleCopyLink) ---
  const handlePhaseConfirm = async (phase: string) => {
    if (!selectedEvent?.id) return

    try {
      setIsGeneratingQR(true)

      const { token, expiresIn } = await eventQR(selectedEvent.id, phase)

      const prodUrl = `https://uniclub.id.vn/student/checkin/${phase}/${token}`

      const styleVariants = [
        { color: { dark: '#000000', light: '#FFFFFF' }, margin: 1 },
        { color: { dark: '#111111', light: '#FFFFFF' }, margin: 2 },
        { color: { dark: '#222222', light: '#FFFFFF' }, margin: 0 },
      ]

      const prodQrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) =>
        QRCode.toDataURL(prodUrl, styleVariants[i % styleVariants.length])
      )
      const prodQrVariants = await Promise.all(prodQrVariantsPromises)

      setQrRotations(prodQrVariants)
      setQrLink(prodUrl)
      setVisibleIndex(0)
      setDisplayedIndex(0)
      setSelectedPhase(phase)

      setShowPhaseModal(false)
      setShowQrModal(true)

      toast({
        title: 'QR Code Generated',
        description: `Check-in QR code generated for ${phase} phase`,
        duration: 3000
      })
    } catch (err: any) {
      console.error('Failed to generate QR', err)
      toast({
        title: 'QR Error',
        description: err?.response?.data?.message || err?.message || 'Could not generate QR code',
        variant: 'destructive'
      })
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleDownloadQR = () => {
    try {
      if (!qrRotations || qrRotations.length === 0) {
        toast({ title: 'No QR', description: 'QR code not available', variant: 'destructive' })
        return
      }

      const qrDataUrl = qrRotations[displayedIndex % qrRotations.length]
      if (!qrDataUrl) return

      const link = document.createElement('a')
      link.download = `qr-code-${selectedEvent?.title?.replace(/[^a-zA-Z0-9]/g, '-')}.png`
      link.href = qrDataUrl
      link.click()

      toast({
        title: 'Downloaded',
        description: 'QR code downloaded successfully'
      })
    } catch (err) {
      toast({ title: 'Download failed', description: 'Could not download QR code', variant: 'destructive' })
    }
  }

  const handleCopyLink = async () => {
    try {
      if (!qrLink) return

      await navigator.clipboard.writeText(qrLink)
      toast({
        title: 'Copied',
        description: 'Link copied to clipboard'
      })
    } catch {
      toast({ title: 'Copy failed', description: 'Could not copy link to clipboard', variant: 'destructive' })
    }
  }

  // Helper mới để get status (dùng startTime ISO string)
  const getEventStatus = (startTimeIso: string, eventStatus?: string) => {
    // Nếu event.status là ONGOING thì bắt buộc phải là "Now"
    if (eventStatus === "ONGOING") return "Now"

    if (!startTimeIso) return "Finished"
    try {
      const now = new Date()
      const eventStartTime = new Date(startTimeIso)

      // Giả sử 2 tiếng cho "Now"
      const EVENT_DURATION_MS = 2 * 60 * 60 * 1000
      const start = eventStartTime.getTime()
      const end = start + EVENT_DURATION_MS
      const nowTime = now.getTime()

      if (nowTime < start) {
        // Trong 7 ngày tới là "Soon"
        if (start - nowTime < 7 * 24 * 60 * 60 * 1000) return "Soon"
        return "Future"
      }
      if (nowTime >= start && nowTime <= end) return "Now"
      return "Finished"
    } catch (error) {
      console.error("Error in getEventStatus:", error);
      return "Finished"
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Events</h1>
              <p className="text-muted-foreground">Admin: Manage all club events and activities</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowCalendarModal(true)}
                className="flex items-center gap-2 bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700"
                >
                <Calendar className="h-4 w-4 mr-2" /> Calendar View
              </Button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search by name"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(0)
                }}
                className="max-w-sm border-slate-300 bg-white" 
              />
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} 
              className="flex items-center gap-2 bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {Object.values(activeFilters).filter(v => v && v !== "all").length + (searchTerm ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>
            {showFilters && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Filters</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Type</label>
                    <Select value={activeFilters["type"] || "all"} onValueChange={(v) => handleFilterChange("type", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                        <SelectItem value="SPECIAL">Special</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Date</label>
                    <Input type="date" value={activeFilters["date"] || ""} onChange={(e) => handleFilterChange("date", e.target.value)} className="h-8 text-xs" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select value={activeFilters["status"] || "all"} onValueChange={(v) => handleFilterChange("status", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="PENDING_COCLUB">Pending Co-Club</SelectItem>
                        <SelectItem value="PENDING_UNISTAFF">Pending Uni-Staff</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="ONGOING">Ongoing</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>

                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Event List */}
          {isLoading ? (
            // Loading Skeletons
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <Card key={index} className="h-[350px]"> {/* Giữ chiều cao skeleton để tránh nhảy layout */}
                  <CardHeader className="p-4"> {/* CHANGED */}
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent className="p-4 space-y-2"> {/* CHANGED */}
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="pt-3 mt-auto"> {/* CHANGED */}
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            // No events state
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "No Events Found" : "No Events Yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search." : "Create your first event to get started"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            // Event grid
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {normalizedEvents.map((event: AdminEvent) => {
                  const isCompleted = event.status === "COMPLETED"
                  const isCancelled = event.status === "CANCELLED" // Thêm check
                  const expired = isCompleted || isCancelled || isEventExpired(event)
                  const status = expired ? "Finished" : getEventStatus(event.startTime, event.status)

                  let borderColor = ""
                  if (isCompleted) {
                    borderColor = "border-l-4 border-l-blue-900"
                  } else if (isCancelled) {
                    borderColor = "border-l-4 border-l-orange-500"
                  } else if (expired) {
                    borderColor = "border-l-4 border-l-gray-400"
                  } else if (event.status === "ONGOING") {
                    borderColor = "border-l-4 border-l-purple-500"
                  } else if (event.status === "APPROVED") {
                    borderColor = "border-l-4 border-l-green-500"
                  } else if (event.status === "PENDING_COCLUB") {
                    borderColor = "border-l-4 border-l-orange-500"
                  } else if (event.status === "PENDING_UNISTAFF") {
                    borderColor = "border-l-4 border-l-yellow-500"
                  } else if (event.status === "REJECTED") {
                    borderColor = "border-l-4 border-l-red-500"
                  }

                  return (
                    <Card
                      key={event.id}
                      className={`hover:shadow-md transition-shadow ${borderColor} ${expired || isCompleted ? 'opacity-60' : ''} h-full flex flex-col`}
                    >
                      {/* <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            {event.description && (
                              <CardDescription
                                className="mt-1 text-sm leading-5 max-h-[3.75rem] overflow-hidden"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical' as const,
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {event.description}
                              </CardDescription>
                            )}
                          </div> */}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg line-clamp-2" title={event.title}>
                              {event.title}
                            </CardTitle>
                            {event.description && (
                              <CardDescription
                                className="mt-1 text-sm leading-5 max-h-[3.75rem] overflow-hidden"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical' as const,
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {event.description}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0 min-w-20">
                            {/* Type badge styled like student/events */}
                            <Badge
                              variant="outline"
                              className={
                                event.type === "PRIVATE"
                                  ? "bg-purple-100 text-purple-700 border-purple-300 shrink-0 text-xs font-semibold"
                                  : event.type === "SPECIAL"
                                    ? "bg-pink-100 text-pink-700 border-pink-300 shrink-0 text-xs font-semibold"
                                    : "bg-blue-100 text-blue-700 border-blue-300 shrink-0 text-xs font-semibold"
                              }
                            >
                              {event.type}
                            </Badge>
                          </div>
                        </div>
                        {/* Approval status badge */}
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {isCompleted ? (
                            <Badge variant="secondary" className="bg-blue-900 text-white border-blue-900 font-semibold">
                              <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                              Completed
                            </Badge>
                          ) : isCancelled ? (
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-400 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-600 font-semibold">
                              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1.5"></span>
                              Cancelled
                            </Badge>
                          ) : expired ? (
                            <Badge variant="secondary" className="bg-gray-400 text-white font-semibold">
                              <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                              Expired
                            </Badge>
                          ) : (
                            <>
                              {event.status === "ONGOING" && (
                                <Badge variant="default" className="bg-purple-600 text-white font-semibold">
                                  <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                                  Ongoing
                                </Badge>
                              )}
                              {event.status === "APPROVED" && (
                                <Badge variant="default" className="bg-green-600 font-semibold">
                                  <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                                  Approved
                                </Badge>
                              )}
                              {event.status === "PENDING_COCLUB" && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-500 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700 font-semibold">
                                  <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1.5"></span>
                                  Pending Co-Club Approval
                                </Badge>
                              )}
                              {event.status === "PENDING_UNISTAFF" && (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700 font-semibold">
                                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>
                                  Pending Uni-Staff Approval
                                </Badge>
                              )}
                              {event.status === "REJECTED" && (
                                <Badge variant="destructive" className="font-semibold">
                                  <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                                  Rejected
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <div className="space-y-3 flex-1">
                          <EventDateTimeDisplay event={event as any} variant="compact" />

                          {event.locationName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {event.locationName}
                            </div>
                          )}
                        </div>

                        {/* Buttons section - pushed to bottom */}
                        <div className="mt-auto pt-4 space-y-3">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push(`/admin/events/${event.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Detail
                          </Button>

                          {/* QR Code Section - Only show if ONGOING and event is still active */}
                          {isEventActive(event) && (
                            <div className="mt-3 pt-3 border-t border-muted">
                              {/* Show Public Event QR button for PUBLIC events */}
                              {event.type === "PUBLIC" && event.checkInCode ? (
                                <PublicEventQRButton
                                  event={{
                                    id: event.id,
                                    name: event.name || event.title,
                                    checkInCode: event.checkInCode,
                                  }}
                                  size="sm"
                                  className="w-full"
                                />
                              ) : event.type !== "PUBLIC" ? (
                                /* Show Generate QR Code button for SPECIAL and PRIVATE events */
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                                  onClick={() => {
                                    setSelectedEvent(event)
                                    setShowPhaseModal(true)
                                  }}
                                >
                                  <QrCode className="h-4 w-4 mr-2" />
                                  Generate QR Code
                                </Button>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              {/* Pagination Controls (server-side) */}
              {paginationInfo.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <Button
                    aria-label="Previous page"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={goPrev}
                    disabled={paginationInfo.first} // Dùng state từ API
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {/* Hiển thị trang 1-indexed */}
                  <div className="min-w-[2rem] text-center text-sm font-medium">{currentPage + 1}</div>
                  <Button
                    aria-label="Next page"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={goNext}
                    disabled={paginationInfo.last} // Dùng state từ API
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Create Event Modal (Không thay đổi nhiều, chỉ logic bên trong) */}
          <Modal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            title="Create New Event"
            description="Add a new event for your club members"
            className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm">Event Name<span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter event name"
                    className="h-9 border-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-sm">Date<span className="text-red-500">*</span></Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="h-9 border-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="registrationDeadline" className="text-sm">Registration Deadline<span className="text-red-500">*</span></Label>
                  <Input
                    id="registrationDeadline"
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="h-9 border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-sm">Type<span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type" className="h-9 border-slate-300">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                      <SelectItem value="SPECIAL">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm">Description<span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your event..."
                  rows={2}
                  className="resize-none border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startTime" className="text-sm">Start Time<span className="text-red-500">*</span></Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime.substring(0, 5)}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value + ":00" })}
                    className="h-9 border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endTime" className="text-sm">End Time<span className="text-red-500">*</span></Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime.substring(0, 5)}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value + ":00" })}
                    className="h-9 border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxCheckInCount" className="text-sm">Max Check-ins<span className="text-red-500">*</span></Label>
                  <Input
                    id="maxCheckInCount"
                    type="number"
                    value={formData.maxCheckInCount}
                    onChange={(e) => setFormData({ ...formData, maxCheckInCount: Number.parseInt(e.target.value) || 100 })}
                    className="h-9 border-slate-300"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="locationId" className="text-sm">Location Name<span className="text-red-500">*</span></Label>
                <Select
                  value={formData.locationId}
                  onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                  disabled={locationsLoading}
                >
                  <SelectTrigger id="locationId" className="h-9 border-slate-300">
                    <SelectValue placeholder={locationsLoading ? "Loading locations..." : "Select a location"} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Map qua locationsData thay vì mảng cứng */}
                    {(locationsData || []).map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="h-9">
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="h-9">Send</Button>
              </div>
            </div>
          </Modal>

          {/* Phase Selection Modal */}
          <PhaseSelectionModal
            open={showPhaseModal}
            onOpenChange={setShowPhaseModal}
            onConfirm={handlePhaseConfirm}
            isLoading={isGeneratingQR}
          />

          {/* QR Modal (Cập nhật eventName prop) */}
          {selectedEvent && (
            <QRModal
              open={showQrModal}
              onOpenChange={setShowQrModal}
              eventName={selectedEvent.title ?? ''} // Dùng .title thay vì .name
              checkInCode={''} // API mới không có checkInCode
              qrRotations={qrRotations}
              qrLink={qrLink}
              countdown={countdown}
              isFullscreen={isFullscreen}
              setIsFullscreen={setIsFullscreen}
              displayedIndex={displayedIndex}
              isFading={isFading}
              handleCopyLink={handleCopyLink}
              handleDownloadQR={handleDownloadQR}
            />
          )}

          {/* Calendar Modal (Cần đảm bảo events prop hoạt động với AdminEvent[]) */}
          <CalendarModal
            open={showCalendarModal}
            onOpenChange={setShowCalendarModal}
            events={allEvents.map(e => ({ ...e, date: e.startTime }))} // Map startTime -> date cho CalendarModal
            onEventClick={(event) => {
              setShowCalendarModal(false)
              router.push(`/admin/events/${event.id}`)
            }}
          />
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}