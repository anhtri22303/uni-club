"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, MapPin, Users, CheckCircle, AlertCircle, XCircle, Eye, QrCode, Maximize2, Minimize2, Copy, Download, RotateCcw, Monitor, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
// import { getEventById } from "@/service/eventApi"
import { generateCode } from "@/service/checkinApi"
import { Modal } from "@/components/modal"
import QRCode from "qrcode"
import { AppShell } from "@/components/app-shell"
import { QRModal } from "@/components/qr-modal"
import { ProtectedRoute } from "@/contexts/protected-route"
import { LoadingSkeleton } from "@/components/loading-skeleton"

import { getEventById, submitForUniversityApproval, timeObjectToString, acceptCoHostInvitation, rejectCoHostInvitation, getEventWallet, EventWallet, TimeObject, getEventSummary, EventSummary, endEvent } from "@/service/eventApi" // 👈 Thêm submitForUniversityApproval
import { getClubIdFromToken } from "@/service/clubApi"
import { Loader2 } from "lucide-react" // 👈 Thêm Loader2
interface EventDetail {
  id: number
  name: string
  description: string
  type: string
  date: string
  startTime: TimeObject | string | null
  endTime: TimeObject | string | null
  status: string
  checkInCode: string
  locationName: string
  maxCheckInCount: number
  currentCheckInCount: number
  budgetPoints: number
  hostClub: {
    id: number
    name: string
    coHostStatus?: string
  }
  coHostedClubs?: Array<{
    id: number
    name: string
    coHostStatus: string
  }>
  // Legacy fields for backward compatibility
  clubId?: number
  time?: string
  locationId?: number
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<EventWallet | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // 👈 THÊM STATE NÀY
  const [isAcceptingCoHost, setIsAcceptingCoHost] = useState(false) // State for accepting co-host
  const [isRejectingCoHost, setIsRejectingCoHost] = useState(false) // State for rejecting co-host
  const [isEndingEvent, setIsEndingEvent] = useState(false) // State for ending event
  const [userClubId, setUserClubId] = useState<number | null>(null)
  const [myCoHostStatus, setMyCoHostStatus] = useState<string | null>(null)

