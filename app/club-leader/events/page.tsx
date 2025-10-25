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
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { useClubEvents, useClub } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
import { Calendar, Plus, Edit, MapPin, Trophy, ChevronLeft, ChevronRight, Filter, X, Eye } from "lucide-react"
import { QrCode } from "lucide-react"
import QRCode from "qrcode"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { createEvent, getEventById } from "@/service/eventApi"
import { generateCode } from "@/service/checkinApi"
import { safeLocalStorage } from "@/lib/browser-utils"
import { fetchLocation } from "@/service/locationApi"
import { fetchClub, getClubIdFromToken } from "@/service/clubApi"
import { Checkbox } from "@/components/ui/checkbox"

export default function ClubLeaderEventsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [userClubId, setUserClubId] = useState<number | null>(() => getClubIdFromToken()) // Gọi hàm trực tiếp
  const [locations, setLocations] = useState<any[]>([])
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [allClubs, setAllClubs] = useState<any[]>([])
  const [clubsLoading, setClubsLoading] = useState(false)
  const [selectedCoHostClubIds, setSelectedCoHostClubIds] = useState<number[]>([])

  // Add fullscreen and environment states
  const [isFullscreen, setIsFullscreen] = useState(false)
  // support 'mobile' environment for deep-link QR
  const [activeEnvironment, setActiveEnvironment] = useState<'local' | 'prod' | 'mobile'>('prod')

  // Fetch locations on mount
  useEffect(() => {
    const loadLocations = async () => {
      setLocationsLoading(true)
      try {
        const data = await fetchLocation({ page: 0, size: 100, sort: ["name"] }) as any
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
        const data = await fetchClub({ page: 0, size: 100, sort: ["name"] })
        const clubList = data?.content || []
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

  // ✅ USE REACT QUERY for events
  const { data: rawEvents = [], isLoading: eventsLoading } = useClubEvents(
    userClubId ? [userClubId] : []
  )

  const { data: managedClub, isLoading: clubLoading } = useClub(userClubId || 0, !!userClubId)

  // Helper function to check if event is active (APPROVED and within date/time range)
  const isEventActive = (event: any) => {
    // Must be APPROVED
    if (event.status !== "APPROVED") return false

    // Check if date and endTime are present
    if (!event.date || !event.endTime) return false

    try {
      // Get current date/time
      const now = new Date()

      // Parse event date (format: YYYY-MM-DD)
      const eventDate = new Date(event.date)

      // Parse endTime (format: HH:MM:SS or HH:MM)
      const [hours, minutes] = event.endTime.split(':').map(Number)

      // Create event end datetime
      const eventEndDateTime = new Date(eventDate)
      eventEndDateTime.setHours(hours, minutes, 0, 0)

      // Event is active if current time is before or equal to end time
      return now <= eventEndDateTime
    } catch (error) {
      console.error('Error checking event active status:', error)
      return false
    }
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
      const timeA = a.startTime || a.time || '00:00'
      const timeB = b.startTime || b.time || '00:00'

      // Convert time strings to comparable format (HH:MM:SS or HH:MM to minutes)
      const parseTime = (timeStr: string) => {
        const parts = timeStr.split(':').map(Number)
        const hours = parts[0] || 0
        const minutes = parts[1] || 0
        return hours * 60 + minutes
      }

      return parseTime(timeB) - parseTime(timeA)
    })
  }

  // Process and sort events
  const events = useMemo(() => {
    // Normalize events with both new and legacy field support
    const normalized = rawEvents.map((e: any) => ({
      ...e,
      title: e.name || e.title,
      time: e.startTime || e.time, // Map startTime to time for legacy compatibility
    }))
    return sortEventsByDateTime(normalized)
  }, [rawEvents])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrDataUrls, setQrDataUrls] = useState<{ local?: string; prod?: string; mobile?: string }>({})
  const [qrLinks, setQrLinks] = useState<{ local?: string; prod?: string; mobile?: string }>({})
  const [qrRotations, setQrRotations] = useState<{ local: string[]; prod: string[]; mobile?: string[] }>({ local: [], prod: [] })
  const [visibleIndex, setVisibleIndex] = useState(0)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
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
    // helper to generate and set QR variants (used immediately and on interval)
    const generateAndSet = async () => {
      if (!selectedEvent?.id) return
      try {
        const { token, qrUrl } = await generateCode(selectedEvent.id)
        console.log('Generated QR token:', token)

        const styleVariants = [
          { color: { dark: '#000000', light: '#FFFFFF' }, margin: 1 },
          { color: { dark: '#111111', light: '#FFFFFF' }, margin: 2 },
          { color: { dark: '#222222', light: '#FFFFFF' }, margin: 0 },
        ]

        // Generate DataURL variants for the qrUrl
        const qrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) => {
          const opts = styleVariants[i % styleVariants.length]
          return QRCode.toDataURL(qrUrl, opts as any)
        })
        const qrVariants = await Promise.all(qrVariantsPromises)

        // Build mobile deep link and its QR variants
        const mobileLink = `exp://192.168.1.50:8081/--/student/checkin/${token}`
        const mobileVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) => {
          const opts = styleVariants[i % styleVariants.length]
          return QRCode.toDataURL(mobileLink, opts as any)
        })
        const mobileVariants = await Promise.all(mobileVariantsPromises)

        setQrRotations({ local: qrVariants, prod: qrVariants, mobile: mobileVariants })
        setQrLinks({ local: qrUrl, prod: qrUrl, mobile: mobileLink })
      } catch (err) {
        console.error('Failed to generate QR:', err)
      }
    }

    // generate once immediately so modal shows a QR without waiting for the first interval
    generateAndSet()

    const rotId = setInterval(() => {
      generateAndSet()
      setVisibleIndex((i) => i + 1)
      setCountdown(Math.floor(ROTATION_INTERVAL_MS / 1000))
    }, ROTATION_INTERVAL_MS)
    const cntId = setInterval(() => {
      setCountdown((s) => (s <= 1 ? Math.floor(ROTATION_INTERVAL_MS / 1000) : s - 1))
    }, 1000)
    return () => {
      clearInterval(rotId)
      clearInterval(cntId)
    }
  }, [showQrModal, selectedEvent])

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
    clubId: userClubId || managedClub.id,
    name: "",
    description: "",
    type: "PUBLIC",
    date: "",
    startTime: "09:00:00",
    endTime: "11:00:00",
    locationId: 0,
    maxCheckInCount: 100,
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
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)

  const filteredEvents = effectiveEvents.filter((item) => {
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

    // club filter
    const clubFilter = activeFilters["club"]
    if (clubFilter && clubFilter !== "all") {
      if (String(item.clubId) !== String(clubFilter)) return false
    }

    // date exact match (can be extended to ranges)
    const dateFilter = activeFilters["date"]
    if (dateFilter) {
      const it = new Date(item.date).toDateString()
      const df = new Date(dateFilter).toDateString()
      if (it !== df) return false
    }

    // status filter
    const statusFilter = activeFilters["status"]
    if (statusFilter && statusFilter !== "all") {
      const status = getEventStatus(item.date, item.time)
      if (String(status).toLowerCase() !== String(statusFilter).toLowerCase()) return false
    }

    // approval status filter
    const approvalFilter = activeFilters["approval"]
    if (approvalFilter && approvalFilter !== "all") {
      if (String(item.status).toUpperCase() !== String(approvalFilter).toUpperCase()) return false
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
    setActiveFilters({})
    setSearchTerm("")
    setCurrentPage(1)
  }

  const hasActiveFilters = Object.values(activeFilters).some((v) => v && v !== "all") || Boolean(searchTerm)

  const resetForm = () => {
    setFormData({ clubId: userClubId || managedClub.id, name: "", description: "", type: "PUBLIC", date: "", startTime: "09:00:00", endTime: "11:00:00", locationId: 0, maxCheckInCount: 100 })
    setSelectedLocationId("")
    setSelectedCoHostClubIds([])
  }

  const handleCreate = async () => {
    // validate required
    if (!formData.name || !formData.date || !formData.startTime || !formData.endTime || !formData.locationId) {
      toast({ title: "Missing Information", description: "Please fill in all required fields including location", variant: "destructive" })
      return
    }

    try {
      const hostClubId = Number(formData.clubId)
      const payload: any = {
        hostClubId,
        name: formData.name,
        description: formData.description,
        type: formData.type as "PUBLIC" | "PRIVATE",
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        locationId: formData.locationId,
        maxCheckInCount: formData.maxCheckInCount,
      }

      // Add coHostClubIds if any are selected
      if (selectedCoHostClubIds.length > 0) {
        payload.coHostClubIds = selectedCoHostClubIds
      }

      const res: any = await createEvent(payload)
      toast({ title: "Event Created", description: "Event created successfully" })
      // Invalidate query to refresh events
      queryClient.invalidateQueries({ queryKey: ["events"] })
      setShowCreateModal(false)
      resetForm()
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create event",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (event: any) => {
    setSelectedEvent(event)
    setFormData({
      clubId: event.hostClub?.id ?? event.clubId ?? userClubId ?? managedClub.id,
      name: event.name ?? event.title ?? "",
      description: event.description ?? "",
      type: event.type ?? "PUBLIC",
      date: event.date ?? "",
      startTime: event.startTime ?? event.time ?? "09:00:00",
      endTime: event.endTime ?? "11:00:00",
      locationId: event.locationId ?? 0,
      maxCheckInCount: event.maxCheckInCount ?? 100,
    })
    // Set the selected location dropdown value
    if (event.locationId) {
      setSelectedLocationId(String(event.locationId))
    }
    setShowEditModal(true)
  }
  const handleUpdate = () => { /* same as source */ }

  // Helper functions for QR actions
  const handleDownloadQR = (environment: 'local' | 'prod' | 'mobile') => {
    try {
      let qrDataUrl: string | undefined
      if (environment === 'local') {
        qrDataUrl = qrRotations.local[displayedIndex % (qrRotations.local.length || 1)]
      } else if (environment === 'prod') {
        qrDataUrl = qrRotations.prod[displayedIndex % (qrRotations.prod.length || 1)]
      } else {
        // mobile: construct an on-the-fly QR image using public QR API (fallback)
        const token = selectedEvent?.checkInCode || ''
        if (!token) {
          toast({ title: 'No token', description: 'Mobile token not available', variant: 'destructive' })
          return
        }
        const mobileLink = `exp://192.168.1.50:8081/--/student/checkin/${token}`
        qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=640x640&data=${encodeURIComponent(mobileLink)}`
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

  const handleCopyLink = async (environment: 'local' | 'prod' | 'mobile') => {
    try {
      let link: string | undefined
      if (environment === 'local') link = qrLinks.local
      else if (environment === 'prod') link = qrLinks.prod
      else {
        // mobile deep link uses checkInCode
        const token = selectedEvent?.checkInCode || ''
        if (!token) {
          toast({ title: 'No token', description: 'Mobile token not available', variant: 'destructive' })
          return
        }
        link = `exp://192.168.1.50:8081/--/student/checkin/${token}`
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

  // Helper to get event status based on date and time
  const getEventStatus = (eventDate: string, eventTime: string) => {
    if (!eventDate) return "Finished"
    const now = new Date()
    // Combine date and time into a single Date object
    const [hour = "00", minute = "00"] = (eventTime || "00:00").split(":")
    const event = new Date(eventDate)
    event.setHours(Number(hour), Number(minute), 0, 0)

    // Event duration: assume 2 hours for "Now" window (customize as needed)
    const EVENT_DURATION_MS = 2 * 60 * 60 * 1000
    const start = event.getTime()
    const end = start + EVENT_DURATION_MS

    if (now.getTime() < start) {
      // If event starts within next 7 days, it's "Soon"
      if (start - now.getTime() < 7 * 24 * 60 * 60 * 1000) return "Soon"
      return "Future"
    }
    if (now.getTime() >= start && now.getTime() <= end) return "Now"
    return "Finished"
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
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Event
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

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Date</label>
                    <Input type="date" value={activeFilters["date"] || ""} onChange={(e) => handleFilterChange("date", e.target.value)} className="h-8 text-xs" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Club</label>
                    <Select value={activeFilters["club"] || "all"} onValueChange={(v) => handleFilterChange("club", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {allClubs.map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select value={activeFilters["status"] || "all"} onValueChange={(v) => handleFilterChange("status", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Soon">Soon</SelectItem>
                        <SelectItem value="Now">Now</SelectItem>
                        <SelectItem value="Finished">Finished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* New approval status filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Approval</label>
                    <Select value={activeFilters["approval"] || "all"} onValueChange={(v) => handleFilterChange("approval", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
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
                  const status = getEventStatus(event.date, event.time)
                  // Border color logic
                  let borderColor = ""
                  if (event.status === "APPROVED") borderColor = "border-green-500"
                  else if (event.status === "REJECTED") borderColor = "border-red-500"
                  else borderColor = "border-transparent"

                  return (
                    <Card
                      key={event.id}
                      className={`hover:shadow-md transition-shadow border-2 ${borderColor} h-full flex flex-col`}
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
                        {/* Approval status badge */}
                        <div className="mt-2">
                          {event.status === "APPROVED" && (
                            <Badge variant="default">Approved</Badge>
                          )}
                          {event.status === "PENDING" && (
                            <Badge variant="outline">Pending</Badge>
                          )}
                          {event.status === "REJECTED" && (
                            <Badge variant="destructive">Rejected</Badge>
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

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Trophy className="h-4 w-4" />
                            {event.points} loyalty points
                          </div>
                        </div>

                        {/* Buttons section - pushed to bottom */}
                        <div className="mt-auto pt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={() => router.push(`/club-leader/events/${event.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Detail
                            </Button>
                            <Button variant="outline" onClick={() => handleEdit(event)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Event
                            </Button>
                          </div>
                          {/* QR Code Section - Only show if APPROVED and event is still active */}
                          {isEventActive(event) && (
                            <div className="mt-3 pt-3 border-t border-muted">
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                                onClick={async () => {
                                  setSelectedEvent(event);
                                  try {
                                    // Generate fresh token and qrUrl using the new API
                                    console.log('Generating check-in token for event:', event.id);
                                    const { token, qrUrl } = await generateCode(event.id);
                                    console.log('Generated token:', token);
                                    console.log('Generated qrUrl:', qrUrl);

                                    // Create URLs with token (path parameter format)
                                    const prodUrl = `https://uniclub-fpt.vercel.app/student/checkin/${token}`;
                                    const localUrl = `http://localhost:3000/student/checkin/${token}`;

                                    console.log('Production URL:', prodUrl);
                                    console.log('Development URL:', localUrl);

                                    // Generate QR code variants
                                    const styleVariants = [
                                      { color: { dark: '#000000', light: '#FFFFFF' }, margin: 1 },
                                      { color: { dark: '#111111', light: '#FFFFFF' }, margin: 2 },
                                      { color: { dark: '#222222', light: '#FFFFFF' }, margin: 0 },
                                    ];

                                    // Generate QR variants for local environment
                                    const localQrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) => {
                                      const opts = styleVariants[i % styleVariants.length];
                                      return QRCode.toDataURL(localUrl, opts as any);
                                    });
                                    const localQrVariants = await Promise.all(localQrVariantsPromises);

                                    // Generate QR variants for production environment
                                    const prodQrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) => {
                                      const opts = styleVariants[i % styleVariants.length];
                                      return QRCode.toDataURL(prodUrl, opts as any);
                                    });
                                    const prodQrVariants = await Promise.all(prodQrVariantsPromises);

                                    // Set different URLs for local and production
                                    setQrRotations({ local: localQrVariants, prod: prodQrVariants });
                                    setQrLinks({ local: localUrl, prod: prodUrl });
                                    setVisibleIndex(0);
                                    setDisplayedIndex(0);
                                    setShowQrModal(true);

                                    toast({
                                      title: 'QR Code Generated',
                                      description: 'Check-in QR code has been generated successfully',
                                      duration: 3000
                                    });
                                  } catch (err: any) {
                                    console.error('Failed to generate QR', err);
                                    toast({
                                      title: 'QR Error',
                                      description: err?.message || 'Could not generate QR code',
                                      variant: 'destructive'
                                    });
                                  }
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

          {/* Create Event Modal */}
          <Modal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            title="Create New Event"
            description="Add a new event for your club members"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter event name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your event..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime.substring(0, 5)}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value + ":00" })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime.substring(0, 5)}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value + ":00" })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxCheckInCount">Max Check-ins {selectedLocationId && "(Auto-filled from location)"}</Label>
                  <Input
                    id="maxCheckInCount"
                    type="number"
                    value={formData.maxCheckInCount}
                    onChange={(e) => setFormData({ ...formData, maxCheckInCount: Number.parseInt(e.target.value) || 100 })}
                    className={selectedLocationId ? "bg-muted border-blue-300" : ""}
                    placeholder="Select location first"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationName">Location *</Label>
                <Select
                  value={selectedLocationId}
                  onValueChange={(value) => {
                    setSelectedLocationId(value)
                    const location = locations.find(loc => String(loc.id) === value)
                    if (location) {
                      setFormData({
                        ...formData,
                        locationId: Number(location.id),
                        maxCheckInCount: location.capacity || 100
                      })
                    }
                  }}
                  disabled={locationsLoading}
                >
                  <SelectTrigger id="locationName">
                    <SelectValue placeholder={locationsLoading ? "Loading locations..." : "Select a location"} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={String(location.id)}>
                        {location.name} {location.capacity && `(Capacity: ${location.capacity})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Co-Host Clubs (Optional)</Label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-muted/30">
                  {clubsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading clubs...</p>
                  ) : allClubs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No clubs available</p>
                  ) : (
                    <div className="space-y-2">
                      {allClubs
                        .filter(club => club.id !== userClubId) // Exclude host club
                        .map((club) => (
                          <div key={club.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`club-${club.id}`}
                              checked={selectedCoHostClubIds.includes(club.id)}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  setSelectedCoHostClubIds([...selectedCoHostClubIds, club.id])
                                } else {
                                  setSelectedCoHostClubIds(selectedCoHostClubIds.filter(id => id !== club.id))
                                }
                              }}
                            />
                            <label
                              htmlFor={`club-${club.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {club.name}
                            </label>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {selectedCoHostClubIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedCoHostClubIds.length} club{selectedCoHostClubIds.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Send</Button>
              </div>
            </div>
          </Modal>

          {/* Edit Event Modal */}
          <Modal open={showEditModal} onOpenChange={setShowEditModal} title="Edit Event" description="Update event details">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Event Name *</Label>
                <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input id="edit-date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">Start Time *</Label>
                  <Input id="edit-startTime" type="time" value={formData.startTime.substring(0, 5)} onChange={(e) => setFormData({ ...formData, startTime: e.target.value + ":00" })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">End Time *</Label>
                  <Input id="edit-endTime" type="time" value={formData.endTime.substring(0, 5)} onChange={(e) => setFormData({ ...formData, endTime: e.target.value + ":00" })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-locationName">Location *</Label>
                <Select
                  value={selectedLocationId}
                  onValueChange={(value) => {
                    setSelectedLocationId(value)
                    const location = locations.find(loc => String(loc.id) === value)
                    if (location) {
                      setFormData({
                        ...formData,
                        locationId: Number(location.id),
                        maxCheckInCount: location.capacity || 100
                      })
                    }
                  }}
                  disabled={locationsLoading}
                >
                  <SelectTrigger id="edit-locationName">
                    <SelectValue placeholder={locationsLoading ? "Loading locations..." : "Select a location"} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={String(location.id)}>
                        {location.name} {location.capacity && `(Capacity: ${location.capacity})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button onClick={handleUpdate}>Update Event</Button>
              </div>
            </div>
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
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
