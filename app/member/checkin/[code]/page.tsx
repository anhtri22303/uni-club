"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Calendar, MapPin, Users, Trophy, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getEventByCode } from '@/service/eventApi'

export default function MemberCheckinByCodePage() {
  const { auth } = useAuth()
  const { clubMemberships } = useData()
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const [checkedInEvents, setCheckedInEvents] = useState<string[]>([])
  const [tokenState, setTokenState] = useState<{ valid: boolean; reason?: string; eventId?: string } | null>(null)

  // read route param produced by the [code] folder
  const checkInCode = (params as any)?.code || (params as any)?.checkInCode || null

  // helpful debug when things don't run
  useEffect(() => {
    console.debug('MemberCheckinByCode params:', params, 'resolved checkInCode:', checkInCode)
  }, [params, checkInCode])

  const [eventData, setEventData] = useState<any | null>(null)

  useEffect(() => {
    if (!checkInCode) return
    ;(async () => {
      try {
        if (typeof checkInCode === "string") {
          const ev = await getEventByCode(checkInCode)
          setEventData(ev)
          setTokenState({ valid: true, eventId: String(ev?.id ?? "") })
        }
      } catch (err) {
        console.warn("Failed to fetch event by code", err)
        setEventData(null)
        setTokenState({ valid: false, reason: "not_found" })
      }
    })()
  }, [checkInCode])

  const handleCheckin = (_event: any) => {
    // Notify user that the check-in action is not yet available
    toast({ title: "Coming soon", description: "Checkin button available soon", duration: 3000 })
    return
  }

  return (
    <ProtectedRoute allowedRoles={["member"]}>
      <AppShell>
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-balance leading-tight">Event Check-in</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Check in to events</p>
          </div>

          {tokenState && !tokenState.valid && (
            <div className="p-3 rounded-md bg-red-50 text-red-700">This QR code is invalid or expired. Please request a new QR from the event organizer.</div>
          )}

          {/* Event details and check-in */}
          {tokenState && tokenState.valid ? (
            eventData ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{eventData.name || eventData.title}</CardTitle>
                  <CardDescription>{eventData.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(eventData.date).toLocaleDateString()} • {eventData.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{eventData.locationId ? `Room ${eventData.locationId}` : eventData.location || 'Event location'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                      <span>{eventData.points ?? eventData.points ?? 0} points</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button onClick={() => handleCheckin({ id: eventData.id, points: eventData.points ?? 0 })}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Check In
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground">Fetching event information...</p>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent>
                <p className="text-muted-foreground">Waiting for a valid QR code...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
