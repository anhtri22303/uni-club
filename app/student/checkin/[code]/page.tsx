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
          console.log('Event fetched successfully:', ev)
        }
      } catch (err: any) {
        console.warn("Failed to fetch event by code", err)
        setEventData(null)
        
        // More specific error handling
        if (err?.response?.status === 404) {
          setTokenState({ valid: false, reason: "not_found" })
        } else if (err?.response?.status === 500) {
          setTokenState({ valid: false, reason: "server_error" })
        } else {
          setTokenState({ valid: false, reason: "unknown_error" })
        }
      }
    })()
  }, [checkInCode])

  const handleCheckin = (event: any) => {
    // Notify user that the check-in action is not yet available
    toast({ 
      title: "Check-in Coming Soon", 
      description: `Check-in functionality for event "${event.name}" will be updated soon.`,
      duration: 3000 
    })
    console.log('Check-in attempt for event:', event)
    return
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-2">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-extrabold text-center mb-2 text-primary">Event Check-in</h1>
            <p className="text-base text-center text-muted-foreground mb-6">Confirm event participation with QR code</p>

            {tokenState && !tokenState.valid && (
              <div className="p-4 rounded-lg bg-red-50 text-red-700 text-center shadow mb-4 border border-red-200">
                {tokenState.reason === "not_found" && (
                  <>QR code does not exist or has expired.<br />Please check the code again or contact the organizer.</>
                )}
                {tokenState.reason === "server_error" && (
                  <>Server error. Please try again later.<br />If the error persists, please contact technical support.</>
                )}
                {tokenState.reason === "unknown_error" && (
                  <>An error occurred while loading event information.<br />Please try again or contact the organizer.</>
                )}
              </div>
            )}

            {/* Event details and check-in */}
            {tokenState && tokenState.valid ? (
              eventData ? (
                <Card className="shadow-lg border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold text-primary text-center mb-1">
                      {eventData.name || eventData.title}
                    </CardTitle>
                    {eventData.description && (
                      <CardDescription className="text-center text-muted-foreground mb-2">
                        {eventData.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 mb-6">
                      <div className="flex items-center gap-2 text-base">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="font-medium">{new Date(eventData.date).toLocaleDateString('vi-VN')} <span className="mx-1">|</span> {eventData.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-base">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span className="font-medium">{eventData.locationId ? `Room ${eventData.locationId}` : eventData.location || 'Event Location'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-base">
                        <Users className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Type: {eventData.type === 'PUBLIC' ? 'Public' : 'Private'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-base">
                        <Badge 
                          variant={eventData.status === 'APPROVED' ? 'default' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          <span>Status: {eventData.status === 'APPROVED' ? 'Approved' : eventData.status}</span>
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="w-full py-6 text-lg font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-500 hover:from-blue-500 hover:to-primary transition"
                      onClick={() => handleCheckin({ 
                        id: eventData.id, 
                        name: eventData.name,
                        clubId: eventData.clubId,
                        checkInCode: eventData.checkInCode 
                      })}
                      disabled={eventData.status !== 'APPROVED'}
                    >
                      <CheckCircle className="h-6 w-6 mr-2" /> 
                      {eventData.status === 'APPROVED' ? 'Check In' : 'Event Not Approved'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow border border-gray-200">
                  <CardContent>
                    <div className="flex flex-col items-center py-8">
                      <Clock className="h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                      <p className="text-muted-foreground text-center">Loading event information...</p>
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="shadow border border-gray-200">
                <CardContent>
                  <div className="flex flex-col items-center py-8">
                    <Clock className="h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                    <p className="text-muted-foreground text-center">Please scan a valid QR code to display event information.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
