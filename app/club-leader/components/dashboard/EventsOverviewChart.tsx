"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, Legend } from "recharts"

interface EventsOverviewChartProps {
  rawEvents: any[]
  pendingCoClubEvents: number
  pendingUniStaffEvents: number
  approvedEvents: number
  ongoingEvents: number
  completedEvents: number
  rejectedEvents: number
  cancelledEvents: number
  eventsLoading: boolean
}

export function EventsOverviewChart({
  rawEvents,
  pendingCoClubEvents,
  pendingUniStaffEvents,
  approvedEvents,
  ongoingEvents,
  completedEvents,
  rejectedEvents,
  cancelledEvents,
  eventsLoading
}: EventsOverviewChartProps) {
  const chartData = [
    {
      name: "Pending Co-club",
      count: pendingCoClubEvents,
      fill: "#fb923c" // orange-400
    },
    {
      name: "Pending UniStaff",
      count: pendingUniStaffEvents,
      fill: "#fbbf24" // amber-400
    },
    {
      name: "Approved",
      count: approvedEvents,
      fill: "#22c55e" // green-500
    },
    {
      name: "Ongoing",
      count: ongoingEvents,
      fill: "#3b82f6" // blue-500
    },
    {
      name: "Completed",
      count: completedEvents,
      fill: "#10b981" // emerald-500
    },
    {
      name: "Rejected",
      count: rejectedEvents,
      fill: "#ef4444" // red-500
    },
    {
      name: "Cancelled",
      count: cancelledEvents,
      fill: "#6b7280" // gray-500
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Calendar className="h-5 w-5 text-blue-600" />
          Events Status Distribution
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {rawEvents.length} total events across all stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        {eventsLoading ? (
          <Skeleton className="h-[300px] sm:h-[350px] w-full" />
        ) : rawEvents.length === 0 ? (
          <div className="h-[300px] sm:h-[350px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No event data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 300 : 350}>
            <BarChart
              data={chartData}
              margin={{ 
                top: 20, 
                right: window.innerWidth < 640 ? 10 : 30, 
                left: window.innerWidth < 640 ? -10 : 10, 
                bottom: window.innerWidth < 640 ? 40 : 5 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: window.innerWidth < 640 ? 9 : 12 }}
                angle={window.innerWidth < 640 ? -45 : 0}
                textAnchor={window.innerWidth < 640 ? "end" : "middle"}
                height={window.innerWidth < 640 ? 80 : 30}
              />
              <YAxis 
                tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

