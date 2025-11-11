"use client"

import { useState, useEffect, useMemo } from "react"
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
import { usePagination } from "@/hooks/use-pagination"
import { useClub, useEventsByClubId, useEventCoHostByClubId } from "@/hooks/use-query-hooks"
import { Calendar, Plus, MapPin, Trophy, ChevronLeft, ChevronRight, Filter, X, Eye, Loader2, Users, QrCode } from "lucide-react"
import QRCode from "qrcode"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { createEvent, timeObjectToString, timeStringToObject, eventQR } from "@/service/eventApi"
import { safeLocalStorage } from "@/lib/browser-utils"
import { PhaseSelectionModal } from "@/components/phase-selection-modal"
import { fetchLocation } from "@/service/locationApi"
import { fetchClub, getClubIdFromToken } from "@/service/clubApi"
import { Checkbox } from "@/components/ui/checkbox"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/hooks/use-query-hooks"
import eventPolicies from "@/src/data/event-policies.json"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle } from "lucide-react"

export default function ClubLeaderEventsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [userClubId, setUserClubId] = useState<number | null>(() => getClubIdFromToken()) // Gọi hàm trực tiếp
  const [locations, setLocations] = useState<any[]>([])
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [selectedLocationCapacity, setSelectedLocationCapacity] = useState<number | null>(null)
  const [allClubs, setAllClubs] = useState<any[]>([])
  const [clubsLoading, setClubsLoading] = useState(false)
  const [selectedCoHostClubIds, setSelectedCoHostClubIds] = useState<number[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [viewMode, setViewMode] = useState<"hosted" | "cohost">("hosted") // Toggle between hosted and co-host events

  // Add fullscreen and environment states
  const [isFullscreen, setIsFullscreen] = useState(false)
  // support 'mobile' environment for deep-link QR
  const [activeEnvironment, setActiveEnvironment] = useState<'local' | 'prod' | 'mobile'>('prod')

  // Fetch locations on mount
  useEffect(() => {
    const loadLocations = async () => {
      setLocationsLoading(true)
      try {
        const data = await fetchLocation({ page: 0, size: 70, sort: ["name"] }) as any
        // Handle both paginated response and direct array
        const locationList = data?.content || data || []
        setLocations(locationList)
      } catch (error) {
        console.error("Failed to fetch locations:", error)
        toast({
          title: "Error",
          description: "Failed to load locations",
          variant: "destructive"
        })
      } finally {
        setLocationsLoading(false)
      }
    }
    loadLocations()
  }, [])

  // Fetch clubs on mount
  useEffect(() => {
    const loadClubs = async () => {
      setClubsLoading(true)
      try {
        const data = await fetchClub({ page: 0, size: 70, sort: ["name"] })
        const clubList = data?.data.content || []
        // const clubList = data || []

        setAllClubs(clubList)
      } catch (error) {
        console.error("Failed to fetch clubs:", error)
        toast({
          title: "Error",
          description: "Failed to load clubs",
          variant: "destructive"
        })
      } finally {
        setClubsLoading(false)
      }
    }
    loadClubs()
  }, [])

  // ✅ USE REACT QUERY for club and events
  const { data: managedClub, isLoading: clubLoading } = useClub(userClubId || 0, !!userClubId)
  const { data: rawEvents = [], isLoading: eventsLoading } = useEventsByClubId(userClubId || 0, !!userClubId && viewMode === "hosted")
  const { data: rawCoHostEvents = [], isLoading: coHostEventsLoading } = useEventCoHostByClubId(userClubId || 0, !!userClubId && viewMode === "cohost")

  // Helper function to check if event has expired (past endTime) or is COMPLETED
  const isEventExpired = (event: any) => {
    // COMPLETED status is always considered expired
    if (event.status === "COMPLETED") return true

    // Check if date and endTime are present
    if (!event.date || !event.endTime) return false

    try {
      // Get current date/time
      const now = new Date()

      // Parse event date (format: YYYY-MM-DD)
      const [year, month, day] = event.date.split('-').map(Number)

      // Convert endTime to string if it's an object
      const endTimeStr = timeObjectToString(event.endTime)

      // Parse endTime (format: HH:MM:SS or HH:MM)
      const [hours, minutes] = endTimeStr.split(':').map(Number)

      // Create event end datetime (using local timezone consistently)
      const eventEndDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0)

      // Event is expired if current time is past the end time
      return now > eventEndDateTime
    } catch (error) {
      console.error('Error checking event expiration:', error)
      return false
    }
  }

  // Helper function to check if event is active (ONGOING and within date/time range)
  const isEventActive = (event: any) => {
    // COMPLETED status means event has ended
    if (event.status === "COMPLETED") return false

    // Must be ONGOING
    if (event.status !== "ONGOING") return false

    // Must not be expired
    if (isEventExpired(event)) return false

    // Check if date and endTime are present
    if (!event.date || !event.endTime) return false

    return true
  }

  // Helper function to sort events by date and time (newest to oldest)
  const sortEventsByDateTime = (eventList: any[]) => {
    return eventList.sort((a: any, b: any) => {
      // Parse dates for comparison
      const dateA = new Date(a.date || '1970-01-01')
      const dateB = new Date(b.date || '1970-01-01')

      // Compare dates first (newest first)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime()
      }

      // If dates are equal, compare times (latest startTime first)
      // Support both new (startTime) and legacy (time) formats
      // Convert TimeObject to string if needed
      const timeAStr = timeObjectToString(a.startTime) || a.time || '00:00'
      const timeBStr = timeObjectToString(b.startTime) || b.time || '00:00'

      // Convert time strings to comparable format (HH:MM:SS or HH:MM to minutes)
      const parseTime = (timeStr: string) => {
        const parts = timeStr.split(':').map(Number)
        const hours = parts[0] || 0
        const minutes = parts[1] || 0
        return hours * 60 + minutes
      }

      return parseTime(timeBStr) - parseTime(timeAStr)
    })
  }

  // Process and sort events (both hosted and co-host based on viewMode)
  const events = useMemo(() => {
    const eventsToProcess = viewMode === "hosted" ? rawEvents : rawCoHostEvents

    // Normalize events with both new and legacy field support
    const normalized = eventsToProcess
      .filter((e: any) => {
        // For hosted events, ONLY show events where this club is the hostClub
        if (viewMode === "hosted" && userClubId) {
          return e.hostClub?.id === userClubId
        }
        // For co-host events, ONLY show events where this club is in coHostedClubs
        if (viewMode === "cohost" && userClubId) {
          return e.coHostedClubs?.some((club: any) => club.id === userClubId)
        }
        return true
      })
      .map((e: any) => {
        // Convert TimeObject to string if needed
        const startTimeStr = timeObjectToString(e.startTime)
        const endTimeStr = timeObjectToString(e.endTime)

        // For co-host events, find the club's co-host status
        const myCoHostStatus = viewMode === "cohost" && userClubId
          ? e.coHostedClubs?.find((club: any) => club.id === userClubId)?.coHostStatus
          : null

        return {
          ...e,
          title: e.name || e.title,
          time: startTimeStr || e.time, // Map startTime to time for legacy compatibility
          startTime: startTimeStr, // Ensure startTime is always a string for display
          endTime: endTimeStr, // Ensure endTime is always a string for display
          clubId: e.hostClub?.id || e.clubId, // Map hostClub.id to clubId for backward compatibility
          clubName: e.hostClub?.name || e.clubName, // Map hostClub.name to clubName for backward compatibility
          myCoHostStatus, // Add co-host status for this club
        }
      })
    return sortEventsByDateTime(normalized)
  }, [viewMode, rawEvents, rawCoHostEvents, userClubId])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showPhaseModal, setShowPhaseModal] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrLinks, setQrLinks] = useState<{ local?: string; prod?: string; mobile?: string }>({})
  const [qrRotations, setQrRotations] = useState<{ local: string[]; prod: string[]; mobile?: string[] }>({ local: [], prod: [] })
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

    // Regenerate QR codes every 30 seconds by calling the API
    const regenerateQR = async () => {
      if (!selectedEvent?.id || !selectedPhase) return

      try {
        console.log('Regenerating QR code for event:', selectedEvent.id, 'with phase:', selectedPhase)
        const { token } = await eventQR(selectedEvent.id, selectedPhase)
        console.log('New token generated:', token)

        // Create URLs with new token and phase
        const prodUrl = `https://uniclub-fpt.vercel.app/student/checkin/${selectedPhase}/${token}`
        const localUrl = `http://localhost:3000/student/checkin/${selectedPhase}/${token}`
        const mobileLink = `exp://192.168.1.50:8081/--/student/checkin/${selectedPhase}/${token}`

        // Generate QR code variants
        const styleVariants = [
          { color: { dark: '#000000', light: '#FFFFFF' }, margin: 1 },
          { color: { dark: '#111111', light: '#FFFFFF' }, margin: 2 },
          { color: { dark: '#222222', light: '#FFFFFF' }, margin: 0 },
        ]

        const localQrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) =>
          QRCode.toDataURL(localUrl, styleVariants[i % styleVariants.length])
        )
        const localQrVariants = await Promise.all(localQrVariantsPromises)

        const prodQrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) =>
          QRCode.toDataURL(prodUrl, styleVariants[i % styleVariants.length])
        )
        const prodQrVariants = await Promise.all(prodQrVariantsPromises)

        const mobileVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) =>
          QRCode.toDataURL(mobileLink, styleVariants[i % styleVariants.length])
        )
        const mobileVariants = await Promise.all(mobileVariantsPromises)

        setQrRotations({ local: localQrVariants, prod: prodQrVariants, mobile: mobileVariants })
        setQrLinks({ local: localUrl, prod: prodUrl, mobile: mobileLink })
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
      setIsFading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [visibleIndex, showQrModal])

  const [formData, setFormData] = useState({
    clubId: userClubId || 0,
    name: "",
    description: "",
    type: "PUBLIC",
    date: "",
    registrationDeadline: "",
    startTime: "09:00:00",
    endTime: "11:00:00",
    locationId: 0,
    maxCheckInCount: 100,
    commitPointCost: 0,
  })

  // Update formData clubId when userClubId changes
  useEffect(() => {
    if (userClubId !== null) {
      setFormData(prev => ({ ...prev, clubId: userClubId }))
    }
  }, [userClubId])

  // Events are already filtered by clubId in the load effect, so use them directly
  const effectiveEvents = events

  // Filters (DataTable-style)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({ expired: "hide" })
  const [showFilters, setShowFilters] = useState(false)

  // Helper to get event status based on date and time
  const getEventStatus = (event: any) => {
    // Nếu event.status là ONGOING thì bắt buộc phải là "Now"
    if (event?.status === "ONGOING") return "Now"
    
    if (!event.date) return "Finished"
    // Get current time
    const now = new Date()

    // Convert TimeObject to string if needed
    const startTimeStr = timeObjectToString(event.startTime || event.time)
    const endTimeStr = timeObjectToString(event.endTime)

    // Parse event date and start time
    const [startHour = "00", startMinute = "00"] = (startTimeStr || "00:00").split(":")
    const [year, month, day] = event.date.split('-').map(Number)
    const eventStart = new Date(year, month - 1, day, Number(startHour), Number(startMinute), 0, 0)

    // Parse event end time
    let eventEnd = eventStart
    if (endTimeStr) {
      const [endHour = "00", endMinute = "00"] = endTimeStr.split(":")
      eventEnd = new Date(year, month - 1, day, Number(endHour), Number(endMinute), 0, 0)
    } else {
      // If no end time, assume 2 hours duration
      eventEnd = new Date(eventStart.getTime() + (2 * 60 * 60 * 1000))
    }

    const start = eventStart.getTime()
    const end = eventEnd.getTime()

    if (now.getTime() < start) {
      // If event starts within next 7 days, it's "Soon"
      if (start - now.getTime() < 7 * 24 * 60 * 60 * 1000) return "Soon"
      return "Future"
    }
    if (now.getTime() >= start && now.getTime() <= end) return "Now"
    return "Finished"
  }

  const filteredEvents = effectiveEvents.filter((item) => {
    // Calculate status values
    const isExpired = isEventExpired(item)
    const isFutureEvent = item.date && new Date(item.date) >= new Date(new Date().toDateString())

    const approvalFilter = activeFilters["approval"]
    const expiredFilter = activeFilters["expired"] || "hide"

    // Apply default restrictions only when filters are at default values
    const isDefaultState = !approvalFilter && expiredFilter === "hide"

    if (isDefaultState) {
      // Default: Only show future PENDING_UNISTAFF and APPROVED events
      if (item.status === "REJECTED") return false
      if (item.status === "COMPLETED") return false
      if (isExpired) return false
      if (!isFutureEvent) return false
    }

    // search by title/name
    if (searchTerm) {
      const v = String(item.title || item.name || "").toLowerCase()
      if (!v.includes(searchTerm.toLowerCase())) return false
    }

    // type filter
    const typeFilter = activeFilters["type"]
    if (typeFilter && typeFilter !== "all") {
      if (String(item.type || "").toUpperCase() !== String(typeFilter).toUpperCase()) return false
    }

    // date exact match (can be extended to ranges)
    const dateFilter = activeFilters["date"]
    if (dateFilter) {
      const it = new Date(item.date).toDateString()
      const df = new Date(dateFilter).toDateString()
      if (it !== df) return false
    }

    // approval status filter (specific status like APPROVED, PENDING, REJECTED)
    if (approvalFilter && approvalFilter !== "all") {
      if (String(item.status).toUpperCase() !== String(approvalFilter).toUpperCase()) return false
    }

    // expired filter - only apply if not in default state (to avoid duplicate filtering)
    if (!isDefaultState) {
      if (expiredFilter === "hide") {
        if (isExpired) return false
      } else if (expiredFilter === "only") {
        if (!isExpired) return false
      }
      // Handle time-based status options (Soon, Finished)
      else if (expiredFilter === "Soon" || expiredFilter === "Finished") {
        const status = getEventStatus(item)
        if (String(status).toLowerCase() !== String(expiredFilter).toLowerCase()) return false
      }
      // "show" means show all - no filtering needed
    }

    return true
  })

  // Pagination (use filtered events)
  const { currentPage, totalPages, paginatedData: paginatedEvents, setCurrentPage } = usePagination({ data: filteredEvents, initialPageSize: 6 })

  const goPrev = () => setCurrentPage(Math.max(1, currentPage - 1))
  const goNext = () => setCurrentPage(Math.min(totalPages, currentPage + 1))

  const handleFilterChange = (filterKey: string, value: any) => {
    setActiveFilters((prev) => ({ ...prev, [filterKey]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setActiveFilters({ expired: "hide" })
    setSearchTerm("")
    setCurrentPage(1)
  }

  const hasActiveFilters = Object.entries(activeFilters).some(([key, v]) => {
    if (key === "expired") return v !== "hide"
    return v && v !== "all"
  }) || Boolean(searchTerm)

  const resetForm = () => {
    setFormData({ clubId: userClubId || 0, name: "", description: "", type: "PUBLIC", date: "", registrationDeadline: "", startTime: "09:00:00", endTime: "11:00:00", locationId: 0, maxCheckInCount: 100, commitPointCost: 0 })
    setSelectedLocationId("")
    setSelectedLocationCapacity(null)
    setSelectedCoHostClubIds([])
  }

  const handleCreate = async () => {
    // Comprehensive validation for all required fields (except coHostedClubs which is optional)
    const validationErrors: string[] = []

    if (!formData.name || formData.name.trim() === "") {
      validationErrors.push("Event Name is required")
    }

    if (!formData.description || formData.description.trim() === "") {
      validationErrors.push("Description is required")
    }

    if (!formData.type) {
      validationErrors.push("Event Type is required")
    }

    if (!formData.date) {
      validationErrors.push("Date is required")
    }

    if (!formData.registrationDeadline) {
      validationErrors.push("Registration Deadline is required")
    }

    if (!formData.startTime) {
      validationErrors.push("Start Time is required")
    }

    if (!formData.endTime) {
      validationErrors.push("End Time is required")
    }

    if (!formData.locationId || formData.locationId === 0) {
      validationErrors.push("Location is required")
    }

    if (!formData.maxCheckInCount || formData.maxCheckInCount <= 0) {
      validationErrors.push("Max Check-ins must be greater than 0")
    }

    if (formData.commitPointCost < 0) {
      validationErrors.push("Point Cost cannot be negative")
    }

    // Validate time range
    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(':').map(Number)
      const [endHour, endMin] = formData.endTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin

      if (endMinutes <= startMinutes) {
        validationErrors.push("End Time must be after Start Time")
      }
    }

    // Show validation errors if any
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive"
      })
      return
    }

    // Validate max check-in count against location capacity
    if (selectedLocationCapacity && formData.maxCheckInCount > selectedLocationCapacity) {
      toast({
        title: "Invalid Max Check-ins",
        description: `Max check-ins (${formData.maxCheckInCount}) cannot exceed location capacity (${selectedLocationCapacity})`,
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      const hostClubId = Number(formData.clubId)

      // Format time strings to HH:MM format (API expects string, not TimeObject)
      const startTime = formData.startTime.substring(0, 5) // Convert HH:MM:SS to HH:MM
      const endTime = formData.endTime.substring(0, 5)     // Convert HH:MM:SS to HH:MM

      // Ensure numeric values are properly converted (not NaN or null)
      const commitPointCost = Number(formData.commitPointCost) || 0

      console.log('📊 Form data before sending:', {
        commitPointCost: formData.commitPointCost,
        convertedCommitPointCost: commitPointCost
      })

      const payload: any = {
        hostClubId,
        name: formData.name,
        description: formData.description,
        type: formData.type as "PUBLIC" | "PRIVATE",
        date: formData.date,
        registrationDeadline: formData.registrationDeadline,
        startTime: startTime,
        endTime: endTime,
        locationId: formData.locationId,
        maxCheckInCount: formData.maxCheckInCount,
        commitPointCost: commitPointCost,
      }

      console.log('📤 Payload being sent to API:', payload)

      // Add coHostClubIds if any are selected
      if (selectedCoHostClubIds.length > 0) {
        payload.coHostClubIds = selectedCoHostClubIds
      }

      const res: any = await createEvent(payload)
      // toast({ title: "Event Created", description: "Event created successfully" })
      // ✅ THAY ĐỔI LOGIC TOAST
      if (selectedCoHostClubIds.length > 0) {
        toast({
          title: "Event Created",
          description: "Event has been sent to co-hosts for approval."
        })
      } else {
        toast({
          title: "Event Created",
          description: "Event has been sent to university staff for approval."
        })
      }
      // Invalidate and refetch events using React Query
      if (userClubId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.eventsByClubId(userClubId) })
      }
      setShowCreateModal(false)
      resetForm()
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create event",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }


  // Helper functions for QR actions
  const handleDownloadQR = (environment: 'local' | 'prod' | 'mobile') => {
    try {
      let qrDataUrl: string | undefined
      if (environment === 'local') {
        qrDataUrl = qrRotations.local[displayedIndex % (qrRotations.local.length || 1)]
      } else if (environment === 'prod') {
        qrDataUrl = qrRotations.prod[displayedIndex % (qrRotations.prod.length || 1)]
      } else {
        // mobile: use pre-generated QR from qrRotations.mobile, or fallback to qrLinks.mobile
        if (qrRotations.mobile && qrRotations.mobile.length > 0) {
          qrDataUrl = qrRotations.mobile[displayedIndex % qrRotations.mobile.length]
        } else if (qrLinks.mobile) {
          // Fallback: generate QR using external API with the correct mobile link (includes phase)
          qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=640x640&data=${encodeURIComponent(qrLinks.mobile)}`
        } else {
          toast({ title: 'No QR', description: 'Mobile QR not available', variant: 'destructive' })
          return
        }
      }

      if (!qrDataUrl) return

      const link = document.createElement('a')
      link.download = `qr-code-${selectedEvent?.name?.replace(/[^a-zA-Z0-9]/g, '-')}-${environment}.png`
      link.href = qrDataUrl
      link.click()

      toast({
        title: 'Downloaded',
        description: `QR code downloaded for ${environment} environment`
      })
    } catch (err) {
      toast({ title: 'Download failed', description: 'Could not download QR code' })
    }
  }

  const handlePhaseConfirm = async (phase: string) => {
    if (!selectedEvent?.id) return

    try {
      setIsGeneratingQR(true)

      // Call new eventQR API with selected phase
      console.log('Generating check-in token for event:', selectedEvent.id, 'with phase:', phase)
      const { token, expiresIn } = await eventQR(selectedEvent.id, phase)
      console.log('Generated token:', token, 'expires in:', expiresIn)

      // Create URLs with token and phase (path parameter format)
      const prodUrl = `https://uniclub-fpt.vercel.app/student/checkin/${phase}/${token}`
      const localUrl = `http://localhost:3000/student/checkin/${phase}/${token}`
      const mobileLink = `exp://192.168.1.50:8081/--/student/checkin/${phase}/${token}`

      // Generate QR code variants
      const styleVariants = [
        { color: { dark: '#000000', light: '#FFFFFF' }, margin: 1 },
        { color: { dark: '#111111', light: '#FFFFFF' }, margin: 2 },
        { color: { dark: '#222222', light: '#FFFFFF' }, margin: 0 },
      ]

      // Generate QR variants for local environment
      const localQrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) =>
        QRCode.toDataURL(localUrl, styleVariants[i % styleVariants.length])
      )
      const localQrVariants = await Promise.all(localQrVariantsPromises)

      // Generate QR variants for production environment
      const prodQrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) =>
        QRCode.toDataURL(prodUrl, styleVariants[i % styleVariants.length])
      )
      const prodQrVariants = await Promise.all(prodQrVariantsPromises)

      // Generate QR variants for mobile
      const mobileVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) =>
        QRCode.toDataURL(mobileLink, styleVariants[i % styleVariants.length])
      )
      const mobileVariants = await Promise.all(mobileVariantsPromises)

      setQrRotations({ local: localQrVariants, prod: prodQrVariants, mobile: mobileVariants })
      setQrLinks({ local: localUrl, prod: prodUrl, mobile: mobileLink })
      setVisibleIndex(0)
      setDisplayedIndex(0)
      setSelectedPhase(phase)

      // Close phase modal and open QR modal
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

  const handleCopyLink = async (environment: 'local' | 'prod' | 'mobile') => {
    try {
      let link: string | undefined
      if (environment === 'mobile') {
        link = qrLinks.mobile
      } else {
        link = environment === 'local' ? qrLinks.local : qrLinks.prod
      }

      if (!link) return

      await navigator.clipboard.writeText(link)
      toast({
        title: 'Copied',
        description: `${environment.charAt(0).toUpperCase() + environment.slice(1)} link copied to clipboard`
      })
    } catch {
      toast({ title: 'Copy failed', description: 'Could not copy link to clipboard' })
    }
  }

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Events</h1>
              {/* <p className="text-muted-foreground">
                Manage {managedClub ? managedClub.name : 'Club'} events
                {userClubId && <span className="text-xs text-muted-foreground/70 ml-2">(Club ID: {userClubId})</span>}
              </p> */}
              <p className="text-muted-foreground h-5">
                {clubLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  <span>
                    Event management for "{managedClub ? <span className="font-semibold text-primary">{managedClub.name}</span> : 'Club'}"
                  </span>
                )}
                {/* {userClubId && <span className="text-xs text-muted-foreground/70 ml-2">(Club ID: {userClubId})</span>} */}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowCalendarModal(true)}>
                <Calendar className="h-4 w-4 mr-2" /> Calendar View
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Event
              </Button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 border-b pb-3">
            <Button
              variant={viewMode === "hosted" ? "default" : "outline"}
              onClick={() => setViewMode("hosted")}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Hosted Events
              {viewMode === "hosted" && <Badge variant="secondary" className="ml-1">{rawEvents.length}</Badge>}
            </Button>
            <Button
              variant={viewMode === "cohost" ? "default" : "outline"}
              onClick={() => setViewMode("cohost")}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Co-Host Events
              {viewMode === "cohost" && <Badge variant="secondary" className="ml-1">{rawCoHostEvents.length}</Badge>}
            </Button>
          </div>

          {/* Search + Filters (DataTable-style) */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search by name"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                className="max-w-sm"
              />

              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                    {Object.values(activeFilters).filter((v) => v && v !== "all").length + (searchTerm ? 1 : 0)}
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Type</label>
                    <Select value={activeFilters["type"] || "all"} onValueChange={(v) => handleFilterChange("type", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
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
                    <Select value={activeFilters["approval"] || "all"} onValueChange={(v) => handleFilterChange("approval", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="PENDING_COCLUB">Pending Co-Club</SelectItem>
                        <SelectItem value="PENDING_UNISTAFF">Pending Uni-Staff</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Expired</label>
                    <Select value={activeFilters["expired"] || "hide"} onValueChange={(v) => handleFilterChange("expired", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hide">Hide Expired</SelectItem>
                        <SelectItem value="show">Show All</SelectItem>
                        <SelectItem value="only">Only Expired</SelectItem>
                        <SelectItem value="Soon">Soon</SelectItem>
                        <SelectItem value="Finished">Finished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {effectiveEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first event to get started</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedEvents.map((event: any) => {
                  // COMPLETED status means event has ended, regardless of date/time
                  const isCompleted = event.status === "COMPLETED"
                  const expired = isCompleted || isEventExpired(event)
                  const status = expired ? "Finished" : getEventStatus(event)

                  // Border color logic
                  let borderColor = ""
                  if (viewMode === "cohost") {
                    // For co-host events, use coHostStatus
                    if (isCompleted) {
                      borderColor = "border-l-4 border-l-blue-900"
                    } else if (expired) {
                      borderColor = "border-l-4 border-l-gray-400"
                    } else if (event.myCoHostStatus === "APPROVED") {
                      borderColor = "border-l-4 border-l-green-500"
                    } else if (event.myCoHostStatus === "REJECTED") {
                      borderColor = "border-l-4 border-l-red-500"
                    } else if (event.myCoHostStatus === "PENDING" || event.myCoHostStatus === "PENDING_COCLUB") {
                      borderColor = "border-l-4 border-l-yellow-500"
                    }
                  } else {
                    // For hosted events, use event status
                    if (isCompleted) {
                      borderColor = "border-l-4 border-l-blue-900"
                    } else if (expired) {
                      borderColor = "border-l-4 border-l-gray-400"
                    } else if (event.status === "APPROVED") {
                      borderColor = "border-l-4 border-l-green-500"
                    } else if (event.status === "PENDING_COCLUB") {
                      borderColor = "border-l-4 border-l-orange-500"
                    } else if (event.status === "PENDING_UNISTAFF") {
                      borderColor = "border-l-4 border-l-yellow-500"
                    } else if (event.status === "REJECTED") {
                      borderColor = "border-l-4 border-l-red-500"
                    }
                  }

                  return (
                    <Card
                      key={event.id}
                      className={`hover:shadow-md transition-shadow ${borderColor} ${expired || isCompleted ? 'opacity-60' : ''} h-full flex flex-col`}
                    >
                      <CardHeader>
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
                          </div>
                          <Badge
                            variant={
                              status === "Finished"
                                ? "secondary"
                                : status === "Soon"
                                  ? "default"
                                  : status === "Now"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {status}
                          </Badge>
                        </div>
                        {/* Approval status badge - show COMPLETED in dark blue, gray for expired events */}
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {isCompleted ? (
                            <Badge variant="secondary" className="bg-blue-900 text-white border-blue-900 font-semibold">
                              <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                              Completed
                            </Badge>
                          ) : expired ? (
                            <Badge variant="secondary" className="bg-gray-400 text-white font-semibold">
                              <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                              Expired
                            </Badge>
                          ) : viewMode === "cohost" ? (
                            <>
                              {/* Show co-host status for co-host events */}
                              {event.myCoHostStatus === "APPROVED" && (
                                <Badge variant="default" className="bg-green-600 font-semibold">
                                  <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                                  Co-Host Approved
                                </Badge>
                              )}
                              {event.myCoHostStatus === "PENDING" && (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-100 font-semibold">
                                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>
                                  Co-Host Pending
                                </Badge>
                              )}
                              {event.myCoHostStatus === "REJECTED" && (
                                <Badge variant="destructive" className="font-semibold">
                                  <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                                  Co-Host Rejected
                                </Badge>
                              )}
                            </>
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
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-500 font-semibold">
                                  <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1.5"></span>
                                  Pending Co-Club Approval
                                </Badge>
                              )}
                              {event.status === "PENDING_UNISTAFF" && (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-500 font-semibold">
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
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>

                          {event.locationName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {event.locationName}
                            </div>
                          )}

                          {(event.startTime && event.endTime) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Trophy className="h-4 w-4" />
                              {event.startTime} - {event.endTime}
                            </div>
                          )}
                        </div>

                        {/* Buttons section - pushed to bottom */}
                        <div className="mt-auto pt-4 space-y-3">
                          <Button variant="outline" className="w-full" onClick={() => router.push(`/club-leader/events/${event.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Detail
                          </Button>
                          {/* QR Code Section - Only show if ONGOING and event is still active */}
                          {isEventActive(event) && (
                            <div className="mt-3 pt-3 border-t border-muted">
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
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Minimal Pager */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <Button
                    aria-label="Previous page"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={goPrev}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="min-w-[2rem] text-center text-sm font-medium">{currentPage}</div>

                  <Button
                    aria-label="Next page"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={goNext}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Event Policy Modal - Right Side */}
          <Modal
            open={showPolicyModal && showCreateModal}
            onOpenChange={() => { }}
            title={eventPolicies.title}
            description="Important guidelines for Points & Budget"
            className="p-2 sm:max-w-[500px] max-h-[90vh] overflow-hidden !fixed !left-[calc(50%+400px)] !top-[50%] !translate-x-0 !translate-y-[-50%] z-[60] border-2 border-blue-300/60 dark:border-blue-700/60 shadow-2xl pointer-events-auto flex flex-col"
            showCloseButton={false}
            noOverlay={true}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 -z-10" />
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/20 dark:bg-blue-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 dark:bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }} />

            <ScrollArea className="h-full mt-2">

              <div className="space-y-4">
                {eventPolicies.sections.map((section, sectionIndex) => (
                  <div
                    key={sectionIndex}
                    className="group bg-white/80 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 border border-blue-200/60 dark:border-blue-800/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]"
                  >
                    {/* Section Header with Icon */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-blue-100 dark:border-blue-900/50">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 shadow-lg">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold text-base bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                        {section.heading}
                      </h4>
                    </div>

                    {/* Items List */}
                    <ul className="space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className={`text-sm leading-relaxed flex items-start gap-3 rounded-xl transition-all duration-200 ${item.important
                            ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20 border-l-4 border-amber-500 dark:border-amber-400 pl-4 pr-3 py-3 font-semibold text-amber-950 dark:text-amber-200 shadow-md hover:shadow-lg'
                            : 'text-gray-700 dark:text-gray-300 pl-1 pr-2 py-1 hover:pl-2 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 rounded-lg'
                            }`}
                        >
                          {item.important ? (
                            <>
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0 mt-0.5 shadow-md">
                                <AlertCircle className="h-3 w-3 text-white" />
                              </div>
                              <span className="flex-1">{item.text}</span>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-center w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 mt-2 shadow-sm" />
                              <span className="flex-1">{item.text}</span>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Footer Section */}
                {eventPolicies.footer && (
                  <div className="mt-5 p-5 bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-violet-100/80 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-violet-900/30 rounded-2xl border-2 border-blue-300/50 dark:border-blue-700/50 backdrop-blur-md shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 shadow-lg flex-shrink-0">
                        <span className="text-white text-xl">💡</span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed italic flex-1 pt-1.5 font-medium">
                        {eventPolicies.footer.text}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Modal>

          {/* Create Event Modal - Left Side */}
          <Modal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            title="Create New Event"
            description="Add a new event for your club members"
            className="sm:max-w-[880px] max-h-[85vh] overflow-hidden !fixed !top-[50%] !translate-y-[-50%] z-[60] flex flex-col"
          >
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3" onClick={() => setShowPolicyModal(false)}>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm">Event Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter event name"
                      className="h-9 border-slate-300"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="text-sm">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="h-9 border-slate-300"
                      required
                    />
                  </div>

                <div className="space-y-1.5">
                  <Label htmlFor="registrationDeadline" className="text-sm">Registration Deadline *</Label>
                  <Input
                    id="registrationDeadline"
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="h-9 border-slate-300"
                    required
                  />
                </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="type" className="text-sm">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => {
                        setFormData({ ...formData, type: value })
                        // Clear co-host clubs when switching to PRIVATE
                        if (value === "PRIVATE") {
                          setSelectedCoHostClubIds([])
                        }
                      }}
                      required
                    >
                      <SelectTrigger id="type" className="h-9 border-slate-300">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="z-[70]">
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                        <SelectItem value="SPECIAL">Special</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-sm">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your event..."
                    rows={2}
                    className="resize-none border-slate-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="startTime" className="text-sm">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime.substring(0, 5)}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value + ":00" })}
                      className="h-9 border-slate-300"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endTime" className="text-sm">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime.substring(0, 5)}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value + ":00" })}
                      className="h-9 border-slate-300"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="maxCheckInCount" className="text-sm">Max Check-ins *</Label>
                    <Input
                      id="maxCheckInCount"
                      type="text"
                      inputMode="numeric" // Tốt cho di động
                      value={formData.maxCheckInCount.toLocaleString('en-US')}
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/[^0-9]/g, ''); // Xóa mọi thứ không phải số
                        const numValue = cleanValue === '' ? 0 : Number.parseInt(cleanValue, 10);
                        setFormData({ ...formData, maxCheckInCount: numValue });
                      }}
                      className={`h-9 border-slate-300${selectedLocationCapacity && formData.maxCheckInCount > selectedLocationCapacity
                        ? "border-red-500 focus-visible:ring-red-500"
                        : selectedLocationId
                          ? "bg-muted border-blue-300"
                          : ""
                        }`}
                      placeholder="100"
                      required
                    />

                    {selectedLocationCapacity && formData.maxCheckInCount > selectedLocationCapacity && (
                      <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                        <span className="text-base">🚫</span>
                        Max check-ins cannot exceed location capacity ({selectedLocationCapacity})
                      </p>
                    )}
                    {selectedLocationCapacity && formData.maxCheckInCount <= selectedLocationCapacity && selectedLocationId && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <span className="text-base">✓</span>
                        Within location capacity
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="commitPointCost" className="text-sm flex items-center gap-1.5">
                      Point Cost *
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowPolicyModal(!showPolicyModal); }}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="View policy guidelines"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                      </button>
                    </Label>
                    <Input
                      id="commitPointCost"
                      type="text"
                      inputMode="numeric" // Tốt cho di động
                      value={formData.commitPointCost.toLocaleString('en-US')}
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/[^0-9]/g, ''); // Xóa mọi thứ không phải số
                        const numValue = cleanValue === '' ? 0 : Number.parseInt(cleanValue, 10);
                        setFormData({ ...formData, commitPointCost: numValue });
                      }}
                      onClick={(e) => { e.stopPropagation(); setShowPolicyModal(true); }}
                      onFocus={() => setShowPolicyModal(true)}
                      className="h-9 transition-all duration-200 focus:ring-2 focus:ring-blue-500 cursor-pointer border-slate-300"
                      placeholder="0"
                      required
                    />

                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="budgetPoints" className="text-sm flex items-center gap-1.5">
                      {/* Removed Budget Points field per latest API */}
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="locationName" className="text-sm">Location *</Label>
                    <Select
                      value={selectedLocationId}
                      onValueChange={(value) => {
                        setSelectedLocationId(value)
                        const location = locations.find(loc => String(loc.id) === value)
                        if (location) {
                          setSelectedLocationCapacity(location.capacity || null)
                          setFormData({
                            ...formData,
                            locationId: Number(location.id),
                            maxCheckInCount: location.capacity || 100
                          })
                        }
                      }}
                      disabled={locationsLoading}
                      required
                    >
                      <SelectTrigger id="locationName" className="h-9 border-slate-300">
                        <SelectValue placeholder={locationsLoading ? "Loading locations..." : "Select a location"} />
                      </SelectTrigger>
                      <SelectContent className="z-[70]">
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={String(location.id)}>
                            {location.name} {location.capacity && `(${location.capacity})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">
                      Co-Host Clubs
                      {selectedCoHostClubIds.length > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({selectedCoHostClubIds.length} selected)
                        </span>
                      )}
                      {formData.type === "PRIVATE" && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                          (Not available for private events)
                        </span>
                      )}
                    </Label>
                    <div className={`border rounded-md p-2 min-h-[2.25rem] bg-muted/30 flex items-center gap-1 flex-wrap border-slate-300 ${formData.type === "PRIVATE" ? "opacity-50 cursor-not-allowed" : ""}`}>
                      {clubsLoading ? (
                        <p className="text-xs text-muted-foreground">Loading...</p>
                      ) : allClubs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No clubs available</p>
                      ) : formData.type === "PRIVATE" ? (
                        <p className="text-xs text-muted-foreground">Co-hosting is not available for private events</p>
                      ) : selectedCoHostClubIds.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Click below to select clubs</p>
                      ) : (
                        <>
                          {selectedCoHostClubIds.map((clubId) => {
                            const club = allClubs.find(c => c.id === clubId)
                            if (!club) return null
                            return (
                              <Badge
                                key={clubId}
                                variant="secondary"
                                className="text-xs px-2 py-0.5 flex items-center gap-1"
                              >
                                {club.name}
                                <X
                                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                                  onClick={() => setSelectedCoHostClubIds(selectedCoHostClubIds.filter(id => id !== clubId))}
                                />
                              </Badge>
                            )
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable co-host section for selecting clubs */}
                {allClubs.filter(club => club.id !== userClubId).length > 0 && (
                  <details className="space-y-2">
                    <summary 
                      className={`text-sm font-medium flex items-center gap-2 ${
                        formData.type === "PRIVATE" 
                          ? "cursor-not-allowed opacity-50 pointer-events-none" 
                          : "cursor-pointer hover:text-primary"
                      }`}
                      onClick={(e) => {
                        if (formData.type === "PRIVATE") {
                          e.preventDefault()
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Select Co-Host Clubs ({allClubs.filter(club => club.id !== userClubId).length} available)
                      {formData.type === "PRIVATE" && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          - Disabled for private events
                        </span>
                      )}
                    </summary>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto bg-muted/30 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        {allClubs
                          .filter(club => club.id !== userClubId)
                          .map((club) => (
                            <div key={club.id} className="flex items-center space-x-2 p-1.5 hover:bg-background rounded">
                              <Checkbox
                                id={`club-full-${club.id}`}
                                checked={selectedCoHostClubIds.includes(club.id)}
                                onCheckedChange={(checked: boolean) => {
                                  if (checked) {
                                    setSelectedCoHostClubIds([...selectedCoHostClubIds, club.id])
                                  } else {
                                    setSelectedCoHostClubIds(selectedCoHostClubIds.filter(id => id !== club.id))
                                  }
                                }}
                                disabled={formData.type === "PRIVATE"}
                                className="h-4 w-4"
                              />
                              <label
                                htmlFor={`club-full-${club.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {club.name}
                              </label>
                            </div>
                          ))}
                      </div>
                    </div>
                  </details>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground italic border-t pt-2 pb-0">
                    * Required fields - All fields except Co-Host Clubs must be filled
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isCreating} className="h-9">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={
                        isCreating ||
                        (selectedLocationCapacity !== null && formData.maxCheckInCount > selectedLocationCapacity)
                      }
                      className="h-9"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Send'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </Modal>

          {/* QR Modal */}
          {selectedEvent && (
            <QRModal
              open={showQrModal}
              onOpenChange={setShowQrModal}
              eventName={selectedEvent.name ?? ''}
              checkInCode={selectedEvent.checkInCode ?? ''}
              qrRotations={qrRotations}
              qrLinks={qrLinks}
              countdown={countdown}
              isFullscreen={isFullscreen}
              setIsFullscreen={setIsFullscreen}
              activeEnvironment={activeEnvironment}
              setActiveEnvironment={setActiveEnvironment}
              displayedIndex={displayedIndex}
              isFading={isFading}
              handleCopyLink={handleCopyLink}
              handleDownloadQR={handleDownloadQR}
            />
          )}

          {/* Phase Selection Modal */}
          <PhaseSelectionModal
            open={showPhaseModal}
            onOpenChange={setShowPhaseModal}
            onConfirm={handlePhaseConfirm}
            isLoading={isGeneratingQR}
          />

          {/* Calendar Modal */}
          <CalendarModal
            open={showCalendarModal}
            onOpenChange={setShowCalendarModal}
            events={events}
            onEventClick={(event) => {
              setShowCalendarModal(false)
              router.push(`/club-leader/events/${event.id}`)
            }}
          />
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
