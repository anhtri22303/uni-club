"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity } from "lucide-react"

interface Event {
  id: number
  name: string
  status: string
  date: string
  [key: string]: any
}

interface Club {
  id: number
  name: string
  [key: string]: any
}

interface ClubApplication {
  id?: number
  status: string
  [key: string]: any
}

interface DashboardChartsProps {
  events?: Event[]
  clubs?: Club[]
  clubApplications?: ClubApplication[]
  totalClubApplications?: number
  completedClubApplications?: number
  pendingClubApplications?: number
  rejectedClubApplications?: number
  totalEventRequests?: number
  pendingCoClubEvents?: number
  pendingUniStaffEvents?: number
  approvedEventsCount?: number
  ongoingEventsCount?: number
  completedEventsCount?: number
  rejectedEventsCount?: number
  cancelledEventsCount?: number
}

export function DashboardCharts({
  events = [],
  clubs = [],
  clubApplications = [],
  totalClubApplications = 0,
  completedClubApplications = 0,
  pendingClubApplications = 0,
  rejectedClubApplications = 0,
  totalEventRequests = 0,
  pendingCoClubEvents = 0,
  pendingUniStaffEvents = 0,
  approvedEventsCount = 0,
  ongoingEventsCount = 0,
  completedEventsCount = 0,
  rejectedEventsCount = 0,
  cancelledEventsCount = 0,
}: DashboardChartsProps) {
  // Event Status Distribution (Pie Chart Data)
  const eventStatusData = useMemo(() => {
    return [
      { name: "Pending Co-Club", value: pendingCoClubEvents, color: "bg-yellow-500" },
      { name: "Pending UniStaff", value: pendingUniStaffEvents, color: "bg-orange-500" },
      { name: "Approved", value: approvedEventsCount, color: "bg-green-500" },
      { name: "Ongoing", value: ongoingEventsCount, color: "bg-blue-500" },
      { name: "Completed", value: completedEventsCount, color: "bg-purple-500" },
      { name: "Rejected", value: rejectedEventsCount, color: "bg-red-500" },
      { name: "Cancelled", value: cancelledEventsCount, color: "bg-gray-500" },
    ].filter(item => item.value > 0)
  }, [pendingCoClubEvents, pendingUniStaffEvents, approvedEventsCount, ongoingEventsCount, completedEventsCount, rejectedEventsCount, cancelledEventsCount])

  // Club Application Status Distribution
  const clubAppStatusData = useMemo(() => {
    return [
      { name: "Pending", value: pendingClubApplications, color: "bg-yellow-500" },
      { name: "Completed", value: completedClubApplications, color: "bg-green-500" },
      { name: "Rejected", value: rejectedClubApplications, color: "bg-red-500" },
    ].filter(item => item.value > 0)
  }, [pendingClubApplications, completedClubApplications, rejectedClubApplications])

  // Events by Month (Bar Chart Data)
  const eventsByMonth = useMemo(() => {
    const monthCounts: Record<string, number> = {}
    events.forEach(event => {
      if (event.date) {
        const date = new Date(event.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
      }
    })
    
    // Get last 6 months
    const result = Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count
      }))
    
    return result
  }, [events])

  // Calculate max value for bar chart scaling
  const maxEventCount = Math.max(...eventsByMonth.map(d => d.count), 1)

  // Calculate total for percentage
  const totalEventStatus = eventStatusData.reduce((sum, item) => sum + item.value, 0)
  const totalClubAppStatus = clubAppStatusData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
      {/* Event Status Distribution - Pie Chart */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 bg-blue-500 rounded-lg">
              <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Event Status Distribution
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Breakdown of all event requests by status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex flex-wrap gap-2">
            {eventStatusData.map((item, index) => {
              const percentage = totalEventStatus > 0 ? ((item.value / totalEventStatus) * 100).toFixed(1) : '0'
              return (
                <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              )
            })}
          </div>
          <div className="space-y-2 sm:space-y-3">
            {eventStatusData.map((item, index) => {
              const percentage = totalEventStatus > 0 ? (item.value / totalEventStatus) * 100 : 0
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.value} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {eventStatusData.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">No event data available</div>
          )}
        </CardContent>
      </Card>

      {/* Club Application Status - Pie Chart */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 bg-green-500 rounded-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Club Application Status
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Distribution of club registration requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex flex-wrap gap-2">
            {clubAppStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 sm:space-y-3">
            {clubAppStatusData.map((item, index) => {
              const percentage = totalClubAppStatus > 0 ? (item.value / totalClubAppStatus) * 100 : 0
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.value} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {clubAppStatusData.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">No application data available</div>
          )}
        </CardContent>
      </Card>

      {/* Events by Month - Bar Chart */}
      <Card className="lg:col-span-2 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 bg-purple-500 rounded-lg">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Event Creation Timeline
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Monthly event creation trends (Last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {eventsByMonth.length > 0 ? (
              <>
                {eventsByMonth.map((item, index) => (
                  <div key={index} className="space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium w-24 sm:w-32">{item.month}</span>
                      <div className="flex-1 mx-2 sm:mx-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 sm:h-8 relative">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-end pr-2 sm:pr-3 transition-all duration-500"
                            style={{ width: `${(item.count / maxEventCount) * 100}%`, minWidth: '2rem' }}
                          >
                            <span className="text-white text-xs sm:text-sm font-bold">{item.count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t text-xs sm:text-sm text-muted-foreground">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  <span>Total events in period: <strong>{eventsByMonth.reduce((sum, item) => sum + item.count, 0)}</strong></span>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8 text-sm">No event timeline data available</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
