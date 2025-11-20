"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Clock, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { timeObjectToString } from "@/service/eventApi"

interface CoHostEventsSectionProps {
  activeCoHostEvents: any[]
  clubId: number | null
  coHostEventsLoading: boolean
}

export function CoHostEventsSection({ activeCoHostEvents, clubId, coHostEventsLoading }: CoHostEventsSectionProps) {
  const router = useRouter()

  return (
    <Card className="border-l-4 border-l-orange-500 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Calendar className="h-5 w-5 text-orange-500" />
              Co-Host Event Invitations
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Pending invitations where your club is invited as co-host
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-300 bg-orange-50 dark:text-orange-300 dark:border-orange-400/60 dark:bg-orange-950/40"
          >
            {activeCoHostEvents.length} Pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {coHostEventsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : activeCoHostEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No active co-host invitations</p>
            <p className="text-xs text-muted-foreground mt-1">You'll see events here when other clubs invite you to co-host</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCoHostEvents.map((event: any) => {
              const myCoHostStatus = event.coHostedClubs?.find((club: any) => club.id === clubId)?.coHostStatus
              const eventDate = event.date ? new Date(event.date).toLocaleDateString() : "N/A"
              const startTimeStr = timeObjectToString(event.startTime)
              const endTimeStr = timeObjectToString(event.endTime)
              
              return (
                <div
                  key={event.id}
                  className={`p-4 border-2 rounded-lg hover:shadow-md transition-all cursor-pointer border-orange-300 bg-yellow-50 hover:border-orange-400 dark:border-orange-400/60 dark:bg-orange-950/30 dark:hover:border-orange-400`}
                  onClick={() => router.push(`/club-leader/events/${event.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base truncate text-foreground">{event.name}</h3>
                      </div>
                      
                      <p className="text-sm text-foreground/80 line-clamp-2 mb-3">
                        {event.description}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-foreground/70">
                          <Users className="h-3 w-3" />
                          <span className="truncate">Host: {event.hostClub?.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground/70">
                          <Calendar className="h-3 w-3" />
                          <span>{eventDate}</span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground/70">
                          <Clock className="h-3 w-3" />
                          <span>{startTimeStr} - {endTimeStr}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {event.locationName}
                          </Badge>
                        </div>
                      </div>
                      
                      {event.coHostedClubs && event.coHostedClubs.length > 1 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-foreground/70">
                            Co-hosts: {event.coHostedClubs.map((c: any) => c.name).join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="outline"
                        className={
                          myCoHostStatus === "PENDING"
                            ? "border-orange-500 text-orange-700 bg-orange-50 dark:border-orange-400 dark:text-orange-300 dark:bg-orange-950/40"
                            : myCoHostStatus === "APPROVED"
                            ? "border-green-500 text-green-700 bg-green-50 dark:border-green-400 dark:text-green-300 dark:bg-green-950/40"
                            : myCoHostStatus === "REJECTED"
                            ? "border-red-500 text-red-700 bg-red-50 dark:border-red-400 dark:text-red-300 dark:bg-red-950/40"
                            : "border-slate-500 text-slate-700 bg-slate-50 dark:border-slate-500/60 dark:text-slate-300 dark:bg-slate-900/40"
                        }
                      >
                        {myCoHostStatus === "PENDING"
                          ? "⏳ Pending Co-host"
                          : myCoHostStatus === "APPROVED"
                          ? "   Accepted"
                          : myCoHostStatus === "REJECTED"
                          ? "  Declined"
                          : myCoHostStatus || "Unknown"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {activeCoHostEvents.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full mt-3" 
                onClick={() => router.push("/club-leader/events")}
              >
                View All Events
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

