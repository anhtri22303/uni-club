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
import { useRouter } from "next/navigation"
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
  Check,
  CheckCircle,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, List } from "lucide-react"

export default function UniStaffReportsPage() {
  const { clubApplications, eventRequests, updateClubApplications, updateEventRequests } = useData()
  const router = useRouter()

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
  
  // Count approved club applications
  const approvedClubApplications = clubApplications.filter((app: any) => app.status === "APPROVED").length
  
  // Count pending club applications
  const pendingClubApplications = clubApplications.filter((app: any) => app.status === "PENDING").length
  
  // Count rejected club applications
  const rejectedClubApplications = clubApplications.filter((app: any) => app.status === "REJECTED").length
  
  // Count approved events (non-expired only)
  const approvedEvents = useMemo(() => {
    const now = new Date()
    return events.filter((event: any) => {
      if (event.status !== "APPROVED") return false
      
      try {
        const eventDate = new Date(event.date)
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':')
          eventDate.setHours(parseInt(hours), parseInt(minutes))
        }
        return eventDate >= now || (eventDate.toDateString() === now.toDateString())
      } catch {
        return false
      }
    }).length
  }, [events])
  
  // Count pending events (non-expired only)
  const pendingEvents = useMemo(() => {
    const now = new Date()
    return events.filter((event: any) => {
      if (event.status !== "PENDING") return false
      
      try {
        const eventDate = new Date(event.date)
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':')
          eventDate.setHours(parseInt(hours), parseInt(minutes))
        }
        return eventDate >= now || (eventDate.toDateString() === now.toDateString())
      } catch {
        return false
      }
    }).length
  }, [events])

  // Count rejected events (non-expired only)
  const rejectedEvents = useMemo(() => {
    const now = new Date()
    return events.filter((event: any) => {
      if (event.status !== "REJECTED") return false
      
      try {
        const eventDate = new Date(event.date)
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':')
          eventDate.setHours(parseInt(hours), parseInt(minutes))
        }
        return eventDate >= now || (eventDate.toDateString() === now.toDateString())
      } catch {
        return false
      }
    }).length
  }, [events])

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
    initialPageSize: 3,
  })

  // Pagination for Clubs List
  const {
    currentPage: clubsCurrentPage,
    totalPages: clubsTotalPages,
    paginatedData: paginatedClubsList,
    setCurrentPage: setClubsCurrentPage,
  } = usePagination({
    data: clubsWithMemberCount,
    initialPageSize: 3,
  })

  // Pagination for Event Requests
  const {
    currentPage: eventsCurrentPage,
    totalPages: eventsTotalPages,
    paginatedData: paginatedEventsList,
    setCurrentPage: setEventsCurrentPage,
  } = usePagination({
    data: filteredEvents,
    initialPageSize: 3,
  })

  // Reset Club Applications pagination when filter changes
  useEffect(() => {
    setClubAppsCurrentPage(1)
  }, [clubAppStatusFilter, setClubAppsCurrentPage])

  // Reset Events pagination when filters change
  useEffect(() => {
    setEventsCurrentPage(1)
  }, [eventStatusFilter, eventTypeFilter, setEventsCurrentPage])

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
                University Staff Dashboard
              </h1>
            </div>
            <div className="flex gap-3">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-secondary">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card 
              className="stats-card-hover border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-100"
              onClick={() => router.push('/uni-staff/clubs')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Clubs</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Building className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalClubs}</div>
                  <ArrowUpRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="stats-card-hover border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-100"
              onClick={() => router.push('/uni-staff/clubs-req')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Club Requests</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">{totalClubApplications}</div>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {approvedClubApplications} approved
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="stats-card-hover border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-100"
              onClick={() => router.push('/uni-staff/events-req')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Event Requests</CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{totalEventRequests}</div>
                <div className="flex items-center text-xs text-purple-600 dark:text-purple-400 mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {approvedEvents} approved
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="stats-card-hover border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-100"
              onClick={() => router.push('/uni-staff/policies')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Total Policies
                </CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{totalPolicies}</div>
                  <ArrowUpRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Overview and Analytics */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview" className="gap-2">
                <List className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
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
                  <CardDescription className="text-xs">
                    Sorted by latest submission date • <span className="font-semibold text-amber-600 dark:text-amber-500">{pendingClubApplications} pending</span>
                  </CardDescription>
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
                  <CardDescription className="text-xs">
                    Filter upcoming events (non-expired) • <span className="font-semibold text-amber-600 dark:text-amber-500">{pendingEvents} pending</span>
                  </CardDescription>
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
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Analytics Dashboard with Charts */}
              
              {/* Row 1: Club Applications and Event Requests Donut Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Club Applications Donut Chart */}
                <Card className="border-2">
              <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <div className="p-1.5 bg-green-500 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                  </div>
                      Club Applications Status
                </CardTitle>
                    <CardDescription>Distribution of club application statuses</CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                      {/* Donut Chart */}
                      <div className="relative w-48 h-48 flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90">
                          {totalClubApplications > 0 ? (
                            <>
                              {/* Pending Arc */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#eab308"
                                strokeWidth="20"
                                strokeDasharray={`${(pendingClubApplications / totalClubApplications) * 251.2} 251.2`}
                                className="transition-all duration-500"
                              />
                              {/* Approved Arc */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="20"
                                strokeDasharray={`${(approvedClubApplications / totalClubApplications) * 251.2} 251.2`}
                                strokeDashoffset={`-${(pendingClubApplications / totalClubApplications) * 251.2}`}
                                className="transition-all duration-500"
                              />
                              {/* Rejected Arc */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="20"
                                strokeDasharray={`${(rejectedClubApplications / totalClubApplications) * 251.2} 251.2`}
                                strokeDashoffset={`-${((pendingClubApplications + approvedClubApplications) / totalClubApplications) * 251.2}`}
                                className="transition-all duration-500"
                              />
                            </>
                          ) : (
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                          )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-3xl font-bold">{totalClubApplications}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                      </div>
                      
                      {/* Legend */}
                      <div className="flex-1 space-y-3 w-full">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-yellow-500" />
                            <span className="font-medium">Pending</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-yellow-600">{pendingClubApplications}</span>
                            <span className="text-sm text-yellow-600">
                              ({totalClubApplications > 0 ? Math.round((pendingClubApplications / totalClubApplications) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-green-500" />
                            <span className="font-medium">Approved</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-green-600">{approvedClubApplications}</span>
                            <span className="text-sm text-green-600">
                              ({totalClubApplications > 0 ? Math.round((approvedClubApplications / totalClubApplications) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-red-500" />
                            <span className="font-medium">Rejected</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-red-600">{rejectedClubApplications}</span>
                            <span className="text-sm text-red-600">
                              ({totalClubApplications > 0 ? Math.round((rejectedClubApplications / totalClubApplications) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                      </div>
                </div>
              </CardContent>
            </Card>

                {/* Event Requests Bar Chart */}
                <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                      <div className="p-1.5 bg-purple-500 rounded-lg">
                        <Calendar className="h-5 w-5 text-white" />
                </div>
                      Event Requests Status
              </CardTitle>
                    <CardDescription>Distribution of event request statuses (non-expired only)</CardDescription>
            </CardHeader>
            <CardContent>
                    <div className="space-y-6">
                      {/* Total Count Display */}
                      <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="text-4xl font-bold text-white-600">{totalEventRequests}</div>
                        <div className="text-sm text-muted-foreground mt-1">Total Requests</div>
                      </div>

                      {/* Bar Chart */}
                      <div className="space-y-6">
                        {/* Pending Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                              <span className="font-semibold text-sm text-yellow-700 dark:text-yellow-400">Pending</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{pendingEvents}</span>
                              <span className="text-xs text-yellow-600 dark:text-yellow-500 w-12 text-right">
                                {totalEventRequests > 0 ? Math.round((pendingEvents / totalEventRequests) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                          <div className="relative h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div
                              className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                              style={{
                                width: `${totalEventRequests > 0 ? (pendingEvents / totalEventRequests) * 100 : 0}%`,
                                backgroundColor: '#eab308',
                              }}
                            >
                              {pendingEvents > 0 && (
                                <span className="text-xs font-bold text-white px-2">
                                  {pendingEvents} request{pendingEvents !== 1 ? 's' : ''}
                                </span>
                              )}
                  </div>
                  </div>
                </div>

                        {/* Approved Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm bg-green-500" />
                              <span className="font-semibold text-sm text-green-700 dark:text-green-400">Approved</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-green-600 dark:text-green-500">{approvedEvents}</span>
                              <span className="text-xs text-green-600 dark:text-green-500 w-12 text-right">
                                {totalEventRequests > 0 ? Math.round((approvedEvents / totalEventRequests) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                          <div className="relative h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div
                              className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                              style={{
                                width: `${totalEventRequests > 0 ? (approvedEvents / totalEventRequests) * 100 : 0}%`,
                                backgroundColor: '#22c55e',
                              }}
                            >
                              {approvedEvents > 0 && (
                                <span className="text-xs font-bold text-white px-2">
                                  {approvedEvents} request{approvedEvents !== 1 ? 's' : ''}
                                </span>
                              )}
                  </div>
                  </div>
                </div>

                        {/* Rejected Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm bg-red-500" />
                              <span className="font-semibold text-sm text-red-700 dark:text-red-400">Rejected</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-red-600 dark:text-red-500">{rejectedEvents}</span>
                              <span className="text-xs text-red-600 dark:text-red-500 w-12 text-right">
                                {totalEventRequests > 0 ? Math.round((rejectedEvents / totalEventRequests) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                          <div className="relative h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div
                              className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                              style={{
                                width: `${totalEventRequests > 0 ? (rejectedEvents / totalEventRequests) * 100 : 0}%`,
                                backgroundColor: '#ef4444',
                              }}
                            >
                              {rejectedEvents > 0 && (
                                <span className="text-xs font-bold text-white px-2">
                                  {rejectedEvents} request{rejectedEvents !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                  </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
              </div>

              {/* Top Clubs by Member Count */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-1.5 bg-blue-500 rounded-lg">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    Top 10 Clubs by Members
                  </CardTitle>
                  <CardDescription>Most popular clubs based on member count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clubsWithMemberCount.slice(0, 10).map((club: any, index: number) => {
                      const maxMembers = Math.max(...clubsWithMemberCount.map((c: any) => c.memberCount || 0))
                      const percentage = maxMembers > 0 ? ((club.memberCount || 0) / maxMembers) * 100 : 0
                      
                      return (
                        <div key={club.clubId} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-bold text-muted-foreground w-6 text-right">#{index + 1}</span>
                              <span className="font-medium truncate">{club.clubName}</span>
                            </div>
                            <span className="font-bold text-blue-600 ml-2">{club.memberCount || 0}</span>
                          </div>
                          <div className="relative h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden ml-8">
                            <div
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 15 && (
                                <span className="text-xs font-bold text-white">
                                  {club.memberCount || 0} members
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
