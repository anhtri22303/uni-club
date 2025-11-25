"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UserCheck, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface RecentApplicationsListProps {
  recentApplications: any[]
  applicationsLoading: boolean
}

type ApplicationStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED"

export function RecentApplicationsList({ recentApplications, applicationsLoading }: RecentApplicationsListProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>("PENDING")

  // Filter applications based on selected status
  const filteredApplications = recentApplications.filter((app: any) => {
    if (statusFilter === "ALL") return true
    return app.status === statusFilter
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
          Recent Applications
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Latest membership requests</CardDescription>
        
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant={statusFilter === "PENDING" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("PENDING")}
            className="text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            Pending
          </Button>
          <Button
            variant={statusFilter === "APPROVED" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("APPROVED")}
            className="text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            Approved
          </Button>
          <Button
            variant={statusFilter === "REJECTED" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("REJECTED")}
            className="text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            Rejected
          </Button>
          <Button
            variant={statusFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ALL")}
            className="text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {applicationsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                No {statusFilter === "ALL" ? "" : statusFilter.toLowerCase()} applications
              </p>
            ) : (
              filteredApplications.map((application: any) => {
                return (
                  <div 
                    key={application.applicationId} 
                    className="flex items-center justify-between p-2 sm:p-3 border rounded-lg gap-2 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => router.push("/club-leader/applications")}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium truncate">{application.applicantName}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{application.applicantEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "Recently"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        application.status === "APPROVED" ? "default" : application.status === "PENDING" ? "secondary" : "destructive"
                      }
                      className={`text-xs shrink-0 ${
                        application.status === "PENDING" 
                          ? "bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700" 
                          : ""
                      }`}
                    >
                      {application.status}
                    </Badge>
                  </div>
                )
              })
            )}
            <Button variant="outline" className="w-full mt-3 bg-transparent text-xs sm:text-sm" onClick={() => router.push("/club-leader/applications")}>
              Manage All Applications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

