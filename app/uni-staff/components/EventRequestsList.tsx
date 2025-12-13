"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePagination } from "@/hooks/use-pagination"
import { timeObjectToString } from "@/service/eventApi"
import { Calendar, ChevronLeft, ChevronRight, Clock, Filter } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

interface EventRequestsListProps {
  events: any[]
  eventsLoading: boolean
  pendingEvents: number
  showAllEvents?: boolean // New prop to show all events including expired
}

export function EventRequestsList({ events, eventsLoading, pendingEvents, showAllEvents = false }: EventRequestsListProps) {
  const [eventStatusFilter, setEventStatusFilter] = useState<string>("PENDING_UNISTAFF")
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL")
  const router = useRouter()

  // Function to handle clicking on an event
  const handleEventClick = (eventId: string) => {
    router.push(`/uni-staff/events-req/${eventId}`)
  }

  // Helper function to safely get event date
  const getEventDate = (event: any): Date | null => {
    // Multi-day event: use startDate or first day's date
    if (event.days && event.days.length > 0) {
      return new Date(event.days[0].date)
    }
    // Single-day event: use startDate or date
    const dateStr = event.startDate || event.date
    if (dateStr) {
      return new Date(dateStr)
    }
    return null
  }

  // Helper function to get event display date string
  const getEventDateString = (event: any): string => {
    const eventDate = getEventDate(event)
    if (!eventDate || isNaN(eventDate.getTime())) {
      return "Invalid Date"
    }
    return eventDate.toLocaleDateString("en-US")
  }

  // Filter and check non-expired events
  const filteredEvents = useMemo(() => {
    const now = new Date()
    
    return events.filter((event: any) => {
      // Check status filter
      if (eventStatusFilter !== "ALL" && event.status !== eventStatusFilter) {
        return false
      }

      // Check type filter
      if (eventTypeFilter !== "ALL" && event.type !== eventTypeFilter) {
        return false
      }

      // Check if event is not expired - Skip if showAllEvents is true
      if (!showAllEvents) {
        try {
          const eventDate = getEventDate(event)
          if (!eventDate || isNaN(eventDate.getTime())) {
            console.warn("Invalid event date for event:", event.id, event.name)
            return false
          }
          
          // If there's an endTime, combine date and endTime for evaluation
          if (event.endTime) {
            const endTimeStr = timeObjectToString(event.endTime)
            const [hours, minutes] = endTimeStr.split(':')
            eventDate.setHours(parseInt(hours), parseInt(minutes))
          }
          
          // Event must be in the future or today
          const isNotExpired = eventDate >= now || 
                 (eventDate.toDateString() === now.toDateString())
          
          if (!isNotExpired) {
            return false
          }
        } catch (error) {
          console.error("Error parsing event date:", error, "for event:", event.id)
          return false
        }
      }
      
      return true
    })
  }, [events, eventStatusFilter, eventTypeFilter, showAllEvents])

  // Manual pagination implementation for debugging
  const pageSize = 3
  const totalEvents = filteredEvents.length
  const totalPages = Math.ceil(totalEvents / pageSize)
  const [currentPage, setCurrentPage] = useState(1)
  
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [eventStatusFilter, eventTypeFilter, showAllEvents])

  const statusDotClass: Record<string, string> = {
    APPROVED: "bg-green-500",
    PENDING: "bg-yellow-500",
    REJECTED: "bg-red-500",
  }

  const goEventsPrev = () => {
    const newPage = Math.max(1, currentPage - 1)
    setCurrentPage(newPage)
  }
  const goEventsNext = () => {
    const newPage = Math.min(totalPages, currentPage + 1)
    setCurrentPage(newPage)
  }

  return (
    <Card className="border-2 dark:border-slate-700">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <div className="p-1 sm:p-1.5 bg-purple-500 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="truncate">Event Requests</span>
            </CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <CardDescription className="text-[10px] sm:text-xs">
              <span className="hidden sm:inline">
                {showAllEvents ? "All events (including expired) " : "Filter upcoming events (non-expired) "} • 
              </span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">{pendingEvents} pending</span>
            </CardDescription>
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <Filter className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <Select value={eventStatusFilter} onValueChange={setEventStatusFilter}>
                <SelectTrigger className="flex-1 sm:w-[90px] md:w-[110px] h-7 sm:h-8 text-[10px] sm:text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING_COCLUB">Pending Co-Club</SelectItem>
                  <SelectItem value="PENDING_UNISTAFF">Pending Uni-Staff</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="flex-1 sm:w-[90px] md:w-[110px] h-7 sm:h-8 text-[10px] sm:text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="WORKSHOP">Workshop</SelectItem>
                  <SelectItem value="SEMINAR">Seminar</SelectItem>
                  <SelectItem value="SOCIAL">Social</SelectItem>
                  <SelectItem value="COMPETITION">Competition</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {eventsLoading ? (
            <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">Loading...</div>
          ) : paginatedEvents.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">No events found matching criteria</div>
          ) : (
            paginatedEvents.map((event: any) => {
              const formattedDate = getEventDateString(event)
              const statusClass = statusDotClass[event.status] || "bg-gray-500"
              
              return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 dark:border-slate-700 dark:hover:bg-slate-800/50 transition-colors gap-2 sm:gap-0 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 mt-1 sm:mt-0 ${statusClass}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{event.name}</p>
                      <div className="flex flex-col gap-0.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                          <span className="truncate">
                            {formattedDate} {event.time || ""}
                            {event.endTime && <span>- {timeObjectToString(event.endTime)}</span>}
                          </span>
                        </span>
                        <span className="truncate">{event.locationName || "Location not specified"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end sm:justify-start gap-3 flex-shrink-0">
                    <div className="text-right sm:text-left">
                      <Badge
                        variant="outline"
                        className={`text-[10px] sm:text-xs px-2 py-0.5 ${
                          event.status === "PENDING_COCLUB"
                            ? "bg-orange-50 text-orange-700 border-orange-500 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-500"
                            : event.status === "PENDING_UNISTAFF" 
                            ? "bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-500"
                            : event.status === "APPROVED"
                            ? "bg-green-50 text-green-700 border-green-500 dark:bg-green-950/30 dark:text-green-400 dark:border-green-500"
                            : event.status === "ONGOING"
                            ? "bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-500"
                            : event.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500"
                            : event.status === "REJECTED"
                            ? "bg-red-50 text-red-700 border-red-500 dark:bg-red-950/30 dark:text-red-400 dark:border-red-500"
                            : event.status === "CANCELLED"
                            ? "bg-gray-50 text-gray-700 border-gray-500 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-500"
                            : "bg-slate-50 text-slate-700 border-slate-500 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-500"
                        }`}
                      >
                        {event.status === "PENDING_COCLUB"
                          ? "⏳ Pending Co-Club"
                          : event.status === "PENDING_UNISTAFF" 
                          ? "🕓 Pending Uni-Staff" 
                          : event.status === "APPROVED" 
                          ? "   Approved" 
                          : event.status === "ONGOING"
                          ? "  Ongoing"
                          : event.status === "COMPLETED"
                          ? "🏁 Completed"
                          : event.status === "REJECTED"
                          ? "  Rejected"
                          : event.status === "CANCELLED"
                          ? "🚫 Cancelled"
                          : event.status}
                      </Badge>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        {event.type || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goEventsPrev()
              }}
              disabled={currentPage === 1}
              className={`
                flex items-center gap-1 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium
                transition-colors border-0 bg-transparent
                ${currentPage === 1 
                  ? 'text-muted-foreground/50 cursor-not-allowed' 
                  : 'text-cyan-500 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-950/20'
                }
              `}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <span className="text-[10px] sm:text-xs font-medium text-cyan-500 dark:text-cyan-400 px-1 sm:px-2">
              {currentPage}/{totalPages}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goEventsNext()
              }}
              disabled={currentPage === totalPages}
              className={`
                flex items-center gap-1 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium
                transition-colors border-0 bg-transparent
                ${currentPage === totalPages 
                  ? 'text-muted-foreground/50 cursor-not-allowed' 
                  : 'text-cyan-500 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-950/20'
                }
              `}
              aria-label="Next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

