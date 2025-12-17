"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { getLocationEvents, LocationEvent, Location } from "@/service/locationApi"
import { Calendar, Clock, Users, MapPin, X, ChevronLeft, ChevronRight, Info } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isWithinInterval } from "date-fns"

interface LocationEventsCalendarModalProps {
  location: Location | null
  isOpen: boolean
  onClose: () => void
}

export default function LocationEventsCalendarModal({
  location,
  isOpen,
  onClose,
}: LocationEventsCalendarModalProps) {
  const { toast } = useToast()
  const [events, setEvents] = useState<LocationEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Load events when modal opens
  useEffect(() => {
    if (isOpen && location) {
      loadLocationEvents()
    }
  }, [isOpen, location])

  const loadLocationEvents = async () => {
    if (!location) return

    try {
      setLoading(true)
      const data = await getLocationEvents(location.id)
      setEvents(data)
    } catch (error) {
      console.error("Error loading location events:", error)
      toast({
        title: "Error",
        description: "Failed to load events for this location",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get event type badge
  const getEventTypeBadge = (type: string) => {
    const badges = {
      PUBLIC: { label: "Public", color: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300" },
      PRIVATE: { label: "Private", color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300" },
      SPECIAL: { label: "Special", color: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300" },
    }
    return badges[type as keyof typeof badges] || badges.PUBLIC
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      COMPLETED: { 
        label: "Completed", 
        color: "bg-blue-900 text-white border-blue-900",
        dotColor: "bg-white"
      },
      ONGOING: { 
        label: "Ongoing", 
        color: "bg-purple-600 text-white border-purple-600",
        dotColor: "bg-white"
      },
      UPCOMING: { 
        label: "Upcoming", 
        color: "bg-green-600 text-white border-green-600",
        dotColor: "bg-white"
      },
      CANCELLED: { 
        label: "Cancelled", 
        color: "bg-orange-100 text-orange-800 border-orange-400 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-600",
        dotColor: "bg-orange-500"
      },
    }
    return badges[status as keyof typeof badges] || badges.UPCOMING
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStartDate = parseISO(event.startDate)
      const eventEndDate = parseISO(event.endDate)
      
      return isWithinInterval(date, {
        start: eventStartDate,
        end: eventEndDate,
      })
    })
  }

  // Calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    const eventsForDate = getEventsForDate(selectedDate)
    
    // Map events and filter their days to only show days matching the selected date
    const eventsWithFilteredDays = eventsForDate.map(event => {
      const filteredDays = event.days.filter(day => {
        const dayDate = parseISO(day.date)
        return isSameDay(dayDate, selectedDate)
      })
      
      return {
        ...event,
        days: filteredDays
      }
    })
    
    // Sort events by start time (earliest first)
    return eventsWithFilteredDays.sort((a, b) => {
      // Get the first day's start time for each event
      const aTime = a.days && a.days.length > 0 ? a.days[0].startTime : "23:59"
      const bTime = b.days && b.days.length > 0 ? b.days[0].startTime : "23:59"
      
      // Compare times (format is "HH:mm")
      return aTime.localeCompare(bTime)
    })
  }, [selectedDate, events])

  // Navigate months
  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    setSelectedDate(null)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1400px] w-[95vw] !max-h-[90vh] h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-blue-600" />
            <div>
              <DialogTitle className="text-2xl">{location?.name || "Location"}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {location?.address}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-sm text-muted-foreground">Loading events...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
            {/* Calendar Section */}
            <div className="lg:col-span-2 flex flex-col">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  {format(currentMonth, "MMMM yyyy")}
                </h3>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="flex-1 border rounded-lg p-4 bg-card overflow-auto">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Empty cells for days before month start */}
                  {Array.from({ length: calendarDays[0].getDay() }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                  ))}

                  {/* Actual days */}
                  {calendarDays.map((day) => {
                    const dayEvents = getEventsForDate(day)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const hasEvents = dayEvents.length > 0
                    const isToday = isSameDay(day, new Date())

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => handleDateClick(day)}
                        className={`
                          aspect-square p-2 rounded-lg border-2 transition-all
                          hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950
                          ${isSelected ? "border-blue-600 bg-blue-50 dark:bg-blue-950" : "border-transparent"}
                          ${isToday ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/50" : ""}
                          ${!isSameMonth(day, currentMonth) ? "opacity-40" : ""}
                        `}
                      >
                        <div className="flex flex-col h-full">
                          <div className={`text-sm font-medium ${isToday ? "text-blue-600 font-bold" : ""}`}>
                            {format(day, "d")}
                          </div>
                          {hasEvents && (
                            <div className="mt-auto flex flex-wrap gap-0.5 justify-center">
                              {dayEvents.slice(0, 3).map((event) => (
                                <div
                                  key={event.id}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    event.type === "PUBLIC"
                                      ? "bg-green-500"
                                      : event.type === "PRIVATE"
                                      ? "bg-orange-500"
                                      : "bg-purple-500"
                                  }`}
                                />
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="text-[8px] text-muted-foreground">
                                  +{dayEvents.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Events List Section */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select a date"}
                </h3>
                {selectedDateEvents.length > 0 && (
                  <Badge variant="secondary">{selectedDateEvents.length} events</Badge>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-4 min-h-0">{!selectedDate ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Info className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Click on a date to view events
                    </p>
                  </div>
                ) : selectedDateEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No events scheduled for this date
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <Card key={event.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            {/* Event Name & Type */}
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm line-clamp-2">
                                {event.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`${getEventTypeBadge(event.type).color} flex-shrink-0`}
                              >
                                {getEventTypeBadge(event.type).label}
                              </Badge>
                            </div>

                            {/* Time Range - Prominent Display */}
                            {event.days && event.days.length > 0 && (
                              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded-md">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-sm text-blue-700 dark:text-blue-400">
                                  {event.days[0].startTime} - {event.days[0].endTime}
                                </span>
                              </div>
                            )}

                            {/* Status */}
                            <Badge
                              variant="secondary"
                              className={`${getStatusBadge(event.status).color} text-xs font-semibold`}
                            >
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${getStatusBadge(event.status).dotColor} mr-1`}></span>
                              {getStatusBadge(event.status).label}
                            </Badge>

                            {/* Multiple Event Days (if more than 1) */}
                            {event.days && event.days.length > 1 && (
                              <div className="space-y-1 pt-1 border-t">
                                <p className="text-xs font-medium text-muted-foreground">Multiple Days:</p>
                                {event.days.map((day) => (
                                  <div
                                    key={day.id}
                                    className="flex items-center gap-2 text-xs text-muted-foreground"
                                  >
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {format(parseISO(day.date), "MMM d")} • {day.startTime} - {day.endTime}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Capacity */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>
                                {event.currentCheckInCount} / {event.maxCheckInCount} attendees
                              </span>
                            </div>

                            {/* Host Club */}
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Host:</span> {event.hostClub.name}
                            </div>

                            {/* Description */}
                            {event.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 pt-1 border-t">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary Footer */}
        {!loading && events.length > 0 && (
          <div className="flex-shrink-0 mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Events: <strong>{events.length}</strong></span>
              <div className="flex gap-4">
                <span>Public: <strong>{events.filter(e => e.type === "PUBLIC").length}</strong></span>
                <span>Private: <strong>{events.filter(e => e.type === "PRIVATE").length}</strong></span>
                <span>Special: <strong>{events.filter(e => e.type === "SPECIAL").length}</strong></span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
