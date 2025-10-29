"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePagination } from "@/hooks/use-pagination"
import { ChevronLeft, ChevronRight, Clock, FileText, Filter } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

interface ClubApplicationsListProps {
  clubApplications: any[]
  pendingClubApplications: number
}

export function ClubApplicationsList({ clubApplications, pendingClubApplications }: ClubApplicationsListProps) {
  const [clubAppStatusFilter, setClubAppStatusFilter] = useState<string>("PENDING")

  // Filter club applications by status and sort by latest submittedAt
  const filteredClubApplications = useMemo(() => {
    const filtered = clubApplications.filter((app: any) => {
      if (clubAppStatusFilter !== "ALL" && app.status !== clubAppStatusFilter) {
        return false
      }
      return true
    })
    
    // Sort by submittedAt in descending order (latest first)
    return filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.submittedAt).getTime()
      const dateB = new Date(b.submittedAt).getTime()
      return dateB - dateA
    })
  }, [clubApplications, clubAppStatusFilter])

  // Pagination for Club Applications
  const {
    currentPage: clubAppsCurrentPage,
    totalPages: clubAppsTotalPages,
    paginatedData: paginatedClubAppsList,
    setCurrentPage: setClubAppsCurrentPage,
  } = usePagination({
    data: filteredClubApplications,
    initialPageSize: 3,
  })

  // Reset Club Applications pagination when filter changes
  useEffect(() => {
    setClubAppsCurrentPage(1)
  }, [clubAppStatusFilter, setClubAppsCurrentPage])

  const statusDotClass: Record<string, string> = {
    APPROVED: "bg-green-500",
    PENDING: "bg-yellow-500",
    REJECTED: "bg-red-500",
  }

  const goClubAppsPrev = () => setClubAppsCurrentPage(Math.max(1, clubAppsCurrentPage - 1))
  const goClubAppsNext = () => setClubAppsCurrentPage(Math.min(clubAppsTotalPages, clubAppsCurrentPage + 1))

  return (
    <Card className="border-2">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <div className="p-1 sm:p-1.5 bg-green-500 rounded-lg flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="truncate">Club Applications</span>
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs mt-1">
              <span className="hidden sm:inline">Sorted by latest submission date • </span>
              <span className="font-semibold text-amber-600 dark:text-amber-500">{pendingClubApplications} pending</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <Filter className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <Select value={clubAppStatusFilter} onValueChange={setClubAppStatusFilter}>
              <SelectTrigger className="w-full sm:w-[110px] h-7 sm:h-8 text-[11px] sm:text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {paginatedClubAppsList.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">No club applications found</div>
          ) : (
            paginatedClubAppsList.map((app: any) => {
              const submittedDate = new Date(app.submittedAt)
              const formattedDate = submittedDate.toLocaleDateString("en-US")
              const statusClass = statusDotClass[app.status] || "bg-gray-500"
              
              return (
                <div
                  key={app.applicationId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-0"
                >
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 mt-1 sm:mt-0 ${statusClass}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{app.clubName}</p>
                      <div className="flex flex-col gap-0.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        <span className="truncate">Proposer: {app.submittedBy?.fullName || app.proposer?.fullName || "Unknown"}</span>
                        <span className="truncate">Major: {app.majorName || "Not specified"}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end sm:justify-start gap-3 flex-shrink-0">
                    <Badge
                      variant={
                        app.status === "APPROVED"
                          ? "default"
                          : app.status === "PENDING"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-[10px] sm:text-xs px-2 py-0.5"
                    >
                      {app.status === "PENDING" ? "Pending" : app.status === "APPROVED" ? "Approved" : "Rejected"}
                    </Badge>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {clubAppsTotalPages > 1 && (
          <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goClubAppsPrev}
              disabled={clubAppsCurrentPage === 1}
              className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
            >
              <ChevronLeft className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <span className="text-[10px] sm:text-xs font-medium px-1">
              {clubAppsCurrentPage}/{clubAppsTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goClubAppsNext}
              disabled={clubAppsCurrentPage === clubAppsTotalPages}
              className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3 w-3 sm:ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

