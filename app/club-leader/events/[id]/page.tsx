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
import { Modal } from "@/components/modal"
import QRCode from "qrcode"
import { AppShell } from "@/components/app-shell"
import { QRModal } from "@/components/qr-modal"
import { ProtectedRoute } from "@/contexts/protected-route"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { PhaseSelectionModal } from "@/components/phase-selection-modal"
import { renderTypeBadge } from "@/lib/eventUtils"

import { getEventById, submitForUniversityApproval, timeObjectToString, coHostRespond, TimeObject, getEventSummary, EventSummary, completeEvent, eventQR, eventTimeExtend } from "@/service/eventApi" // 👈 Thêm submitForUniversityApproval, eventQR và eventTimeExtend
import { EventWalletHistoryModal } from "@/components/event-wallet-history-modal"
import { getClubIdFromToken } from "@/service/clubApi"
import { Loader2, Star, Filter, ClockIcon } from "lucide-react" // 👈 Thêm Loader2, Star, Filter, ClockIcon
import { getFeedback, Feedback } from "@/service/feedbackApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { TimeExtensionModal } from "@/components/time-extension-modal"
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
  const [showWalletHistoryModal, setShowWalletHistoryModal] = useState(false)
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // 👈 THÊM STATE NÀY
  const [isAcceptingCoHost, setIsAcceptingCoHost] = useState(false) // State for accepting co-host
  const [isRejectingCoHost, setIsRejectingCoHost] = useState(false) // State for rejecting co-host
  const [isEndingEvent, setIsEndingEvent] = useState(false) // State for ending event
  const [userClubId, setUserClubId] = useState<number | null>(null)
  const [myCoHostStatus, setMyCoHostStatus] = useState<string | null>(null)
  
  // Feedback states
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const FEEDBACKS_PER_PAGE = 5

  // Phase selection modal state
  const [showPhaseModal, setShowPhaseModal] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  // Time extension modal state
  const [showTimeExtensionModal, setShowTimeExtensionModal] = useState(false)
  const [isExtendingTime, setIsExtendingTime] = useState(false)

  // QR Code states
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrLinks, setQrLinks] = useState<{ local?: string; prod?: string; mobile?: string }>({})
  const [qrRotations, setQrRotations] = useState<{ local: string[]; prod: string[]; mobile?: string[] }>({ local: [], prod: [] })
  const [visibleIndex, setVisibleIndex] = useState(0)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeEnvironment, setActiveEnvironment] = useState<'local' | 'prod' | 'mobile'>('prod')
  const [selectedPhase, setSelectedPhase] = useState<string>('')
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

        // Fetch event summary if APPROVED, ONGOING or COMPLETED
        if (data.status === "APPROVED" || data.status === "ONGOING" || data.status === "COMPLETED") {
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

        // Fetch feedback for COMPLETED events
        if (data.status === "APPROVED" || data.status === "ONGOING" || data.status === "COMPLETED") {
          try {
            setFeedbackLoading(true)
            const feedbackData = await getFeedback(params.id as string)
            setFeedbacks(feedbackData)
          } catch (feedbackError) {
            console.error("Failed to load feedback:", feedbackError)
            // Don't show error toast for feedback, it's not critical
          } finally {
            setFeedbackLoading(false)
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

    // Regenerate QR codes every 30 seconds by calling the API
    const regenerateQR = async () => {
      if (!event?.id || !selectedPhase) return

      try {
        console.log('Regenerating QR code for event:', event.id, 'with phase:', selectedPhase)
        const { token } = await eventQR(event.id, selectedPhase)
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
  }, [showQrModal, event, selectedPhase])

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
      case "ONGOING":
        return (
          <Badge variant="default" className="bg-purple-600 text-white border-purple-600">
            <Clock className="h-3 w-3 mr-1" />
            Ongoing
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "PENDING_COCLUB":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending Co-Club Approval
          </Badge>
        )
      case "PENDING_UNISTAFF":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending Uni-Staff Approval
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

  const getTypeBadge = (type: string) => renderTypeBadge(type)

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

  // Helper function to render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  // Filter feedbacks by rating
  const filteredFeedbacks = ratingFilter === "all" 
    ? feedbacks 
    : feedbacks.filter(fb => fb.rating === parseInt(ratingFilter))

  // Calculate average rating
  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1)
    : "0.0"

  // Count feedbacks by rating
  const ratingCounts = {
    5: feedbacks.filter(fb => fb.rating === 5).length,
    4: feedbacks.filter(fb => fb.rating === 4).length,
    3: feedbacks.filter(fb => fb.rating === 3).length,
    2: feedbacks.filter(fb => fb.rating === 2).length,
    1: feedbacks.filter(fb => fb.rating === 1).length,
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredFeedbacks.length / FEEDBACKS_PER_PAGE)
  const startIndex = (currentPage - 1) * FEEDBACKS_PER_PAGE
  const endIndex = startIndex + FEEDBACKS_PER_PAGE
  const paginatedFeedbacks = filteredFeedbacks.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [ratingFilter])

  // Check if the event is currently active (within date and time range)
  const isEventActive = () => {
    if (!event) return false

    // COMPLETED status means event has ended
    if (event.status === "COMPLETED") return false

    // Must be ONGOING
    if (event.status !== "ONGOING") return false

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
      const response = await coHostRespond(event.id, true) // accept=true
      
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
      const response = await coHostRespond(event.id, false) // accept=false
      
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
      const response = await completeEvent(event.id)
      
      // Show success message
      toast({
        title: 'Success',
        description: response.message || 'Event has been completed successfully',
      })
      
      // Reload the page to get updated event status
      window.location.reload()
      
    } catch (err: any) {
      console.error('Failed to complete event', err)
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to complete event',
        variant: 'destructive'
      })
      setIsEndingEvent(false)
    }
  }

  const handleExtendTime = async (newDate: string, newStartTime: string, newEndTime: string, reason: string) => {
    if (!event) return

    try {
      setIsExtendingTime(true)
      const response = await eventTimeExtend(event.id, {
        newDate,
        newStartTime,
        newEndTime,
        reason
      })
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Event time has been extended successfully',
      })
      
      // Close modal
      setShowTimeExtensionModal(false)
      
      // Reload the page to get updated event data
      window.location.reload()
      
    } catch (err: any) {
      console.error('Failed to extend event time', err)
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to extend event time',
        variant: 'destructive'
      })
      setIsExtendingTime(false)
      throw err // Re-throw to prevent modal from closing
    }
  }

  const handleGenerateQR = () => {
    // Open phase selection modal
    setShowPhaseModal(true)
  }

  const handlePhaseConfirm = async (phase: string) => {
    if (!event) return

    try {
      setIsGeneratingQR(true)
      
      // Call new eventQR API with selected phase
      console.log('Generating check-in token for event:', event.id, 'with phase:', phase)
      const { token, expiresIn } = await eventQR(event.id, phase)
      console.log('Generated token:', token, 'expires in:', expiresIn)

      // Create URLs with token and phase (path parameter format)
      const prodUrl = `https://uniclub-fpt.vercel.app/student/checkin/${phase}/${token}`
      const localUrl = `http://localhost:3000/student/checkin/${phase}/${token}`
      const mobileLink = `exp://192.168.1.50:8081/--/student/checkin/${phase}/${token}`

      console.log('Production URL:', prodUrl)
      console.log('Development URL:', localUrl)
      console.log('Mobile URL:', mobileLink)

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

      // Set different URLs for local, production, and mobile
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

  const handleDownloadQR = async (environment: 'local' | 'prod' | 'mobile') => {
    try {
      let qrDataUrl: string | undefined
      if (environment === 'local') {
        qrDataUrl = qrRotations.local[displayedIndex % qrRotations.local.length]
      } else if (environment === 'prod') {
        qrDataUrl = qrRotations.prod[displayedIndex % qrRotations.prod.length]
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
              {/* Show More Time and End Event buttons only when status is ONGOING */}
              {event.status === "ONGOING" && (
                <>
                  <Button
                    onClick={() => setShowTimeExtensionModal(true)}
                    disabled={isExtendingTime || isEndingEvent}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  >
                    {isExtendingTime ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extending...
                      </>
                    ) : (
                      <>
                        <ClockIcon className="h-4 w-4 mr-2" />
                        More Time
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleEndEvent}
                    disabled={isEndingEvent || isExtendingTime}
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
                </>
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
                      {(event.status === "APPROVED" || event.status === "ONGOING" || event.status === "COMPLETED") ? (
                        summaryLoading ? (
                          <span className="text-muted-foreground">Loading...</span>
                        ) : eventSummary ? (
                          `${eventSummary.checkedInCount} / ${eventSummary.registrationsCount}`
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
                      {(event.status === "APPROVED" || event.status === "ONGOING" || event.status === "COMPLETED") && eventSummary
                        ? `${event.maxCheckInCount - eventSummary.registrationsCount} remaining`
                        : `${event.maxCheckInCount - event.currentCheckInCount} remaining`}
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm text-green-700 font-medium">
                        Budget Points
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs text-green-700 hover:text-green-900 hover:bg-green-100"
                        onClick={() => setShowWalletHistoryModal(true)}
                      >
                        History
                      </Button>
                    </div>
                    <div className="font-semibold text-lg text-green-800">
                      {event.budgetPoints || 0} points
                    </div>
                  </div>
                </div>

                {/* Event Summary - Only shown when APPROVED, ONGOING or COMPLETED */}
                {(event.status === "APPROVED" || event.status === "ONGOING" || event.status === "COMPLETED") && eventSummary && (
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

                {/* QR Code Generation Button - Only show if ONGOING and event is still active */}
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
                          {event.status !== "ONGOING"
                            ? `QR codes are only available for ongoing events. Current status: ${event.status}`
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

          {/* Feedback Section - Show for APPROVED, ONGOING, COMPLETED */}
          {(event.status === "APPROVED" || event.status === "ONGOING" || event.status === "COMPLETED") && (
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Event Feedback</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      See what participants thought about this event
                    </p>
                  </div>
                  {feedbacks.length > 0 && (
                    <div className="text-center">
                      <div className="flex items-center gap-2">
                        <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                        <span className="text-3xl font-bold">{averageRating}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feedbacks.length} {feedbacks.length === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {feedbackLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading feedback...</span>
                  </div>
                ) : feedbacks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">No feedback available for this event yet.</div>
                  </div>
                ) : (
                  <>
                    {/* Rating Filter */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">Filter by rating:</span>
                        <Select value={ratingFilter} onValueChange={setRatingFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All ratings" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All ratings ({feedbacks.length})</SelectItem>
                            <SelectItem value="5">5 stars ({ratingCounts[5]})</SelectItem>
                            <SelectItem value="4">4 stars ({ratingCounts[4]})</SelectItem>
                            <SelectItem value="3">3 stars ({ratingCounts[3]})</SelectItem>
                            <SelectItem value="2">2 stars ({ratingCounts[2]})</SelectItem>
                            <SelectItem value="1">1 star ({ratingCounts[1]})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Showing {filteredFeedbacks.length} of {feedbacks.length} {feedbacks.length === 1 ? 'feedback' : 'feedbacks'}
                      </div>
                    </div>

                    <Separator />

                    {/* Feedback List */}
                    {filteredFeedbacks.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground">No feedback found for the selected rating.</div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {paginatedFeedbacks.map((feedback) => (
                            <div
                              key={feedback.feedbackId}
                              className="p-4 bg-muted/30 rounded-lg border border-muted hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <div className="font-medium">Member #{feedback.membershipId}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {new Date(feedback.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })}
                                    </div>
                                  </div>
                                </div>
                                {renderStars(feedback.rating)}
                              </div>
                              <p className="text-sm leading-relaxed pl-13">
                                {feedback.comment}
                              </p>
                              {feedback.updatedAt && (
                                <div className="text-xs text-muted-foreground mt-2 pl-13">
                                  Updated: {new Date(feedback.updatedAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric"
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                              Showing {startIndex + 1}-{Math.min(endIndex, filteredFeedbacks.length)} of {filteredFeedbacks.length}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                              </Button>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className="min-w-[40px]"
                                  >
                                    {page}
                                  </Button>
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                              >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <PhaseSelectionModal
          open={showPhaseModal}
          onOpenChange={setShowPhaseModal}
          onConfirm={handlePhaseConfirm}
          isLoading={isGeneratingQR}
        />

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

        {/* Wallet History Modal */}
        {event && (
          <EventWalletHistoryModal
            open={showWalletHistoryModal}
            onOpenChange={setShowWalletHistoryModal}
            eventId={String(event.id)}
          />
        )}

        {/* Time Extension Modal */}
        {event && (
          <TimeExtensionModal
            open={showTimeExtensionModal}
            onOpenChange={setShowTimeExtensionModal}
            onSubmit={handleExtendTime}
            currentDate={event.date}
            currentStartTime={timeObjectToString(event.startTime)}
            currentEndTime={timeObjectToString(event.endTime)}
            eventName={event.name}
            isSubmitting={isExtendingTime}
          />
        )}
      </AppShell>
    </ProtectedRoute>
  )
}