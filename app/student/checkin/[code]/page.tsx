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
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-2">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-extrabold text-center mb-2 text-primary">Event Check-in</h1>
            <p className="text-base text-center text-muted-foreground mb-6">Xác nhận tham gia sự kiện bằng mã QR</p>

            {tokenState && !tokenState.valid && (
              <div className="p-4 rounded-lg bg-red-50 text-red-700 text-center shadow mb-4 border border-red-200">
                Mã QR không hợp lệ hoặc đã hết hạn.<br />Vui lòng liên hệ ban tổ chức để nhận mã mới.
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
                        <span className="font-medium">{new Date(eventData.date).toLocaleDateString()} <span className="mx-1">|</span> {eventData.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-base">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span className="font-medium">{eventData.locationId ? `Phòng ${eventData.locationId}` : eventData.location || 'Địa điểm sự kiện'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-base">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium">{eventData.points ?? 0} điểm thưởng</span>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="w-full py-6 text-lg font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-500 hover:from-blue-500 hover:to-primary transition"
                      onClick={() => handleCheckin({ id: eventData.id, points: eventData.points ?? 0 })}
                    >
                      <CheckCircle className="h-6 w-6 mr-2" /> Check In
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow border border-gray-200">
                  <CardContent>
                    <div className="flex flex-col items-center py-8">
                      <Clock className="h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                      <p className="text-muted-foreground text-center">Đang tải thông tin sự kiện...</p>
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="shadow border border-gray-200">
                <CardContent>
                  <div className="flex flex-col items-center py-8">
                    <Clock className="h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                    <p className="text-muted-foreground text-center">Vui lòng quét mã QR hợp lệ để hiển thị thông tin sự kiện.</p>
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
