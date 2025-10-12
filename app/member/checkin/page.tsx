"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Calendar, MapPin, Users, Trophy, Clock, QrCode } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getEventByCode } from '@/service/eventApi'

// Removed static `src/data` imports — use empty fallbacks. Replace with API/context in future if needed.
const clubs: any[] = []
const events: any[] = []

export default function MemberCheckinPage() {
  const { auth } = useAuth()
  const { clubMemberships } = useData()
  const { toast } = useToast()
  const router = useRouter()
  const [checkedInEvents, setCheckedInEvents] = useState<string[]>([])
  const [tokenState, setTokenState] = useState<{ valid: boolean; reason?: string; eventId?: string } | null>(null)
  const [eventData, setEventData] = useState<any | null>(null)
  const [checkInCode, setCheckInCode] = useState<string>("")

  // Get user's club memberships
  const userClubMemberships = clubMemberships.filter(
    (m) => m.userId === auth.userId && m.status === "APPROVED"
  )
  const userClubIds = userClubMemberships.map((m) => m.clubId)

  // Today (YYYY-MM-DD)
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]

  // Static events for today
  const defaultClubId = userClubIds[0] ?? "c-ai"

  const staticEvents = [
    {
      id: "e-ai-workshop-today",
      clubId: defaultClubId,
      title: "AI Workshop: Introduction to Machine Learning",
      date: todayStr,
      time: "14:00",
      location: "Lab A101",
      description: "Hands-on workshop covering basic ML concepts and practical implementation",
      points: 75,
    },
    {
      id: "e-design-meetup-today",
      clubId: defaultClubId,
      title: "Design Meetup: UI/UX Crash Course",
      date: todayStr,
      time: "16:30",
      location: "Room B204",
      description: "Rapid intro to user flows, wireframes and design systems for beginners",
      points: 50,
    },
  ]

  const allEvents = [...events, ...staticEvents]

  const availableEvents = allEvents.filter((event) => {
    const eventDate = new Date(event.date).toISOString().split("T")[0]
    return eventDate === todayStr && userClubIds.includes(event.clubId)
  })

  const handleCheckin = (event: (typeof allEvents)[0]) => {
    if (tokenState && !tokenState.valid) {
      toast({ title: "Invalid QR", description: "This QR code is expired or invalid.", variant: "destructive" })
      return
    }

    if (checkedInEvents.includes(event.id)) {
      toast({
        title: "Already Checked In",
        description: "You have already checked in to this event",
        variant: "destructive",
      })
      return
    }

    setCheckedInEvents((prev) => [...prev, event.id])

    toast({
      title: "Đã checkin thành công!",
      description: `+ ${event.points} points`,
      duration: 3000,
    })
  }

  const handleCheckInSubmit = () => {
    if (!checkInCode.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã check-in",
        variant: "destructive"
      })
      return
    }

    // Navigate to the dynamic route with the code
    router.push(`/member/checkin/${checkInCode.trim()}`)
  }

  // Handle URL params: prefer ?code=... (fetch events and match by checkInCode).
  // Fallback: ?token=... (legacy short-lived token validation).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const token = params.get('token')

    if (code) {
      ;(async () => {
        try {
          const ev = await getEventByCode(code)
          if (ev) {
            setEventData(ev)
            setTokenState({ valid: true, eventId: String(ev.id) })
          } else {
            try { window.location.href = '/member/checkin/invalid' } catch {}
            setTokenState({ valid: false, reason: 'not_found' })
          }
        } catch (err) {
          console.error('Failed to fetch event by code', err)
          try { window.location.href = '/member/checkin/invalid' } catch {}
          setTokenState({ valid: false, reason: 'error' })
        }
      })()
      return
    }

    if (!token) {
      setTokenState(null)
      return
    }

    ;(async () => {
      try {
        const res = await fetch('/api/checkin/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const json = await res.json()
        if (json?.success) {
          setTokenState({ valid: true, eventId: json.eventId })
        } else {
          // redirect to invalid page
          try { window.location.href = '/member/checkin/invalid' } catch {}
          setTokenState({ valid: false, reason: json.reason || json.message })
        }
      } catch (err) {
        try { window.location.href = '/member/checkin/invalid' } catch {}
        setTokenState({ valid: false, reason: 'error' })
      }
    })()
  }, [])

  return (
  <ProtectedRoute allowedRoles={["member"]}>
      <AppShell>
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-balance leading-tight">
              Event Check-in
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Check in to today's events and earn points
            </p>
          </div>

          {tokenState && !tokenState.valid && (
            <div className="p-3 rounded-md bg-red-50 text-red-700">
              This QR code is invalid or expired. Please request a new QR from the event organizer.
            </div>
          )}

          {availableEvents.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <QrCode className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nhập mã Check-in</h3>
                <p className="text-muted-foreground mb-6">
                  Nhập mã check-in từ sự kiện để tham gia
                </p>
                <div className="max-w-md mx-auto space-y-4">
                  <Input
                    type="text"
                    placeholder="Nhập mã check-in..."
                    value={checkInCode}
                    onChange={(e) => setCheckInCode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCheckInSubmit()
                      }
                    }}
                    className="text-center text-lg py-3"
                  />
                  <Button
                    onClick={handleCheckInSubmit}
                    className="w-full py-3 text-lg font-semibold bg-primary hover:bg-primary/90"
                    disabled={!checkInCode.trim()}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Tham gia sự kiện
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {availableEvents.map((event) => {
                const club = clubs.find((c) => c.id === event.clubId)
                const isCheckedIn = checkedInEvents.includes(event.id)

                return (
                  <Card
                    key={event.id}
                    className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      isCheckedIn
                        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                        : "hover:scale-[1.02]"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                    <CardHeader className="relative pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl font-bold flex items-center gap-2">
                            {isCheckedIn && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                            {event.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{club?.name ?? event.clubId}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                          </CardDescription>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-gradient-to-r from-primary to-accent text-white border-0 px-4 py-2 text-sm"
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          {event.points} pts
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="relative pt-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-6 text-base text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            <span>{event.time ? `Starts ${event.time}` : "Available now"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            <span>{event.location ?? "Event location"}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleCheckin(event)}
                          disabled={isCheckedIn}
                          className={`text-lg font-semibold rounded-xl py-3 px-6 min-w-[140px] ${
                            isCheckedIn
                              ? "bg-green-600 hover:bg-green-600 cursor-default"
                              : "bg-primary hover:bg-primary/90"
                          }`}
                        >
                          {isCheckedIn ? (
                            <>
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Checked In
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Check In
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 mt-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
                <Trophy className="h-6 w-6" />
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="py-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700">
                    {checkedInEvents.length}
                  </div>
                  <div className="text-base text-blue-700 font-medium">Events Checked In</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700">
                    {checkedInEvents.reduce((total, eventId) => {
                      const ev = allEvents.find((e) => e.id === eventId)
                      return total + (ev?.points || 0)
                    }, 0)}
                  </div>
                  <div className="text-base text-blue-700 font-medium">Points Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
