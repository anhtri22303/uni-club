"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: any[];
  onEventClick?: (event: any) => void;
}

export function CalendarModal({
  open,
  onOpenChange,
  events,
  onEventClick,
}: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // First/last day of month
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    setExpandedDays(new Set());
  };
  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
    setExpandedDays(new Set());
  };
  const goToToday = () => setCurrentDate(new Date());

  // Toggle expand
  const toggleDayExpansion = (dateKey: string) => {
    setExpandedDays((prev) => {
      const ns = new Set(prev);
      ns.has(dateKey) ? ns.delete(dateKey) : ns.add(dateKey);
      return ns;
    });
  };

  // Group events by date (supports both single-day and multi-day events)
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    events.forEach((event) => {
      // Multi-day event: add to each day in the days[] array
      if (event.days && Array.isArray(event.days) && event.days.length > 0) {
        event.days.forEach((day: any) => {
          if (day.date) {
            const dateKey = new Date(day.date).toLocaleDateString("en-CA"); // YYYY-MM-DD
            if (!grouped[dateKey]) grouped[dateKey] = [];
            // Create a copy with the specific day's time
            grouped[dateKey].push({
              ...event,
              currentDayDate: day.date,
              currentDayStartTime: day.startTime,
              currentDayEndTime: day.endTime,
            });
          }
        });
      }
      // Legacy single-day event: use event.date or startDate
      else if (event.date || event.startDate) {
        const dateKey = new Date(
          event.date || event.startDate
        ).toLocaleDateString("en-CA"); // YYYY-MM-DD
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(event);
      }
    });
    // Sort inside each day by time
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        const ta = a.currentDayStartTime || a.startTime || a.time || "00:00";
        const tb = b.currentDayStartTime || b.startTime || b.time || "00:00";
        return ta.localeCompare(tb);
      });
    });
    return grouped;
  }, [events]);

  // Month stats
  const monthStats = useMemo(() => {
    const list = Object.values(eventsByDate).flat();
    const completed = list.filter(
      (e) => e.status?.toUpperCase() === "COMPLETED"
    ).length;
    const approved = list.filter(
      (e) => e.status?.toUpperCase() === "APPROVED"
    ).length;
    const pending = list.filter(
      (e) => e.status?.toUpperCase() === "PENDING"
    ).length;
    const rejected = list.filter(
      (e) => e.status?.toUpperCase() === "REJECTED"
    ).length;
    return { total: list.length, completed, approved, pending, rejected };
  }, [eventsByDate]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
  }, [startingDayOfWeek, daysInMonth]);

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isToday = (day: number) => {
    const t = new Date();
    return (
      day === t.getDate() &&
      currentDate.getMonth() === t.getMonth() &&
      currentDate.getFullYear() === t.getFullYear()
    );
  };

  const getEventsForDay = (day: number) => {
    const dk = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toLocaleDateString("en-CA");
    return eventsByDate[dk] || [];
  };

  const getEventColor = (event: any) => {
    const status = event.status?.toUpperCase();

    // Check if event is in the past (before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    // For multi-day events in calendar, use currentDayDate if available, otherwise use endDate/date/startDate
    const eventDateStr =
      event.currentDayDate || event.endDate || event.date || event.startDate;
    const eventDate = eventDateStr ? new Date(eventDateStr) : null;
    const isPast = eventDate && eventDate < today;

    // COMPLETED status - dark blue (matching club-leader/events)
    if (status === "COMPLETED")
      return "bg-blue-900 text-white border-blue-900 font-semibold";

    // Expired (past events) - gray (matching club-leader/events)
    if (isPast) {
      return "bg-gray-400 text-white border-gray-400 font-semibold opacity-60";
    }

    // ONGOING - purple (matching club-leader/events)
    if (status === "ONGOING")
      return "bg-purple-600 text-white border-purple-600 font-semibold";

    // APPROVED - green (matching club-leader/events)
    if (status === "APPROVED")
      return "bg-green-600 text-white border-green-600 font-semibold";

    // PENDING_COCLUB - orange (matching club-leader/events)
    if (status === "PENDING_COCLUB")
      return "bg-orange-100 text-orange-700 border-orange-500 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700 font-semibold";

    // PENDING_UNISTAFF, PENDING, WAITING - yellow (matching club-leader/events)
    if (status === "PENDING_UNISTAFF" || status === "PENDING" || status === "WAITING")
      return "bg-yellow-100 text-yellow-700 border-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700 font-semibold";

    // REJECTED - red (matching club-leader/events)
    if (status === "REJECTED")
      return "bg-red-600 text-white border-red-600 font-semibold";

    // CANCELLED - orange (matching club-leader/events)
    if (status === "CANCELLED")
      return "bg-orange-100 text-orange-800 border-orange-400 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-600 font-semibold";

    // Default - blue
    return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700 font-semibold";
  };

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
              <h2 className="text-base sm:text-xl font-bold min-w-[140px] sm:min-w-[200px] text-center text-gray-800 dark:text-gray-200 truncate">
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
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
                <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {monthStats.total}{" "}
                  {monthStats.total === 1 ? "Event" : "Events"}
                </span>
              </div>
              {monthStats.completed > 0 && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {monthStats.completed} Completed
                </Badge>
              )}
              {monthStats.approved > 0 && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {monthStats.approved} Approved
                </Badge>
              )}
              {monthStats.pending > 0 && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {monthStats.pending} Pending
                </Badge>
              )}
              {monthStats.rejected > 0 && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {monthStats.rejected} Rejected
                </Badge>
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
        <div className="flex flex-wrap gap-3 text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-blue-600"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Completed
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-green-600"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Approved
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-amber-600"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Pending
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-600"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Rejected
            </span>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="border-2 rounded-xl overflow-hidden shadow-lg border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-7 bg-blue-600 dark:bg-blue-700">
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day, idx) => (
              <div
                key={day}
                className={cn(
                  "p-2 sm:p-3 text-center text-xs sm:text-sm font-bold text-white border-r border-white/20 last:border-r-0 overflow-hidden",
                  idx === 0 && "text-red-100",
                  idx === 6 && "text-blue-100"
                )}
              >
                <span className="hidden md:inline truncate">{day}</span>
                <span className="md:hidden truncate">
                  {day.substring(0, 3)}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-white dark:bg-gray-950">
            {calendarDays.map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const today = day ? isToday(day) : false;
              const isWeekend = index % 7 === 0 || index % 7 === 6;
              const dateKey = day
                ? new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    day
                  ).toLocaleDateString("en-CA")
                : "";
              const isExpanded = expandedDays.has(dateKey);
              const visibleEvents = isExpanded
                ? dayEvents
                : dayEvents.slice(0, 3);

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[110px] sm:min-h-[120px] border-r border-b last:border-r-0 p-1 sm:p-2",
                    day
                      ? "bg-white dark:bg-gray-950 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                      : "bg-gray-100/50 dark:bg-gray-900/50",
                    isWeekend && day && "bg-blue-50/30 dark:bg-blue-950/10",
                    today &&
                      "ring-2 ring-blue-500 ring-inset bg-blue-50 dark:bg-blue-950/30",
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
                            today &&
                              "bg-blue-600 text-white",
                            !today &&
                              isWeekend &&
                              "text-red-600 dark:text-red-400",
                            !today &&
                              !isWeekend &&
                              "text-gray-700 dark:text-gray-300"
                          )}
                        >
                          {day}
                        </span>
                      </div>

                      {/* Events */}
                      <ScrollArea className="flex-1 min-w-0">
                        <div className="space-y-0.5 sm:space-y-1 min-w-0">
                          {visibleEvents.map((event, eventIdx) => {
                            const title = event.name || event.title;
                            // For multi-day events in calendar, use currentDay times
                            const startTimeStr =
                              event.currentDayStartTime ||
                              event.startTime ||
                              event.time ||
                              "";
                            const endTimeStr =
                              event.currentDayEndTime || event.endTime || "";
                            const start =
                              typeof startTimeStr === "string"
                                ? startTimeStr.substring(0, 5)
                                : "";
                            const end =
                              typeof endTimeStr === "string"
                                ? endTimeStr.substring(0, 5)
                                : "";
                            // Check if this is a multi-day event
                            const isMultiDay =
                              event.days &&
                              Array.isArray(event.days) &&
                              event.days.length > 1;
                            const totalDays = isMultiDay
                              ? event.days.length
                              : 1;
                            return (
                              <TooltipProvider key={eventIdx}>
                                <Tooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => onEventClick?.(event)}
                                      className={cn(
                                        "w-full max-w-full block text-left rounded px-1.5 py-1 sm:px-2 sm:py-1.5 text-xs border",
                                        "hover:shadow-md transition",
                                        getEventColor(event)
                                      )}
                                    >
                                      <div className="w-full max-w-full overflow-hidden">
                                        {/* TITLE */}
                                        <div
                                          className="
        font-semibold leading-tight
        text-[11px] sm:text-[12px] md:text-[13px]
        line-clamp-2
      "
                                        >
                                          {title}
                                        </div>

                                        {/* META */}
                                        {isMultiDay && (
                                          <div className="flex items-center gap-1 text-[10px] font-bold mt-0.5 overflow-hidden">
                                            <CalendarIcon className="h-2.5 w-2.5 flex-shrink-0" />
                                            <span className="truncate">
                                              {totalDays} days event
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="max-w-xs bg-slate-900 dark:bg-slate-800 border-slate-700"
                                  >
                                    <div className="space-y-1.5 text-xs">
                                      <div className="font-bold text-white">
                                        {title}
                                      </div>
                                      {isMultiDay && (
                                        <div className="flex items-center gap-1.5 text-slate-200">
                                          <CalendarIcon className="h-3.5 w-3.5" />
                                          <span className="font-medium">
                                            {totalDays} days event
                                          </span>
                                        </div>
                                      )}
                                      {(start || end) && (
                                        <div className="flex items-center gap-1.5 text-slate-200">
                                          <Clock className="h-3.5 w-3.5" />
                                          <span className="font-medium">
                                            {start}
                                            {end && ` - ${end}`}
                                          </span>
                                        </div>
                                      )}
                                      {event.locationName && (
                                        <div className="flex items-center gap-1.5 text-slate-200">
                                          <MapPin className="h-3.5 w-3.5" />
                                          <span className="font-medium">
                                            {event.locationName}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}

                          {dayEvents.length > 3 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDayExpansion(dateKey);
                              }}
                              className="w-full text-[9px] sm:text-[10px] text-center font-semibold text-blue-600 dark:text-blue-400 py-1 sm:py-1.5 bg-blue-100/50 dark:bg-blue-900/30 rounded hover:bg-blue-200/70 dark:hover:bg-blue-800/50 transition-colors flex items-center justify-center gap-0.5 sm:gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  <span className="hidden xs:inline">
                                    Show less
                                  </span>
                                  <span className="xs:hidden">Less</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  <span className="hidden xs:inline">
                                    +{dayEvents.length - 3} more
                                  </span>
                                  <span className="xs:hidden">
                                    +{dayEvents.length - 3}
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
