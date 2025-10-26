"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePagination } from "@/hooks/use-pagination"
import { useState } from "react"
import { Calendar, Users, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { safeLocalStorage } from "@/lib/browser-utils"
import { useClubEvents, useClubs } from "@/hooks/use-query-hooks"

// Import data
import clubs from "@/src/data/clubs.json"

export default function MemberEventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [userClubIds, setUserClubIds] = useState<number[]>([])
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

  // ✅ USE REACT QUERY - automatically filters by clubIds
  const { data: eventsData = [], isLoading: loading } = useClubEvents(userClubIds)
  const { data: clubsData = [] } = useClubs()

  const filteredEvents = eventsData.filter(
    (event) =>
      (event.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.hostClub?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      clubsData.find((c: any) => c.id === event.hostClub?.id)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clubs.find((c) => c.id === event.hostClub?.id)?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Helper function to check if event has expired (past endTime)
  const isEventExpired = (event: any) => {
    // Check if date and endTime are present
    if (!event.date || !event.endTime) return false

    try {
      // Get current date/time in Vietnam timezone (UTC+7)
      const now = new Date()
      const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))

      // Parse event date (format: YYYY-MM-DD)
      const [year, month, day] = event.date.split('-').map(Number)
      
      // Parse endTime (format: HH:MM:SS or HH:MM)
      const [hours, minutes] = event.endTime.split(':').map(Number)

      // Create event end datetime in Vietnam timezone
      const eventEndDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0)

      // Event is expired if current VN time is past the end time
      return vnTime > eventEndDateTime
    } catch (error) {
      console.error('Error checking event expiration:', error)
      return false
    }
  }

  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({ expired: "hide" })

  const finalFilteredEvents = filteredEvents.filter((event) => {
    // expired filter
    const expiredFilter = activeFilters["expired"]
    if (expiredFilter === "hide") {
      if (isEventExpired(event)) return false
    } else if (expiredFilter === "only") {
      if (!isEventExpired(event)) return false
    }
    return true
  })

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData: paginatedEvents,
    setCurrentPage,
    setPageSize,
  } = usePagination({
    data: finalFilteredEvents,
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
    router.push(`/student/events/${eventId}`)
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
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
            <Select 
              value={activeFilters["expired"] || "hide"} 
              onValueChange={(v) => {
                setActiveFilters({ ...activeFilters, expired: v })
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hide">Hide Expired</SelectItem>
                <SelectItem value="show">Show All</SelectItem>
                <SelectItem value="only">Only Expired</SelectItem>
              </SelectContent>
            </Select>
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
                const status = getEventStatus(event.date)

                return (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{event.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            {event.hostClub?.name || "Unknown Club"}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            event.status === "APPROVED" 
                              ? status === "past" ? "secondary" : status === "upcoming" ? "default" : "outline"
                              : "destructive"
                          }
                        >
                          {event.status === "APPROVED" 
                            ? (status === "past" ? "Past" : status === "upcoming" ? "Soon" : "Future")
                            : event.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>

                        {(event.startTime && event.endTime) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Trophy className="h-4 w-4" />
                            {event.startTime} - {event.endTime}
                          </div>
                        )}

                        <Button
                          className="w-full"
                          variant={status === "past" || event.status !== "APPROVED" ? "outline" : "default"}
                          disabled={status === "past" || event.status !== "APPROVED"}
                          onClick={() => handleEventDetail(event.id)}
                        >
                          {status === "past" ? "Event Ended" : event.status !== "APPROVED" ? event.status : "Detail"}
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
