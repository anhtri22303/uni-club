"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { useState } from "react"
import { Calendar, Users, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"

// Import data
import events from "@/src/data/events.json"
import clubs from "@/src/data/clubs.json"

export default function StudentEventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    initialPageSize: 6, // giảm còn 6 để có >=2 trang khi >6 items
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
            <p className="text-muted-foreground">Discover upcoming club events and activities</p>
          </div>

          <div className="flex gap-4">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1) // reset trang khi search
              }}
              className="max-w-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedEvents.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms</p>
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

          {/* Luôn render Pagination; component tự ẩn nếu chỉ có 1 trang */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1) // reset về trang 1 khi đổi số dòng/trang
            }}
            pageSizeOptions={[6, 12, 24, 48]}
          />
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
