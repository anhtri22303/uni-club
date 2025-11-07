"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { UserCheck } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface ApplicationStatusChartProps {
  approvedApplicationsCount: number
  pendingApplicationsCount: number
  rejectedApplicationsCount: number
  totalApplications: number
  applicationsLoading: boolean
}

export function ApplicationStatusChart({
  approvedApplicationsCount,
  pendingApplicationsCount,
  rejectedApplicationsCount,
  totalApplications,
  applicationsLoading
}: ApplicationStatusChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <UserCheck className="h-5 w-5 text-green-600" />
          Application Status Distribution
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">{totalApplications} total applications</CardDescription>
      </CardHeader>
      <CardContent>
        {applicationsLoading ? (
          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
        ) : totalApplications === 0 ? (
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No application data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Approved", value: approvedApplicationsCount, color: "#22c55e" },
                  { name: "Pending", value: pendingApplicationsCount, color: "#eab308" },
                  { name: "Rejected", value: rejectedApplicationsCount, color: "#ef4444" },
                ].filter(item => item.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => {
                  const isMobile = window.innerWidth < 640
                  return isMobile ? `${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(0)}%`
                }}
                outerRadius={window.innerWidth < 640 ? 60 : 80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: "Approved", value: approvedApplicationsCount, color: "#22c55e" },
                  { name: "Pending", value: pendingApplicationsCount, color: "#eab308" },
                  { name: "Rejected", value: rejectedApplicationsCount, color: "#ef4444" },
                ].filter(item => item.value > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

