"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Clock, Calendar, MapPin, Users, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getEventByCode, eventCheckinPublic } from '@/service/eventApi'

export default function StudentPublicCheckinPage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isCheckinLoading, setIsCheckinLoading] = useState(false)
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  // Get check-in code from URL
  const checkInCode = (params as any)?.checkInCode || null

  // Load event details when component mounts
  useEffect(() => {
    const loadEventDetail = async () => {
      if (!checkInCode) {
        toast({
          title: "Invalid Check-in Code",
          description: "Check-in code is missing from the URL",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      try {
        const eventData = await getEventByCode(checkInCode as string)
        setEvent(eventData)
      } catch (error: any) {
        console.error('Error loading event:', error)
        toast({
          title: "Event Not Found",
          description: error?.response?.data?.message || "Could not load event details",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadEventDetail()
  }, [checkInCode, toast])

  const handleCheckin = async () => {
    if (!checkInCode || typeof checkInCode !== 'string') {
      toast({ 
        title: "Invalid Check-in Code", 
        description: "Check-in code is missing or invalid",
        variant: "destructive"
      })
      return
    }

    if (isCheckinLoading || isCheckedIn) return

    setIsCheckinLoading(true)
    
    try {
      console.log('Starting public event check-in with code:', checkInCode)
      const response = await eventCheckinPublic(checkInCode)
      
      console.log('Public event check-in response:', response)
      
      toast({ 
        title: "Check-in Successful! 🎉", 
        description: response?.message || "You've successfully checked in to the event!",
        duration: 3000
      })

      setIsCheckedIn(true)

      // Redirect after successful check-in
      setTimeout(() => {
        router.push('/student/events')
      }, 2000)
    } catch (error: any) {
      console.error('Public event check-in error:', error)

      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "An error occurred during check-in. Please try again.";

      toast({
        title: "Check-in Failed",
        description: String(errorMessage),
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsCheckinLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getTypeBadge = (type: string) => {
    const typeUpper = type?.toUpperCase()
    switch (typeUpper) {
      case 'PUBLIC':
        return <Badge className="bg-green-100 text-green-700 border-green-500">PUBLIC</Badge>
      case 'PRIVATE':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-500">PRIVATE</Badge>
      case 'SPECIAL':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-500">SPECIAL</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <AppShell>
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Loading event details...</p>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (!event) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <AppShell>
          <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
            <div className="text-center space-y-4">
              <div className="text-6xl">❌</div>
              <h1 className="text-3xl font-bold text-destructive">Event Not Found</h1>
              <p className="text-muted-foreground">The event you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => router.push('/student/events')} className="mt-4">
                Back to Events
              </Button>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="shadow-xl border-2 border-primary/20">
            <CardContent className="pt-8 space-y-6">
              {/* Event Header */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  {getTypeBadge(event.type)}
                  <Badge 
                    variant="outline" 
                    className={`
                      ${event.status === 'ONGOING' ? 'bg-green-100 text-green-700 border-green-500' : ''}
                      ${event.status === 'APPROVED' ? 'bg-blue-100 text-blue-700 border-blue-500' : ''}
                      ${event.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700 border-gray-500' : ''}
                    `}
                  >
                    {event.status}
                  </Badge>
                </div>
                <h1 className="text-4xl font-extrabold text-primary">{event.name}</h1>
                <p className="text-lg text-muted-foreground">{event.description}</p>
              </div>

              <Separator />

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium">{formatDate(event.date)}</div>
                    <div className="text-xs text-muted-foreground">{event.date}</div>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="text-sm text-muted-foreground">Time</div>
                    <div className="font-medium">
                      {event.startTime && event.endTime 
                        ? `${event.startTime} - ${event.endTime}`
                        : "Time not specified"}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-medium">{event.locationName}</div>
                  </div>
                </div>

                {/* Attendance */}
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Users className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="text-sm text-muted-foreground">Attendance</div>
                    <div className="font-medium">
                      {event.currentCheckInCount} / {event.maxCheckInCount} checked in
                    </div>
                  </div>
                </div>
              </div>

              {/* Host Club */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-muted-foreground mb-1">Hosted by</div>
                <div className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                  {event.hostClub?.name}
                </div>
              </div>

              <Separator />

              {/* Check-in Button */}
              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full py-8 text-2xl font-bold flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all transform hover:scale-105 shadow-xl"
                  onClick={handleCheckin}
                  disabled={isCheckinLoading || isCheckedIn}
                >
                  {isCheckinLoading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin" />
                      Processing...
                    </>
                  ) : isCheckedIn ? (
                    <>
                      <CheckCircle className="h-8 w-8" />
                      Checked In!
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-8 w-8" /> 
                      Check In Now
                    </>
                  )}
                </Button>

                {/* Info Note */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>This is a public event - no registration required</p>
                  <p className="text-xs mt-1">Code: {event.checkInCode}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