  // QR Code states
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrLinks, setQrLinks] = useState<{ local?: string; prod?: string }>({})
  const [qrRotations, setQrRotations] = useState<{ local: string[]; prod: string[] }>({ local: [], prod: [] })
  const [visibleIndex, setVisibleIndex] = useState(0)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeEnvironment, setActiveEnvironment] = useState<'local' | 'prod' | 'mobile'>('prod')
  const ROTATION_INTERVAL_MS = 30 * 1000
  const VARIANTS = 3
  const [countdown, setCountdown] = useState(() => Math.floor(ROTATION_INTERVAL_MS / 1000))

  // Get club ID from token on mount
  useEffect(() => {
    const id = getClubIdFromToken()
    if (id) {
      setUserClubId(id)
    }
  }, [])

  useEffect(() => {
    const loadEventDetail = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const data = await getEventById(params.id as string)
        setEvent(data)
        
        // Check if current club is a co-host
        if (userClubId && data.coHostedClubs) {
          const myCoHost = data.coHostedClubs.find((club: any) => club.id === userClubId)
          if (myCoHost) {
            setMyCoHostStatus(myCoHost.coHostStatus)
          }
        }

        // Fetch wallet data
        try {
          setWalletLoading(true)
          const walletData = await getEventWallet(params.id as string)
          setWallet(walletData)
        } catch (walletError) {
          console.error("Failed to load wallet:", walletError)
          // Don't show error toast for wallet, it's not critical
        } finally {
          setWalletLoading(false)
        }

        // Fetch event summary if APPROVED
        if (data.status === "APPROVED") {
          try {
            setSummaryLoading(true)
            const summaryData = await getEventSummary(params.id as string)
            setEventSummary(summaryData)
          } catch (summaryError) {
            console.error("Failed to load event summary:", summaryError)
            // Don't show error toast for summary, it's not critical
          } finally {
            setSummaryLoading(false)
          }
        }
      } catch (error) {
        console.error("Failed to load event detail:", error)
        toast({
          title: "Error",
          description: "Failed to load event details",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadEventDetail()
  }, [params.id, userClubId, toast])

  // QR rotation logic
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
      if (event?.id) {
        try {
          const { token } = await generateCode(event.id)
          console.log('Rotating QR - Generated new token:', token)

          // Create URLs with token (path parameter format)
          const prodUrl = `https://uniclub-fpt.vercel.app/student/checkin/${token}`
          const localUrl = `http://localhost:3000/student/checkin/${token}`

          const styleVariants = [
            { color: { dark: '#000000', light: '#FFFFFF' }, margin: 1 },
            { color: { dark: '#111111', light: '#FFFFFF' }, margin: 2 },
            { color: { dark: '#222222', light: '#FFFFFF' }, margin: 0 },
          ]

          // Generate QR variants for local
          const localQrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) => {
            const opts = styleVariants[i % styleVariants.length]
            return QRCode.toDataURL(localUrl, opts as any)
          })
          const localQrVariants = await Promise.all(localQrVariantsPromises)

          // Generate QR variants for production
          const prodQrVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) => {
            const opts = styleVariants[i % styleVariants.length]
            return QRCode.toDataURL(prodUrl, opts as any)
          })
          const prodQrVariants = await Promise.all(prodQrVariantsPromises)

          setQrRotations({ local: localQrVariants, prod: prodQrVariants })
          setQrLinks({ local: localUrl, prod: prodUrl })
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
  }, [showQrModal, event])

  // Fade animation
  useEffect(() => {
    if (!showQrModal) return
    setIsFading(true)
    const t = setTimeout(() => {
      setDisplayedIndex(visibleIndex)
      setIsFading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [visibleIndex, showQrModal])

  // ✅New function to handle submission to university
  const handleSubmitToUniversity = async () => {
    if (!event) return

    setIsSubmitting(true)
    try {
      await submitForUniversityApproval(event.id)
      toast({
        title: "Success",
        description: "Event has been submitted to university staff for final approval."
      })
      // Cập nhật state cục bộ để UI phản ánh ngay lập tức
      setEvent(prev => prev ? { ...prev, status: "PENDING" } : null)
    } catch (error: any) {
      console.error("Failed to submit to university:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to submit event",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return (
          <Badge variant="secondary" className="bg-blue-900 text-white border-blue-900">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "WAITING_COCLUB_APPROVAL":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Waiting Co-Club Approval
          </Badge>
        )
      case "WAITING_UNISTAFF_APPROVAL":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Waiting Uni-Staff Approval
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "PUBLIC" ? "default" : "secondary"}>
        {type}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  // Check if the event is currently active (within date and time range)
  const isEventActive = () => {
    if (!event) return false

    // COMPLETED status means event has ended
    if (event.status === "COMPLETED") return false

    // Must be APPROVED
    if (event.status !== "APPROVED") return false

    // Check if date and endTime are present
    if (!event.date || !event.endTime) return false

    try {
      // Get current date/time
      const now = new Date()

      // Parse event date (format: YYYY-MM-DD)
      const eventDate = new Date(event.date)

      // Convert endTime to string if it's an object
      const endTimeStr = timeObjectToString(event.endTime)
      
      // Parse endTime (format: HH:MM:SS or HH:MM)
      const [hours, minutes] = endTimeStr.split(':').map(Number)

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

  // Helper function to reload event data
  const reloadEventData = async () => {
    try {
      console.log('🔄 Reloading event data...')
      const updatedEvent = await getEventById(params.id as string)
      setEvent(updatedEvent)
      
      // Update co-host status for current club
      if (userClubId && updatedEvent.coHostedClubs) {
        const myCoHost = updatedEvent.coHostedClubs.find((club: any) => club.id === userClubId)
        if (myCoHost) {
          setMyCoHostStatus(myCoHost.coHostStatus)
          console.log('✅ Co-host status updated:', myCoHost.coHostStatus)
        } else {
          setMyCoHostStatus(null)
        }
      }
      
      console.log('✅ Event data reloaded successfully')
    } catch (error) {
      console.error('❌ Failed to reload event data:', error)
      toast({
        title: 'Warning',
        description: 'Could not refresh event data. Please reload the page.',
        variant: 'destructive'
      })
    }
  }

  const handleAcceptCoHost = async () => {
    if (!event) return

    try {
      setIsAcceptingCoHost(true)
      const response = await acceptCoHostInvitation(event.id)
      
      // Show success message
      toast({
        title: 'Success',
        description: response.message || 'Co-host invitation accepted successfully',
      })
      
      // Reload event detail to get updated status immediately
      await reloadEventData()
      
    } catch (err: any) {
      console.error('Failed to accept co-host invitation', err)
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to accept co-host invitation',
        variant: 'destructive'
      })
    } finally {
      setIsAcceptingCoHost(false)
    }
  }

  const handleRejectCoHost = async () => {
    if (!event) return

    try {
      setIsRejectingCoHost(true)
      const response = await rejectCoHostInvitation(event.id)
      
      // Show rejection message
      toast({
        title: 'Rejected',
        description: response.message || 'Co-host invitation rejected',
        variant: 'destructive'
      })
      
      // Reload event detail to get updated status immediately
      await reloadEventData()
      
    } catch (err: any) {
      console.error('Failed to reject co-host invitation', err)
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to reject co-host invitation',
        variant: 'destructive'
      })
    } finally {
      setIsRejectingCoHost(false)
    }
  }

  const handleEndEvent = async () => {
    if (!event) return

    try {
      setIsEndingEvent(true)
      const response = await endEvent(event.id)
      
      // Show success message
      toast({
        title: 'Success',
        description: response.message || 'Event has been ended successfully',
      })
      
      // Reload the page to get updated event status
      window.location.reload()
      
    } catch (err: any) {
      console.error('Failed to end event', err)
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to end event',
        variant: 'destructive'
      })
      setIsEndingEvent(false)
    }
  }

  const handleGenerateQR = async () => {
    if (!event) return

    try {
      // Generate fresh token using the new API
      console.log('Generating check-in token for event:', event.id)
      const { token } = await generateCode(event.id)
      console.log('Generated token:', token)

      // Create URLs with token (path parameter format)
      const prodUrl = `https://uniclub-fpt.vercel.app/student/checkin/${token}`
      const localUrl = `http://localhost:3000/student/checkin/${token}`

      console.log('Production URL:', prodUrl)
      console.log('Development URL:', localUrl)

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

      // Set different URLs for local and production
      setQrRotations({ local: localQrVariants, prod: prodQrVariants })
      setQrLinks({ local: localUrl, prod: prodUrl })
      setVisibleIndex(0)
      setDisplayedIndex(0)
      setShowQrModal(true)

      toast({
        title: 'QR Code Generated',
        description: 'Check-in QR code has been generated successfully',
        duration: 3000
      })
    } catch (err: any) {
      console.error('Failed to generate QR', err)
      toast({
        title: 'QR Error',
        description: err?.message || 'Could not generate QR code',
        variant: 'destructive'
      })
    }
  }

  const handleDownloadQR = async (environment: 'local' | 'prod' | 'mobile') => {
    try {
      let qrDataUrl: string | undefined
      if (environment === 'local') {
        qrDataUrl = qrRotations.local[displayedIndex % qrRotations.local.length]
      } else if (environment === 'prod') {
        qrDataUrl = qrRotations.prod[displayedIndex % qrRotations.prod.length]
      } else {
        // mobile: construct QR image using public API (fallback)
        const token = event?.checkInCode || ''
        if (!token) {
          toast({ title: 'No token', description: 'Mobile token not available', variant: 'destructive' })
          return
        }
        const mobileLink = `exp://192.168.1.50:8081/--/student/checkin/${token}`
        qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=640x640&data=${encodeURIComponent(mobileLink)}`
      }

      if (!qrDataUrl) return

      const link = document.createElement('a')
      link.download = `qr-code-${event?.name?.replace(/[^a-zA-Z0-9]/g, '-')}-${environment}.png`
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
      if (!event?.id) {
        toast({ title: 'No event', description: 'Event not available', variant: 'destructive' })
        return
      }

      if (environment === 'mobile') {
        // Generate fresh token for mobile deep link
        const { token } = await generateCode(event.id)
        link = `exp://192.168.1.50:8081/--/student/checkin/${token}`
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

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <LoadingSkeleton className="h-96" />
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }
  // // ✅ TÍNH TOÁN TRẠNG THÁI CO-HOST
  // const coHosts = event.coHostedClubs || []
  // const pendingCoHosts = coHosts.filter(
  //   club => club.coHostStatus === "PENDING" // Giả sử status chờ là "PENDING"
  // ).length

  // const allCoHostsResponded = coHosts.length > 0 && pendingCoHosts === 0

  // const anyCoHostRejected = coHosts.some(
  //   club => club.coHostStatus === "REJECTED"
  // )

  if (!event) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Event Not Found</h3>
                <p className="text-muted-foreground">The event you're looking for doesn't exist.</p>
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // ✅ TÍNH TOÁN TRẠNG THÁI CO-HOST
  const coHosts = event.coHostedClubs || []
  const pendingCoHosts = coHosts.filter(
    club => club.coHostStatus === "PENDING" // Giả sử status chờ là "PENDING"
  ).length

  const allCoHostsResponded = coHosts.length > 0 && pendingCoHosts === 0

  const anyCoHostRejected = coHosts.some(
    club => club.coHostStatus === "REJECTED"
  )

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
            </div>
            <div className="flex items-center gap-3">
              {/* Show Accept and Reject buttons if this club is a co-host with PENDING status */}
              {myCoHostStatus === "PENDING" && (
                <>
                  <Button
                    onClick={handleAcceptCoHost}
                    disabled={isAcceptingCoHost || isRejectingCoHost}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isAcceptingCoHost ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRejectCoHost}
                    disabled={isAcceptingCoHost || isRejectingCoHost}
                    variant="destructive"
                  >
                    {isRejectingCoHost ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </>
              )}
              {/* Show End Event button only when status is APPROVED */}
              {event.status === "APPROVED" && (
                <Button
                  onClick={handleEndEvent}
                  disabled={isEndingEvent}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isEndingEvent ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ending Event...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      End Event
                    </>
                  )}
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Event Details</span>
              </div>
            </div>
          </div>

          {/* Event Detail Card */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">{event.name}</CardTitle>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(event.status)}
                    {getTypeBadge(event.type)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Event ID</div>
                  <div className="font-mono text-lg font-semibold">#{event.id}</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Description */}
              {event.description && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                </div>
              )}

              <Separator />

              {/* Event Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date & Time */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Date & Time</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{formatDate(event.date)}</div>
                        <div className="text-sm text-muted-foreground">{event.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">
                          {event.startTime && event.endTime
                            ? `${timeObjectToString(event.startTime)} - ${timeObjectToString(event.endTime)}`
                            : event.time || "Time not set"}
                        </div>
                        <div className="text-sm text-muted-foreground">Event Duration</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location & Club */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Location & Organization</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{event.locationName}</div>
                        <div className="text-sm text-muted-foreground">Event Venue</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{event.hostClub.name}</div>
                        <div className="text-sm text-muted-foreground">Organizing Club</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Co-hosted Clubs */}
              {event.coHostedClubs && event.coHostedClubs.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Co-hosting Clubs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {event.coHostedClubs.map((club) => (
                      <div key={club.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">{club.name}</div>
                            <div className="text-sm text-muted-foreground">Club ID: {club.id}</div>
                          </div>
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

              {/* Check-in Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Check-in Information</h3>

                {/* Check-in Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Max Capacity</div>
                    <div className="font-semibold text-lg">{event.maxCheckInCount} people</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Current Check-ins</div>
                    <div className="font-semibold text-lg">
                      {event.status === "APPROVED" ? (
                        summaryLoading ? (
                          <span className="text-muted-foreground">Loading...</span>
                        ) : eventSummary ? (
                          `${eventSummary.checkedInCount} / ${event.maxCheckInCount}`
                        ) : (
                          `${event.currentCheckInCount} / ${event.maxCheckInCount}`
                        )
                      ) : (
                        `${event.currentCheckInCount} / ${event.maxCheckInCount}`
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Available Spots</div>
                    <div className="font-semibold text-lg">
                      {event.status === "APPROVED" && eventSummary
                        ? `${event.maxCheckInCount - eventSummary.checkedInCount} remaining`
                        : `${event.maxCheckInCount - event.currentCheckInCount} remaining`}
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="text-sm text-green-700 font-medium">
                      {event.status === "APPROVED" ? "Wallet Balance" : "Budget Points"}
                    </div>
                    <div className="font-semibold text-lg text-green-800">
                      {event.status === "APPROVED" ? (
                        walletLoading ? (
                          <span className="text-muted-foreground">Loading...</span>
                        ) : wallet ? (
                          `${wallet.walletBalance} points`
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )
                      ) : (
                        `${event.budgetPoints || 0} points`
                      )}
                    </div>
                  </div>
                </div>

                {/* Event Summary - Only shown when APPROVED */}
                {event.status === "APPROVED" && eventSummary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-700 font-medium">Total Registrations</div>
                      <div className="font-semibold text-lg text-blue-800">
                        {summaryLoading ? (
                          <span className="text-muted-foreground">Loading...</span>
                        ) : (
                          `${eventSummary.registrationsCount} registered`
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                      <div className="text-sm text-amber-700 font-medium">Refunded</div>
                      <div className="font-semibold text-lg text-amber-800">
                        {summaryLoading ? (
                          <span className="text-muted-foreground">Loading...</span>
                        ) : (
                          `${eventSummary.refundedCount} refunds`
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code Generation Button - Only show if APPROVED and event is still active */}
                {isEventActive() && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-900">QR Code Access</div>
                        <div className="text-sm text-blue-700">Generate scannable QR codes for easy check-in</div>
                      </div>
                      <Button
                        onClick={handleGenerateQR}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR Code
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status message for non-active events */}
                {!isEventActive() && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-yellow-800">QR Code Unavailable</div>
                        <div className="text-sm text-yellow-700">
                          {event.status !== "APPROVED"
                            ? `QR codes are only available for approved events. Current status: ${event.status}`
                            : "This event has ended or is missing date/time information. QR codes are no longer available."
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ THÊM KHU VỰC UNIVERSITY APPROVAL MỚI */}
              {event.status === "WAITING" && ( // Chỉ hiển thị khi event đang chờ co-host
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">University Approval Status</h3>

                    {!allCoHostsResponded && (
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-yellow-800">Waiting for Co-hosts</div>
                          <div className="text-sm text-yellow-700">
                            Waiting for {pendingCoHosts} co-host(s) to respond before submitting to the university.
                          </div>
                        </div>
                      </div>
                    )}

                    {allCoHostsResponded && anyCoHostRejected && (
                      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-red-800">Co-host Rejected</div>
                          <div className="text-sm text-red-700">
                            At least one co-host has rejected this event. It cannot be submitted to the university.
                          </div>
                        </div>
                      </div>
                    )}

                    {allCoHostsResponded && !anyCoHostRejected && (
                      <div className="flex items-center justify-between gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <div className="font-medium text-green-800">Ready for Submission</div>
                          <div className="text-sm text-green-700">
                            All co-hosts have approved. You can now send this event for university approval.
                          </div>
                        </div>
                        <Button
                          onClick={handleSubmitToUniversity}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit to University"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
              {/* ✅ KẾT THÚC KHU VỰC MỚI */}
            </CardContent>
          </Card>
        </div>

        <QRModal
          open={showQrModal}
          onOpenChange={setShowQrModal}
          eventName={event?.name ?? ''}
          checkInCode={event?.checkInCode ?? ''}
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
      </AppShell>
    </ProtectedRoute>
  )
}