"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Users,
  MapPin,
  Mail,
  Building,
  FileText,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
<<<<<<< Updated upstream
import { getEventById, putEventStatus, getEventWallet, EventWallet, getEventSummary, EventSummary, eventSettle, getEventSettle } from "@/service/eventApi"
=======
import { getEventById, putEventStatus, getEventSummary, EventSummary, eventSettle, getEventSettle, eventQR } from "@/service/eventApi"
>>>>>>> Stashed changes
import { useToast } from "@/hooks/use-toast"
import { renderTypeBadge } from "@/lib/eventUtils"
import { getLocationById } from "@/service/locationApi"
import { getClubById } from "@/service/clubApi"
<<<<<<< Updated upstream
=======
import { PhaseSelectionModal } from "@/components/phase-selection-modal"
import { QRModal } from "@/components/qr-modal"
import { EventWalletHistoryModal } from "@/components/event-wallet-history-modal"
import QRCode from "qrcode"
>>>>>>> Stashed changes

interface EventRequestDetailPageProps {
  params: {
    id: string
  }
}

export default function EventRequestDetailPage({ params }: EventRequestDetailPageProps) {
  const [request, setRequest] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<any | null>(null)
  const [locationLoading, setLocationLoading] = useState<boolean>(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [club, setClub] = useState<any | null>(null)
  const [clubLoading, setClubLoading] = useState<boolean>(false)
  const [clubError, setClubError] = useState<string | null>(null)
  const { toast } = useToast()
  const [processing, setProcessing] = useState(false)
  const [showWalletHistoryModal, setShowWalletHistoryModal] = useState(false)
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [settling, setSettling] = useState(false)
  const [isEventSettled, setIsEventSettled] = useState(false)
  const [checkingSettled, setCheckingSettled] = useState(false)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      try {
        const data: any = await getEventById(params.id)
        if (!mounted) return
        setRequest(data)

        // Fetch event summary if APPROVED, ONGOING or COMPLETED
        if (data.status === "APPROVED" || data.status === "ONGOING" || data.status === "COMPLETED") {
          try {
            setSummaryLoading(true)
            const summaryData = await getEventSummary(params.id)
            if (mounted) setEventSummary(summaryData)
          } catch (summaryError) {
            console.error("Failed to load event summary:", summaryError)
            // Don't show error toast for summary, it's not critical
          } finally {
            if (mounted) setSummaryLoading(false)
          }
        }

        // Check if event is settled (if COMPLETED status)
        if (data.status === "COMPLETED") {
          try {
            setCheckingSettled(true)
            const settledEvents = await getEventSettle()
            const isSettled = settledEvents.some((e: any) => e.id === data.id)
            if (mounted) setIsEventSettled(isSettled)
          } catch (settledError) {
            console.error("Failed to check settled events:", settledError)
            // Don't show error toast, it's not critical
          } finally {
            if (mounted) setCheckingSettled(false)
          }
        }

        // if the event has a locationId, fetch that location
        if (data && (data.locationId || data.venueId || data.location)) {
          const locId = data.locationId ?? data.venueId ?? data.location
          setLocationLoading(true)
          try {
            const loc = await getLocationById(locId)
            if (!mounted) return
            // API may wrap in { data: {...} } or return object directly
            const normalized = loc && (loc as any).data ? (loc as any).data : loc
            setLocation(normalized)
          } catch (err: any) {
            console.error(err)
            if (!mounted) return
            setLocationError(err?.message || "Failed to load location")
          } finally {
            if (mounted) setLocationLoading(false)
          }
        }
        // if the event has a clubId, fetch that club
        if (data && (data.clubId || data.requestedByClubId || data.club)) {
          const clubId = data.clubId ?? data.requestedByClubId ?? data.club
          setClubLoading(true)
          try {
            const c = await getClubById(clubId)
            if (!mounted) return
            const normalizedClub = c && (c as any).data ? (c as any).data : c
            setClub(normalizedClub)
          } catch (err: any) {
            console.error(err)
            if (!mounted) return
            setClubError(err?.message || "Failed to load club")
          } finally {
            if (mounted) setClubLoading(false)
          }
        }
      } catch (err: any) {
        console.error(err)
        if (!mounted) return
        setError(err?.message || "Failed to load event")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [params.id])

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["uni_staff"]}>
        <AppShell>
          <div className="py-8 text-center">
            <Card>
              <CardContent className="py-8">Loading event...</CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (error || !request) {
    return (
      <ProtectedRoute allowedRoles={["uni_staff"]}>
        <AppShell>
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">Event Request Not Found</h1>
            <p className="text-muted-foreground mb-4">The requested event request could not be found.</p>
            <Link href="/uni-staff/events-req">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event Requests
              </Button>
            </Link>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="secondary" className="bg-blue-900 text-white border-blue-900">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "PENDING_COCLUB":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-500">
            <Clock className="h-3 w-3 mr-1" />
            Pending Co-Club Approval
          </Badge>
        )
      case "PENDING_UNISTAFF":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            Pending Uni-Staff Approval
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-500">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // effective status (prefer status over type) for checks and display
  const effectiveStatus = (request.status ?? request.type ?? "").toString().toUpperCase()

  const updateStatus = async (status: string) => {
    if (!request) return
    setProcessing(true)
    try {
      await putEventStatus(request.id, status, request.budgetPoints || 0)
      // optimistic/local update
      setRequest({ ...request, status })
      toast({ title: status === "APPROVED" ? "Approved" : "Rejected", description: `Event ${request.name || request.id} ${status === "APPROVED" ? "approved" : "rejected"}.` })
    } catch (err: any) {
      console.error('Update status failed', err)
      toast({ title: 'Error', description: err?.message || 'Failed to update event status' })
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const handleSettle = async () => {
    if (!request) return
    setSettling(true)
    try {
      const response = await eventSettle(request.id)
      toast({ 
        title: 'Event Settled', 
        description: response.message || `Event ${request.name || request.id} has been settled successfully.` 
      })
      // Mark as settled and refetch the event data
      setIsEventSettled(true)
      const updatedData = await getEventById(params.id)
      setRequest(updatedData)
    } catch (err: any) {
      console.error('Settle failed', err)
      toast({ 
        title: 'Error', 
        description: err?.response?.data?.message || err?.message || 'Failed to settle event',
        variant: 'destructive'
      })
    } finally {
      setSettling(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["uni_staff"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link href="/uni-staff/events-req">
                <Button variant="ghost" size="sm" className="mb-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Event Requests
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">{request.name || request.eventName}</h1>
              <p className="text-muted-foreground">Event Organization Request Details</p>
            </div>
            <div className="flex items-center gap-2">
              {/* prefer status, fallback to type */}
              {getStatusBadge(effectiveStatus)}
              {effectiveStatus === "COMPLETED" && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className={isEventSettled ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}
                  onClick={handleSettle} 
                  disabled={settling || isEventSettled || checkingSettled}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  {checkingSettled ? 'Checking...' : settling ? 'Settling...' : isEventSettled ? 'Already Settled' : 'Settle Event'}
                </Button>
              )}
              {effectiveStatus !== "APPROVED" && effectiveStatus !== "REJECTED" && effectiveStatus !== "COMPLETED" && (
                <div className="flex gap-2">
                  <Button variant="default" size="sm" className="h-8 w-8 p-0" onClick={() => updateStatus('APPROVED')} disabled={processing}>
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" className="h-8 w-8 p-0" onClick={() => updateStatus('REJECTED')} disabled={processing}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Event Name</label>
                    <p className="text-lg font-semibold">{request.name || request.eventName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {request.type && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                        <div className="mt-1">
                          {renderTypeBadge(request.type)}
                        </div>
                      </div>
                    )}
                    {request.category && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Category</label>
                        <div className="mt-1">
                          <Badge variant="outline">{request.category}</Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
          <p className="mt-1">{request.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    { (request.date || request.eventDate) && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Event Date</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(request.date || request.eventDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                    { (request.startTime || request.endTime || request.time || request.eventTime) && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Event Time</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {request.startTime && request.endTime 
                              ? `${request.startTime} - ${request.endTime}`
                              : request.time || request.eventTime || "Time not set"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Venue</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {request.locationName ? (
                          request.locationName
                        ) : (
                          <>
                            {locationLoading && "Loading location..."}
                            {locationError && `Location #${request.locationId} (failed to load)`}
                            {!locationLoading && !locationError && location && (location.name || location.locationName) && (
                              <>{location.name || location.locationName} (#{location.id ?? request.locationId})</>
                            )}
                            {!locationLoading && !locationError && !location && (request.locationId ? `Location #${request.locationId}` : request.venue)}
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {request.expectedAttendees !== undefined && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Expected Attendees</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{request.expectedAttendees} people</span>
                        </div>
                      </div>
                    )}
                    {request.budget !== undefined && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Budget</label>
                        <div className="flex items-center gap-2 mt-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{request.budget ? formatCurrency(request.budget) : "-"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Check-in Capacity - only show if available */}
                  {request.maxCheckInCount !== undefined && request.currentCheckInCount !== undefined && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Max Capacity</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{request.maxCheckInCount} people</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Current Check-ins</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {(request.status === "APPROVED" || request.status === "ONGOING" || request.status === "COMPLETED") ? (
                                summaryLoading ? (
                                  "Loading..."
                                ) : eventSummary ? (
                                  `${eventSummary.registrationsCount} / ${request.maxCheckInCount}`
                                ) : (
                                  `${request.currentCheckInCount} / ${request.maxCheckInCount}`
                                )
                              ) : (
                                `${request.currentCheckInCount} / ${request.maxCheckInCount}`
                              )}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Available Spots</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {(request.status === "APPROVED" || request.status === "ONGOING" || request.status === "COMPLETED") && eventSummary
                                ? `${request.maxCheckInCount - eventSummary.registrationsCount} remaining`
                                : `${request.maxCheckInCount - request.currentCheckInCount} remaining`}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-sm text-green-700 font-medium">
                              Budget Points
                            </label>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-green-700 hover:text-green-900 hover:bg-green-100"
                              onClick={() => setShowWalletHistoryModal(true)}
                            >
                              History
                            </Button>
                          </div>
                          <div className="font-semibold text-green-800 mt-1">
                            {request.budgetPoints || 0} points
                          </div>
                        </div>
                      </div>

                      {/* Event Summary - Only shown when APPROVED, ONGOING or COMPLETED */}
                      {(request.status === "APPROVED" || request.status === "ONGOING" || request.status === "COMPLETED") && eventSummary && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="p-3 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg border border-blue-200">
                            <label className="text-sm text-blue-700 font-medium">Total Registrations</label>
                            <div className="font-semibold text-blue-800 mt-1">
                              {summaryLoading ? (
                                <span className="text-muted-foreground">Loading...</span>
                              ) : (
                                `${eventSummary.registrationsCount} registered`
                              )}
                            </div>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                            <label className="text-sm text-amber-700 font-medium">Refunded</label>
                            <div className="font-semibold text-amber-800 mt-1">
                              {summaryLoading ? (
                                <span className="text-muted-foreground">Loading...</span>
                              ) : (
                                `${eventSummary.refundedCount} refunds`
                              )}
                            </div>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                            <label className="text-sm text-purple-700 font-medium">Total Commit Points</label>
                            <div className="font-semibold text-purple-800 mt-1">
                              {summaryLoading ? (
                                <span className="text-muted-foreground">Loading...</span>
                              ) : (
                                `${eventSummary.totalCommitPoints} points`
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Co-hosted Clubs */}
                  {request.coHostedClubs && request.coHostedClubs.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-muted-foreground">Co-hosting Clubs</label>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {request.coHostedClubs.map((club: any) => (
                          <div key={club.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{club.name}</span>
                              <span className="text-sm text-muted-foreground">(#{club.id})</span>
                            </div>
                            <Badge 
                              variant="outline"
                              className={
                                club.coHostStatus === "APPROVED"
                                  ? "bg-green-100 text-green-700 border-green-500"
                                  : club.coHostStatus === "REJECTED"
                                  ? "bg-red-100 text-red-700 border-red-500"
                                  : club.coHostStatus === "PENDING"
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-500"
                                  : "bg-gray-100 text-gray-700 border-gray-300"
                              }
                            >
                              {club.coHostStatus}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              { (request.purpose || request.description) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Purpose & Objectives
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed">{request.purpose || request.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  { (request.requestDate || request.date) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Request Date</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(request.requestDate || request.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Organizing Club</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {request.hostClub ? (
                          <>{request.hostClub.name} (#{request.hostClub.id})</>
                        ) : (
                          <>
                            {clubLoading && "Loading club..."}
                            {clubError && `Club #${request.clubId ?? request.requestedByClubId} (failed to load)`}
                            {!clubLoading && !clubError && club && (club.name || club.clubName) && (
                              <>{club.name || club.clubName} (#{club.id ?? request.clubId})</>
                            )}
                            {!clubLoading && !clubError && !club && (request.requestedBy ?? (request.clubId ? `Club #${request.clubId}` : "-"))}
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {request.requestedByContact && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                      <p className="font-semibold mt-1">{request.requestedByContact}</p>
                    </div>
                  )}

                  { (request.requestedByEmail || request.email) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${request.requestedByEmail || request.email}`} className="text-blue-600 hover:underline">
                          {request.requestedByEmail || request.email}
                        </a>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                    <div className="mt-2">{getStatusBadge(request.status || request.type)}</div>
                  </div>
                </CardContent>
              </Card>

              {effectiveStatus === "COMPLETED" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Event Settlement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isEventSettled ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          This event has already been settled.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-3">
                        This event has been completed. Click the button below to process the final settlement.
                      </p>
                    )}
                    <Button 
                      className={`w-full ${isEventSettled ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                      variant="default" 
                      onClick={handleSettle} 
                      disabled={settling || isEventSettled || checkingSettled}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {checkingSettled ? 'Checking Status...' : settling ? 'Processing Settlement...' : isEventSettled ? 'Already Settled' : 'Settle Event'}
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Organizer
                    </Button>
                  </CardContent>
                </Card>
              )}
              {effectiveStatus !== "APPROVED" && effectiveStatus !== "REJECTED" && effectiveStatus !== "COMPLETED" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" variant="default" onClick={() => updateStatus('APPROVED')} disabled={processing}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processing ? 'Processing...' : 'Approve Request'}
                    </Button>
                    <Button className="w-full" variant="destructive" onClick={() => updateStatus('REJECTED')} disabled={processing}>
                      <XCircle className="h-4 w-4 mr-2" />
                      {processing ? 'Processing...' : 'Reject Request'}
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Organizer
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
<<<<<<< Updated upstream
=======

          {/* Phase Selection Modal */}
          <PhaseSelectionModal
            open={showPhaseModal}
            onOpenChange={setShowPhaseModal}
            onConfirm={handlePhaseConfirm}
            isLoading={isGeneratingQR}
          />

          {/* QR Code Modal */}
          <QRModal
            open={showQrModal}
            onOpenChange={setShowQrModal}
            eventName={request?.name || ''}
            checkInCode={checkInCode}
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

          {/* Wallet History Modal */}
          <EventWalletHistoryModal
            open={showWalletHistoryModal}
            onOpenChange={setShowWalletHistoryModal}
            eventId={params.id}
          />
>>>>>>> Stashed changes
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
