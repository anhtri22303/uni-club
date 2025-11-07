"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserCheck } from "lucide-react"

interface ApplicationStatsCardProps {
  totalApplications: number
  approvedApplicationsCount: number
  pendingApplicationsCount: number
  rejectedApplicationsCount: number
  applicationsLoading: boolean
}

export function ApplicationStatsCard({
  totalApplications,
  approvedApplicationsCount,
  pendingApplicationsCount,
  rejectedApplicationsCount,
  applicationsLoading
}: ApplicationStatsCardProps) {
  return (
    <Card className="border-4 border-green-500/30 bg-green-500/5 hover:border-green-500/50 transition-all shadow-lg hover:shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
              {applicationsLoading ? "..." : totalApplications}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base font-medium mt-1">Applications</CardDescription>
          </div>
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-green-500/10 flex items-center justify-center">
            <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Approved:</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {approvedApplicationsCount}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pending Review:</span>
            <Badge variant={pendingApplicationsCount > 0 ? "default" : "outline"} className="bg-yellow-50 text-yellow-700 border-yellow-200">
              {pendingApplicationsCount}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Rejected:</span>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              {rejectedApplicationsCount}
            </Badge>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-muted-foreground font-medium">Approval Rate:</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {totalApplications > 0 ? Math.round((approvedApplicationsCount / totalApplications) * 100) : 0}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

