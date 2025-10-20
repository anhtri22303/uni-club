"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, MapPin, Users, Eye, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getEventById } from "@/service/eventApi"
import { AppShell } from "@/components/app-shell"
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
  locationId: number
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
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
      <ProtectedRoute allowedRoles={["student"]}>
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
    <ProtectedRoute allowedRoles={["student"]}>
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


            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
