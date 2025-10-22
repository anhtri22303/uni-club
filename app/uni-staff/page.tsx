"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePagination } from "@/hooks/use-pagination"
import { useData } from "@/contexts/data-context"
import { usePolicies, useEvents, useClubs } from "@/hooks/use-query-hooks"
import { getClubApplications } from "@/service/clubApplicationAPI"
import { getClubMemberCount } from "@/service/clubApi"
import { useEffect, useState, useMemo } from "react"
import {
  Calendar,
  Building,
  Download,
  Filter,
  ArrowUpRight,
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UniStaffReportsPage() {
  const { clubApplications, eventRequests, updateClubApplications, updateEventRequests } = useData()

  // ✅ USE REACT QUERY for events, clubs, and policies
  const { data: events = [], isLoading: eventsLoading } = useEvents()
  const { data: clubs = [], isLoading: clubsLoading } = useClubs()
  const { data: policies = [] } = usePolicies()

  // State management - Event filters
  const [eventStatusFilter, setEventStatusFilter] = useState<string>("PENDING")
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL")

  // State management - Club Application filter
  const [clubAppStatusFilter, setClubAppStatusFilter] = useState<string>("PENDING")

  // State management - Clubs with member count
  const [clubsWithMemberCount, setClubsWithMemberCount] = useState<any[]>([])

  // Fetch club applications when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch club applications
        const clubAppData = await getClubApplications()
        updateClubApplications(clubAppData || [])

        // Use events for eventRequests to avoid calling API twice
        updateEventRequests(events || [])
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
    if (events.length > 0) {
      loadData()
    }
  }, [events])

  // Fetch member count for each club
  useEffect(() => {
    const fetchMemberCounts = async () => {
      if (clubs.length === 0) return

      const clubsWithCounts = await Promise.all(
        clubs.map(async (club: any) => {
          try {
            const { activeMemberCount } = await getClubMemberCount(club.id)
            return { ...club, memberCount: activeMemberCount }
          } catch (error) {
            console.error(`Error fetching member count for club ${club.id}:`, error)
            return { ...club, memberCount: 0 }
          }
        })
      )

      // Sort by member count (high to low)
      const sortedClubs = clubsWithCounts.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
      setClubsWithMemberCount(sortedClubs)
    }

    fetchMemberCounts()
  }, [clubs])

  const totalClubs = clubs.length
  const totalPolicies = policies.length
  const totalClubApplications = clubApplications.length
  const totalEventRequests = eventRequests.length

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

  // Filter and check non-expired events
  const filteredEvents = useMemo(() => {
    const now = new Date()
    
    return events.filter((event: any) => {
      // Check status filter
      if (eventStatusFilter !== "ALL" && event.status !== eventStatusFilter) {
        return false
      }

      // Check type filter
      if (eventTypeFilter !== "ALL" && event.type !== eventTypeFilter) {
        return false
      }

      // Check if event is not expired (date + endTime)
      try {
        const eventDate = new Date(event.date)
        
        // If there's an endTime, combine date and endTime for evaluation
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':')
          eventDate.setHours(parseInt(hours), parseInt(minutes))
        }
        
        // Event must be in the future or today
        return eventDate >= now || 
               (eventDate.toDateString() === now.toDateString())
      } catch (error) {
        console.error("Error parsing event date:", error)
        return false
      }
    })
  }, [events, eventStatusFilter, eventTypeFilter])

  // Pagination for Club Applications
  const {
    currentPage: clubAppsCurrentPage,
    totalPages: clubAppsTotalPages,
    paginatedData: paginatedClubAppsList,
    setCurrentPage: setClubAppsCurrentPage,
  } = usePagination({
    data: filteredClubApplications,
    initialPageSize: 5,
  })

  // Pagination for Clubs List
  const {
    currentPage: clubsCurrentPage,
    totalPages: clubsTotalPages,
    paginatedData: paginatedClubsList,
    setCurrentPage: setClubsCurrentPage,
  } = usePagination({
    data: clubsWithMemberCount,
    initialPageSize: 5,
  })

  // Pagination for Event Requests
  const {
    currentPage: eventsCurrentPage,
    totalPages: eventsTotalPages,
    paginatedData: paginatedEventsList,
    setCurrentPage: setEventsCurrentPage,
  } = usePagination({
    data: filteredEvents,
    initialPageSize: 5,
  })

  const statusDotClass: Record<string, string> = {
    APPROVED: "bg-green-500",
    PENDING: "bg-yellow-500",
    REJECTED: "bg-red-500",
  }

  const goClubAppsPrev = () => setClubAppsCurrentPage(Math.max(1, clubAppsCurrentPage - 1))
  const goClubAppsNext = () => setClubAppsCurrentPage(Math.min(clubAppsTotalPages, clubAppsCurrentPage + 1))

  const goClubsPrev = () => setClubsCurrentPage(Math.max(1, clubsCurrentPage - 1))
  const goClubsNext = () => setClubsCurrentPage(Math.min(clubsTotalPages, clubsCurrentPage + 1))
  
  const goEventsPrev = () => setEventsCurrentPage(Math.max(1, eventsCurrentPage - 1))
  const goEventsNext = () => setEventsCurrentPage(Math.min(eventsTotalPages, eventsCurrentPage + 1))

  return (
    <ProtectedRoute allowedRoles={["uni_staff"]}>
      <AppShell>
        <div className="space-y-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Comprehensive insights and performance metrics</p>
            </div>
            <div className="flex gap-3">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-secondary">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card className="stats-card-hover border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Clubs</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Building className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalClubs}</div>
                <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card-hover border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Club Requests</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <Building className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">{totalClubApplications}</div>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +8% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card-hover border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Event Requests</CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{totalEventRequests}</div>
                <div className="flex items-center text-xs text-purple-600 dark:text-purple-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +24% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card-hover border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Total Policies
                </CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{totalPolicies}</div>
                <div className="flex items-center text-xs text-orange-600 dark:text-orange-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +5% from last month
                </div>
              </CardContent>
            </Card>
          </div>

          {/* First Row: Club Applications and Event Requests side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Club Applications List (with status filter) */}
            <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-1.5 bg-green-500 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    Club Applications
                  </CardTitle>
                  <CardDescription className="text-xs">Sorted by latest submission date</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 text-muted-foreground" />
                  <Select value={clubAppStatusFilter} onValueChange={setClubAppStatusFilter}>
                    <SelectTrigger className="w-[110px] h-8 text-xs">
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
                  <div className="text-center py-8 text-muted-foreground">No club applications found</div>
                ) : (
                  paginatedClubAppsList.map((app: any) => {
                    const submittedDate = new Date(app.submittedAt)
                    const formattedDate = submittedDate.toLocaleDateString("en-US")
                    const statusClass = statusDotClass[app.status] || "bg-gray-500"
                    
                    return (
                      <div
                        key={app.applicationId}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusClass}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base truncate">{app.clubName}</p>
                            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground mt-1">
                              <span className="truncate">Proposer: {app.submittedBy?.fullName || app.proposer?.fullName || "Unknown"}</span>
                              <span className="truncate">Major: {app.majorName || "Not specified"}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formattedDate}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge
                            variant={
                              app.status === "APPROVED"
                                ? "default"
                                : app.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
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
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goClubAppsPrev}
                    disabled={clubAppsCurrentPage === 1}
                    className="h-8 text-xs"
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Previous
                  </Button>
                  <span className="text-xs font-medium">
                    Page {clubAppsCurrentPage} / {clubAppsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goClubAppsNext}
                    disabled={clubAppsCurrentPage === clubAppsTotalPages}
                    className="h-8 text-xs"
                  >
                    Next
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Requests List (with filters) */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-1.5 bg-purple-500 rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    Event Requests List
                  </CardTitle>
                  <CardDescription className="text-xs">Filter upcoming events (non-expired)</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 text-muted-foreground" />
                  <Select value={eventStatusFilter} onValueChange={setEventStatusFilter}>
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="WORKSHOP">Workshop</SelectItem>
                      <SelectItem value="SEMINAR">Seminar</SelectItem>
                      <SelectItem value="SOCIAL">Social</SelectItem>
                      <SelectItem value="COMPETITION">Competition</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eventsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : paginatedEventsList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No events found matching criteria</div>
                ) : (
                  paginatedEventsList.map((event: any) => {
                    const eventDate = new Date(event.date)
                    const formattedDate = eventDate.toLocaleDateString("en-US")
                    const statusClass = statusDotClass[event.status] || "bg-gray-500"
                    
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusClass}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base truncate">{event.name}</p>
                            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formattedDate} {event.time || ""}
                                {event.endTime && <span>- {event.endTime}</span>}
                              </span>
                              <span className="truncate">{event.locationName || "Location not specified"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <Badge
                              variant={
                                event.status === "APPROVED"
                                  ? "default"
                                  : event.status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {event.status === "PENDING" ? "Pending" : event.status === "APPROVED" ? "Approved" : "Rejected"}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {event.type || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {eventsTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goEventsPrev}
                    disabled={eventsCurrentPage === 1}
                    className="h-8 text-xs"
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Previous
                  </Button>
                  <span className="text-xs font-medium">
                    Page {eventsCurrentPage} / {eventsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goEventsNext}
                    disabled={eventsCurrentPage === eventsTotalPages}
                    className="h-8 text-xs"
                  >
                    Next
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          </div>

          {/* Second Row: All Clubs List (full width) */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-1.5 bg-blue-500 rounded-lg">
                  <Building className="h-5 w-5 text-white" />
                </div>
                All Clubs List
              </CardTitle>
              <CardDescription className="text-xs">Sorted by member count (high to low)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clubsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : paginatedClubsList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No clubs found</div>
                ) : (
                  paginatedClubsList.map((club: any, index: number) => (
                    <div
                      key={club.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {club.name?.charAt(0) || "C"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base truncate">{club.name}</p>
                          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                            <span className="truncate">Leader: {club.leaderName || "Not assigned"}</span>
                            <span className="truncate">Major: {club.majorName || "Not assigned"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-xl font-bold text-blue-600">{club.memberCount || 0}</p>
                          <p className="text-xs text-muted-foreground">Members</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {clubsTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goClubsPrev}
                    disabled={clubsCurrentPage === 1}
                    className="h-8 text-xs"
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Previous
                  </Button>
                  <span className="text-xs font-medium">
                    Page {clubsCurrentPage} / {clubsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goClubsNext}
                    disabled={clubsCurrentPage === clubsTotalPages}
                    className="h-8 text-xs"
                  >
                    Next
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
