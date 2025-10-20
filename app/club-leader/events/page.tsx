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
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { Calendar, Plus, Edit, MapPin, Trophy, ChevronLeft, ChevronRight, Filter, X, Eye } from "lucide-react"
import { QrCode } from "lucide-react"
import QRCode from "qrcode"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEvent, getEventById } from "@/service/eventApi"
import { generateCode } from "@/service/checkinApi"
import { safeLocalStorage } from "@/lib/browser-utils"
import { useClubEvents } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/hooks/use-query-hooks"

export default function ClubLeaderEventsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [userClubId, setUserClubId] = useState<number | null>(null)

  // Add fullscreen and environment states
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeEnvironment, setActiveEnvironment] = useState<'local' | 'prod'>('prod')

  // Get clubId from localStorage
  useEffect(() => {
    try {
      const saved = safeLocalStorage.getItem("uniclub-auth")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.clubId) {
          setUserClubId(Number(parsed.clubId))
        }
      }
    } catch (error) {
      console.error("Failed to get clubId from localStorage:", error)
    }
  }, [])

  // Use React Query hook to fetch events
  const { data: apiEvents = [], isLoading: loading } = useClubEvents(userClubId ? [userClubId] : [])
  
  // Sort events by date and time
  const sortEventsByDateTime = (eventList: any[]) => {
    return eventList.sort((a: any, b: any) => {
      const dateA = new Date(a.date || '1970-01-01')
      const dateB = new Date(b.date || '1970-01-01')
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime()
      }
      
      const timeA = a.time || '00:00'
      const timeB = b.time || '00:00'
      
      const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        return (hours || 0) * 60 + (minutes || 0)
      }
      
      return parseTime(timeB) - parseTime(timeA)
    })
  }

  const events = sortEventsByDateTime([...apiEvents])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrDataUrls, setQrDataUrls] = useState<{ local?: string; prod?: string }>({})
  const [qrLinks, setQrLinks] = useState<{ local?: string; prod?: string }>({})
  const [qrRotations, setQrRotations] = useState<{ local: string[]; prod: string[] }>({ local: [], prod: [] })
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
    const rotId = setInterval(async () => {
      // Generate new QR code when rotating
      if (selectedEvent?.id) {
        try {
          const { token, qrUrl } = await generateCode(selectedEvent.id)
          console.log('Rotating QR - Generated new token:', token)
          
          const styleVariants = [
            { color: { dark: '#000000', light: '#FFFFFF' }, margin: 1 },
            { color: { dark: '#111111', light: '#FFFFFF' }, margin: 2 },
            { color: { dark: '#222222', light: '#FFFFFF' }, margin: 0 },
          ]
          const qrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) => {
            const opts = styleVariants[i % styleVariants.length]
            return QRCode.toDataURL(qrUrl, opts as any)
          })
          const qrVariants = await Promise.all(qrVariantsPromises)
          
          setQrRotations({ local: qrVariants, prod: qrVariants })
          setQrLinks({ local: qrUrl, prod: qrUrl })
        } catch (err) {
          console.error('Failed to rotate QR:', err)
        }
      }
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
    clubId: userClubId || 0,
    name: "",
    description: "",
    type: "PUBLIC",
    date: "",
    time: "13:30",
    locationId: 0,
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

  const resetForm = () => setFormData({ clubId: userClubId || 0, name: "", description: "", type: "PUBLIC", date: "", time: "13:30", locationId: 0 })

  const handleCreate = async () => {
    // validate required
    if (!formData.name || !formData.date) {
      toast({ title: "Missing Information", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    try {
      const clubId = String(formData.clubId).match(/^\d+$/) ? Number(formData.clubId) : formData.clubId
      const payload = {
        clubId,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        locationId: formData.locationId,
      }

      const res: any = await createEvent(payload)
      if (res && res.success) {
        toast({ title: "Event Created", description: res.message || "Event created successfully" })
        setShowCreateModal(false)
        // Invalidate events cache to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() })
      } else {
        toast({ title: "Create failed", description: res?.message || "Could not create event", variant: "destructive" })
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" })
    }
  }

  const handleEdit = (event: any) => {
    setSelectedEvent(event)
    setFormData({
      clubId: event.clubId ?? userClubId ?? 0,
      name: event.name ?? event.title ?? "",
      description: event.description ?? "",
      type: event.type ?? "PUBLIC",
      date: event.date ?? "",
      time: event.time ?? "13:30",
      locationId: event.locationId ?? 0,
    })
    setShowEditModal(true)
  }
  const handleUpdate = () => { /* same as source */ }

  // Helper functions for QR actions
  const handleDownloadQR = (environment: 'local' | 'prod') => {
    try {
      const qrDataUrl = environment === 'local' 
        ? qrRotations.local[displayedIndex % qrRotations.local.length]
        : qrRotations.prod[displayedIndex % qrRotations.prod.length]
      
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

  const handleCopyLink = async (environment: 'local' | 'prod') => {
    try {
      const link = environment === 'local' ? qrLinks.local : qrLinks.prod
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
              <p className="text-muted-foreground">
                Manage Club events
                {userClubId && <span className="text-xs text-muted-foreground/70 ml-2">(Club ID: {userClubId})</span>}
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
                        <SelectItem value={String(userClubId)}>My Club</SelectItem>
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
                          {/* QR Code Section - Only show if APPROVED */}
                          {event.status === "APPROVED" && (
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
                                    
                                    // Generate QR code variants using the qrUrl from backend
                                    const styleVariants = [
                                      { color: { dark: '#000000', light: '#FFFFFF' }, margin: 1 },
                                      { color: { dark: '#111111', light: '#FFFFFF' }, margin: 2 },
                                      { color: { dark: '#222222', light: '#FFFFFF' }, margin: 0 },
                                    ];
                                    const qrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) => {
                                      const opts = styleVariants[i % styleVariants.length];
                                      return QRCode.toDataURL(qrUrl, opts as any);
                                    });
                                    const qrVariants = await Promise.all(qrVariantsPromises);
                                    
                                    // Use the same qrUrl for both local and prod since backend provides the final URL
                                    setQrRotations({ local: qrVariants, prod: qrVariants });
                                    setQrLinks({ local: qrUrl, prod: qrUrl });
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationId">Location ID</Label>
                  <Input
                    id="locationId"
                    type="number"
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input id="edit-date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <Input id="edit-time" type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
                </div>
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
