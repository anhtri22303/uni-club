"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, MapPin, Users, CheckCircle, AlertCircle, XCircle, Eye, QrCode, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getEventById, timeObjectToString, getEventWallet, EventWallet, eventQR, getEventSummary, EventSummary, TimeObject } from "@/service/eventApi"
import QRCode from "qrcode"
import { AppShell } from "@/components/app-shell"
import { QRModal } from "@/components/qr-modal"
import { ProtectedRoute } from "@/contexts/protected-route"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { renderTypeBadge } from "@/lib/eventUtils"
import { PhaseSelectionModal } from "@/components/phase-selection-modal"

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

export default function AdminEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCheckInCode, setShowCheckInCode] = useState(false)
  const [wallet, setWallet] = useState<EventWallet | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Phase selection modal state
  const [showPhaseModal, setShowPhaseModal] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

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

  useEffect(() => {
    const loadEventDetail = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const data = await getEventById(params.id as string)
        setEvent(data)

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
  }, [params.id, toast])

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
      toast({ title: 'Download failed', description: 'Could not download QR code', variant: 'destructive' })
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
      toast({ title: 'Copy failed', description: 'Could not copy link to clipboard', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
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

  if (!event) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
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

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
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
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Admin: Event Details</span>
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
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin View
                    </Badge>
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
                        <div className="text-sm text-muted-foreground">Organizing Club (ID: {event.hostClub.id})</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Admin Check-in Information */}
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
                          `${eventSummary.registrationsCount} / ${event.maxCheckInCount}`
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
                    <div className="text-sm text-green-700 font-medium">
                      Budget Points
                    </div>
                    <div className="font-semibold text-lg text-green-800">
                      {event.budgetPoints || 0} points
                    </div>
                  </div>
                </div>

                {/* Event Summary - Only shown when APPROVED, ONGOING or COMPLETED */}
                {(event.status === "APPROVED" || event.status === "ONGOING" || event.status === "COMPLETED") && eventSummary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                      <div className="text-sm text-purple-700 font-medium">Total Commit Points</div>
                      <div className="font-semibold text-lg text-purple-800">
                        {summaryLoading ? (
                          <span className="text-muted-foreground">Loading...</span>
                        ) : (
                          `${eventSummary.totalCommitPoints} points`
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium text-blue-900">Check-in Code</div>
                      <div className="text-sm text-blue-700">Administrative access to event check-in code</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-xl font-bold text-blue-800 bg-white px-4 py-2 rounded-md border min-w-[120px] text-center">
                        {showCheckInCode ? event.checkInCode : "••••••••"}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCheckInCode((v) => !v)}
                        className="ml-2"
                      >
                        {showCheckInCode ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </div>
                  
                  {/* QR Code Generation Button - Admin can generate for APPROVED or ONGOING events */}
                  {(event.status === "APPROVED" || event.status === "ONGOING") && (
                    <div className="border-t border-blue-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-blue-900">QR Code Access</div>
                          <div className="text-sm text-blue-700">
                            Generate scannable QR codes for easy check-in
                          </div>
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
                  
                  {/* Status message for non-ongoing events */}
                  {event.status !== "ONGOING" && (
                    <div className="border-t border-blue-200 pt-4">
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-yellow-800">QR Code Unavailable</div>
                            <div className="text-sm text-yellow-700">
                              QR codes are only available for ongoing events. Current status: {event.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Co-hosted Clubs */}
              {event.coHostedClubs && event.coHostedClubs.length > 0 && (
                <>
                  <Separator />
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
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <PhaseSelectionModal
          open={showPhaseModal}
          onOpenChange={setShowPhaseModal}
          onConfirm={handlePhaseConfirm}
          isLoading={isGeneratingQR}
        />

        {event && (
          <QRModal
            open={showQrModal}
            onOpenChange={setShowQrModal}
            eventName={event.name ?? ''}
            checkInCode={event.checkInCode ?? ''}
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
      </AppShell>
    </ProtectedRoute>
  )
}
