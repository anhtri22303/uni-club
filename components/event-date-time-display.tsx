import { Calendar, Clock, Ticket } from "lucide-react"
import { 
  isMultiDayEvent, 
  formatEventDateRange,
  getEventDurationDays,
  timeObjectToString,
  EventDay,
} from "@/service/eventApi"

interface EventDateTimeDisplayProps {
  event: {
    startDate?: string
    endDate?: string
    days?: EventDay[]
    date?: string
    startTime?: any
    endTime?: any
    time?: string
  }
  variant?: "compact" | "detailed"
  className?: string
}

export function EventDateTimeDisplay({ 
  event, 
  variant = "compact",
  className = "" 
}: EventDateTimeDisplayProps) {
  const isMultiDay = isMultiDayEvent(event as any)

  if (variant === "compact") {
    // For event cards/lists
    if (isMultiDay) {
      return (
        <>
          <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{formatEventDateRange(event as any, "en-US")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ticket className="h-4 w-4" />
            <span>{getEventDurationDays(event as any)} day{getEventDurationDays(event as any) > 1 ? 's' : ''} event</span>
          </div>
        </>
      )
    }

    // Single day event
    return (
      <>
        <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
          <Calendar className="h-4 w-4" />
          <span>
            {event.date 
              ? new Date(event.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Date not set"}
          </span>
        </div>

        {(event.startTime || event.endTime || event.time) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {event.startTime && event.endTime
                ? `${timeObjectToString(event.startTime)} - ${timeObjectToString(event.endTime)}`
                : event.time || "Time not set"}
            </span>
          </div>
        )}
      </>
    )
  }

  // Detailed variant for event detail pages
  if (isMultiDay) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Calendar className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="font-medium">
              {formatEventDateRange(event as any, "en-US")}
            </div>
            <div className="text-sm text-muted-foreground">
              {getEventDurationDays(event as any)} day{getEventDurationDays(event as any) > 1 ? 's' : ''} event
            </div>
          </div>
        </div>
        
        {/* Schedule for each day */}
        {event.days && event.days.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Event Schedule</h4>
            {event.days.map((day, index) => (
              <div key={day.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-muted">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">D{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {day.startTime} - {day.endTime}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Single day detailed view
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <Calendar className="h-5 w-5 text-primary" />
        <div>
          <div className="font-medium">
            {event.date 
              ? new Date(event.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Date not set"}
          </div>
          <div className="text-sm text-muted-foreground">
            {event.date || "No date specified"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <Clock className="h-5 w-5 text-primary" />
        <div>
          <div className="font-medium">
            {event.startTime && event.endTime
              ? `${timeObjectToString(event.startTime)} - ${timeObjectToString(event.endTime)}`
              : event.time || "Time not set"}
          </div>
          <div className="text-sm text-muted-foreground">
            Event Duration
          </div>
        </div>
      </div>
    </div>
  )
}
