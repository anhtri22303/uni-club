"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EventStatsCardProps {
  totalEvents: number
  pendingCoClubEvents: number
  pendingUniStaffEvents: number
  approvedEvents: number
  ongoingEvents: number
  completedEvents: number
  rejectedEvents: number
  cancelledEvents: number
  eventsLoading: boolean
}

export function EventStatsCard({
  totalEvents,
  pendingCoClubEvents,
  pendingUniStaffEvents,
  approvedEvents,
  ongoingEvents,
  completedEvents,
  rejectedEvents,
  cancelledEvents,
  eventsLoading
}: EventStatsCardProps) {
  const totalPending = pendingCoClubEvents + pendingUniStaffEvents
  const activeEvents = approvedEvents + ongoingEvents
  const totalSuccess = approvedEvents + ongoingEvents + completedEvents
  
  return (
    <Card className="border-4 border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 transition-all shadow-lg hover:shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-blue-600">
              {eventsLoading ? "..." : totalEvents}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base font-medium mt-1">Total Events</CardDescription>
          </div>
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-2 text-sm mt-0">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">⏳ Pending:</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                {totalPending}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">🟢 Active:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {activeEvents}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">🏁 Completed:</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {completedEvents}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">❌ Rejected:</span>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {rejectedEvents}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">🚫 Cancelled:</span>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                {cancelledEvents}
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-muted-foreground font-medium">Success Rate:</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {totalEvents > 0 ? Math.round((totalSuccess / totalEvents) * 100) : 0}%
              </Badge>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-2 text-sm mt-0">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Waiting Co-club:</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                {pendingCoClubEvents}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Waiting UniStaff:</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                {pendingUniStaffEvents}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">✅ Approved:</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                {approvedEvents}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">🟢 Ongoing:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                {ongoingEvents}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">🏁 Completed:</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                {completedEvents}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">❌ Rejected:</span>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                {rejectedEvents}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">🚫 Cancelled:</span>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                {cancelledEvents}
              </Badge>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

