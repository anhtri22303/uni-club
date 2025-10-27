"use client"

import { useState, useMemo } from "react"
import { Modal } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: any[]
  onEventClick?: (event: any) => void
}

export function CalendarModal({ open, onOpenChange, events, onEventClick }: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  // Get the first day of the month and total days
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday, 1 = Monday, etc.

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setExpandedDays(new Set()) // Clear expanded state when changing months
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setExpandedDays(new Set()) // Clear expanded state when changing months
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Toggle day expansion
  const toggleDayExpansion = (dateKey: string) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey)
      } else {
        newSet.add(dateKey)
      }
      return newSet
    })
  }

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    events.forEach((event) => {
      if (event.date) {
        const dateKey = new Date(event.date).toLocaleDateString('en-CA') // YYYY-MM-DD format
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(event)
      }
    })
    // Sort events within each date by startTime
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        const timeA = a.startTime || a.time || '00:00'
        const timeB = b.startTime || b.time || '00:00'
        return timeA.localeCompare(timeB)
      })
    })
    return grouped
  }, [events])

  // Calculate event statistics for current month
  const monthStats = useMemo(() => {
    const eventsInMonth = Object.values(eventsByDate).flat()
    const approved = eventsInMonth.filter(e => e.status?.toUpperCase() === 'APPROVED').length
    const pending = eventsInMonth.filter(e => e.status?.toUpperCase() === 'PENDING').length
    const rejected = eventsInMonth.filter(e => e.status?.toUpperCase() === 'REJECTED').length
    return {
      total: eventsInMonth.length,
      approved,
      pending,
      rejected
    }
  }, [eventsByDate])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = []
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }, [startingDayOfWeek, daysInMonth])

  // Format month and year
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Check if a date is today
  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  // Get events for a specific day
  const getEventsForDay = (day: number) => {
    const dateKey = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString('en-CA')
    return eventsByDate[dateKey] || []
  }

  // Get status color for event
  const getEventColor = (event: any) => {
    const status = event.status?.toUpperCase()
    if (status === "REJECTED") return "bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 text-red-800 dark:text-red-300 border-red-400 dark:border-red-600 shadow-sm"
    if (status === "PENDING") return "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 text-amber-800 dark:text-amber-300 border-amber-400 dark:border-amber-600 shadow-sm"
    if (status === "APPROVED") return "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 text-green-800 dark:text-green-300 border-green-400 dark:border-green-600 shadow-sm"
    return "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-600 shadow-sm"
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Event Calendar"
      description={`View all events in a monthly calendar view`}
      className="sm:max-w-7xl max-h-[90vh] overflow-hidden"
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        {/* Calendar Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-3 -mt-1">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-9 w-9 p-0 hover:bg-primary/10 hover:border-primary/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-bold min-w-[200px] text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {monthYear}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-9 w-9 p-0 hover:bg-primary/10 hover:border-primary/50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Event Statistics - Inline */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <CalendarIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  {monthStats.total} {monthStats.total === 1 ? 'Event' : 'Events'}
                </span>
              </div>
              {monthStats.approved > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-lg border border-green-400 dark:border-green-600">
                  <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                  <span className="text-xs font-semibold text-green-800 dark:text-green-300">
                    {monthStats.approved} Approved
                  </span>
                </div>
              )}
              {monthStats.pending > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 rounded-lg border border-amber-400 dark:border-amber-600">
                  <div className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400"></div>
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    {monthStats.pending} Pending
                  </span>
                </div>
              )}
              {monthStats.rejected > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 rounded-lg border border-red-400 dark:border-red-600">
                  <div className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400"></div>
                  <span className="text-xs font-semibold text-red-800 dark:text-red-300">
                    {monthStats.rejected} Rejected
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-9 hover:bg-primary hover:text-primary-foreground"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Today
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-3 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm"></div>
            <span className="font-medium text-green-700 dark:text-green-400">Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm"></div>
            <span className="font-medium text-amber-700 dark:text-amber-400">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-sm"></div>
            <span className="font-medium text-red-700 dark:text-red-400">Rejected</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border-2 rounded-xl overflow-hidden shadow-lg border-blue-200/50 dark:border-blue-800/50">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-blue-600 to-purple-600">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
              <div
                key={day}
                className={cn(
                  "p-3 text-center text-sm font-bold text-white border-r border-white/20 last:border-r-0",
                  idx === 0 && "text-red-100",
                  idx === 6 && "text-blue-100"
                )}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.substring(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 bg-white dark:bg-gray-950">
            {calendarDays.map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : []
              const today = day ? isToday(day) : false
              const isWeekend = index % 7 === 0 || index % 7 === 6
              const dateKey = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString('en-CA') : ''
              const isExpanded = expandedDays.has(dateKey)
              const visibleEvents = isExpanded ? dayEvents : dayEvents.slice(0, 3)

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[110px] border-r border-b last:border-r-0 p-2",
                    day ? "bg-white dark:bg-gray-950 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors" : "bg-gray-100/50 dark:bg-gray-900/50",
                    isWeekend && day && "bg-blue-50/30 dark:bg-blue-950/10",
                    today && "ring-2 ring-blue-500 ring-inset bg-blue-50 dark:bg-blue-950/30",
                    index % 7 === 6 && "border-r-0",
                    "border-gray-200 dark:border-gray-800"
                  )}
                >
                  {day && (
                    <div className="h-full flex flex-col">
                      {/* Day Number */}
                      <div className="flex items-center justify-center mb-1.5">
                        <span
                          className={cn(
                            "text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full transition-all",
                            today && "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md scale-110",
                            !today && isWeekend && "text-red-600 dark:text-red-400",
                            !today && !isWeekend && "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                          )}
                        >
                          {day}
                        </span>
                      </div>

                      {/* Events for this day */}
                      <ScrollArea className="flex-1">
                        <div className="space-y-1">
                          {visibleEvents.map((event, eventIdx) => (
                            <button
                              key={eventIdx}
                              onClick={() => onEventClick?.(event)}
                              className={cn(
                                "w-full text-left rounded-md px-2 py-1.5 text-xs border transition-all",
                                "hover:scale-[1.03] hover:shadow-md active:scale-[0.98]",
                                getEventColor(event)
                              )}
                            >
                              <div className="font-semibold truncate leading-tight mb-1">
                                {event.name || event.title}
                              </div>
                              <div className="space-y-0.5">
                                {/* Time Range */}
                                <div className="flex items-center gap-1 text-[10px] opacity-90">
                                  <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                                  <span className="truncate font-medium">
                                    {(event.startTime || event.time || '').substring(0, 5)}
                                    {event.endTime && ` - ${event.endTime.substring(0, 5)}`}
                                  </span>
                                </div>
                                {/* Location */}
                                {event.locationName && (
                                  <div className="flex items-center gap-1 text-[10px] opacity-90">
                                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                                    <span className="truncate font-medium">
                                      {event.locationName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleDayExpansion(dateKey)
                              }}
                              className="w-full text-[10px] text-center font-semibold text-blue-600 dark:text-blue-400 py-1.5 bg-blue-100/50 dark:bg-blue-900/30 rounded hover:bg-blue-200/70 dark:hover:bg-blue-800/50 transition-colors flex items-center justify-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3 w-3" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3" />
                                  +{dayEvents.length - 3} more
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </Modal>
  )
}

