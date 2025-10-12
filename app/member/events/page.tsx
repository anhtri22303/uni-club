"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { useState } from "react"
import { Calendar, Users, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { safeLocalStorage } from "@/lib/browser-utils"
import { fetchEvent } from "@/service/eventApi"

// Import data
import events from "@/src/data/events.json"
import clubs from "@/src/data/clubs.json"

export default function MemberEventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [userClubIds, setUserClubIds] = useState<number[]>([])
  const [apiEvents, setApiEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Get user's club IDs from localStorage
  useEffect(() => {
    try {
      const saved = safeLocalStorage.getItem("uniclub-auth")
      console.log("Events page - Raw localStorage data:", saved)
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log("Events page - Parsed localStorage data:", parsed)
        
        if (parsed.clubIds && Array.isArray(parsed.clubIds)) {
          const clubIdNumbers = parsed.clubIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
          console.log("Events page - Setting userClubIds to:", clubIdNumbers)
          setUserClubIds(clubIdNumbers)
        } else if (parsed.clubId) {
          const clubIdNumber = Number(parsed.clubId)
          console.log("Events page - Setting userClubIds from single clubId to:", [clubIdNumber])
          setUserClubIds([clubIdNumber])
        }
      }
    } catch (error) {
      console.error("Failed to get clubIds from localStorage:", error)
    }
  }, [])

  // Load events from API
  useEffect(() => {
    if (userClubIds.length === 0) return // Don't load until we have club IDs

    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const data: any = await fetchEvent()
        if (!mounted) return
        
        // API should return an array; guard defensively
        const raw: any[] = Array.isArray(data) ? data : (data?.content ?? data?.events ?? [])
        // Normalize shape: some APIs use `name` instead of `title`.
        const normalized = raw.map((e: any) => ({ ...e, title: e.title ?? e.name }))
        
        console.log("Events page - All events from API:", normalized.length)
        console.log("Events page - User club IDs:", userClubIds)
        
        // Filter events by user's clubIds
        const userEvents = normalized.filter((event: any) => {
          const eventClubId = Number(event.clubId)
          const isUserEvent = userClubIds.includes(eventClubId)
          if (isUserEvent) {
            console.log(`Including event "${event.title}" from club ${eventClubId}`)
          }
          return isUserEvent
        })
        
        console.log("Events page - Filtered events for user:", userEvents.length)
        setApiEvents(userEvents)
      } catch (error) {
        console.error("Failed to load events:", error)
        // Fallback to local data filtered by user's clubs
        const fallbackEvents = events.filter((event) => userClubIds.includes(Number(event.clubId)))
        setApiEvents(fallbackEvents)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [userClubIds])

  // Use API events if available, otherwise fallback to local data
  const eventsData = apiEvents.length > 0 ? apiEvents : 
    events.filter((event) => userClubIds.length === 0 || userClubIds.includes(Number(event.clubId)))

  const filteredEvents = eventsData.filter(
    (event) =>
      (event.title || event.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      clubs.find((c) => c.id === event.clubId)?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData: paginatedEvents,
    setCurrentPage,
    setPageSize,
  } = usePagination({
    data: filteredEvents,
    initialPageSize: 6,
  })

  const getEventStatus = (eventDate: string) => {
    const now = new Date()
    const event = new Date(eventDate)
    if (event < now) return "past"
    if (event.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) return "upcoming"
    return "future"
  }

  const handleEventDetail = (eventId: string) => {
    router.push(`/member/events/${eventId}`)
  }

  return (
    <ProtectedRoute allowedRoles={["member"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground">
              Discover upcoming events from your clubs
              {userClubIds.length > 0 && (
                <span className="text-xs text-muted-foreground/70 ml-2">
                  (Showing events from club{userClubIds.length > 1 ? 's' : ''} {userClubIds.join(', ')})
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-4">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="max-w-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground">Loading events...</div>
              </div>
            ) : userClubIds.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No club membership found</h3>
                <p className="text-muted-foreground">You need to join a club first to see events</p>
              </div>
            ) : paginatedEvents.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground">
                  {filteredEvents.length === 0 && eventsData.length > 0 
                    ? "Try adjusting your search terms" 
                    : "Your clubs haven't posted any events yet"}
                </p>
              </div>
            ) : (
              paginatedEvents.map((event) => {
                const club = clubs.find((c) => c.id === event.clubId)
                const status = getEventStatus(event.date)

                return (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            {club?.name}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={status === "past" ? "secondary" : status === "upcoming" ? "default" : "outline"}
                        >
                          {status === "past" ? "Past" : status === "upcoming" ? "Soon" : "Future"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Trophy className="h-4 w-4" />
                          {event.points} loyalty points
                        </div>

                        <Button
                          className="w-full"
                          variant={status === "past" ? "outline" : "default"}
                          disabled={status === "past"}
                          onClick={() => handleEventDetail(event.id)}
                        >
                          {status === "past" ? "Event Ended" : "Detail"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
            pageSizeOptions={[6, 12, 24, 48]}
          />
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
