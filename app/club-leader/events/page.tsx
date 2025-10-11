"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/modal"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { Calendar, Plus, Edit, MapPin, Trophy, ChevronLeft, ChevronRight, Filter, X } from "lucide-react"
import { QrCode } from "lucide-react"
import QRCode from "qrcode"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import clubs from "@/src/data/clubs.json"
import { fetchEvent } from "@/service/eventApi"
import { createEvent, getEventById } from "@/service/eventApi"

export default function ClubLeaderEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const { toast } = useToast()

  // Load events from API on mount
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data: any = await fetchEvent()
        if (!mounted) return
        // API should return an array; guard defensively
        const raw: any[] = Array.isArray(data) ? data : (data?.events ?? [])
        // Normalize shape: some APIs use `name` instead of `title`.
        const normalized = raw.map((e: any) => ({ ...e, title: e.title ?? e.name }))
        setEvents(normalized)
      } catch (error) {
        console.error("Failed to load events:", error)
        toast({ title: "Error fetching events", description: "Could not load events from server.", variant: "destructive" })
      }
    }

    load()
    return () => { mounted = false }
  }, [])

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
  // show each QR visual for 30 seconds
  const ROTATION_INTERVAL_MS = 30 * 1000
  const VARIANTS = 3

  const [countdown, setCountdown] = useState(() => Math.floor(ROTATION_INTERVAL_MS / 1000))

  // rotate QR image index while modal open and maintain a countdown (seconds)
  useEffect(() => {
    if (!showQrModal) {
      // reset countdown when modal closed
      setCountdown(Math.floor(ROTATION_INTERVAL_MS / 1000))
      setDisplayedIndex(0)
      setIsFading(false)
      return
    }

    // start with full countdown when modal opens
    setCountdown(Math.floor(ROTATION_INTERVAL_MS / 1000))

    const rotId = setInterval(() => {
      setVisibleIndex((i) => i + 1)
      // reset countdown when rotation happens
      setCountdown(Math.floor(ROTATION_INTERVAL_MS / 1000))
    }, ROTATION_INTERVAL_MS)

    const cntId = setInterval(() => {
      setCountdown((s) => (s <= 1 ? Math.floor(ROTATION_INTERVAL_MS / 1000) : s - 1))
    }, 1000)

    return () => {
      clearInterval(rotId)
      clearInterval(cntId)
    }
  }, [showQrModal])

  // handle fade animation when visibleIndex changes
  useEffect(() => {
    if (!showQrModal) return
    // start fade-out
    setIsFading(true)
    const t = setTimeout(() => {
      setDisplayedIndex(visibleIndex)
      // fade-in
      setIsFading(false)
    }, 300) // 300ms fade duration

    return () => clearTimeout(t)
  }, [visibleIndex, showQrModal])

  // For demo purposes, assume managing the first club
  const managedClub = clubs[0]

  const [formData, setFormData] = useState({
    clubId: managedClub.id,
    name: "",
    description: "",
    type: "PUBLIC",
    date: "",
    time: "13:30",
    locationId: 0,
  })
  // Try to match by clubId; note: local clubs may use string ids (e.g. "c-ai")
  // while the API may use numeric clubId. If no match, fall back to showing all events.
  const clubEvents = events.filter((e) => String(e.clubId) === String(managedClub.id))
  const effectiveEvents = clubEvents.length ? clubEvents : events

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

  const resetForm = () => setFormData({ clubId: managedClub.id, name: "", description: "", type: "PUBLIC", date: "", time: "13:30", locationId: 0 })

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
        // close modal and reload to refresh data from API
        setShowCreateModal(false)
        window.location.reload()
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
      clubId: event.clubId ?? managedClub.id,
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

  const getEventStatus = (eventDate: string) => {
    const now = new Date()
    const event = new Date(eventDate)
    if (event < now) return "past"
    if (event.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) return "upcoming"
    return "future"
  }

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Events</h1>
              <p className="text-muted-foreground">Manage {managedClub.name} events</p>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                        {clubs.map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
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
                  const status = getEventStatus(event.date)

                  return (
                    <Card key={event.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            {event.description && <CardDescription className="mt-1">{event.description}</CardDescription>}
                          </div>
                          <Badge
                            variant={status === "past" ? "secondary" : status === "upcoming" ? "default" : "outline"}
                          >
                            {status === "past" ? "Past" : status === "upcoming" ? "Soon" : "Future"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Trophy className="h-4 w-4" />
                            {event.points} loyalty points
                          </div>

                          <Button variant="outline" className="w-full bg-transparent" onClick={() => handleEdit(event)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Event
                          </Button>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                  try {
                                    // Prefer server-side persistent checkInCode when available.
                                    let code: string | null = null
                                    try {
                                      const serverEvent = await getEventById(String(event.id))
                                      if (serverEvent) {
                                        // If the server explicitly has no checkInCode, surface error and abort
                                        if (!serverEvent.checkInCode) {
                                          toast({ title: 'No check-in code', description: 'This event has not been assigned a persistent check-in code. Please contact the organizer.', variant: 'destructive' })
                                          return
                                        }
                                        code = String(serverEvent.checkInCode)
                                      }
                                    } catch (e) {
                                      // on server error, fall back to minting a token
                                    }

                                    // If we still don't have a persistent code (because server errored), mint a short-lived token
                                    if (!code) {
                                      const tokenResp = await fetch('/api/checkin/token', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ eventId: String(event.id) }),
                                      })
                                      const tokenJson = await tokenResp.json()
                                      if (!tokenJson?.success) throw new Error('Token mint failed')
                                      code = tokenJson.token
                                    }

                                    // Build canonical URLs using a query parameter: /member/checkin?code={checkInCode}
                                    // This avoids path-based routing and makes it easy for the check-in page
                                    // to read the code from the URL and fetch event data.
                                    const localUrl = `http://localhost:3000/member/checkin/${encodeURIComponent(String(code))}`
                                    const prodUrl = `https://uniclub-fpt.vercel.app/member/checkin/${encodeURIComponent(String(code))}`

                                    // generate multiple visually-distinct images by varying QR styling options
                                    // NOTE: We avoid adding a URL fragment (#...) because scanners will include
                                    // the fragment in the opened URL. Keeping the encoded URL identical
                                    // ensures the scanned link is exactly `/member/checkin/{code}`.
                                    const styleVariants = [
                                      { color: { dark: '#000000', light: '#FFFFFF' }, margin: 1 },
                                      { color: { dark: '#111111', light: '#FFFFFF' }, margin: 2 },
                                      { color: { dark: '#222222', light: '#FFFFFF' }, margin: 0 },
                                    ]

                                    const localVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) => {
                                      const opts = styleVariants[i % styleVariants.length]
                                      return QRCode.toDataURL(localUrl, opts as any)
                                    })
                                    const prodVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) => {
                                      const opts = styleVariants[i % styleVariants.length]
                                      return QRCode.toDataURL(prodUrl, opts as any)
                                    })

                                    const [localVariants, prodVariants] = await Promise.all([
                                      Promise.all(localVariantsPromises),
                                      Promise.all(prodVariantsPromises),
                                    ])

                                    setQrRotations({ local: localVariants, prod: prodVariants })
                                    setQrLinks({ local: localUrl, prod: prodUrl })
                                    setVisibleIndex(0)
                                    setDisplayedIndex(0)
                                    setShowQrModal(true)
                                  } catch (err) {
                                    console.error('Failed to generate QR', err)
                                    toast({ title: 'QR Error', description: 'Could not generate QR code', variant: 'destructive' })
                                  }
                                }}
                              className="h-8 w-8 p-0"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
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
          <Modal open={showQrModal} onOpenChange={setShowQrModal} title="Event QR Code" description="Scan to check-in">
            <div className="flex flex-col items-center gap-4">
              {/* Countdown box */}
              <div className="p-2 rounded-md bg-muted/60 text-sm text-muted-foreground">
                Next QR in <span className="font-medium">{countdown}s</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium mb-2">Local (dev)</div>
                  {qrRotations.local.length ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrRotations.local[displayedIndex % qrRotations.local.length]} alt="QR Code Local" className={`w-40 h-40 transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`} />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(qrLinks.local || ""); toast({ title: 'Copied', description: 'Local link copied to clipboard' }) } catch { toast({ title: 'Copy failed' }) } }}>Copy link</Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Generating...</div>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium mb-2">Production (vercel)</div>
                  {qrRotations.prod.length ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrRotations.prod[displayedIndex % qrRotations.prod.length]} alt="QR Code Prod" className={`w-40 h-40 transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`} />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(qrLinks.prod || ""); toast({ title: 'Copied', description: 'Production link copied to clipboard' }) } catch { toast({ title: 'Copy failed' }) } }}>Copy link</Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Generating...</div>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">Scan a QR to open the check-in page (local or production)</div>
            </div>
          </Modal>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
