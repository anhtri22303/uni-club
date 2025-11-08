"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"

interface RecentApplicationsListProps {
  recentApplications: any[]
  applicationsLoading: boolean
}

export function RecentApplicationsList({ recentApplications, applicationsLoading }: RecentApplicationsListProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
          Recent Applications
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Latest membership requests</CardDescription>
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
            {recentApplications.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">No recent applications</p>
            ) : (
              recentApplications.map((application: any) => {
                return (
                  <div key={application.applicationId} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg gap-2">
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
                      className="text-xs shrink-0"
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

