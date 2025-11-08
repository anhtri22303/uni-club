"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"

interface KeyMetricsSummaryProps {
  totalMembers: number
  recentlyJoined: number
  approvedApplicationsCount: number
  totalApplications: number
  activeApprovedEvents: number
  totalApprovedEvents: number
  pendingApplicationsCount: number
}

export function KeyMetricsSummary({
  totalMembers,
  recentlyJoined,
  approvedApplicationsCount,
  totalApplications,
  activeApprovedEvents,
  totalApprovedEvents,
  pendingApplicationsCount
}: KeyMetricsSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          Key Metrics Summary
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Performance indicators at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-700 dark:text-purple-300">{totalMembers}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">Total Members</p>
            <Badge variant="outline" className="mt-2 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs truncate max-w-full">
              +{recentlyJoined} this month
            </Badge>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700 dark:text-green-300">
              {totalApplications > 0 ? Math.round((approvedApplicationsCount / totalApplications) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">Approval Rate</p>
            <p className="text-xs text-muted-foreground mt-2 truncate">{approvedApplicationsCount}/{totalApplications} approved</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">{activeApprovedEvents}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">Active Events</p>
            <p className="text-xs text-muted-foreground mt-2 truncate">Out of {totalApprovedEvents} approved</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-700 dark:text-yellow-300">{pendingApplicationsCount}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">Pending Review</p>
            <p className="text-xs text-muted-foreground mt-2 truncate">Applications waiting</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

