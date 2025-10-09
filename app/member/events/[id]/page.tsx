"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useParams, useRouter } from "next/navigation"
import { Calendar, Users, Trophy, MapPin, Clock, ArrowLeft, UserCheck, Star, Share2 } from "lucide-react"

// Import data
import eventsJson from "@/src/data/events.json"
import clubsJson from "@/src/data/clubs.json"

type EventStatus = "past" | "upcoming" | "future"

interface EventRecord {
  id: string
  clubId: string
  title: string
  date: string
  time?: string
  points?: number
}

interface ClubRecord {
  id: string
  name: string
  category: string
  description?: string
}

export default function MemberEventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const events = eventsJson as EventRecord[]
  const clubs = clubsJson as ClubRecord[]

  const event = events.find((e) => e.id === eventId)
  const club = event ? clubs.find((c) => c.id === event.clubId) : null

  if (!event || !club) {
    return (
      <ProtectedRoute allowedRoles={["member"]}>
        <AppShell>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  const getEventStatus = (dateStr: string): EventStatus => {
    const now = new Date()
    const eventDateOnly = new Date(dateStr)
    if (eventDateOnly < now) return "past"
    if (eventDateOnly.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) return "upcoming"
    return "future"
  }

  const buildEventDate = (e: EventRecord) => {
    const base = new Date(e.date)
    if (e.time) {
      const [h, m] = e.time.split(":").map(Number)
      base.setHours(h ?? 0, m ?? 0, 0, 0)
    }
    return base
  }

  const status = getEventStatus(event.date)
  const eventDate = buildEventDate(event)

  return (
    <ProtectedRoute allowedRoles={["member"]}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{event.title}</h1>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={`/placeholder-icon.png?height=24&width=24&text=${club.name.charAt(0)}`} />
                    <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">Organized by {club.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={status === "past" ? "secondary" : status === "upcoming" ? "default" : "outline"}>
                  {status === "past" ? "Past Event" : status === "upcoming" ? "Coming Soon" : "Future Event"}
                </Badge>
                <Button variant="outline" size="sm" aria-label="Share event">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-lg flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Join us for an exciting {event.title.toLowerCase()} organized by {club.name}. This event promises to
                    be an engaging experience where you can connect with fellow students, learn new skills, and earn
                    valuable loyalty points.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Whether you're a beginner or have experience, this event is designed to accommodate all skill
                    levels. Come prepared to participate, learn, and have fun with your peers!
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="text-sm font-medium text-muted-foreground w-20">9:00 AM</div>
                      <div>
                        <div className="font-medium">Registration & Welcome</div>
                        <div className="text-sm text-muted-foreground">Check-in and event introduction</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex gap-4">
                      <div className="text-sm font-medium text-muted-foreground w-20">10:00 AM</div>
                      <div>
                        <div className="font-medium">Main Activity</div>
                        <div className="text-sm text-muted-foreground">Core event activities and participation</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex gap-4">
                      <div className="text-sm font-medium text-muted-foreground w-20">12:00 PM</div>
                      <div>
                        <div className="font-medium">Networking & Wrap-up</div>
                        <div className="text-sm text-muted-foreground">
                          Connect with participants and closing remarks
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {eventDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {eventDate.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Student Center Hall A</div>
                      <div className="text-sm text-muted-foreground">Main Campus</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">3 hours</div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{event.points ?? 0} Points</div>
                      <div className="text-sm text-muted-foreground">Loyalty reward</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {status === "past" ? (
                      <Button className="w-full" disabled>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Event Completed
                      </Button>
                    ) : (
                      <Button className="w-full">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Register for Event
                      </Button>
                    )}
                    <Button variant="outline" className="w-full bg-transparent">
                      <Star className="h-4 w-4 mr-2" />
                      Add to Favorites
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>About {club.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`/placeholder-40x40.png?height=40&width=40&text=${club.name.charAt(0)}`} />
                      <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{club.name}</div>
                      <div className="text-sm text-muted-foreground">{club.category}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {club.description ?? `Explore more about ${club.name}.`}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.push(`/clubs/${club.id}`)}
                    aria-label="View club profile"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Club Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
