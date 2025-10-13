"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, MapPin, Users, CheckCircle, AlertCircle, XCircle, Eye, QrCode, Maximize2, Minimize2, Copy, Download, RotateCcw, Monitor, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getEventById } from "@/service/eventApi"
import { Modal } from "@/components/modal"
import QRCode from "qrcode"
import { AppShell } from "@/components/app-shell"
import { QRModal } from "@/components/qr-modal"
import { ProtectedRoute } from "@/contexts/protected-route"
import { LoadingSkeleton } from "@/components/loading-skeleton"

interface EventDetail {
  id: number
  clubId: number
  name: string
  description: string
  type: string
  date: string
  time: string
  status: string
  locationId: number
  checkInCode: string
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCheckInCode, setShowCheckInCode] = useState(false)

  // QR Code states
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrLinks, setQrLinks] = useState<{ local?: string; prod?: string }>({})
  const [qrRotations, setQrRotations] = useState<{ local: string[]; prod: string[] }>({ local: [], prod: [] })
  const [visibleIndex, setVisibleIndex] = useState(0)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeEnvironment, setActiveEnvironment] = useState<'local' | 'prod'>('prod')
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

    const rotId = setInterval(() => {
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
  }, [showQrModal])

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
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
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

  const handleGenerateQR = async () => {
    if (!event) return

    try {
      // Use persistent checkInCode from event
      let code: string | null = event.checkInCode || null

      // If no persistent code, try to fetch or generate one
      if (!code) {
        try {
          const serverEvent = await getEventById(String(event.id))
          if (serverEvent?.checkInCode) {
            code = serverEvent.checkInCode
          }
        } catch (e) {
          // Fallback: generate short-lived token
        }
      }

      // If still no code, mint a token
      if (!code) {
        try {
          const tokenResp = await fetch('/api/checkin/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId: event.id })
          })
          const tokenData = await tokenResp.json()
          if (tokenData?.token) code = tokenData.token
        } catch (e) {
          toast({ title: 'QR Error', description: 'Could not generate check-in code', variant: 'destructive' })
          return
        }
      }

      // Build URLs
      const localUrl = `http://localhost:3000/student/checkin/${encodeURIComponent(String(code))}`
      const prodUrl = `https://uniclub-fpt.vercel.app/student/checkin/${encodeURIComponent(String(code))}`

      // Generate QR variants
      const styleVariants = [
        { color: { dark: '#000000', light: '#FFFFFF' }, margin: 1 },
        { color: { dark: '#111111', light: '#FFFFFF' }, margin: 2 },
        { color: { dark: '#222222', light: '#FFFFFF' }, margin: 0 },
      ]

      const localVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) => 
        QRCode.toDataURL(localUrl, styleVariants[i % styleVariants.length])
      )
      const prodVariantsPromises = Array.from({ length: VARIANTS }).map((_, i) => 
        QRCode.toDataURL(prodUrl, styleVariants[i % styleVariants.length])
      )

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
  }

  const handleDownloadQR = async (environment: 'local' | 'prod') => {
    try {
      const qrDataUrl = environment === 'local' 
        ? qrRotations.local[displayedIndex % qrRotations.local.length]
        : qrRotations.prod[displayedIndex % qrRotations.prod.length]
      
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
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Event Details</span>
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
                        <div className="font-medium">{formatTime(event.time)}</div>
                        <div className="text-sm text-muted-foreground">Start Time</div>
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
                        <div className="font-medium">Location ID: {event.locationId}</div>
                        <div className="text-sm text-muted-foreground">Event Venue</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Club ID: {event.clubId}</div>
                        <div className="text-sm text-muted-foreground">Organizing Club</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Check-in Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Check-in Information</h3>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium text-blue-900">Check-in Code</div>
                      <div className="text-sm text-blue-700">Use this code for event attendance</div>
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
                        {showCheckInCode ? "Ẩn" : "Hiện"}
                      </Button>
                    </div>
                  </div>
                  
                  {/* QR Code Generation Button - Only show if APPROVED */}
                  {event.status === "APPROVED" && (
                    <div className="border-t border-blue-200 pt-4">
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
                  
                  {/* Status message for non-approved events */}
                  {event.status !== "APPROVED" && (
                    <div className="border-t border-blue-200 pt-4">
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-yellow-800">QR Code Unavailable</div>
                          <div className="text-sm text-yellow-700">
                            QR codes are only available for approved events. Current status: {event.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ...existing code... */}
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