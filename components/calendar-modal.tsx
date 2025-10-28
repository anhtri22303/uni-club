"use client"

import { useState, useMemo } from "react"
import { Modal } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: any[]
  onEventClick?: (event: any) => void
}

export function CalendarModal({
  open,
  onOpenChange,
  events,
  onEventClick,
}: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  // First/last day of month
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  )
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  )
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay() // 0=Sun

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    )
    setExpandedDays(new Set())
  }
  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    )
    setExpandedDays(new Set())
  }
  const goToToday = () => setCurrentDate(new Date())

  // Toggle expand
  const toggleDayExpansion = (dateKey: string) => {
    setExpandedDays((prev) => {
      const ns = new Set(prev)
      ns.has(dateKey) ? ns.delete(dateKey) : ns.add(dateKey)
      return ns
    })
  }

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    events.forEach((event) => {
      if (event.date) {
        const dateKey = new Date(event.date).toLocaleDateString("en-CA") // YYYY-MM-DD
        if (!grouped[dateKey]) grouped[dateKey] = []
        grouped[dateKey].push(event)
      }
    })
    // Sort inside each day by time
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        const ta = a.startTime || a.time || "00:00"
        const tb = b.startTime || b.time || "00:00"
        return ta.localeCompare(tb)
      })
    })
    return grouped
  }, [events])

  // Month stats
  const monthStats = useMemo(() => {
    const list = Object.values(eventsByDate).flat()
    const completed = list.filter((e) => e.status?.toUpperCase() === "COMPLETED").length
    const approved = list.filter((e) => e.status?.toUpperCase() === "APPROVED").length
    const pending = list.filter((e) => e.status?.toUpperCase() === "PENDING").length
    const rejected = list.filter((e) => e.status?.toUpperCase() === "REJECTED").length
    return { total: list.length, completed, approved, pending, rejected }
  }, [eventsByDate])

  // Calendar days
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(day)
    return days
  }, [startingDayOfWeek, daysInMonth])

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const isToday = (day: number) => {
    const t = new Date()
    return (
      day === t.getDate() &&
      currentDate.getMonth() === t.getMonth() &&
      currentDate.getFullYear() === t.getFullYear()
    )
  }

  const getEventsForDay = (day: number) => {
    const dk = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toLocaleDateString("en-CA")
    return eventsByDate[dk] || []
  }

  const getEventColor = (event: any) => {
    const status = event.status?.toUpperCase()
    
    // Check if event is in the past (before today)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset to start of day for comparison
    const eventDate = event.date ? new Date(event.date) : null
    const isPast = eventDate && eventDate < today
    
    // COMPLETED status always gets dark blue
    if (status === "COMPLETED")
      return "bg-gradient-to-br from-blue-900 to-blue-950 dark:from-blue-900 dark:to-blue-950 text-white dark:text-white border-blue-900 dark:border-blue-800 shadow-sm opacity-70"
    
    // Past events get lighter colors
    if (isPast) {
      if (status === "REJECTED")
        return "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 shadow-sm opacity-60"
      if (status === "PENDING")
        return "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700 shadow-sm opacity-60"
      if (status === "APPROVED")
        return "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700 shadow-sm opacity-60"
      return "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 shadow-sm opacity-60"
    }
    
    // Future/today events get normal vibrant colors
    if (status === "REJECTED")
      return "bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 text-red-800 dark:text-red-300 border-red-400 dark:border-red-600 shadow-sm"
    if (status === "PENDING")
      return "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 text-amber-800 dark:text-amber-300 border-amber-400 dark:border-amber-600 shadow-sm"
    if (status === "APPROVED")
      return "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 text-green-800 dark:text-green-300 border-green-400 dark:border-green-600 shadow-sm"
    return "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-600 shadow-sm"
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Event Calendar"
      description="View all events in a monthly calendar view"
      className="sm:max-w-7xl max-h-[90vh] overflow-hidden"
    >
      {/* Line-clamp helpers (no Tailwind plugin needed) */}
      <style jsx global>{`
        .clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (min-width: 640px) {
          /* make it easy to swap clamps responsively */
          .sm\\:clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
      `}</style>

      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-3 -mt-1">
          <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-primary/10 hover:border-primary/50"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <h2 className="text-base sm:text-xl font-bold min-w-[140px] sm:min-w-[200px] text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                {monthYear}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-primary/10 hover:border-primary/50"
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                  {monthStats.total} {monthStats.total === 1 ? "Event" : "Events"}
                </span>
              </div>
              {monthStats.completed > 0 && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-gradient-to-br from-blue-900 to-blue-950 rounded-lg border border-blue-900">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white flex-shrink-0"></div>
                  <span className="text-[10px] sm:text-xs font-semibold text-white whitespace-nowrap">
                    {monthStats.completed} <span className="hidden xs:inline">Completed</span>
                  </span>
                </div>
              )}
              {monthStats.approved > 0 && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-lg border border-green-400 dark:border-green-600">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-600 dark:bg-green-400 flex-shrink-0"></div>
                  <span className="text-[10px] sm:text-xs font-semibold text-green-800 dark:text-green-300 whitespace-nowrap">
                    {monthStats.approved} <span className="hidden xs:inline">Approved</span>
                  </span>
                </div>
              )}
              {monthStats.pending > 0 && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 rounded-lg border border-amber-400 dark:border-amber-600">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-600 dark:bg-amber-400 flex-shrink-0"></div>
                  <span className="text-[10px] sm:text-xs font-semibold text-amber-800 dark:text-amber-300 whitespace-nowrap">
                    {monthStats.pending} <span className="hidden xs:inline">Pending</span>
                  </span>
                </div>
              )}
              {monthStats.rejected > 0 && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 rounded-lg border border-red-400 dark:border-red-600">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-600 dark:bg-red-400 flex-shrink-0"></div>
                  <span className="text-[10px] sm:text-xs font-semibold text-red-800 dark:text-red-300 whitespace-nowrap">
                    {monthStats.rejected} <span className="hidden xs:inline">Rejected</span>
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 sm:h-9 hover:bg-primary hover:text-primary-foreground"
            >
              <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Today</span>
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-3 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-gradient-to-br from-blue-900 to-blue-950 shadow-sm"></div>
            <span className="font-medium text-blue-900 dark:text-blue-400">Completed</span>
          </div>
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

        {/* Calendar grid */}
        <div className="border-2 rounded-xl overflow-hidden shadow-lg border-blue-200/50 dark:border-blue-800/50">
          <div className="grid grid-cols-7 bg-gradient-to-r from-blue-600 to-purple-600">
            {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((day, idx) => (
              <div
                key={day}
                className={cn(
                  "p-2 sm:p-3 text-center text-xs sm:text-sm font-bold text-white border-r border-white/20 last:border-r-0 overflow-hidden",
                  idx === 0 && "text-red-100",
                  idx === 6 && "text-blue-100"
                )}
              >
                <span className="hidden md:inline truncate">{day}</span>
                <span className="md:hidden truncate">{day.substring(0, 3)}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-white dark:bg-gray-950">
            {calendarDays.map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : []
              const today = day ? isToday(day) : false
              const isWeekend = index % 7 === 0 || index % 7 === 6
              const dateKey =
                day
                  ? new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day
                    ).toLocaleDateString("en-CA")
                  : ""
              const isExpanded = expandedDays.has(dateKey)
              const visibleEvents = isExpanded ? dayEvents : dayEvents.slice(0, 3)

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[110px] sm:min-h-[120px] border-r border-b last:border-r-0 p-1 sm:p-2",
                    day
                      ? "bg-white dark:bg-gray-950 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                      : "bg-gray-100/50 dark:bg-gray-900/50",
                    isWeekend && day && "bg-blue-50/30 dark:bg-blue-950/10",
                    today && "ring-2 ring-blue-500 ring-inset bg-blue-50 dark:bg-blue-950/30",
                    index % 7 === 6 && "border-r-0",
                    "border-gray-200 dark:border-gray-800",
                    "overflow-hidden"
                  )}
                >
                  {day && (
                    <div className="h-full flex flex-col min-w-0">
                      {/* Day number */}
                      <div className="flex items-center justify-center mb-1 sm:mb-1.5">
                        <span
                          className={cn(
                            "text-xs sm:text-sm font-bold h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-full transition-all",
                            today && "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md scale-110",
                            !today && isWeekend && "text-red-600 dark:text-red-400",
                            !today && !isWeekend && "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                          )}
                        >
                          {day}
                        </span>
                      </div>

                      {/* Events */}
                      <ScrollArea className="flex-1 min-w-0">
                        <div className="space-y-0.5 sm:space-y-1 min-w-0">
                          {visibleEvents.map((event, eventIdx) => {
                            const title = event.name || event.title
                            const start = (event.startTime || event.time || "").substring(0, 5)
                            const end = event.endTime ? event.endTime.substring(0, 5) : ""
                            return (
                              <button
                                key={eventIdx}
                                onClick={() => onEventClick?.(event)}
                                className={cn(
                                  "w-full text-left rounded px-1.5 py-1 sm:px-2 sm:py-1.5 text-xs border transition-all block min-w-0",
                                  "hover:scale-[1.02] sm:hover:scale-[1.03] hover:shadow-md active:scale-[0.98]",
                                  getEventColor(event)
                                )}
                              >
                                <div className="w-full min-w-0">
                                  {/* Title: 1 line on mobile, 2 lines ≥ sm */}
                                  <div
                                    className={cn(
                                      "leading-tight mb-0.5 sm:mb-1 w-full",
                                      "text-[11px] sm:text-[12px] md:text-[13px]",
                                      "max-w-[88px] xs:max-w-[120px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[240px]",
                                      // ensure ellipsis + line clamp
                                      "overflow-hidden",
                                      "sm:clamp-2", // 2 lines on sm↑
                                      "clamp-1" // 1 line on mobile
                                    )}
                                    title={title}
                                  >
                                    {title}
                                  </div>

                                  <div className="space-y-0.5 w-full min-w-0">
                                    {/* Time: single-line, ellipsis if needed */}
                                    <div className="hidden xs:flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] opacity-90 w-full min-w-0 overflow-hidden">
                                      <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0" />
                                      <span
                                        className="font-medium truncate flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                                        title={`${start}${end ? ` - ${end}` : ""}`}
                                      >
                                        {start}
                                        {end && ` - ${end}`}
                                      </span>
                                    </div>

                                    {/* Location: single-line on ≥sm */}
                                    {event.locationName && (
                                      <div className="hidden sm:flex items-center gap-1 text-[10px] opacity-90 w-full min-w-0 overflow-hidden">
                                        <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                                        <span
                                          className="font-medium truncate flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                                          title={event.locationName}
                                        >
                                          {event.locationName}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })}

                          {dayEvents.length > 3 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleDayExpansion(dateKey)
                              }}
                              className="w-full text-[9px] sm:text-[10px] text-center font-semibold text-blue-600 dark:text-blue-400 py-1 sm:py-1.5 bg-blue-100/50 dark:bg-blue-900/30 rounded hover:bg-blue-200/70 dark:hover:bg-blue-800/50 transition-colors flex items-center justify-center gap-0.5 sm:gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  <span className="hidden xs:inline">Show less</span>
                                  <span className="xs:hidden">Less</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  <span className="hidden xs:inline">+{dayEvents.length - 3} more</span>
                                  <span className="xs:hidden">+{dayEvents.length - 3}</span>
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
